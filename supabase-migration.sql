-- ============================================================================
-- BookitFly - Complete Supabase Migration Script
-- ============================================================================
-- This script is idempotent and can be pasted directly into the Supabase SQL Editor.
-- It creates all enums, tables, functions, triggers, RLS policies, storage
-- buckets, indexes, cron jobs, and seed data for the BookitFly platform.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('buyer', 'provider', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE provider_type AS ENUM ('travel_agency', 'hajj_umrah');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('pending_review', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE provider_status AS ENUM ('active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('active', 'sold_out', 'expired', 'deactivated', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('payment_processing', 'confirmed', 'payment_failed', 'refunded', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE trip_type AS ENUM ('one_way', 'round_trip');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cabin_class AS ENUM ('economy', 'business', 'first');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'application_approved',
    'application_rejected',
    'new_booking',
    'trip_removed',
    'account_suspended',
    'booking_confirmed',
    'payment_failed',
    'booking_refunded',
    'new_application',
    'provider_reapplied'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email       text        NOT NULL,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        user_role   NOT NULL DEFAULT 'buyer',
  locale      text        NOT NULL DEFAULT 'ar',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User profile data, auto-created on signup via trigger.';

-- ----------------------------------------------------------------------------
-- 2.2 provider_applications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_applications (
  id                      uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid               NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  provider_type           provider_type      NOT NULL,
  company_name_ar         text               NOT NULL,
  company_name_en         text,
  company_description_ar  text,
  company_description_en  text,
  contact_email           text               NOT NULL,
  contact_phone           text               NOT NULL,
  doc_commercial_reg_url  text,
  doc_iata_permit_url     text,
  doc_hajj_permit_url     text,
  doc_tourism_permit_url  text,
  doc_civil_aviation_url  text,
  terms_accepted_at       timestamptz,
  status                  application_status NOT NULL DEFAULT 'pending_review',
  admin_comment           text,
  reviewed_by             uuid               REFERENCES auth.users ON DELETE SET NULL,
  reviewed_at             timestamptz,
  created_at              timestamptz        NOT NULL DEFAULT now(),
  updated_at              timestamptz        NOT NULL DEFAULT now()
);

COMMENT ON TABLE provider_applications IS 'Applications submitted by buyers to become providers.';

-- ----------------------------------------------------------------------------
-- 2.3 providers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS providers (
  id                      uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid            NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  application_id          uuid            REFERENCES provider_applications ON DELETE SET NULL,
  provider_type           provider_type   NOT NULL,
  company_name_ar         text            NOT NULL,
  company_name_en         text,
  company_description_ar  text,
  company_description_en  text,
  logo_url                text,
  contact_email           text            NOT NULL,
  contact_phone           text            NOT NULL,
  commission_rate         numeric(5,2)    DEFAULT 10.00,
  status                  provider_status NOT NULL DEFAULT 'active',
  suspended_reason        text,
  has_commercial_reg      boolean         NOT NULL DEFAULT false,
  has_iata_permit         boolean         NOT NULL DEFAULT false,
  has_hajj_permit         boolean         NOT NULL DEFAULT false,
  has_tourism_permit      boolean         NOT NULL DEFAULT false,
  has_civil_aviation      boolean         NOT NULL DEFAULT false,
  created_at              timestamptz     NOT NULL DEFAULT now(),
  updated_at              timestamptz     NOT NULL DEFAULT now()
);

COMMENT ON TABLE providers IS 'Approved provider profiles linked 1:1 to a user.';

-- ----------------------------------------------------------------------------
-- 2.4 trips
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id         uuid          NOT NULL REFERENCES providers ON DELETE CASCADE,
  airline             text          NOT NULL,
  flight_number       text,
  origin_city_ar      text          NOT NULL,
  origin_city_en      text,
  origin_code         text,
  destination_city_ar text          NOT NULL,
  destination_city_en text,
  destination_code    text,
  departure_at        timestamptz   NOT NULL,
  return_at           timestamptz,
  trip_type           trip_type     NOT NULL DEFAULT 'one_way',
  cabin_class         cabin_class   NOT NULL DEFAULT 'economy',
  total_seats         integer       NOT NULL CHECK (total_seats > 0),
  booked_seats        integer       NOT NULL DEFAULT 0 CHECK (booked_seats >= 0),
  price_per_seat      numeric(10,2) NOT NULL CHECK (price_per_seat > 0),
  description_ar      text,
  description_en      text,
  image_url           text,
  status              trip_status   NOT NULL DEFAULT 'active',
  removed_reason      text,
  removed_by          uuid          REFERENCES auth.users ON DELETE SET NULL,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT booked_seats_le_total CHECK (booked_seats <= total_seats)
);

COMMENT ON TABLE trips IS 'Flight trip listings created by providers.';

-- ----------------------------------------------------------------------------
-- 2.5 bookings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id                  uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             uuid           NOT NULL REFERENCES trips ON DELETE CASCADE,
  buyer_id            uuid           NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  provider_id         uuid           NOT NULL REFERENCES providers ON DELETE CASCADE,
  passenger_name      text           NOT NULL,
  passenger_phone     text           NOT NULL,
  passenger_email     text           NOT NULL,
  passenger_id_number text,
  seats_count         integer        NOT NULL DEFAULT 1 CHECK (seats_count >= 1 AND seats_count <= 10),
  price_per_seat      numeric(10,2)  NOT NULL,
  total_amount        numeric(10,2)  NOT NULL,
  commission_rate     numeric(5,2)   NOT NULL,
  commission_amount   numeric(10,2)  NOT NULL,
  provider_payout     numeric(10,2)  NOT NULL,
  status              booking_status NOT NULL DEFAULT 'payment_processing',
  moyasar_payment_id  text,
  paid_at             timestamptz,
  cancelled_at        timestamptz,
  cancelled_by        uuid           REFERENCES auth.users ON DELETE SET NULL,
  refunded_at         timestamptz,
  refunded_by         uuid           REFERENCES auth.users ON DELETE SET NULL,
  admin_notes         text,
  created_at          timestamptz    NOT NULL DEFAULT now(),
  updated_at          timestamptz    NOT NULL DEFAULT now()
);

COMMENT ON TABLE bookings IS 'Seat bookings made by buyers for specific trips.';

-- ----------------------------------------------------------------------------
-- 2.6 notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid              NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title_ar   text              NOT NULL,
  title_en   text              NOT NULL,
  body_ar    text              NOT NULL DEFAULT '',
  body_en    text              NOT NULL DEFAULT '',
  data       jsonb             DEFAULT '{}',
  read       boolean           NOT NULL DEFAULT false,
  created_at timestamptz       NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS 'In-app notifications for users.';

-- ----------------------------------------------------------------------------
-- 2.7 platform_settings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_settings (
  id                      serial        PRIMARY KEY,
  default_commission_rate  numeric(5,2)  NOT NULL DEFAULT 10.00,
  terms_content_ar         text,
  terms_content_en         text,
  created_at               timestamptz   NOT NULL DEFAULT now(),
  updated_at               timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE platform_settings IS 'Global platform configuration (single-row).';


-- ============================================================================
-- 3. UPDATED_AT TRIGGER (generic, applied to all tables with updated_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to each relevant table
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles',
    'provider_applications',
    'providers',
    'trips',
    'bookings',
    'platform_settings'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trigger_set_updated_at'
        AND tgrelid = tbl::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trigger_set_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW
         EXECUTE FUNCTION set_updated_at()',
        tbl
      );
    END IF;
  END LOOP;
END $$;


-- ============================================================================
-- 4. HANDLE NEW USER TRIGGER
-- ============================================================================
-- When a new user signs up in auth.users, auto-create a profiles row.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.raw_user_meta_data ->> 'phone',
    'buyer',
    COALESCE(NEW.raw_user_meta_data ->> 'locale', 'ar')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and recreate to ensure it is up to date
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1 book_seats - atomically reserve seats on a trip
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION book_seats(p_trip_id uuid, p_seats integer)
RETURNS void AS $$
DECLARE
  v_total   integer;
  v_booked  integer;
  v_status  trip_status;
BEGIN
  -- Lock the trip row for update
  SELECT total_seats, booked_seats, status
    INTO v_total, v_booked, v_status
    FROM trips
   WHERE id = p_trip_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip not found: %', p_trip_id;
  END IF;

  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'Trip is not active (current status: %)', v_status;
  END IF;

  IF (v_booked + p_seats) > v_total THEN
    RAISE EXCEPTION 'Not enough seats available. Requested: %, Available: %',
      p_seats, (v_total - v_booked);
  END IF;

  UPDATE trips
     SET booked_seats = booked_seats + p_seats,
         status = CASE
           WHEN (booked_seats + p_seats) = total_seats THEN 'sold_out'::trip_status
           ELSE status
         END
   WHERE id = p_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 5.2 release_seats - atomically release booked seats back to a trip
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION release_seats(p_trip_id uuid, p_seats integer)
RETURNS void AS $$
DECLARE
  v_booked integer;
  v_status trip_status;
BEGIN
  -- Lock the trip row for update
  SELECT booked_seats, status
    INTO v_booked, v_status
    FROM trips
   WHERE id = p_trip_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip not found: %', p_trip_id;
  END IF;

  IF p_seats > v_booked THEN
    RAISE EXCEPTION 'Cannot release more seats than booked. Releasing: %, Currently booked: %',
      p_seats, v_booked;
  END IF;

  UPDATE trips
     SET booked_seats = booked_seats - p_seats,
         status = CASE
           WHEN v_status = 'sold_out' AND (booked_seats - p_seats) < total_seats
             THEN 'active'::trip_status
           ELSE status
         END
   WHERE id = p_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 5.3 expire_past_trips - mark departed trips as expired
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION expire_past_trips()
RETURNS void AS $$
BEGIN
  UPDATE trips
     SET status = 'expired'::trip_status
   WHERE departure_at < now()
     AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 5.4 cleanup_failed_payments - timeout stale payment_processing bookings
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_failed_payments()
RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id, trip_id, seats_count
      FROM bookings
     WHERE status = 'payment_processing'
       AND created_at < now() - interval '30 minutes'
     FOR UPDATE
  LOOP
    -- Mark the booking as failed
    UPDATE bookings
       SET status = 'payment_failed'::booking_status
     WHERE id = rec.id;

    -- Release the seats back to the trip
    PERFORM release_seats(rec.trip_id, rec.seats_count);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 6. HELPER: check if a user has admin role
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
     WHERE id = auth.uid()
       AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: check if a user is a provider
CREATE OR REPLACE FUNCTION is_provider()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
     WHERE id = auth.uid()
       AND role = 'provider'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: get the provider id for the current user
CREATE OR REPLACE FUNCTION get_provider_id()
RETURNS uuid AS $$
  SELECT id FROM providers WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings     ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too (prevents bypass by postgres role in some contexts)
ALTER TABLE profiles              FORCE ROW LEVEL SECURITY;
ALTER TABLE provider_applications FORCE ROW LEVEL SECURITY;
ALTER TABLE providers             FORCE ROW LEVEL SECURITY;
ALTER TABLE trips                 FORCE ROW LEVEL SECURITY;
ALTER TABLE bookings              FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications         FORCE ROW LEVEL SECURITY;
ALTER TABLE platform_settings     FORCE ROW LEVEL SECURITY;

-- ----------------------------------------
-- 7.1 profiles
-- ----------------------------------------

-- SELECT: users can read their own profile; admins can read all
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR is_admin()
  );

-- UPDATE: users can update their own profile (not role)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (
    id = auth.uid()
  )
  WITH CHECK (
    id = auth.uid()
  );

-- INSERT: service role only (via the handle_new_user trigger)
-- No insert policy for authenticated users; the trigger runs as SECURITY DEFINER.

-- Admin update (e.g., changing role)
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin())
  WITH CHECK (is_admin());

