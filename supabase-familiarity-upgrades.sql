-- =======================================================================
-- BookitFly — familiarity upgrades
-- Adds: fare_tiers, saved_passengers, loyalty_wallet, price_freeze,
--       check-in reminders tracking, booking reference shortcode,
--       luggage add-on tracking, flexible destination search.
-- Safe to re-run (idempotent via IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- =======================================================================

-- ---------------------------------------------------------------
-- 1. Fare tiers on trips (jsonb array of { code, name_ar, name_en, price, cabin_kg, checked_kg, refundable, changeable, seat_selection, badge_ar, badge_en, description_ar, description_en })
-- ---------------------------------------------------------------
alter table if exists trips
  add column if not exists fare_tiers jsonb default '[]'::jsonb;

alter table if exists trips
  add column if not exists duration_minutes integer;

comment on column trips.fare_tiers is
  'Array of fare-tier objects. Each: {code, name_ar, name_en, price, cabin_kg, checked_kg, refundable, changeable, seat_selection, badge_ar, badge_en, description_ar, description_en}';

comment on column trips.duration_minutes is
  'Flight duration in minutes — used for fastest sort + best value ribbon ranking';

-- ---------------------------------------------------------------
-- 2. Booking reference short code (for guest lookup)
-- ---------------------------------------------------------------
alter table if exists bookings
  add column if not exists reference_code text;

-- Generate a unique short reference (8 alphanumeric chars, no confusing 0/O/1/I)
create or replace function generate_booking_reference()
returns text
language plpgsql
as $$
declare
  new_code text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  loop
    new_code := '';
    for i in 1..8 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;

    -- PERFORM + FOUND avoids any SELECT INTO parser ambiguity
    perform 1 from bookings where reference_code = new_code limit 1;
    if not found then
      return new_code;
    end if;
  end loop;
end;
$$;

-- Backfill + auto-fill trigger
update bookings set reference_code = generate_booking_reference()
  where reference_code is null;

create or replace function fill_booking_reference()
returns trigger
language plpgsql
as $$
begin
  if new.reference_code is null then
    new.reference_code := generate_booking_reference();
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_fill_reference on bookings;
create trigger bookings_fill_reference
  before insert on bookings
  for each row
  execute function fill_booking_reference();

alter table if exists bookings
  alter column reference_code set not null;

create unique index if not exists bookings_reference_code_uq on bookings (reference_code);

-- Mirror on the other 3 booking tables, if they exist
alter table if exists room_bookings add column if not exists reference_code text;
alter table if exists car_bookings add column if not exists reference_code text;
alter table if exists package_bookings add column if not exists reference_code text;

do $$
begin
  if to_regclass('room_bookings') is not null then
    update room_bookings set reference_code = generate_booking_reference() where reference_code is null;
    alter table room_bookings alter column reference_code set not null;
    create unique index if not exists room_bookings_reference_code_uq on room_bookings (reference_code);
    drop trigger if exists room_bookings_fill_reference on room_bookings;
    create trigger room_bookings_fill_reference before insert on room_bookings for each row execute function fill_booking_reference();
  end if;
  if to_regclass('car_bookings') is not null then
    update car_bookings set reference_code = generate_booking_reference() where reference_code is null;
    alter table car_bookings alter column reference_code set not null;
    create unique index if not exists car_bookings_reference_code_uq on car_bookings (reference_code);
    drop trigger if exists car_bookings_fill_reference on car_bookings;
    create trigger car_bookings_fill_reference before insert on car_bookings for each row execute function fill_booking_reference();
  end if;
  if to_regclass('package_bookings') is not null then
    update package_bookings set reference_code = generate_booking_reference() where reference_code is null;
    alter table package_bookings alter column reference_code set not null;
    create unique index if not exists package_bookings_reference_code_uq on package_bookings (reference_code);
    drop trigger if exists package_bookings_fill_reference on package_bookings;
    create trigger package_bookings_fill_reference before insert on package_bookings for each row execute function fill_booking_reference();
  end if;
end$$;

-- ---------------------------------------------------------------
-- 3. Luggage add-on + fare tier selection on bookings
-- ---------------------------------------------------------------
alter table if exists bookings
  add column if not exists selected_fare_tier text,
  add column if not exists extra_checked_bags integer not null default 0,
  add column if not exists extra_bag_fee numeric(10,2) not null default 0,
  add column if not exists booked_for_other boolean not null default false;

-- ---------------------------------------------------------------
-- 4. Saved passenger profiles (autofill from past bookings)
-- ---------------------------------------------------------------
create table if not exists saved_passengers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  nationality_iso text,
  id_number text not null,
  id_expiry_date date not null,
  is_self boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_passengers_user_idx on saved_passengers (user_id);

alter table saved_passengers enable row level security;

drop policy if exists "saved_passengers_select_own" on saved_passengers;
create policy "saved_passengers_select_own" on saved_passengers
  for select using (auth.uid() = user_id);

drop policy if exists "saved_passengers_insert_own" on saved_passengers;
create policy "saved_passengers_insert_own" on saved_passengers
  for insert with check (auth.uid() = user_id);

drop policy if exists "saved_passengers_update_own" on saved_passengers;
create policy "saved_passengers_update_own" on saved_passengers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_passengers_delete_own" on saved_passengers;
create policy "saved_passengers_delete_own" on saved_passengers
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 5. Loyalty wallet (Qitaf-like) — points earned per booking
-- ---------------------------------------------------------------
create table if not exists loyalty_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance_points integer not null default 0,
  lifetime_points integer not null default 0,
  tier text not null default 'silver',
  updated_at timestamptz not null default now()
);

