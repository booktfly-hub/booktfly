# BookitFly — Last Changes & Roadmap

_Last updated: 2026-04-20 (continued: duration_minutes + PhoneInput rollout)_

---

## 1. What Drove These Changes

### Competitor UX Research

Two production-ready competitors were analysed end-to-end:

**Almosafer.com (Saudi market leader)**
- Hijri calendar toggle on all date pickers (critical for Saudi users)
- BNPL "4× instalments, no interest" badge near every price
- Mada / Apple Pay / STC Pay / Visa / Mastercard logos on checkout
- Inline fare-tier expansion (FLY / ALM FLY / ALMOSAFER+ / FLYMAX) with feature matrix
- "Book for someone else" identity toggle before passenger details
- 4-step labelled progress stepper during checkout
- Persistent checkout sidebar (item + line-items + total on every checkout step)
- Luggage add-on upsell (per-bag extra checked baggage)
- Stale-search refresh modal after ~10 min of inactivity
- Post-booking cross-sell panel (hotel / car / package)

**Lastminute.com (international benchmark)**
- Stay-on-page flight-detail modal (mobile → bottom sheet)
- Sort tabs with price + duration previews per tab
- Trust bar (PCI-DSS, SSL, 24/7 support)
- Guest checkout with email-only reference lookup
- Ribbon badges: Best Value / Cheapest / Fastest on cards
- 7-day price calendar strip on flight listing
- Countdown urgency on last-minute deals

### Gap Analysis vs BookitFly

All ~22 approved gaps are now implemented (items 3, 12, 14, 24 were excluded per user request):

| # | Gap | Status |
|---|-----|--------|
| 1 | Hijri date picker | ✅ Done |
| 2 | BNPL badge | ✅ Done |
| 4 | Mada/STC Pay/Apple Pay logos | ✅ Done |
| 5 | Fare-tier selector (buyer) | ✅ Done |
| 6 | Fare-tier editor (provider) | ✅ Done |
| 7 | "Book for someone else" toggle | ✅ Done |
| 8 | Progress stepper | ✅ Done |
| 9 | Persistent checkout sidebar | ✅ Done |
| 10 | Luggage add-on panel | ✅ Done |
| 11 | Stale-search modal | ✅ Done |
| 13 | Cross-sell panel | ✅ Done |
| 15 | Ribbon badges (Best Value / Cheapest / Fastest) | ✅ Done |
| 16 | Flight-detail bottom sheet (mobile-first) | ✅ Done |
| 17 | Sort tabs with previews | ✅ Done |
| 18 | 7-day price calendar strip | ✅ Done |
| 19 | Passport name hint | ✅ Done |
| 20 | Phone input with country dial-code picker | ✅ Done |
| 21 | Saved-passengers autofill | ✅ Done |
| 22 | Loyalty wallet (earn/redeem points) | ✅ Done |
| 23 | 48h price freeze | ✅ Done |
| 25 | Guest booking lookup (email + reference code) | ✅ Done |
| 26 | Currency switcher | ✅ Done |
| 27 | Itinerary download (HTML→print→PDF) | ✅ Done |
| 28 | Check-in reminder cron (T−24h / T−3h) | ✅ Done |
| 29 | Map-view toggle UI | ✅ Done (rendering deferred) |
| 30 | "Anywhere" flexible destination option | ✅ Done (wiring deferred) |

---

## 2. Database Migration

**File:** `supabase-familiarity-upgrades.sql`
**How to apply:** Paste into Supabase SQL Editor → Run (idempotent, safe to re-run)

### Schema Changes

#### `trips` table
```
fare_tiers          jsonb    DEFAULT '[]'   -- array of FareTier objects
duration_minutes    integer                 -- for Fastest sort
origin_lat          numeric
origin_lon          numeric
destination_lat     numeric
destination_lon     numeric
```

#### `bookings` table
```
reference_code              text UNIQUE NOT NULL  -- 8-char alphanumeric, auto-generated
selected_fare_tier          text
extra_checked_bags          integer DEFAULT 0
extra_bag_fee               numeric(10,2) DEFAULT 0
booked_for_other            boolean DEFAULT false
checkin_reminder_24h_sent_at  timestamptz
checkin_reminder_3h_sent_at   timestamptz
```

#### New tables
| Table | Purpose |
|-------|---------|
| `saved_passengers` | Autofill passenger profiles per user |
| `loyalty_wallets` | Loyalty points balance + tier |
| `loyalty_transactions` | Points earn/redeem/adjust history |
| `price_freezes` | 48h price holds (fee-gated) |

All new tables have RLS enabled with user-scoped policies.

