-- Batch 1: component prices + offer price (2026-04-07)
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS trip_price numeric,
  ADD COLUMN IF NOT EXISTS car_price numeric,
  ADD COLUMN IF NOT EXISTS hotel_price numeric;

-- Earlier: package detail fields
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS duration_days integer,
  ADD COLUMN IF NOT EXISTS room_basis text,
  ADD COLUMN IF NOT EXISTS breakfast_included boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS airport_transfer_included boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tour_guide_included boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sightseeing_tours_included boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.packages.duration_days IS 'Advertised package duration in days.';
COMMENT ON COLUMN public.packages.room_basis IS 'Room occupancy basis for the advertised package price, e.g. double.';
COMMENT ON COLUMN public.packages.breakfast_included IS 'Whether breakfast is included in the package.';
COMMENT ON COLUMN public.packages.airport_transfer_included IS 'Whether airport pickup/dropoff is included.';
COMMENT ON COLUMN public.packages.tour_guide_included IS 'Whether a tour guide is included.';
COMMENT ON COLUMN public.packages.sightseeing_tours_included IS 'Whether sightseeing tours are included.';