create table if not exists loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('earn','redeem','adjustment','expire')),
  points integer not null,
  booking_id uuid,
  booking_kind text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_tx_user_idx on loyalty_transactions (user_id, created_at desc);

alter table loyalty_wallets enable row level security;
alter table loyalty_transactions enable row level security;

drop policy if exists "loyalty_wallet_select_own" on loyalty_wallets;
create policy "loyalty_wallet_select_own" on loyalty_wallets
  for select using (auth.uid() = user_id);

drop policy if exists "loyalty_tx_select_own" on loyalty_transactions;
create policy "loyalty_tx_select_own" on loyalty_transactions
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 6. Price freeze (hold price for 48h)
-- ---------------------------------------------------------------
create table if not exists price_freezes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  guest_email text,
  trip_id uuid,
  room_id uuid,
  car_id uuid,
  package_id uuid,
  frozen_price numeric(10,2) not null,
  currency text not null default 'SAR',
  fee_paid numeric(10,2) not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  booking_id uuid,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists price_freezes_user_idx on price_freezes (user_id);
create index if not exists price_freezes_expires_idx on price_freezes (expires_at);

alter table price_freezes enable row level security;

drop policy if exists "price_freezes_select_own" on price_freezes;
create policy "price_freezes_select_own" on price_freezes
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 7. Check-in reminder tracking
-- ---------------------------------------------------------------
alter table if exists bookings
  add column if not exists checkin_reminder_24h_sent_at timestamptz,
  add column if not exists checkin_reminder_3h_sent_at timestamptz;

-- ---------------------------------------------------------------
-- 8. Flexible destination search (lat/lon on trips for map view + anywhere-search)
-- ---------------------------------------------------------------
alter table if exists trips
  add column if not exists origin_lat numeric,
  add column if not exists origin_lon numeric,
  add column if not exists destination_lat numeric,
  add column if not exists destination_lon numeric;

-- ---------------------------------------------------------------
-- 9. pg_cron: check-in reminder dispatcher (fires every 15 min)
-- ---------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'checkin-reminder-dispatch',
      '*/15 * * * *',
      $cron$
      select net.http_post(
        url := current_setting('app.settings.api_base', true) || '/api/cron/checkin-reminders',
        headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true))
      );
      $cron$
    );
  end if;
exception when others then
  raise notice 'Could not schedule cron (pg_cron/pg_net not set up): %', sqlerrm;
end$$;

-- ---------------------------------------------------------------
-- Done.
-- ---------------------------------------------------------------
