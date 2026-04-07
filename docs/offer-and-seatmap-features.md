# Offer And Seat-Map Features

## Scope

This document summarizes the product and engineering changes discussed and implemented for richer travel offers in BookitFly.

It covers:
- package offer extensions for bundled travel ads
- trip marketing and benefit fields
- seat-map based trip booking
- database and backend behavior
- current implementation status and remaining gaps

## 1. Package Offer Extensions

### Why

Some provider offers are not simple flights. They are bundled travel ads that include:
- destination
- flight
- hotel
- number of days and nights
- room basis
- meal plan
- airport transfer
- tour guide
- sightseeing tours

The existing `package` model was closer than `trip`, but it was still missing several structured fields.

### Added Package Fields

The package model now supports these extra structured fields:
- `duration_days`
- `room_basis`
- `breakfast_included`
- `airport_transfer_included`
- `tour_guide_included`
- `sightseeing_tours_included`

### Package UI / API Coverage

Implemented in:
- provider package creation form
- package validation schema
- package create/update API persistence
- package card display
- package detail display

### Room Basis Values

Current values:
- `single`
- `double`
- `triple`
- `quad`

### Package Migration

Applied via:
- [supabase-package-offer-fields.sql](/Users/mahmoudmac/Documents/Projects/bookitfly/supabase-package-offer-fields.sql)

## 2. Trip Marketing And Benefit Fields

### Why

A trip listing should support airline-style marketing details beyond route, date, and seat count.

Examples:
- baggage allowance
- meal included
- seat selection included

These should be structured fields, not only free-text description.

### Added Trip Fields

The trip model now supports:
- `checked_baggage_kg`
- `cabin_baggage_kg`
- `meal_included`
- `seat_selection_included`

### UI Coverage

These fields are now available in provider trip creation.

They are also displayed on the public trip detail page as trip benefits.

## 3. Seat-Map Based Trip Booking

### Goal

Replace pure seat-count booking with optional exact-seat booking for trips that use a seat map.

When seat-map mode is enabled:
- provider configures a plane-style seat layout
- customer selects exact seat numbers
- reserved seats become unavailable automatically
- seat inventory is enforced in the backend

### Supported Seat-Map Concepts

Current seat-map model includes:
- number of rows
- fixed 3-3 layout:
  - left columns: `A B C`
  - right columns: `D E F`
- blocked seats
- tier rows:
  - `up_front`
  - `extra_legroom`
  - `standard`

### Added Trip Seat-Map Fields

The trip model now supports:
- `seat_map_enabled`
- `seat_map_config`

`seat_map_config` contains:
- `rows`
- `left_columns`
- `right_columns`
- `blocked_seats`
- `up_front_rows`
- `extra_legroom_rows`

### Provider Behavior

In provider trip creation:
- seat-map mode can be enabled per trip
- provider can set total rows
- provider can define up-front rows
- provider can define extra-legroom rows
- provider can click seats to block them from sale
- `total_seats` is calculated automatically from non-blocked seats

### Customer Booking Behavior

In trip booking:
- if seat map is enabled, customer chooses exact seats
- selected seats control passenger count
- selected seats control price calculation
- each passenger form is associated with a selected seat
- unavailable seats are disabled visually

### Public Trip Detail Behavior

On trip detail page:
- trip benefits are shown
- seat-map preview is shown when enabled
- unavailable seats are displayed as unavailable

## 4. Seat Locking Rules

### Core Rule

Seat locking must be backend-enforced, not frontend-only.

Two users must not be able to pay for the same seat at the same time.

### Reservation Strategy

For trips without seat maps:
- existing `book_seats()` count-based reservation still applies

For trips with seat maps:
- booking creates explicit seat assignments
- exact selected seats are reserved in the database
- `(trip_id, seat_number)` is unique

### Unavailable Seats

Seats are treated as unavailable when they are:
- manually blocked by provider in the seat map
- already assigned to an existing booking

### Payment Processing Behavior

Seat assignments are reserved during booking creation, not only after confirmation.

This is intentional. It prevents race conditions where two users choose the same seat and both reach payment.

### Release Behavior

Seat assignments are released when booking status changes to:
- `payment_failed`
- `cancelled`
- `rejected`
- `refunded`

They are also removed if the booking row is deleted.

## 5. Database Changes

### New / Extended Trip Columns

Added to `trips`:
- `checked_baggage_kg`
- `cabin_baggage_kg`
- `meal_included`
- `seat_selection_included`
- `seat_map_enabled`
- `seat_map_config`

### New Table

Added:
- `trip_seat_assignments`

