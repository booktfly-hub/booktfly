-- =================================================================
-- BookitFly: Role-based contracts, pricing, visitor tracking, templates
-- Safe to re-run (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- Paste into Supabase SQL Editor.
-- =================================================================

-- ---------- Profiles: user-level reusable signature ----------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signature_url text;

-- ---------- Provider applications: contract signing ----------
ALTER TABLE provider_applications ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE provider_applications ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz;
ALTER TABLE provider_applications ADD COLUMN IF NOT EXISTS contract_version text DEFAULT 'v1-2024';

-- ---------- Marketeer applications: same ----------
ALTER TABLE marketeer_applications ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE marketeer_applications ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz;
ALTER TABLE marketeer_applications ADD COLUMN IF NOT EXISTS contract_version text DEFAULT 'v1-2024';

-- ---------- Bookings: client contract signed + name change ----------
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS buyer_signature_url text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contract_version text DEFAULT 'v1-2024';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS name_change_count int NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS name_change_fee_paid numeric NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_breakdown jsonb;

-- ---------- Trips: name-change policy + age pricing + per-trip commission ----------
ALTER TABLE trips ADD COLUMN IF NOT EXISTS name_change_allowed boolean NOT NULL DEFAULT false;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS name_change_fee numeric NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS name_change_is_refundable boolean NOT NULL DEFAULT true;

DO $$ BEGIN
  ALTER TABLE trips ADD COLUMN child_discount_percentage numeric NOT NULL DEFAULT 0
    CHECK (child_discount_percentage BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE trips ADD COLUMN infant_discount_percentage numeric NOT NULL DEFAULT 0
    CHECK (infant_discount_percentage BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE trips ADD COLUMN special_discount_percentage numeric NOT NULL DEFAULT 0
    CHECK (special_discount_percentage BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS special_discount_label_ar text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS special_discount_label_en text;

DO $$ BEGIN
  ALTER TABLE trips ADD COLUMN commission_rate_override numeric
    CHECK (commission_rate_override BETWEEN 0 AND 50);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ---------- Trip price history (dynamic pricing audit) ----------
CREATE TABLE IF NOT EXISTS trip_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  old_price numeric,
  new_price numeric NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tph_trip ON trip_price_history(trip_id, changed_at DESC);

CREATE OR REPLACE FUNCTION log_trip_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price_per_seat IS DISTINCT FROM OLD.price_per_seat THEN
    INSERT INTO trip_price_history(trip_id, old_price, new_price, changed_by)
    VALUES (NEW.id, OLD.price_per_seat, NEW.price_per_seat, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trip_price_change ON trips;
CREATE TRIGGER trip_price_change
  AFTER UPDATE OF price_per_seat ON trips
  FOR EACH ROW EXECUTE FUNCTION log_trip_price_change();

ALTER TABLE trip_price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "providers read own price history" ON trip_price_history;
CREATE POLICY "providers read own price history" ON trip_price_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trips t JOIN providers p ON p.id = t.provider_id
    WHERE t.id = trip_price_history.trip_id AND p.user_id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------- Site visits (anonymous visitor tracking) ----------
CREATE TABLE IF NOT EXISTS site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  path text NOT NULL,
  country text,
  city text,
  region text,
  ip_hash text,
  user_agent text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_country ON site_visits(country);
CREATE INDEX IF NOT EXISTS idx_site_visits_session ON site_visits(session_id);

ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read site_visits" ON site_visits;
CREATE POLICY "admins read site_visits" ON site_visits FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------- Email templates ----------
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  subject_ar text NOT NULL,
  subject_en text NOT NULL,
  body_html_ar text NOT NULL,
  body_html_en text NOT NULL,
  body_text_ar text,
  body_text_en text,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage email_templates" ON email_templates;
CREATE POLICY "admins manage email_templates" ON email_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------- WhatsApp templates ----------
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  body_ar text NOT NULL,
  body_en text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage whatsapp_templates" ON whatsapp_templates;
CREATE POLICY "admins manage whatsapp_templates" ON whatsapp_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------- Storage buckets ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false), ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: owner + admin read, anyone authenticated can upload their own
DROP POLICY IF EXISTS "signatures_read_own_or_admin" ON storage.objects;
CREATE POLICY "signatures_read_own_or_admin" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'signatures' AND (
      (auth.uid()::text = (storage.foldername(name))[1]) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
      (storage.foldername(name))[1] = 'guest'
    )
  );

DROP POLICY IF EXISTS "signatures_insert_any_auth_or_guest" ON storage.objects;
CREATE POLICY "signatures_insert_any_auth_or_guest" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'signatures' AND (
      auth.role() = 'authenticated' OR
      (storage.foldername(name))[1] = 'guest'
    )
  );

DROP POLICY IF EXISTS "contracts_read_owner_or_admin" ON storage.objects;
CREATE POLICY "contracts_read_owner_or_admin" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts' AND (
      (auth.uid()::text = (storage.foldername(name))[1]) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- ---------- New notification types ----------
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'contract_signed';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'name_change_requested';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'name_change_approved';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Seed default email templates ----------
INSERT INTO email_templates (slug, subject_ar, subject_en, body_html_ar, body_html_en, variables)
VALUES
  ('booking_confirmed',
   'تم تأكيد حجزك — BookitFly',
   'Your booking is confirmed — BookitFly',
   '<p>مرحباً {{name}}،</p><p>تم تأكيد حجزك رقم <b>{{booking_id}}</b> من {{origin}} إلى {{destination}} بتاريخ {{date}}.</p>',
   '<p>Hello {{name}},</p><p>Your booking <b>{{booking_id}}</b> from {{origin}} to {{destination}} on {{date}} is confirmed.</p>',
   '["name","booking_id","origin","destination","date"]'::jsonb),
  ('booking_cancelled',
   'تم إلغاء حجزك',
   'Your booking was cancelled',
   '<p>مرحباً {{name}}، تم إلغاء حجزك رقم {{booking_id}}.</p>',
   '<p>Hello {{name}}, your booking {{booking_id}} has been cancelled.</p>',
   '["name","booking_id"]'::jsonb),
  ('booking_refunded',
   'تم استرداد مبلغ حجزك',
   'Your booking was refunded',
   '<p>مرحباً {{name}}، تم استرداد مبلغ {{amount}} ريال لحجزك {{booking_id}}.</p>',
   '<p>Hello {{name}}, {{amount}} SAR refunded for booking {{booking_id}}.</p>',
   '["name","booking_id","amount"]'::jsonb),
  ('application_approved',
   'تم قبول طلبك',
   'Your application was approved',
   '<p>تهانينا {{name}}، تم قبول طلبك للانضمام.</p>',
   '<p>Congratulations {{name}}, your application has been approved.</p>',
   '["name"]'::jsonb),
  ('application_rejected',
   'تم رفض طلبك',
   'Your application was rejected',
   '<p>مرحباً {{name}}، للأسف لم يتم قبول طلبك. السبب: {{reason}}</p>',
   '<p>Hello {{name}}, your application was rejected. Reason: {{reason}}</p>',
   '["name","reason"]'::jsonb),
  ('contract_signed',
   'تم توقيع العقد بنجاح',
   'Contract signed successfully',
   '<p>مرحباً {{name}}، تم استلام توقيعك على عقد {{contract_name}} بتاريخ {{date}}.</p>',
   '<p>Hello {{name}}, your signature on the {{contract_name}} contract was received on {{date}}.</p>',
   '["name","contract_name","date"]'::jsonb),
  ('name_change_requested',
   'طلب تغيير اسم مسافر',
   'Passenger name change requested',
   '<p>تم تقديم طلب تغيير اسم للحجز {{booking_id}}. من: {{old_name}} — إلى: {{new_name}}. الرسوم: {{fee}} ريال.</p>',
   '<p>Name change requested for booking {{booking_id}}. From: {{old_name}} — To: {{new_name}}. Fee: {{fee}} SAR.</p>',
   '["booking_id","old_name","new_name","fee"]'::jsonb),
  ('new_booking',
   'حجز جديد — BookitFly',
   'New booking — BookitFly',
   '<p>لديك حجز جديد من {{buyer_name}} بقيمة {{amount}} ريال.</p>',
   '<p>You have a new booking from {{buyer_name}} for {{amount}} SAR.</p>',
   '["buyer_name","amount"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ---------- Seed WhatsApp templates ----------
INSERT INTO whatsapp_templates (slug, body_ar, body_en, variables)
VALUES
  ('booking_confirmed',
   'مرحباً {{name}}، تم تأكيد حجزك رقم {{booking_id}} من {{origin}} إلى {{destination}} بتاريخ {{date}}. شكراً لاختيارك BookitFly ✈️',
   'Hello {{name}}, your booking {{booking_id}} from {{origin}} to {{destination}} on {{date}} is confirmed. Thanks for choosing BookitFly ✈️',
   '["name","booking_id","origin","destination","date"]'::jsonb),
  ('booking_reminder',
   'تذكير: رحلتك {{booking_id}} غداً الساعة {{time}}. نتمنى لك رحلة سعيدة!',
   'Reminder: your flight {{booking_id}} is tomorrow at {{time}}. Safe travels!',
   '["booking_id","time"]'::jsonb),
  ('name_change_confirmed',
   'تم تحديث اسم المسافر على حجزك {{booking_id}}. الرسوم المخصومة: {{fee}} ريال.',
   'Passenger name updated on booking {{booking_id}}. Fee charged: {{fee}} SAR.',
   '["booking_id","fee"]'::jsonb),
  ('contract_signed',
   'تم استلام توقيعك على العقد بنجاح. شكراً {{name}}.',
   'Your contract signature was received. Thanks {{name}}.',
   '["name"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- =================================================================
-- END
-- =================================================================
