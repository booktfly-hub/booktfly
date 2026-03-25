-- ============================================================================
-- BookitFly - Marketeer Feature Migration
-- ============================================================================
-- Paste into Supabase SQL Editor and run.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Add marketeer role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'marketeer';

-- FlyPoints event types
DO $$ BEGIN
  CREATE TYPE flypoints_event_type AS ENUM (
    'registration_bonus',
    'booking_sale',
    'referral_client_signup',
    'referral_client_booking',
    'referral_marketeer',
    'weekly_bonus',
    'speed_bonus',
    'rating_bonus',
    'content_bonus',
    'share_bonus',
    'travel_bonus',
    'cancellation_penalty',
    'bad_rating_penalty',
    'no_response_penalty',
    'manual_adjustment'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add marketeer notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'marketeer_application_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'marketeer_application_rejected';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_marketeer_application';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'points_earned';

-- ============================================================================
-- 2. ALTER EXISTING TABLES
-- ============================================================================

-- Track which marketeer referred a user (stored as referral_code text)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- FlyPoints SAR conversion rate (1 point = N SAR)
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS flypoints_sar_rate NUMERIC(6,4) NOT NULL DEFAULT 0.05;

-- ============================================================================
-- 3. NEW TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- marketeer_applications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketeer_applications (
  id               UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID               NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name        TEXT               NOT NULL,
  national_id      TEXT               NOT NULL,
  date_of_birth    DATE               NOT NULL,
  phone            TEXT               NOT NULL,
  phone_alt        TEXT,
  email            TEXT               NOT NULL,
  national_address TEXT               NOT NULL,
  status           application_status NOT NULL DEFAULT 'pending_review',
  admin_comment    TEXT,
  reviewed_by      UUID               REFERENCES auth.users ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ        NOT NULL DEFAULT now()
);

COMMENT ON TABLE marketeer_applications IS 'Applications submitted by buyers to become marketeers.';

-- ----------------------------------------------------------------------------
-- marketeers (approved)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marketeers (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  application_id   UUID        REFERENCES marketeer_applications ON DELETE SET NULL,
  full_name        TEXT        NOT NULL,
  national_id      TEXT        NOT NULL,
  phone            TEXT        NOT NULL,
  referral_code    TEXT        NOT NULL UNIQUE,
  status           TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE marketeers IS 'Approved marketeer profiles linked 1:1 to a user.';

-- ----------------------------------------------------------------------------
-- flypoints_transactions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flypoints_transactions (
  id             UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  marketeer_id   UUID                 NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  points         INTEGER              NOT NULL,
  event_type     flypoints_event_type NOT NULL,
  reference_id   UUID,
  description_ar TEXT                 NOT NULL DEFAULT '',
  description_en TEXT                 NOT NULL DEFAULT '',
  expires_at     TIMESTAMPTZ          NOT NULL DEFAULT (now() + INTERVAL '12 months'),
  created_at     TIMESTAMPTZ          NOT NULL DEFAULT now()
);

COMMENT ON TABLE flypoints_transactions IS 'FlyPoints ledger for marketeers. Positive = earned, negative = deducted.';

-- ============================================================================
-- 4. VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW marketeer_points_balance AS
SELECT
  marketeer_id,
  COALESCE(SUM(points), 0)::INTEGER AS balance
FROM flypoints_transactions
WHERE expires_at > now()
GROUP BY marketeer_id;

COMMENT ON VIEW marketeer_points_balance IS 'Active (non-expired) FlyPoints balance per marketeer.';

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Generate a unique referral code like MKT-A1B2C3
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code    TEXT;
  exists  BOOLEAN;
BEGIN
  LOOP
    code := 'MKT-' || upper(substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 6));
    SELECT COUNT(*) > 0 INTO exists FROM marketeers WHERE referral_code = code;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['marketeer_applications', 'marketeers']
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
-- 7. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_marketeer_applications_user_id ON marketeer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_marketeer_applications_status   ON marketeer_applications(status);
CREATE INDEX IF NOT EXISTS idx_marketeers_user_id              ON marketeers(user_id);
CREATE INDEX IF NOT EXISTS idx_marketeers_referral_code        ON marketeers(referral_code);
CREATE INDEX IF NOT EXISTS idx_flypoints_marketeer_id          ON flypoints_transactions(marketeer_id);
CREATE INDEX IF NOT EXISTS idx_flypoints_expires_at            ON flypoints_transactions(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by            ON profiles(referred_by);

-- ============================================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE marketeer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketeers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE flypoints_transactions ENABLE ROW LEVEL SECURITY;

-- marketeer_applications: own read + insert
DROP POLICY IF EXISTS "marketeer_applications_select_own" ON marketeer_applications;
CREATE POLICY "marketeer_applications_select_own"
  ON marketeer_applications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "marketeer_applications_insert_own" ON marketeer_applications;
CREATE POLICY "marketeer_applications_insert_own"
  ON marketeer_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- marketeers: own read
DROP POLICY IF EXISTS "marketeers_select_own" ON marketeers;
CREATE POLICY "marketeers_select_own"
  ON marketeers FOR SELECT
  USING (user_id = auth.uid());

-- flypoints_transactions: own read
DROP POLICY IF EXISTS "flypoints_transactions_select_own" ON flypoints_transactions;
CREATE POLICY "flypoints_transactions_select_own"
  ON flypoints_transactions FOR SELECT
  USING (marketeer_id = auth.uid());

-- ============================================================================
-- 9. UPDATE handle_new_user TO CAPTURE REFERRAL CODE
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, locale, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.raw_user_meta_data ->> 'phone',
    'buyer',
    COALESCE(NEW.raw_user_meta_data ->> 'locale', 'ar'),
    NEW.raw_user_meta_data ->> 'referred_by'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
