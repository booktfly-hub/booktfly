-- =================================================================
-- Daily unsigned-contract reminder infrastructure.
-- Adds reminder_sent_at tracking + schedules pg_cron to call the
-- /api/cron/contract-reminders endpoint once per day at 09:10 UTC.
-- =================================================================

-- Track when we last reminded the buyer so we don't spam
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contract_reminder_sent_at timestamptz;
ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS contract_reminder_sent_at timestamptz;
ALTER TABLE car_bookings ADD COLUMN IF NOT EXISTS contract_reminder_sent_at timestamptz;
ALTER TABLE package_bookings ADD COLUMN IF NOT EXISTS contract_reminder_sent_at timestamptz;

-- Enable pg_net so pg_cron can make HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule: every day at 09:10 UTC (12:10 Saudi Arabia time)
-- pg_cron calls /api/cron/contract-reminders with the shared secret.
-- Replace CRON_SECRET_VALUE with your real value via the Supabase dashboard after applying this migration.
DO $$
DECLARE
  app_url text := current_setting('app.settings.app_url', true);
  cron_secret text := current_setting('app.settings.cron_secret', true);
BEGIN
  -- Guard: only schedule if both settings are configured
  IF app_url IS NOT NULL AND cron_secret IS NOT NULL THEN
    PERFORM cron.unschedule('contract-reminders-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'contract-reminders-daily');
    PERFORM cron.schedule(
      'contract-reminders-daily',
      '10 9 * * *',
      format(
        $job$ SELECT net.http_post(
          url := %L,
          headers := jsonb_build_object('Authorization', %L, 'Content-Type', 'application/json'),
          body := '{}'::jsonb
        ); $job$,
        app_url || '/api/cron/contract-reminders',
        'Bearer ' || cron_secret
      )
    );
  END IF;
END $$;

SELECT 'migration applied' AS status;