-- ----------------------------------------
-- 7.2 provider_applications
-- ----------------------------------------

-- SELECT: users see their own; admins see all
DROP POLICY IF EXISTS "applications_select" ON provider_applications;
CREATE POLICY "applications_select" ON provider_applications
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

-- INSERT: authenticated users (buyers) can create applications
DROP POLICY IF EXISTS "applications_insert" ON provider_applications;
CREATE POLICY "applications_insert" ON provider_applications
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- UPDATE: admins can update (for review actions)
DROP POLICY IF EXISTS "applications_update_admin" ON provider_applications;
CREATE POLICY "applications_update_admin" ON provider_applications
  FOR UPDATE USING (is_admin())
  WITH CHECK (is_admin());

-- UPDATE: applicant can update their own pending application (resubmit/edit)
DROP POLICY IF EXISTS "applications_update_own" ON provider_applications;
CREATE POLICY "applications_update_own" ON provider_applications
  FOR UPDATE USING (
    user_id = auth.uid() AND status = 'pending_review'
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ----------------------------------------
-- 7.3 providers
-- ----------------------------------------

-- SELECT: anyone can read active providers; admins read all; providers read their own
DROP POLICY IF EXISTS "providers_select_public" ON providers;
CREATE POLICY "providers_select_public" ON providers
  FOR SELECT USING (
    status = 'active'
    OR user_id = auth.uid()
    OR is_admin()
  );

-- UPDATE: providers can update their own (non-status, non-commission fields)
DROP POLICY IF EXISTS "providers_update_own" ON providers;
CREATE POLICY "providers_update_own" ON providers
  FOR UPDATE USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
    -- status and commission_rate changes are restricted at application level
  );

