# Packages Feature — UI Testing Guide

**Base URL:** `http://localhost:3001`
**Dev server command:** `pnpm dev` (port 3001)

---

## Accounts Needed

You need 3 browser sessions (or use incognito tabs):

| Role | How to get |
|------|-----------|
| **Admin** | Log in with the admin account |
| **Provider** | Log in with an approved provider account |
| **Buyer** | Log in with a regular buyer account (or stay logged out) |

---

## PART 1 — Provider: Create a Package

### 1.1 Navigate to Provider Packages

1. Log in as **Provider**
2. Open the sidebar — confirm you see **"باقاتي" / "My Packages"** and **"حجوزات الباقات" / "Package Bookings"** links
3. Click **"باقاتي" / "My Packages"**
4. **Expected:** Empty state or list of packages. A "Create Package" / "إنشاء باقة" button is visible.

---

### 1.2 Create a Package — Flight + Hotel + Car (Full)

1. Click **"Create Package"**
2. Fill in **Basic Info**:
   - Name (AR): `باقة الرياض - جدة الشاملة`
   - Name (EN): `Riyadh - Jeddah Full Package`
   - Description (AR): `باقة متكاملة تشمل الطيران والفندق والسيارة`
   - Destination (AR): `جدة`
   - Destination (EN): `Jeddah`
   - Start Date: any future date (e.g. 30 days from today)
   - End Date: 5 days after start date
   - Currency: SAR
   - Total Price: `2500`
   - Original Price: `3200` (to show savings)
   - Max Bookings: `20`

3. Toggle **"يشمل رحلة طيران" / "Includes Flight"** ON
   - Try **"Select existing trip"** — a dropdown of your active trips should appear
   - If no trips exist, switch to **manual entry** and fill:
     - Airline: `سعودية / Saudia`
     - Flight Number: `SV123`
     - Origin (AR): `الرياض`
     - Origin Code: `RUH`
     - Destination (AR): `جدة`
     - Destination Code: `JED`
     - Departure: pick a date/time
     - Return: pick a date/time (later)
     - Cabin Class: Economy

4. Toggle **"يشمل إقامة فندقية" / "Includes Hotel"** ON
   - Try selecting an existing room, OR use manual:
     - Hotel Name (AR): `فندق هيلتون جدة`
     - Hotel Name (EN): `Hilton Jeddah`
     - Category: `hotel`
     - Nights: `4`
     - City (AR): `جدة`

5. Toggle **"يشمل سيارة" / "Includes Car"** ON
   - Try selecting an existing car, OR use manual:
     - Brand (AR): `تويوتا`
     - Brand (EN): `Toyota`
     - Model (AR): `كامري`
     - Model (EN): `Camry`
     - Category: Sedan
     - Rental Days: `4`

6. Upload 1–2 images (any JPG/PNG)

7. Click **Submit / Save**

**Expected:**
- Redirected to `/provider/packages`
- New package appears in the list with status badge **"نشطة" / "Active"**
- Included items icons (✈️ 🏨 🚗) visible on the card

---

### 1.3 Create a Package — Flight Only

Repeat steps above but only toggle **Includes Flight** ON.
- **Expected:** Package shows only the flight section on the detail page.

---

### 1.4 Edit a Package

1. From `/provider/packages`, click the edit icon or click a package
2. Change the Total Price to `2800`
3. Save
4. **Expected:** Price updates on the package list and detail page

---

### 1.5 Deactivate a Package

1. On the provider packages list, find the deactivate button
2. Click deactivate
3. **Expected:** Status badge changes to **"معطلة" / "Deactivated"**
4. Navigate to `/packages` (customer view) — deactivated package should **not** appear
5. Go back and reactivate it
6. **Expected:** Status returns to Active, package appears in customer browse

---

## PART 2 — Navbar & Customer Browse

### 2.1 Navbar Link

1. Log out (or open incognito)
2. Visit `http://localhost:3001/ar`
3. **Expected:** Navbar shows **"الباقات"** link between Cars and Last Minute
4. Click it → redirected to `/ar/packages`

---

### 2.2 Browse Packages Page

URL: `http://localhost:3001/ar/packages`

1. **Expected:** Page loads with the package(s) you created displayed as cards
2. Each card should show:
   - Package image (or gradient placeholder)
   - Package name
   - Destination with pin icon
   - Included items pills (Flight / Hotel / Car)
   - Date range (if set)
   - Price with strikethrough original price
