# Points & Referral System

BooktFly's universal points and referral system spans all three user types: **Customers**, **Marketeers**, and **Providers**. Points incentivize platform growth through sign-ups, bookings, referrals, and content creation.

---

## Table of Contents

- [Points Sources](#points-sources)
- [Referral System](#referral-system)
- [Marketeer Guest Booking](#marketeer-guest-booking)
- [Points Usage](#points-usage)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Notification Events](#notification-events)
- [File Map](#file-map)

---

## Points Sources

### Customers

| Activity | Points | Trigger | Status |
|----------|--------|---------|--------|
| Registration | 200 | Email verified (auth callback) | Implemented |
| First booking | 500 | First booking payment confirmed | Implemented |
| Invite friend (signs up) | 150 | Friend completes registration | Implemented |
| Rate trip | 70 | - | Future |
| Share offer | 50 | - | Future |

### Marketeers

| Activity | Points | Trigger | Status |
|----------|--------|---------|--------|
| Registration | 500 | Admin approves application | Implemented |
| Invite marketeer | 300 | Invited marketeer approved | Implemented |
| Invite customer (signs up) | 150 | Referred user registers | Implemented |
| Sell flight ticket | 500 | Referred user's booking confirmed | Implemented |
| Sell hotel room | 300 | Referred user's room booking confirmed | Implemented |
| Sub-marketeer commission | 5% of booking total | Sub-marketeer's referral books | Implemented |
| Sell full trip | 800 | - | Future (needs bundle concept) |
| Reply to customer | 30 | - | Future (needs chat) |

### Providers

| Activity | Points | Trigger | Status |
|----------|--------|---------|--------|
| Registration | 1000 | Admin approves application | Implemented |
| Add offer (trip or room) | 200 | Trip/room created | Implemented |
| Big discount on trip | 400 | - | Future |
| Exclusive offer | 500 | - | Future |

---

## Referral System

### Referral Codes

Every user gets a unique referral code:

- **Marketeers**: `MKT-XXXXXX` (generated on approval via `generate_referral_code()` RPC)
- **Customers/Buyers**: `USR-XXXXXX` (generated on signup via `generate_customer_referral_code()`)

### Referral Link Flow

```
User visits: /ref/{CODE}
  |
  +--> MKT-XXXXXX? --> Sets `ref_code` cookie (30 days)
  +--> USR-XXXXXX? --> Sets `cref_code` cookie (30 days)
  |
  +--> Redirects to /trips
```

On signup, the signup form reads the cookie and passes it as `referred_by` in auth metadata. The `handle_new_user()` DB trigger stores it in `profiles.referred_by`.

### Referral Chain (2-level)

```
Marketeer A invites Marketeer B (300 pts to A)
  |
  Marketeer B refers Customer C (150 pts to B)
    |
    Customer C books a flight (500 pts to B, 5% of total to A)
```

The chain is tracked via `marketeers.referred_by_marketeer_id`.

### Post-Signup Rewards (Auth Callback)

When a user verifies their email and lands on `/auth/callback`:

1. **Customer registration bonus**: 200 pts (one-time, deduplicated)
2. If `referred_by` starts with `MKT-`: award 150 pts to the marketeer + notification
3. If `referred_by` starts with `USR-`: award 150 pts to the referring customer + notification

### Post-Booking Rewards (Payment Approval)

When admin approves a booking payment:

1. **Customer first-booking bonus**: 500 pts (one-time)
2. If buyer was referred by a marketeer: 500 pts (flight) or 300 pts (room) to marketeer
3. If that marketeer was invited by another: 5% commission points to parent marketeer
4. If booking was created by a marketeer directly (`booked_by_marketeer_id`): same points to that marketeer

---

## Marketeer Guest Booking

Marketeers can book on behalf of users who don't have accounts.

### Flow

```
1. Marketeer → /marketeer/book
   - Searches available trips
   - Enters guest info (name, email, phone, ID)
   - Submits booking

2. System creates booking:
   - buyer_id = NULL
   - booked_by_marketeer_id = marketeer.id
   - guest_token = auto-generated UUID

3. Guest receives email (via Resend):
   - Booking details (route, date, seats, amount)
   - Bank transfer info (bank name, IBAN, holder)
   - Link to public payment page: /guest/booking/{guest_token}

4. Guest visits public page:
   - Views booking details + bank info
   - Uploads transfer receipt (image)

5. Admin approves payment:
   - Marketeer gets 500 pts (flight) / 300 pts (room) + notification
   - Parent marketeer gets 5% commission (if applicable)
```

### Public Payment Page

The page at `/guest/booking/[token]` is fully public (no auth required). It shows:

- Booking status (awaiting payment / receipt uploaded / confirmed / failed)
- Flight details (route, airline, date, class, seats)
- Total amount
- Bank transfer details
- Receipt upload area (drag & drop)

This page is designed to later support card payments and Apple Pay.

---

## Points Usage

Points can be converted to (future implementation):

- Discounts on trips
- Commission payouts
- Account perks (priority support, badges)
- Boosting offers (providers)

Current conversion rate is stored in `platform_settings.flypoints_sar_rate` (default: 0.05 SAR per point). Marketeers can withdraw points as SAR via the wallet system.

---

## Database Schema

### New Tables

#### `customer_points_transactions`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK -> auth.users) | Customer who earned points |
| points | INTEGER | Positive = earned, negative = deducted |
| event_type | customer_points_event | registration_bonus, first_booking, invite_friend, rate_trip, share_offer, manual_adjustment |
| reference_id | UUID | Optional reference (booking ID, user ID, etc.) |
| description_ar | TEXT | Arabic description |
| description_en | TEXT | English description |
| created_at | TIMESTAMPTZ | When awarded |

#### `provider_points_transactions`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| provider_id | UUID (FK -> providers) | Provider who earned points |
| points | INTEGER | Positive = earned, negative = deducted |
| event_type | provider_points_event | registration_bonus, add_offer, big_discount, exclusive_offer, manual_adjustment |
| reference_id | UUID | Optional reference |
| description_ar | TEXT | Arabic description |
| description_en | TEXT | English description |
| created_at | TIMESTAMPTZ | When awarded |

### Modified Tables

#### `profiles` (added columns)

| Column | Type | Description |
|--------|------|-------------|
| referral_code | TEXT (UNIQUE) | Customer referral code (USR-XXXXXX) |
| referred_by | TEXT | Who referred this user (MKT-XXXXXX or USR-XXXXXX) |

#### `marketeers` (added columns)

| Column | Type | Description |
|--------|------|-------------|
| referred_by_marketeer_id | UUID (FK -> marketeers) | Which marketeer invited this one |

#### `bookings` & `room_bookings` (added columns)

| Column | Type | Description |
|--------|------|-------------|
| booked_by_marketeer_id | UUID (FK -> marketeers) | Marketeer who created this booking for a guest |
| guest_token | UUID (UNIQUE) | Token for public payment page access |

### New Enums

- `customer_points_event`: registration_bonus, first_booking, invite_friend, rate_trip, share_offer, manual_adjustment
- `provider_points_event`: registration_bonus, add_offer, big_discount, exclusive_offer, manual_adjustment
- `flypoints_event_type` (expanded): added invite_customer, sell_ticket, sell_hotel, sell_full_trip, reply_customer

### Views

- `customer_points_balance`: SUM(points) grouped by user_id
- `provider_points_balance`: SUM(points) grouped by provider_id
- `marketeer_points_balance`: existing, SUM of non-expired flypoints

---

## API Endpoints

### Points

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/points` | Required | Get current user's points balance + transactions (works for customers & providers) |

### Marketeer Guest Booking

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/marketeers/book` | Marketeer | Create booking for a guest. Sends email to guest. |
| GET | `/api/guest/booking/[token]` | Public | View booking details + bank info |
| POST | `/api/guest/booking/[token]` | Public | Upload transfer receipt (multipart form) |

### Referral

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/ref/[code]` | Public | Sets referral cookie (MKT- or USR- prefix) and redirects to /trips |

---

## Notification Events

Every point award triggers an in-app notification via `notify()`:

| Event | Recipient | Notification Type |
|-------|-----------|------------------|
| Customer signup bonus (200 pts) | Customer | `points_earned` |
| Customer first booking (500 pts) | Customer | `points_earned` |
| Customer friend invited (150 pts) | Referring customer | `points_earned` |
| Marketeer referral signed up (150 pts) | Marketeer | `points_earned` |
| Marketeer invited marketeer (300 pts) | Inviting marketeer | `points_earned` |
| Marketeer's referral booked (500/300 pts) | Marketeer | `points_earned` |
| Sub-marketeer commission (5%) | Parent marketeer | `points_earned` |
| Guest booking created | Marketeer | `new_booking` |
| Guest payment confirmed | Marketeer | `points_earned` |
| Provider registration (1000 pts) | Provider | `points_earned` |
| Provider added offer (200 pts) | Provider | `points_earned` |

---

## File Map

### Core Logic

| File | Purpose |
|------|---------|
| `lib/points.ts` | `handleBookingConfirmedRewards()` and `handleMarkeeteerDirectBookingRewards()` |
| `lib/notifications.ts` | `notify()` and `notifyAdmin()` functions |

### API Routes

| File | Purpose |
|------|---------|
| `app/api/points/route.ts` | Customer/provider points API |
| `app/api/marketeers/book/route.ts` | Marketeer books for guest |
| `app/api/guest/booking/[token]/route.ts` | Public guest booking view + receipt upload |
| `app/[locale]/auth/callback/route.ts` | Post-signup rewards + referral tracking |
| `app/api/admin/bookings/[id]/approve-payment/route.ts` | Booking rewards on payment approval |
| `app/api/admin/room-bookings/[id]/approve-payment/route.ts` | Room booking rewards on payment approval |
| `app/api/admin/marketeers/[id]/route.ts` | Circle 2: invite marketeer rewards |
| `app/api/admin/applications/[id]/route.ts` | Provider registration bonus |
| `app/api/trips/route.ts` | Provider add_offer bonus (trips) |
| `app/api/rooms/route.ts` | Provider add_offer bonus (rooms) |
| `app/[locale]/ref/[code]/route.ts` | Referral link handler (MKT- and USR-) |

### Pages

| File | Purpose |
|------|---------|
| `app/[locale]/profile/page.tsx` | Customer points display + referral link |
| `app/[locale]/marketeer/dashboard/page.tsx` | Marketeer points breakdown + nav cards |
| `app/[locale]/marketeer/book/page.tsx` | Book for customer form |
| `app/[locale]/guest/booking/[token]/page.tsx` | Public guest payment page |

### Email Templates

| File | Purpose |
|------|---------|
| `emails/guest-booking.tsx` | Guest booking confirmation with bank details + payment link |

### Types

| File | Purpose |
|------|---------|
| `types/database.ts` | `CustomerPointsEventType`, `ProviderPointsEventType`, updated `Booking` & `RoomBooking` types |

### Translations

| File | Keys Added |
|------|------------|
| `messages/en.json` | `profile.points_title`, `profile.points_balance`, `profile.friends_invited`, `profile.invite_friends`, `profile.invite_friends_desc`, `profile.recent_points` |
| `messages/ar.json` | Same keys in Arabic |