-- UPDATE: admins can update all providers
DROP POLICY IF EXISTS "providers_update_admin" ON providers;
CREATE POLICY "providers_update_admin" ON providers
  FOR UPDATE USING (is_admin())
  WITH CHECK (is_admin());

-- INSERT: service role only (created when application is approved)
-- No authenticated insert policy; this is done via server-side logic.

-- ----------------------------------------
-- 7.4 trips
-- ----------------------------------------

-- SELECT: anyone can read active trips; providers see their own; admins see all
DROP POLICY IF EXISTS "trips_select" ON trips;
CREATE POLICY "trips_select" ON trips
  FOR SELECT USING (
    status = 'active'
    OR provider_id = get_provider_id()
    OR is_admin()
  );

-- INSERT: providers can create trips
DROP POLICY IF EXISTS "trips_insert_provider" ON trips;
CREATE POLICY "trips_insert_provider" ON trips
  FOR INSERT WITH CHECK (
    is_provider()
    AND provider_id = get_provider_id()
  );

-- UPDATE: providers can update their own trips; admins can update all
DROP POLICY IF EXISTS "trips_update_provider" ON trips;
CREATE POLICY "trips_update_provider" ON trips
  FOR UPDATE USING (
    provider_id = get_provider_id()
  )
  WITH CHECK (
    provider_id = get_provider_id()
  );