3. **Filters to test:**
   - Type a destination city → results filter
   - Toggle Flight/Hotel/Car include filters → results update
   - Sort by Price Low/High → cards reorder
   - Clear filters → all packages return

---

### 2.3 Package Detail Page

1. Click a package card
2. **Expected URL:** `/ar/packages/[id]`
3. **Expected content:**
   - Image carousel (click arrows to cycle)
   - Package name + destination
   - "What's Included" section with:
     - Flight card showing airline, route, dates (if flight included)
     - Hotel card showing name, nights, category (if hotel included)
     - Car card showing brand, model, rental days (if car included)
   - Provider info
   - Booking sidebar (desktop) or bottom bar (mobile):
     - `+` / `−` buttons to set number of people
     - Total price updates dynamically (price × people)
     - Guest name, phone, email fields
     - Start/End date fields

---

## PART 3 — Customer: Book a Package

### 3.1 Complete a Booking

1. Open a package detail page as a **Buyer** (logged in)
2. Set number of people to `2`
3. Fill in:
   - Name: `Ahmed Al-Omari`
   - Phone: `0501234567`
   - Email: `ahmed@test.com`
   - Start Date: match the package start date
   - End Date: match the package end date
4. Click **"احجز الآن" / "Book Now"**
5. **Expected:** Redirected to `/ar/checkout/[bookingId]`
6. Complete the dummy payment
7. **Expected:** Booking confirmed, status shows "Confirmed"

---

### 3.2 Book as Guest (Not Logged In)

1. Log out
2. Open a package detail page
3. Fill in the booking form
4. **Expected:** Booking proceeds or prompts login (check which behavior is implemented)

---

## PART 4 — Provider: View Package Bookings

1. Log in as **Provider**
2. Sidebar → **"حجوزات الباقات" / "Package Bookings"**
3. **Expected:** The booking from Part 3 appears in the table
4. Columns to verify: guest name, package name, people count, dates, total amount, status badge

---

## PART 5 — Admin: Manage Packages

### 5.1 Admin Sidebar

1. Log in as **Admin**
2. Check the admin sidebar for **"الباقات" / "Packages"** group
3. Should have two links: **Packages** and **Package Bookings**

---

### 5.2 Admin Packages Page

URL: `http://localhost:3001/ar/admin/packages`

**Expected:**
- Table showing all packages (including deactivated ones)
- Columns: Name, Destination, Provider, Price, Included (icons), Status, Date
- Status filter dropdown works
- Can remove a package (enter a reason, confirm)

---

### 5.3 Admin Package Bookings Page

URL: `http://localhost:3001/ar/admin/package-bookings`

**Expected:**
- Table showing all package bookings across all providers
- Columns: Guest, Package, Provider, People, Dates, Amount, Status
- Status filter works

---

## PART 6 — Language Switch

1. On any packages page, switch to **English** using the language switcher
2. **Expected:** All labels, badges, and content switch to English
3. Switch back to Arabic
4. **Expected:** All content returns to Arabic including RTL layout

---

## Quick Checklist

| # | Test | Pass / Fail | Notes |
|---|------|-------------|-------|
| 1 | "Packages" link visible in navbar | | |
| 2 | "My Packages" in provider sidebar | | |
| 3 | "Package Bookings" in provider sidebar | | |
| 4 | Create package with all 3 components | | |
| 5 | Create package with flight only | | |
| 6 | Select existing trip/room/car when creating | | |
| 7 | Package appears on customer browse page | | |
| 8 | Filters work on browse page | | |
| 9 | Package detail shows all sections | | |
| 10 | People counter updates price dynamically | | |
| 11 | Booking form submits and redirects to checkout | | |
| 12 | Provider sees booking in package bookings list | | |
| 13 | Deactivate package hides it from customers | | |
| 14 | Admin can view all packages | | |
| 15 | Admin can view all package bookings | | |
| 16 | Language switch works on all pages | | |

---

## Known Limitations / Notes

- Payment is a **dummy form** — any card number works, booking auto-confirms after "processing"
- Package images are uploaded to the `package-images` Supabase storage bucket
- If a linked trip/room/car is deleted, the package falls back to inline fields
- The "available spots" badge on cards = `max_bookings - current_bookings`
