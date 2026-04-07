# BookitFly — Change Log for Audit & Testing
**Date:** 2026-04-07  
**Session summary:** Two feature batches were implemented in this conversation.

---

## Batch 1 — Package Component Pricing & Savings Display

### What changed
Packages previously had a single `total_price` field. Providers can now enter a separate price for each component (flight, hotel, car), see an auto-calculated total, and optionally enter a discounted "offer price" to surface a savings badge to buyers.

### Database
| Migration | File |
|-----------|------|
| `add_package_component_prices` | Applied via Supabase MCP |

**Columns added to `packages` table:**
| Column | Type | Nullable |
|--------|------|----------|
| `trip_price` | numeric | YES |
| `car_price` | numeric | YES |
| `hotel_price` | numeric | YES |

**Existing columns re-used (no schema change needed):**
- `total_price` — now stores the final price the buyer pays (offer price if set, otherwise the sum)
- `original_price` — now stores the sum of components (shown as crossed-out) when an offer price is set

### Files modified

| File | Change |
|------|--------|
| `types/database.ts` | Added `trip_price`, `car_price`, `hotel_price` (`number \| null`) to `Package` type |
| `lib/validations.ts` | Added `trip_price`, `car_price`, `hotel_price`, `offer_price` (all optional numbers) to `getPackageSchema()` |
| `app/api/packages/route.ts` (POST) | Reads new fields from FormData; computes `total_price = offer_price ?? sum`, `original_price = offer_price ? sum : null` |
| `app/api/packages/[id]/route.ts` (PUT) | Same logic applied to the edit/update handler |
| `app/[locale]/provider/packages/new/page.tsx` | Replaced single price input with per-component price inputs (shown conditionally based on included components), auto-total display, optional offer price field with live savings preview |
| `app/[locale]/provider/packages/[id]/page.tsx` | Same UI changes applied to the edit page; existing `total_price`/`original_price` loaded back correctly into the new fields |
| `components/packages/package-card.tsx` | Added savings badge: "وفر X ر.س مع الباقة" / "Save X SAR with the package" shown when `original_price > total_price` |

### Business logic
```
trip_price + car_price + hotel_price = SUM

if offer_price is set AND offer_price < SUM:
    total_price   = offer_price       ← what buyer pays
    original_price = SUM              ← shown crossed out
    savings badge = SUM - offer_price

if offer_price is NOT set:
    total_price   = SUM
    original_price = null             ← no crossed-out price shown
```

### How to test
1. Log in as a provider with an active account.
2. Go to **Provider → Packages → New Package**.
3. Enable "Flight", "Hotel", and "Car" toggles.
4. Enter a price for each enabled component (e.g., Flight: 1000, Hotel: 800, Car: 400).
5. Verify the **Total** box auto-updates to 2200.
6. Enter an offer price lower than 2200 (e.g., 1900).
7. Verify the green text appears: "وفر 300 ر.س مع الباقة".
8. Submit and verify the package appears on the listing page with a crossed-out 2200 and 1900 as the offer price.
9. Open the package card and confirm the savings badge is displayed.
10. Edit the package and verify prices load correctly.
11. Clear the offer price and re-save — confirm the crossed-out price disappears.

---

## Batch 2 — UX Improvements (6 sub-tasks)

---

### 2A — Last-Minute Page: Trip Preferences Prompt

**What changed:** A preference bar is shown at the top of the Last-Minute deals page asking for:
- Number of passengers (numeric input, min 1)
- Trip type (Round Trip / One Way toggle)

Preferences are saved to `localStorage` under key `bkf_prefs` and restored on next visit. A confirmation summary is shown after saving.

**File modified:** `app/[locale]/last-minute/last-minute-content.tsx`

**localStorage key:** `bkf_prefs`  
**Fields stored:** `{ passengers: number, tripType: "round_trip" | "one_way" }`

**How to test:**
1. Open `/last-minute` as any user (logged in or not).
2. The preference bar appears above the trip cards.
3. Set passengers to 3 and select "One Way". Click **Save**.
4. Confirm the summary line shows "3 passengers · One way".
5. Refresh the page — verify the values are restored (3, One Way).
6. Open browser DevTools → Application → localStorage → confirm `bkf_prefs` key exists with correct values.
7. Change to Round Trip and verify it saves immediately (no submit needed for toggle).

---

### 2B — Date Formatting: Always English + Year

**What changed:** All date displays across the application now use English locale and include the year. Previously, dates in Arabic mode displayed using the Arabic (`ar-SA`) locale (e.g., "٧ أبريل ٢٠٢٦") and some displays omitted the year.

**Format applied:** `d MMM yyyy` (e.g., "7 Apr 2026") via `date-fns/enUS`, or `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`.