#### Functions & Triggers
- `generate_booking_reference()` — generates unique 8-char code (no 0/O/1/I)
- `fill_booking_reference` trigger — auto-fills on INSERT for `bookings`, `room_bookings`, `car_bookings`, `package_bookings`
- pg_cron job: fires every 15 min → `/api/cron/checkin-reminders`

---

## 3. New Files

### Library

| File | Purpose |
|------|---------|
| `lib/hijri.ts` | Umm al-Qura Hijri↔Gregorian (no npm dep), `formatHijri()`, `hijriMonths()` |
| `lib/countries-dial.ts` | 44 country dial codes, GCC/MENA first, `parseE164()`, `toE164()`, `flagEmoji()` |
| `lib/loyalty.ts` | Server-side `awardBookingPoints()` + `redeemPoints()` (uses supabaseAdmin) |

### UI Primitives (`components/ui/`)

| File | Purpose |
|------|---------|
| `bnpl-badge.tsx` | "4× no interest" badge — compact / inline / full variants |
| `ribbon-badge.tsx` | Best Value / Cheapest / Fastest badge + `computeRibbons<T>()` helper |
| `passport-name-hint.tsx` | Latin-letters passport name hint (compact + expanded) |
| `payment-logos.tsx` | Inline SVG logos: Mada, Apple Pay, Visa, Mastercard, STC Pay |
| `stale-search-modal.tsx` | 10-min inactivity modal with refresh + new-search CTAs |

### Booking Components (`components/bookings/`)

| File | Purpose |
|------|---------|
| `luggage-addon-panel.tsx` | Included bag display + extra-bag +/− upsell |
| `book-for-other-toggle.tsx` | Toggle: booking for self vs someone else |
| `checkout-sidebar.tsx` | Persistent sidebar: summary + line items + BNPL + payment logos + SSL |
| `cross-sell-panel.tsx` | Post-booking upsell for hotel / car / package |
| `price-freeze-button.tsx` | 48h price freeze UI (fee = max(25, 3% of price)) |

### Trip Components (`components/trips/`)

| File | Purpose |
|------|---------|
| `price-strip.tsx` | 7-day horizontal price calendar, colour-codes cheapest day |
| `sort-tabs.tsx` | Cheapest / Fastest / Top Rated / Newest tabs with price+duration previews |
| `flight-detail-sheet.tsx` | Mobile-first bottom sheet: full flight detail + sticky CTA + BNPL |
| `fare-tier-selector.tsx` | Buyer-facing tier comparison grid with feature rows |
| `map-view-toggle.tsx` | List / Map tab toggle (map rendering deferred) |
| `flexible-destination-option.tsx` | "Anywhere" destination option for search |

### Shared Components (`components/shared/`)

| File | Purpose |
|------|---------|
| `phone-input.tsx` | Flag + dial-code picker (44 countries, searchable) + E.164 formatting |
| `hijri-date-picker.tsx` | Gregorian↔Hijri toggle; Hijri = 3 dropdowns in Arabic |
| `passenger-category-picker.tsx` | Adult / Child / Infant counters with business rules |
| `currency-switcher.tsx` | SAR / AED / USD / EUR / GBP; persists to localStorage |
| `loyalty-badge.tsx` | Shows wallet balance or earn estimate for current booking |
| `saved-passengers-picker.tsx` | Autofill chips from saved passenger profiles |

### Provider Components (`components/provider/`)

| File | Purpose |
|------|---------|
| `fare-tiers-editor.tsx` | Up to 4 fare tiers per trip (name/price/baggage/refund/change/seat) |

### Auth Components (`components/auth/`)

| File | Purpose |
|------|---------|
| `guest-booking-lookup.tsx` | Email + reference-code form → redirects to guest booking view |

### API Routes (`app/api/`)

| Route | Method | Purpose |
|-------|--------|---------|
| `bookings/guest-lookup` | GET | Lookup by reference_code + email across all booking tables |
| `saved-passengers` | GET, POST | List + create passenger profiles |
| `saved-passengers/[id]` | PATCH, DELETE | Update + delete passenger profile |
| `loyalty` | GET | Wallet balance + last 20 transactions |
| `price-freeze` | GET, POST | Active freezes + create new freeze |
| `cron/checkin-reminders` | POST | Dispatches T−24h and T−3h check-in notifications |
| `bookings/[id]/itinerary` | GET | Full-page HTML itinerary (browser prints to PDF) |

---

## 4. Modified Files

