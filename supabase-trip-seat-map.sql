ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS checked_baggage_kg integer,
  ADD COLUMN IF NOT EXISTS cabin_baggage_kg integer,
  ADD COLUMN IF NOT EXISTS meal_included boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seat_selection_included boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seat_map_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seat_map_config jsonb;

CREATE TABLE IF NOT EXISTS public.trip_seat_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  seat_number text NOT NULL,
  passenger_index integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_trip_seat_assignments_trip_id ON public.trip_seat_assignments(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_seat_assignments_booking_id ON public.trip_seat_assignments(booking_id);

CREATE OR REPLACE FUNCTION public.assign_trip_seats_to_booking(
  p_booking_id uuid,
  p_trip_id uuid,
  p_seat_numbers text[]
)
RETURNS void AS $$
DECLARE
  v_config jsonb;
  v_rows integer;
  v_left_columns text[];
  v_right_columns text[];
  v_allowed_columns text[];
  v_blocked_seats text[];
  v_seat text;
  v_row integer;
  v_column text;
  v_requested_count integer;
BEGIN
  SELECT seat_map_config
    INTO v_config
    FROM public.trips
   WHERE id = p_trip_id
     AND seat_map_enabled = true
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seat map is not enabled for trip %', p_trip_id;
  END IF;

  v_requested_count := COALESCE(array_length(p_seat_numbers, 1), 0);
  IF v_requested_count = 0 THEN
    RAISE EXCEPTION 'At least one seat must be selected';
  END IF;

  IF (
    SELECT count(DISTINCT upper(trim(seat)))
    FROM unnest(p_seat_numbers) AS seat
  ) <> v_requested_count THEN
    RAISE EXCEPTION 'Duplicate seats are not allowed';
  END IF;

  v_rows := COALESCE((v_config ->> 'rows')::integer, 0);
  v_left_columns := ARRAY(SELECT jsonb_array_elements_text(v_config -> 'left_columns'));
  v_right_columns := ARRAY(SELECT jsonb_array_elements_text(v_config -> 'right_columns'));
  v_allowed_columns := v_left_columns || v_right_columns;
  v_blocked_seats := ARRAY(
    SELECT upper(jsonb_array_elements_text(COALESCE(v_config -> 'blocked_seats', '[]'::jsonb)))
  );

  FOREACH v_seat IN ARRAY p_seat_numbers
  LOOP
    v_seat := upper(trim(v_seat));
    v_row := NULLIF(regexp_replace(v_seat, '[^0-9]', '', 'g'), '')::integer;
    v_column := NULLIF(regexp_replace(v_seat, '[^A-Z]', '', 'g'), '');

    IF v_row IS NULL OR v_column IS NULL OR v_row < 1 OR v_row > v_rows OR NOT (v_column = ANY(v_allowed_columns)) THEN
      RAISE EXCEPTION 'Seat % is invalid for this trip', v_seat;
    END IF;

    IF v_seat = ANY(v_blocked_seats) THEN
      RAISE EXCEPTION 'Seat % is blocked for this trip', v_seat;
    END IF;
  END LOOP;

  PERFORM public.book_seats(p_trip_id, v_requested_count);

  INSERT INTO public.trip_seat_assignments (trip_id, booking_id, seat_number, passenger_index)
  SELECT
    p_trip_id,
    p_booking_id,
    upper(trim(seat_number)),
    ordinality - 1
  FROM unnest(p_seat_numbers) WITH ORDINALITY AS seat_numbers(seat_number, ordinality);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_trip_seat_assignments()
RETURNS trigger AS $$
DECLARE
  v_seat_count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT count(*) INTO v_seat_count
    FROM public.trip_seat_assignments
    WHERE booking_id = OLD.id;

    IF v_seat_count > 0 THEN
      DELETE FROM public.trip_seat_assignments WHERE booking_id = OLD.id;
      PERFORM public.release_seats(OLD.trip_id, v_seat_count);
    END IF;

    RETURN OLD;
  END IF;

  IF NEW.status IN ('payment_failed', 'cancelled', 'rejected', 'refunded')
     AND OLD.status IS DISTINCT FROM NEW.status THEN

    SELECT count(*) INTO v_seat_count
    FROM public.trip_seat_assignments
    WHERE booking_id = NEW.id;

    IF v_seat_count > 0 THEN
      DELETE FROM public.trip_seat_assignments WHERE booking_id = NEW.id;
      PERFORM public.release_seats(NEW.trip_id, v_seat_count);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_cleanup_trip_seat_assignments ON public.bookings;
CREATE TRIGGER trigger_cleanup_trip_seat_assignments
AFTER UPDATE OR DELETE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_trip_seat_assignments();

ALTER TABLE public.trip_seat_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_seat_assignments_select" ON public.trip_seat_assignments;
CREATE POLICY "trip_seat_assignments_select" ON public.trip_seat_assignments
  FOR SELECT USING (true);