**Files modified:**
| File | Location |
|------|----------|
| `components/home/hero-section-client.tsx` | Hotel check-in, car pickup/return, flight departure/return date pickers |
| `components/trips/trip-card.tsx` | Departure date and time display |
| `components/packages/package-card.tsx` | Package start/end dates — year added |
| `components/rooms/room-availability-badge.tsx` | Available from/to dates — year added |
| `components/provider/trip-detail-form.tsx` | Departure and return date pickers |
| `app/[locale]/trips/trips-content.tsx` | Departure and return date filter pickers |
| `app/[locale]/trips/[id]/page.tsx` | Trip detail departure date |
| `app/[locale]/packages/[id]/package-detail-client.tsx` | Package detail date displays |
| `app/[locale]/provider/rooms/new/page.tsx` | Available from/to date pickers |
| `app/[locale]/provider/rooms/[id]/page.tsx` | Available from/to date pickers |
| `app/[locale]/provider/trips/new/page.tsx` | Departure and return date pickers |

**How to test:**
1. Switch the app to Arabic locale (`/ar/...`).
2. Open any trip card — departure date should read e.g. "15 Jun 2026" (not Arabic numerals).
3. Open the home page search and click the departure date picker — the selected date displays as "15 Jun 2026".
4. Open a package card — start/end dates should include the year.
5. Open the provider room creation form — available from/to dates should display in English with year.

---

### 2C — Home Page: Removed Sections

**What changed:**
- **Removed:** `StatsSection` (trips count / providers count / bookings count statistics block).
- **Removed:** `TrendingDestinations` ("وجهات سياحية رايجة") section.
- Related database queries for `tripsCount`, `providersCount`, `bookingsCount` removed from the server component.

**File modified:** `app/[locale]/page.tsx`

**How to test:**
1. Open the home page (`/` or `/ar`).
2. Confirm there is no statistics counter section (trips listed, providers, bookings confirmed).
3. Confirm there is no "وجهات سياحية رايجة" / "Trending Destinations" section.

---

### 2D — Home Page: Request-Trip Section Repositioned

**What changed:** `FlightRequestSection` ("هل تحتاج رحلة مخصصة؟") moved from the bottom of the page to immediately after the Hero/Search component — making it the second visible section.

**File modified:** `app/[locale]/page.tsx`

**New page section order:**
1. Hero (search)
2. **Flight Request Section** ← moved here
3. Last Minute Deals
4. Featured Trips
5. Value Proposition
6. How It Works
7. Testimonials
8. Become Provider CTA

**How to test:**
1. Open the home page.
2. Scroll down past the hero/search component.
3. The "request a custom flight" card should be the very first section encountered.

---

### 2E — Search: Passengers Count for Flights

**What changed:** A passengers count input (with `Users` icon) was added to the flight search form on the hero section. It:
- Defaults to 1
- Is included in the URL when navigating to `/trips` (as `?passengers=N` when N > 1)
- Is persisted to `localStorage` (`bkf_prefs.passengers`)
- Is restored from `localStorage` on page load

Hotel passengers (already existed in the form) now also persist to `localStorage` (`bkf_prefs.hotelPassengers`).

**File modified:** `components/home/hero-section-client.tsx`

**localStorage key:** `bkf_prefs`  
**Fields stored:** `{ passengers: number, tripType: string, hotelPassengers: number }`

**How to test:**
1. Open the home page on the Flights tab.
2. Confirm a passengers input field is visible with a people icon.
3. Set passengers to 4 and select "One Way".
4. Click Search — verify the URL contains `?passengers=4&trip_type=one_way`.
5. Refresh the home page — confirm passengers shows 4 and trip type shows One Way.
6. Switch to Hotels tab, set passengers to 2, search.
7. Refresh — confirm hotel passengers field restores to 2.
8. Clear localStorage and reload — confirm defaults to 1 passenger, round trip.

---

## Summary Table

| # | Feature | DB Change | Files Changed | Status |
|---|---------|-----------|---------------|--------|
| 1 | Package per-component pricing + savings badge | 3 columns added | 7 files | ✅ Complete |
| 2A | Last-minute trip preferences prompt (localStorage) | None | 1 file | ✅ Complete |
| 2B | All dates → English + year | None | 11 files | ✅ Complete |
| 2C | Remove Stats + Trending Destinations from home | None | 1 file | ✅ Complete |
| 2D | Move Flight Request section below search | None | 1 file | ✅ Complete |
| 2E | Passengers count in flight search + localStorage | None | 1 file | ✅ Complete |

**Total files modified:** 22  
**Total DB migrations applied:** 1  
**Breaking changes:** None — all changes are additive or UI-only. Existing packages without component prices continue to work (fields are nullable).