| File | What Changed |
|------|-------------|
| `messages/ar.json` | 24 new namespaces: bnpl, ribbon, passport_hint, payment, phone_input, hijri, age_category, sort_tabs, fare_tier, luggage, book_for_other, checkout_sidebar, guest_lookup, price_strip, stale_search, cross_sell, currency, booking_success, check_in, loyalty, price_freeze, map_view, flex_destination, saved_passengers |
| `messages/en.json` | Same 24 namespaces in English |
| `types/database.ts` | Added `FareTier`, `SavedPassenger`, `LoyaltyWallet`, `LoyaltyTransaction`, `PriceFreeze` types; extended `Trip` and `Booking` with new columns |
| `lib/validations.ts` | Added `fare_tiers` array + `duration_minutes` + lat/lon fields to `getTripSchema()` |
| `components/trips/trip-card.tsx` | Added `ribbon` prop + `RibbonBadge` + `BnplBadge` near price |
| `components/cars/car-card.tsx` | Same ribbon + BNPL additions |
| `components/rooms/room-card.tsx` | Same |
| `components/packages/package-card.tsx` | Same |
| `app/[locale]/trips/trips-content.tsx` | `computeRibbons`, `PriceStrip`, `SortTabs`, `StaleSearchModal` |
| `app/[locale]/cars/cars-content.tsx` | `computeRibbons` + `ribbon` prop |
| `app/[locale]/rooms/rooms-content.tsx` | Same |
| `app/[locale]/packages/packages-content.tsx` | Same |
| `app/[locale]/trips/[id]/trip-detail-client.tsx` | `FlightDetailSheet` + `showDetailSheet` state; mobile price button → sheet |
| `app/[locale]/trips/[id]/book/page.tsx` | `FareTierSelector`, `PassengerCategoryPicker`, `BookForOtherToggle`, `LuggageAddonPanel`, `PriceFreezeButton`, `LoyaltyBadge`, `PhoneInput`, `HijriDatePicker`, `SavedPassengersPicker`, `PassportNameHint` |
| `app/[locale]/provider/trips/new/page.tsx` | `FareTiersEditor` after pricing card |
| `app/[locale]/checkout/[bookingId]/page.tsx` | `ProgressStepper` (step 3) + `TrustBadges`; confirmed state → itinerary download + `CrossSellPanel` |
| `app/[locale]/my-bookings/page.tsx` | `GuestBookingLookup` in empty state |
| `components/layout/navbar.tsx` | `CurrencySwitcher` next to `LanguageSwitcher` |
| `components/layout/footer.tsx` | `PaymentLogosRow` before copyright |
| `components/bookings/trust-badges.tsx` | `showPayments` prop → appends `PaymentLogosRow` |

---

## 5. PR2 Plan — Name-Change Policy + Age Discounts + Commission Override + Price History

_Migration file to create: `supabase-role-contracts-and-pricing.sql`_

### Schema additions (PR2)
```sql
-- bookings
ALTER TABLE bookings ADD COLUMN price_breakdown jsonb;
ALTER TABLE bookings ADD COLUMN name_change_count int NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN name_change_fee_paid numeric NOT NULL DEFAULT 0;

-- trips
ALTER TABLE trips ADD COLUMN name_change_allowed boolean NOT NULL DEFAULT false;
ALTER TABLE trips ADD COLUMN name_change_fee numeric NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN name_change_is_refundable boolean NOT NULL DEFAULT true;
ALTER TABLE trips ADD COLUMN child_discount_percentage numeric NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN infant_discount_percentage numeric NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN special_discount_percentage numeric NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN special_discount_label_ar text;
ALTER TABLE trips ADD COLUMN special_discount_label_en text;
ALTER TABLE trips ADD COLUMN commission_rate_override numeric;

-- price history
CREATE TABLE trip_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  old_price numeric, new_price numeric,
  changed_at timestamptz DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
-- AFTER UPDATE OF price_per_seat ON trips → insert history row
```

### UI work (PR2)
- Provider trip form: "Name change policy" card + age-discount % knobs + commission override field (admin-only)
- Buyer trip detail page: name-change badge + age-based price breakdown
- Booking form: `PassengerCategoryPicker` already wired — just need to persist `age_category` to `bookings.passengers` jsonb
- `app/api/bookings/[id]/change-name/route.ts` — validates policy, charges fee, updates `passengers`, increments count
- My-bookings: "Change passenger name" button when `name_change_allowed`
- Provider dashboard: sparkline of last 10 price changes per trip

---

## 6. PR3 Plan — E-Signatures + Admin Template Manager + Visitor Analytics

