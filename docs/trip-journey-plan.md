# Trip User Journey — Plan

Scope: unify the trip experience for **Admin**, **Marketing**, and **User (buyer)** roles. Benchmarks: lastminute.com (urgency/flash deals), Wego/Almosafer (MENA patterns), Booking.com affiliate (marketer flow).

Industry anchors:
- Travel conversion: 2–3% average, 4%+ good
- Forced signup at checkout: ~−45% conversion
- Authentic countdown timers: +15–30% conversion
- Mobile wallets (Apple Pay / Mada): up to +50% conversion
- Page load < 2s is the floor

---

## 1. ADMIN — Curator, not janitor

### Keep
- Soft-remove trips with reason + provider email: `app/api/admin/trips/[id]/remove/route.ts`
- Approve/reject provider applications and booking payments
- All booking-status transitions go through admin-audited APIs

### Add
- `is_featured`, `featured_until`, `curated_category` on `trips`
- `/admin/trips` action: **Feature** (toggles boost + sets expiry)
- Curated category taxonomy: `last_minute`, `weekend_getaway`, `hajj_season`, `umrah_offer`, `family_friendly`
- `reported` flag on trips + `/admin/reports` queue (buyer complaints)
- Admin can create "Platform Curated" trips (seeded provider row)
- **Do NOT build**: pre-publish approval queue. Trust providers, punish via reports.

### Delete policy
- **No hard deletes** of trips or bookings. Only soft-delete. Audit trail is mandatory for refund disputes.

---

## 2. MARKETING — Every user is a marketer, then power-users get a dashboard

### Track A — Organic sharing (all users)
- WhatsApp share button on every trip card (MENA market = WhatsApp-first)
- Copy-link generates `trips/[id]?ref=USR-XXX`
- Rich OG image per trip via `@vercel/og`: price, route, seats left
- Downloadable Instagram Story asset (1080×1920, pre-rendered)
- Reward: Flypoints on conversion (table already exists)

### Track B — Professional marketers (`marketeer` role)
- `/marketeer` dashboard: clicks, conversions, earnings, top trips, pending payout
- UTM capture (`utm_source`, `utm_campaign`, `utm_medium`) persisted on `bookings`
- Creative kit page: banners, copy templates, trip-specific share images
- Tiered commission (bronze/silver/gold by monthly volume)
- Monthly leaderboard (gamification)

### Deal badges (marketing surface)
- 🔥 Flash Deal (ends in X)
- Only N seats left at this price (only if real)
- −X% vs avg
- "Last booked X min ago" (only real data)

---

## 3. USER — Zero-friction guest booking + gentle, email-driven retention

### Booking flow (target: 3 screens, < 60 seconds)
1. Trip page with sticky "Book now" + live "X seats left"
2. Single-page checkout: contact (name/email/phone) → passengers → payment
3. Confirmation: booking ref + **"Claim your account — one click"** soft CTA

### No email verification
- Per product decision: guest books with email + phone, no OTP, no verify.
- Possession of the email equals proof (same bar as "forgot password" flows).

### Email-driven lifecycle (all use existing Resend + React Email stack)
| Trigger | Template | CTA |
|---|---|---|
| Booking confirmed | `booking-confirmed` (existing) | Claim your account |
| 7d before trip | `trip-reminder` **(new)** | Get live gate alerts → account |
| Day of trip | `trip-day` **(new)** | No CTA — pure value |
| Day after trip | `trip-review` **(new)** | Rate + earn 50 Flypoints (requires account) |
| 3d after trip | `similar-trips` **(new)** | Save favorites with account |

### Magic-link claim flow
- New route: `/claim/[token]` where `token` = existing `guest_token`
- Click → passwordless signup → auto-merge all bookings with that email into the new user
- Zero OTP, zero verification step

### Copy principles
- Arabic-first, one soft CTA per email, never a popup, never a gate
- Confirmed ✅ examples:
  - "احفظ رحلتك في حسابك — خطوة واحدة فقط"
  - "أنشئ حسابك بنقرة واحدة للاطلاع على عروض مشابهة"

---

## Build order

1. **`/last-minute` polish** — page-level flash countdown, share kit on cards, stronger deal ribbons *(current task)*
2. **Share kit**: WhatsApp/Copy/X buttons + per-trip OG image (`@vercel/og`)
3. **Guest → account magic-link claim** (`/claim/[token]` + merge logic)
4. **Trip lifecycle emails** (reminder, trip-day, review, similar-trips)
5. **Admin "feature trip" toggle** + curated category landing pages
6. **Marketer dashboard** + UTM capture

Total estimate: ~5 focused dev-days.

---

## Files that matter

- Guest-aware booking API: `app/api/bookings/route.ts`
- Checkout: `app/[locale]/trips/[id]/book/page.tsx`
- Guest receipt: `app/[locale]/guest/booking/[token]/page.tsx`
- Notifications dispatch: `lib/notifications.ts`
- Referral cookie set: `app/ref/[code]/route.ts`
- Trip card (shared everywhere): `components/trips/trip-card.tsx`
- Last-minute landing: `app/[locale]/last-minute/last-minute-content.tsx`
- Admin trip ops: `app/api/admin/trips/[id]/remove/route.ts`
- Sitemap: `app/sitemap.ts`