Columns:
- `id`
- `trip_id`
- `booking_id`
- `seat_number`
- `passenger_index`
- `created_at`

Important constraint:
- unique `(trip_id, seat_number)`

### New Function

Added:
- `assign_trip_seats_to_booking(p_booking_id, p_trip_id, p_seat_numbers)`

This function:
- validates seat-map mode
- validates seat format
- validates seat existence in configured layout
- rejects blocked seats
- rejects duplicate requested seats
- reserves seat count through `book_seats()`
- inserts seat assignments

### Trigger / Cleanup

Added trigger-based cleanup for `trip_seat_assignments` when bookings become invalid for reservation.

### Trip / Seat Map Migration

Applied via:
- [supabase-trip-seat-map.sql](/Users/mahmoudmac/Documents/Projects/bookitfly/supabase-trip-seat-map.sql)

## 6. Files Touched

### Package-Related

- [app/[locale]/provider/packages/new/page.tsx](/Users/mahmoudmac/Documents/Projects/bookitfly/app/[locale]/provider/packages/new/page.tsx)
- [app/[locale]/packages/[id]/package-detail-client.tsx](/Users/mahmoudmac/Documents/Projects/bookitfly/app/[locale]/packages/[id]/package-detail-client.tsx)
- [components/packages/package-card.tsx](/Users/mahmoudmac/Documents/Projects/bookitfly/components/packages/package-card.tsx)
- [app/api/packages/route.ts](/Users/mahmoudmac/Documents/Projects/bookitfly/app/api/packages/route.ts)
- [lib/validations.ts](/Users/mahmoudmac/Documents/Projects/bookitfly/lib/validations.ts)
- [types/database.ts](/Users/mahmoudmac/Documents/Projects/bookitfly/types/database.ts)

### Trip / Seat Map Related

- [app/[locale]/provider/trips/new/page.tsx](/Users/mahmoudmac/Documents/Projects/bookitfly/app/[locale]/provider/trips/new/page.tsx)
- [app/[locale]/trips/[id]/book/page.tsx](/Users/mahmoudmac/Documents/Projects/bookitfly/app/[locale]/trips/[id]/book/page.tsx)
- [app/[locale]/trips/[id]/trip-detail-client.tsx](/Users/mahmoudmac/Documents/Projects/bookitfly/app/[locale]/trips/[id]/trip-detail-client.tsx)
- [app/api/bookings/route.ts](/Users/mahmoudmac/Documents/Projects/bookitfly/app/api/bookings/route.ts)
- [app/api/marketeers/book/route.ts](/Users/mahmoudmac/Documents/Projects/bookitfly/app/api/marketeers/book/route.ts)
- [app/api/trips/route.ts](/Users/mahmoudmac/Documents/Projects/bookitfly/app/api/trips/route.ts)
- [app/api/trips/[id]/route.ts](/Users/mahmoudmac/Documents/Projects/bookitfly/app/api/trips/[id]/route.ts)
- [lib/seat-map.ts](/Users/mahmoudmac/Documents/Projects/bookitfly/lib/seat-map.ts)
- [components/trips/seat-map.tsx](/Users/mahmoudmac/Documents/Projects/bookitfly/components/trips/seat-map.tsx)
- [lib/validations.ts](/Users/mahmoudmac/Documents/Projects/bookitfly/lib/validations.ts)
- [types/database.ts](/Users/mahmoudmac/Documents/Projects/bookitfly/types/database.ts)

## 7. Current Limitations

These are intentionally not fully covered yet:
- provider trip edit page does not yet expose the new trip benefit and seat-map fields
- seat map currently assumes a fixed `3 + aisle + 3` column structure
- seat tiers are visual/marketing tiers only; they do not currently affect price
- no separate admin UI exists yet for inspecting seat-map assignments per trip
- no seat hold timeout independent of booking status exists beyond existing booking lifecycle rules

## 8. Recommended Next Steps

### Product / UX

- add trip edit support for the new fields
- show selected seat numbers in booking detail pages
- show seat assignments in provider booking management
- add seat-tier pricing if needed
- add more cabin layout presets

### Engineering

- add e2e coverage for:
  - booking with seat map
  - duplicate seat contention
  - seat release after payment failure or cancellation
- add server-side tests for `assign_trip_seats_to_booking`
- consider moving seat-map config to a dedicated model if layouts become more complex

## 9. Summary

The platform now supports richer travel offers in two major directions:

- `package` can represent bundled travel ads much better than before
- `trip` can now behave more like an airline inventory product with flight benefits and exact seat selection

This brings the product closer to real travel-agency offers and airline-style booking behavior while keeping the existing trip and package architecture intact.
