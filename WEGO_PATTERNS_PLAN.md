# Wego-Pattern Roadmap — Trips Page

> Note: a `PLAN.md` already exists at the repo root for an unrelated platform
> evolution plan. This file tracks Wego-style UX patterns separately.

This document tracks the remaining Wego-style UX patterns to bring the trips
search experience closer to a meta-search competitor (Wego, Skyscanner, Kayak).

The big search card, trip-type pills, dual date pickers, passenger+cabin
picker, 7-day price strip, sort tabs, and result counts are already in place.
The first stops filter (chips above results: Direct / 1 stop / 2+ stops) was
shipped together with this plan and lives in `components/trips/stops-filter.tsx`.

---

## 1. Stops filter chips ✅ (DONE)

Implemented in this iteration.

- File: `components/trips/stops-filter.tsx`
- Wired into `app/[locale]/trips/trips-content.tsx`
- Shows counts and the cheapest price per bucket
- Filters both platform `trips` (using `is_direct`) and `partnerOffers`
  (using `transfers`)
- Hotels are unaffected
- Resets when the global "Clear filters" is triggered

Limitation: platform trips only expose `is_direct` (boolean), so non-direct
platform trips are bucketed as "1 stop" (we cannot distinguish 1 vs. 2+).
If this becomes important, add a `stops_count` column to `trips`.

---

## 2. Airline filter chips with counts and min-price ✅ (DONE)

Implemented.

- File: `components/trips/airline-filter.tsx`
- Wired into `app/[locale]/trips/trips-content.tsx`
- Aggregates airlines from both platform `trips.airline` and
  `partnerOffers.airline_iata`/`airline_name`. IATA-looking strings (2–3
  alphanumerics) are normalized to uppercase; free-text names get a
  `name:<lowercased>` bucket key so they don't collide with IATA codes.
- Each chip shows: airline logo (via `https://pics.avs.io/64/64/{IATA}.png`
  CDN, falls back to a 2-letter monogram), name, result count, and the
  cheapest price for that airline.
- Counts and min-prices respect the active stops filter so chips reflect
  what selecting them would actually yield.
- Sorted by cheapest price; only top 6 shown by default with a "+N" expander.
- Filters both `filteredTrips` and `filteredPartnerOffers`; resets in
  `clearFilters`; counted in `hasActiveFilters`.

---

## 3. Sticky compact search bar on scroll ✅ (DONE)

Implemented.

- File: `components/trips/sticky-search-summary.tsx`
- Wired into `app/[locale]/trips/trips-content.tsx` via a `searchCardRef`
  attached to the main search card.
- Uses `IntersectionObserver` (rootMargin `-80px` to clear the navbar) to
  show the bar only when the search card scrolls above the navbar.
- `position: fixed; top-20` with backdrop blur; slides in/out with opacity
  + translate-Y transition.
- Layout shows route (origin → destination), date range, pax + cabin
  (responsive: route always visible, date from md+, pax+cabin from lg+),
  plus Edit and Search buttons.
- Trip type drives the divider icon (round-trip → ⇄, else →).
- Edit smooth-scrolls back to the main card; Search re-runs `handleSearch`.

Mobile bottom-sheet polish (a single pill that opens a full editor) is
deferred — the current responsive collapse is good enough for MVP.

---

## 4. Departure-time buckets ✅ (DONE)

Implemented.

