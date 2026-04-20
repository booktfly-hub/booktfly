-- =================================================================
-- Extend role-specific client contract signing to all booking types.
-- Rooms, Cars, and Packages must also gate payment behind a signed contract.
-- =================================================================

-- ---------- Room bookings ----------
ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS buyer_signature_url text;
ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz;
ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS contract_version text DEFAULT 'v1-2024';

-- ---------- Car bookings ----------
ALTER TABLE car_bookings ADD COLUMN IF NOT EXISTS buyer_signature_url text;
ALTER TABLE car_bookings ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz;
ALTER TABLE car_bookings ADD COLUMN IF NOT EXISTS contract_version text DEFAULT 'v1-2024';

-- ---------- Package bookings ----------
ALTER TABLE package_bookings ADD COLUMN IF NOT EXISTS buyer_signature_url text;
ALTER TABLE package_bookings ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz;
ALTER TABLE package_bookings ADD COLUMN IF NOT EXISTS contract_version text DEFAULT 'v1-2024';

SELECT 'migration applied' AS status;
