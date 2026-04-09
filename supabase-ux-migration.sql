-- ============================================================
-- BookItFly UX Overhaul Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  car_id uuid REFERENCES cars(id) ON DELETE SET NULL,
  item_type text NOT NULL DEFAULT 'trip' CHECK (item_type IN ('trip', 'room', 'car', 'package')),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(booking_id, reviewer_id)
);

CREATE INDEX idx_reviews_provider ON reviews(provider_id);
CREATE INDEX idx_reviews_trip ON reviews(trip_id);
CREATE INDEX idx_reviews_room ON reviews(room_id);
CREATE INDEX idx_reviews_car ON reviews(car_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

-- Add rating columns to providers
ALTER TABLE providers ADD COLUMN IF NOT EXISTS avg_rating numeric(2,1) DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS review_count int DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Trigger to auto-update provider avg_rating and review_count
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE providers SET
    avg_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE provider_id = COALESCE(NEW.provider_id, OLD.provider_id)), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = COALESCE(NEW.provider_id, OLD.provider_id))
  WHERE id = COALESCE(NEW.provider_id, OLD.provider_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_provider_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their bookings"
  ON reviews FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
  );

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE USING (auth.uid() = reviewer_id);


-- 2. PRICE ALERTS TABLE
CREATE TABLE IF NOT EXISTS price_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  origin_code text NOT NULL,
  origin_name_ar text,
  origin_name_en text,
  destination_code text NOT NULL,
  destination_name_ar text,
  destination_name_en text,
  target_price numeric,
  cabin_class text DEFAULT 'economy',
  is_active boolean DEFAULT true,
  last_notified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(is_active) WHERE is_active = true;

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own price alerts"
  ON price_alerts FOR ALL USING (auth.uid() = user_id);


-- 3. SAVED ITEMS TABLE
CREATE TABLE IF NOT EXISTS saved_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('trip', 'room', 'car', 'package')),
  item_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX idx_saved_items_user ON saved_items(user_id);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved items"
  ON saved_items FOR ALL USING (auth.uid() = user_id);


-- 4. RECENT SEARCHES TABLE
CREATE TABLE IF NOT EXISTS recent_searches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  search_type text NOT NULL DEFAULT 'flight' CHECK (search_type IN ('flight', 'hotel', 'car')),
  origin_code text,
  destination_code text,
  origin_name_ar text,
  origin_name_en text,
  destination_name_ar text,
  destination_name_en text,
  departure_date date,
  return_date date,
  trip_type text,
  passengers int DEFAULT 1,
  cabin_class text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_recent_searches_user ON recent_searches(user_id, created_at DESC);

ALTER TABLE recent_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recent searches"
  ON recent_searches FOR ALL USING (auth.uid() = user_id);

-- Auto-cleanup: keep only last 10 searches per user
CREATE OR REPLACE FUNCTION cleanup_recent_searches()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM recent_searches
  WHERE id IN (
    SELECT id FROM recent_searches
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_cleanup_recent_searches
AFTER INSERT ON recent_searches
FOR EACH ROW EXECUTE FUNCTION cleanup_recent_searches();


-- 5. FAQ / HELP CONTENT TABLE
CREATE TABLE IF NOT EXISTS faq_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('booking', 'payment', 'cancellation', 'provider', 'account', 'general')),
  question_ar text NOT NULL,
  question_en text,
  answer_ar text NOT NULL,
  answer_en text,
  sort_order int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published FAQ items"
  ON faq_items FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage FAQ items"
  ON faq_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- 6. Add notification types for new features
-- (The notification type is stored as text, so no enum change needed)

-- 7. Enable realtime for reviews (optional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE reviews;

-- 8. pg_cron job for price alerts (runs daily at 8am)
-- Uncomment if pg_cron is enabled:
-- SELECT cron.schedule(
--   'check-price-alerts',
--   '0 8 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_APP_URL/api/cron/check-price-alerts',
--     headers := '{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
--   );
--   $$
-- );