DROP POLICY IF EXISTS "trips_update_admin" ON trips;
CREATE POLICY "trips_update_admin" ON trips
  FOR UPDATE USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: none (status changes only)
-- No DELETE policies defined.

-- ----------------------------------------
-- 7.5 bookings
-- ----------------------------------------

-- SELECT: buyers see their own; providers see bookings on their trips; admins see all
DROP POLICY IF EXISTS "bookings_select" ON bookings;
CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (
    buyer_id = auth.uid()
    OR provider_id = get_provider_id()
    OR is_admin()
  );

-- INSERT: authenticated users can create bookings
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND buyer_id = auth.uid()
  );

-- UPDATE: admins can update (for refund/cancel); service role for payment callbacks
DROP POLICY IF EXISTS "bookings_update_admin" ON bookings;
CREATE POLICY "bookings_update_admin" ON bookings
  FOR UPDATE USING (is_admin())
  WITH CHECK (is_admin());

-- ----------------------------------------
-- 7.6 notifications
-- ----------------------------------------

-- SELECT: users see their own notifications
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- INSERT: service role only (inserted by server-side notify function)
-- No authenticated insert policy.

-- UPDATE: users can mark their own notifications as read
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ----------------------------------------
-- 7.7 platform_settings
-- ----------------------------------------

-- SELECT: admins only
DROP POLICY IF EXISTS "settings_select_admin" ON platform_settings;
CREATE POLICY "settings_select_admin" ON platform_settings
  FOR SELECT USING (is_admin());

-- UPDATE: admins only
DROP POLICY IF EXISTS "settings_update_admin" ON platform_settings;
CREATE POLICY "settings_update_admin" ON platform_settings
  FOR UPDATE USING (is_admin())
  WITH CHECK (is_admin());


-- ============================================================================
-- 8. STORAGE BUCKETS
-- ============================================================================

-- provider-documents: private bucket for application docs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'provider-documents',
  'provider-documents',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- trip-images: public bucket for trip photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-images',
  'trip-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- avatars: public bucket for user/provider avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------
-- Storage RLS Policies
-- ----------------------------------------