- File: `components/trips/departure-time-filter.tsx`
- Buckets: Morning (06–11:59), Afternoon (12–17:59), Evening (18–23:59),
  Night (00–05:59) — derived from the hour part of the ISO string at
  origin local time (UTC slice from the ISO, not the user's local TZ).
- Each chip has a sun/moon icon and a result count.
- Wired into `app/[locale]/trips/trips-content.tsx` via `timeFilter` state;
  applied in both `filteredTrips` and `filteredPartnerOffers`; reset in
  `clearFilters`; counted in `hasActiveFilters`.
- Added `night` translation in `messages/{ar,en}.json`.

---

## 5. Duration slider ✅ (DONE)

Implemented.

- File: `components/trips/duration-filter.tsx`
- Single slider capped between `min` and `max` hours derived from the
  current result set (`durationBounds` `useMemo`).
- Hidden when all results have the same duration (`max <= min`).
- "≤ N hours" label + clear `×` once active. When the user drags to the
  max, the cap resets to `null` (no filter).
- Wired into `app/[locale]/trips/trips-content.tsx` via `maxDurationHours`
  state; applied in both filtered memos; reset in `clearFilters`; counted
  in `hasActiveFilters`.

---

## 6. Price-prediction / "Good deal" badge ✅ (DONE)

Implemented.

- Files:
  - `lib/price-tier.ts` — `computePriceTiers(items)` returns a `Map<id, tier>`
    using simple quartile bucketing (≤Q1 → `good_deal`, ≥Q3 → `high`, rest
    `typical`). Skips when fewer than 4 items or when prices collapse to a
    single value. Also exports `priceMedian(items)` for the tooltip.
  - `components/ui/price-tier-badge.tsx` — emerald "Good deal" / amber
    "High price" badge. Returns `null` for `typical`. Tooltip ("vs. route
    median X CUR") uses the `title` attribute, locale-aware (AR/EN/TR).
- Wired into:
  - `TripCard` accepts `priceTier` + `priceMedian` props; the badge sits
    next to the existing ribbon row.
  - `LiveTripCard` accepts the same props; the badge sits next to the
    Duffel/Travelpayouts source pill in the top-right corner.
  - `trips-content.tsx` builds a merged `[trips + partnerOffers]` set (with
    `t:` / `o:` prefixed ids to avoid collisions), computes tiers + median
    in a `useMemo`, and passes per-card values down.
- Tier reflects the **full visible market** (both platform trips and live
  offers) so the "good deal" claim is meaningful across sources.

---

## 7. "Search nearby" toggles ✅ (DONE — partial)

Implemented for **platform trips**. Live offers (Travelpayouts/Duffel) and
the per-card deviation badge are deferred (see notes).

- New file: `lib/nearby-airports.ts` — curated map of MENA/GCC airport
  hubs to nearby IATA codes (RUH↔DMM, JED↔MED, DXB↔SHJ↔AUH, IST↔SAW, …).
  Lookup is case-insensitive on the IATA code; passing a city-name string
  is a no-op so the existing fuzzy ilike search still wins. Exports
  `expandWithNearby(code)` and `isIataCode(value)`.
- API `/api/trips` GET: now accepts `include_nearby=1` and `flex_days=N`
  (clamped to 0–3). When `include_nearby` is on **and** the search term
  is a 3-letter IATA, the location filter expands to match any of the
  expanded codes against `*_code`. `flex_days` widens the
  `departure_at` lower/upper bounds by ±N days.
- SSR `app/[locale]/trips/page.tsx` mirrors the same expansion + flex-day
  logic so first paint matches the URL.
- Trips content (`trips-content.tsx`):
  - `Filters` extended with `include_nearby: boolean` and `flex_days: number`.
  - Two new toggle pills under the trip-type row: 📍 *Nearby airports* and
    📅 *Flexible dates ±3*.
  - Wired into URL sync, `filterDepsRef` change-tracker, `fetchTrips`
    params, and `clearFilters` (via `emptyFilters`).
  - `hasActiveFilters` rewritten to handle booleans/numbers correctly
    (the old `val !== ''` check was buggy for non-string fields).

**Deferred:**
- **Live offers nearby/flex.** Travelpayouts/Duffel each take a single
  origin/destination/date — supporting nearby/flex would mean fan-out
  parallel calls. Out of scope for this turn; track separately.
- **Per-card deviation badge** (`From RUH +75 km`, `+1 day`). Needs the
  server to tag each result with how it deviated from the user's
  original query. Easy follow-up: add `deviation: { airport?: string;
  days?: number }` to the trips API response.

---

## 8. Saved searches & price alerts ✅ (DONE)

Most of this feature was **already built** in the project under the name
`price_alerts`. What was missing was exposing it on the trips **search**
page (it had only been wired into the trip detail page). Added in this
turn:

- New file: `components/trips/track-route-button.tsx`
  - "Track route" button that checks existing alerts on mount via
    `/api/price-alerts` and reflects state (`Track route` ↔ `Tracked`).
  - Auth-aware via the `useUser` context: logged-out users get a login
    CTA that returns to the current URL.
  - Posts to `/api/price-alerts` with `origin_code`, `destination_code`,
    `cabin_class`, and `target_price` (= the route median price from
    `priceTierData`).
  - Handles 409 (alert exists) gracefully by flipping to "Tracked".
- Wired into `app/[locale]/trips/trips-content.tsx` next to the Share
  button. Hidden until both origin and destination are filled.

**Already in place (not re-built):**
- Table: `price_alerts` (Supabase).
- API: `app/api/price-alerts/route.ts` (GET / POST / DELETE).
- Cron: `app/api/cron/check-price-alerts/` (re-runs live-offer fetch and
  fires when current price ≤ target).
- Email: `emails/price-alert.tsx` template.
- Management UI: `app/[locale]/profile/alerts/` page.
- Notification type: `price_alert_triggered` in `types/database.ts`.

---

## 9. Map view toggle for hotels ✅ (DONE)

Implemented with **Leaflet + OpenStreetMap** (already in `package.json` as
`leaflet` 1.9 + `react-leaflet` 5). No paid map provider needed.

- New file: `lib/city-coordinates.ts` — curated `CITY_COORDS` map of
  IATA-code → `[lat, lng]` for the MENA/GCC cities the platform serves
  (Saudi, UAE, Egypt, Jordan, Lebanon, Turkey, Iraq, Maghreb). Hotel
  offers carry `city_iata` only (Booking.com aggregates per-city, not
  per-property), so plotting per-city is the honest level of detail.
- New file: `components/trips/hotel-map-view.tsx`
  - `HotelMapView({ offers, height })` — clusters offers by `city_iata`
    so the same city's luxury/comfort/budget tiers stack into a single
    pin with a popover.
  - Popover lists each tier (with star count) as a clickable affiliate
    deep-link to Booking, and shows a "from N CUR" footer using the
    cheapest tier in that city.
  - Auto-centers on the cluster centroid; zooms to 11 for one-city
    results, 5 for multi-city.
  - SSR-safe: imported into `trips-content.tsx` via `next/dynamic` with
    `ssr: false` so Leaflet's `window`/DOM access never runs on the
    server. Leaflet CSS is imported in the component file (mirrors
    `components/shared/location-map.tsx`).
- Wiring: hotels section now uses the existing `MapViewToggle`
  (`components/trips/map-view-toggle.tsx`, previously unused) — replaced
  the static "Stay tiers" badge with the toggle. `hotelView` state lives
  in `trips-content.tsx`.

Limitations / follow-ups:
- Per-property pins would need richer data from Booking; deferred until
  the hotels API exposes per-hotel lat/lng.
- Marker clustering (e.g. `react-leaflet-markercluster`) is unnecessary
  at the current per-city granularity — revisit when we move to
  per-property data.

---

## 10. Share-search URL button ✅ (DONE)

Implemented.

- Files:
  - `lib/use-filter-url-sync.ts` — debounced (300ms) sync from filter state
    to the URL via `window.history.replaceState`. Critically, it does **not**
    use `router.replace` — that would re-invoke the server component (and
    refetch trips + live offers) on every keystroke. The server-rendered
    initial filters are still honoured because the URL is shareable; once
    in the client, filter changes update the URL silently.
  - `components/trips/share-search-button.tsx` — Share button placed next
    to the sort dropdown / filter toggle.
- Share strategy:
  1. Try `navigator.share()` (mobile share-sheet, system dialog).
  2. Fallback: `navigator.clipboard.writeText`.
  3. Last-resort fallback: hidden `<input>` + `document.execCommand('copy')`.
- Shows a "Copied" check icon for 1.8s after a successful clipboard copy.
- Empty/default values (sort=newest, adults=1, etc.) are stripped from the
  URL so it stays compact and human-readable.

---

## 11. Recent searches strip ✅ (DONE)

Implemented.

- File: `components/trips/recent-searches.tsx` — exports `RecentSearches`,
  `loadRecentSearches`, `saveRecentSearch`, and `clearRecentSearches`.
- Storage: `localStorage` key `bookitfly:recent_searches`, capped at 6,
  FIFO with de-duplication on `origin-destination-date_from`.
- Saved automatically on `handleSearch` when both origin & destination are
  set; the component is bumped via a `refreshKey` so it re-reads storage.
- Selecting a chip restores all stored fields (origin, destination, dates,
  trip type, cabin, pax) and re-runs the search.
- Each chip has a tiny `×` to remove a single entry.
- Hidden entirely when no recent searches exist.
- Renders just below the main search card.

---

## Recommended order

1. Stops chips ✅
2. Airline chips with counts ✅
3. Sticky compact search bar ✅
4. Departure-time buckets ✅ + Duration slider ✅
5. Share-search URL ✅ + Recent searches ✅
6. Price-tier badge ✅
7. Search-nearby toggles ✅ (platform trips only; live-offer fan-out + per-card
   deviation badge deferred)
8. Saved searches & price alerts ✅
9. Hotel map view ✅

---

## Notes

- All chip components should follow the styling in `stops-filter.tsx`
  (rounded-full, slate-200 border, primary fill when active, with optional
  count badge and min-price tag).
- Translations live in `messages/{ar,en}.json` under the `filters` key —
  reuse existing keys where possible (`direct`, `morning`, etc.).
- Keep filters client-side until they grow large; once we add the airline
  filter we may want a single `?filters=` URL param to avoid bloating the
  query string.
