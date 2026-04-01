-- ============================================================
-- Trip Requests Revamp Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add new statuses to flight_request_status enum
ALTER TYPE flight_request_status ADD VALUE IF NOT EXISTS 'offered';
ALTER TYPE flight_request_status ADD VALUE IF NOT EXISTS 'matched';
ALTER TYPE flight_request_status ADD VALUE IF NOT EXISTS 'expired';

-- 2. Add user_id and marketeer_id columns to flight_requests
ALTER TABLE flight_requests
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS marketeer_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_flight_requests_user_id ON flight_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_flight_requests_marketeer_id ON flight_requests(marketeer_id);

-- 3. Create trip_request_offer_status enum
DO $$ BEGIN
  CREATE TYPE trip_request_offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Create trip_request_offers table
CREATE TABLE IF NOT EXISTS trip_request_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES flight_requests(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  price_per_seat numeric(12,2) NOT NULL,
  total_price numeric(12,2) NOT NULL,
  notes text,
  status trip_request_offer_status NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_request_offers_request_id ON trip_request_offers(request_id);
CREATE INDEX IF NOT EXISTS idx_trip_request_offers_provider_id ON trip_request_offers(provider_id);
CREATE INDEX IF NOT EXISTS idx_trip_request_offers_status ON trip_request_offers(status);

-- 5. Add flight_request_id to trips
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS flight_request_id uuid REFERENCES flight_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trips_flight_request_id ON trips(flight_request_id);

-- 6. Auto-update updated_at trigger for trip_request_offers
CREATE OR REPLACE FUNCTION update_trip_request_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_trip_request_offers_updated_at ON trip_request_offers;
CREATE TRIGGER trigger_trip_request_offers_updated_at
  BEFORE UPDATE ON trip_request_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_request_offers_updated_at();

-- 7. RLS Policies for flight_requests (update existing)
ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own flight requests" ON flight_requests;
CREATE POLICY "Users can view own flight requests" ON flight_requests
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = marketeer_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM providers WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "Anyone can insert flight requests" ON flight_requests;
CREATE POLICY "Anyone can insert flight requests" ON flight_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update flight requests" ON flight_requests;
CREATE POLICY "Admin can update flight requests" ON flight_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 8. RLS Policies for trip_request_offers
ALTER TABLE trip_request_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can view offers on pending requests" ON trip_request_offers;
CREATE POLICY "Providers can view offers on pending requests" ON trip_request_offers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM providers WHERE id = provider_id AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM flight_requests fr
      WHERE fr.id = request_id AND (fr.user_id = auth.uid() OR fr.marketeer_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Active providers can create offers" ON trip_request_offers;
CREATE POLICY "Active providers can create offers" ON trip_request_offers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM providers WHERE id = provider_id AND user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "Request owner can update offers" ON trip_request_offers;
CREATE POLICY "Request owner can update offers" ON trip_request_offers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM flight_requests fr
      WHERE fr.id = request_id AND (fr.user_id = auth.uid() OR fr.marketeer_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