-- provider-documents: users can upload to their own folder; admins can read all
DROP POLICY IF EXISTS "provider_docs_insert" ON storage.objects;
CREATE POLICY "provider_docs_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'provider-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "provider_docs_select_own" ON storage.objects;
CREATE POLICY "provider_docs_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'provider-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin()
    )
  );

DROP POLICY IF EXISTS "provider_docs_update_own" ON storage.objects;
CREATE POLICY "provider_docs_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'provider-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "provider_docs_delete_own" ON storage.objects;
CREATE POLICY "provider_docs_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'provider-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- trip-images: providers can upload; anyone can read (public bucket)
DROP POLICY IF EXISTS "trip_images_insert" ON storage.objects;
CREATE POLICY "trip_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'trip-images'
    AND auth.uid() IS NOT NULL
    AND is_provider()
  );

DROP POLICY IF EXISTS "trip_images_select" ON storage.objects;
CREATE POLICY "trip_images_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'trip-images'
  );

DROP POLICY IF EXISTS "trip_images_update" ON storage.objects;
CREATE POLICY "trip_images_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'trip-images'
    AND auth.uid() IS NOT NULL
    AND (is_provider() OR is_admin())
  );

DROP POLICY IF EXISTS "trip_images_delete" ON storage.objects;
CREATE POLICY "trip_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'trip-images'
    AND auth.uid() IS NOT NULL
    AND (is_provider() OR is_admin())
  );

-- avatars: users can upload to their own folder; anyone can read (public bucket)
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
  );

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ============================================================================
-- 9. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_trips_provider_id     ON trips (provider_id);
CREATE INDEX IF NOT EXISTS idx_trips_status           ON trips (status);
CREATE INDEX IF NOT EXISTS idx_trips_departure_at     ON trips (departure_at);
CREATE INDEX IF NOT EXISTS idx_trips_status_departure ON trips (status, departure_at);

CREATE INDEX IF NOT EXISTS idx_bookings_trip_id  ON bookings (trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_buyer_id ON bookings (buyer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status   ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings (provider_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read    ON notifications (user_id, read);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON provider_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status  ON provider_applications (status);

CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers (user_id);
CREATE INDEX IF NOT EXISTS idx_providers_status  ON providers (status);


-- ============================================================================
-- 10. pg_cron JOBS
-- ============================================================================
-- NOTE: pg_cron must be enabled in your Supabase project (Database > Extensions).
-- If pg_cron is not enabled, these statements will fail gracefully.
-- You can enable it via: CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  -- Only schedule if pg_cron extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Expire past trips every hour
    PERFORM cron.unschedule('expire-past-trips');
    PERFORM cron.schedule(
      'expire-past-trips',
      '0 * * * *',
      'SELECT expire_past_trips()'
    );

    -- Cleanup failed payments every 15 minutes
    PERFORM cron.unschedule('cleanup-failed-payments');
    PERFORM cron.schedule(
      'cleanup-failed-payments',
      '*/15 * * * *',
      'SELECT cleanup_failed_payments()'
    );
  ELSE
    RAISE NOTICE 'pg_cron extension not enabled. Skipping cron job scheduling. Enable it in Supabase Dashboard > Database > Extensions.';
  END IF;
END $$;


-- ============================================================================
-- 11. SEED DATA
-- ============================================================================

-- Insert default platform settings if none exist
INSERT INTO platform_settings (default_commission_rate)
SELECT 10.00
WHERE NOT EXISTS (SELECT 1 FROM platform_settings LIMIT 1);


COMMIT;

-- ============================================================================
-- FLIGHT REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS flight_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  departure_date date NOT NULL,
  return_date date,
  seats_needed integer NOT NULL DEFAULT 1 CHECK (seats_needed >= 1 AND seats_needed <= 20),
  cabin_class text NOT NULL DEFAULT 'economy' CHECK (cabin_class IN ('economy', 'business', 'first')),
  budget_max numeric(10,2),
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'cancelled')),
  admin_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_flight_requests_status ON flight_requests(status);
CREATE INDEX IF NOT EXISTS idx_flight_requests_created_at ON flight_requests(created_at DESC);

CREATE OR REPLACE TRIGGER update_flight_requests_updated_at
  BEFORE UPDATE ON flight_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit flight requests"
  ON flight_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "admins can manage flight requests"
  ON flight_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