### Schema additions (PR3)
```sql
ALTER TABLE profiles ADD COLUMN signature_url text;
ALTER TABLE provider_applications ADD COLUMN signature_url text, contract_signed_at timestamptz, contract_version text;
ALTER TABLE marketeer_applications ADD COLUMN signature_url text, contract_signed_at timestamptz, contract_version text;
ALTER TABLE bookings ADD COLUMN buyer_signature_url text, contract_signed_at timestamptz, contract_version text;

CREATE TABLE email_templates (slug text UNIQUE, subject_ar text, subject_en text, body_html_ar text, body_html_en text, variables jsonb, enabled boolean);
CREATE TABLE whatsapp_templates (slug text UNIQUE, body_ar text, body_en text, variables jsonb, enabled boolean);

CREATE TABLE site_visits (
  session_id text, path text, country text, city text,
  ip_hash text, user_agent text, user_id uuid, referrer text,
  created_at timestamptz DEFAULT now()
);
```

### UI work (PR3)
- `components/signature-pad.tsx` — HTML5 canvas, mouse + touch, exports PNG dataURL
- `components/contract-viewer.tsx` — AR/EN contract text, scroll-to-bottom gates signing
- Contract step added to: `/become-provider/apply`, `/become-marketeer/apply`, `/checkout/[bookingId]`, `/guest/booking`
- `app/api/contracts/sign/route.ts` — uploads PNG to `signatures/` storage bucket, updates DB row
- `app/[locale]/admin/templates/` — list + edit email/WhatsApp templates, live preview
- `lib/templates.ts` — `renderTemplate(slug, vars, locale)` with DB-first, static fallback
- `app/[locale]/admin/analytics/visitors/page.tsx` — cards + bar charts (pure Tailwind, no chart lib)
- Visitor tracking in `proxy.ts`: fire-and-forget `site_visits` insert with hashed IP, Vercel geo headers

---

## 7. Outstanding Items (Must-Do Before Launch)

### Critical
- [ ] **`CRON_SECRET` env var** — add to `.env.local` AND Supabase project Settings → Edge Functions. Required for check-in reminder cron to authenticate.
- [ ] **Storage buckets** — create `signatures` and `contracts` buckets in Supabase Storage (private). Already in PR3 SQL but needed before any contract signing can work.

### High Priority
- [x] **`duration_minutes` UI** — added integer input (15–2880 min) in `app/[locale]/provider/trips/new/page.tsx` Flight Benefits card. Also wired `fare_tiers` + `duration_minutes` through `/api/trips` route into the `trips` insert.
- [x] **Phone input on major forms** — wired `PhoneInput` (with Controller for RHF) on: `app/[locale]/auth/signup/page.tsx`, `app/[locale]/profile/page.tsx`, `app/[locale]/become-provider/apply/page.tsx` (contact_phone), `app/[locale]/become-marketeer/apply/page.tsx` (phone + phone_alt).
- [x] **Phone input on remaining forms** — `PhoneInput` (with Controller) now wired on: `trip-requests/page.tsx`, `rooms/[id]/book/page.tsx`, `cars/[id]/book/page.tsx`, `packages/[id]/book/page.tsx`.

### Medium Priority
- [x] **Fare tiers on trip detail page** — `FareTierSelector` preview added to `trip-detail-client.tsx` after Trip Benefits card with a "selection happens at booking" note.
- [ ] **"Anywhere" destination wiring** — `FlexibleDestinationOption` component exists but needs to hook into the city autocomplete search and map `origin_lat/lon` + `destination_lat/lon` DB columns.

### Low Priority (Post-MVP)
- [ ] **Map view rendering** — `MapViewToggle` built, clicking "Map" does nothing. Needs Mapbox GL JS or Google Maps integration.
- [ ] **Loyalty redemption UI** — `LoyaltyBadge` shows balance and earn estimate. Need to add a "Use points" option during checkout (subtract from total).
- [ ] **Price freeze consumed flow** — when a freeze is consumed at checkout, the `price_freezes.consumed_at` column should be set and the frozen price applied. Currently the freeze row is created but not consumed.
- [ ] **WhatsApp templates** — `whatsapp_templates` table will be created in PR3. The send button is intentionally disabled ("Twilio not configured") until a WhatsApp Business API provider is chosen.

---

## 8. Quick Dev Reference

```bash
# Start dev server (port 3001)
pnpm dev

# Type-check
pnpm tsc --noEmit

# Apply DB migration
# → Open Supabase SQL Editor
# → Paste contents of supabase-familiarity-upgrades.sql
# → Run

# Kill port if occupied
lsof -ti:3001 | xargs kill -9
```

### Key URLs (local)
- App: http://localhost:3001
- Supabase project: https://xitstzqbjpdgkagtvczw.supabase.co
- Supabase SQL Editor: https://supabase.com/dashboard/project/xitstzqbjpdgkagtvczw/sql/new
