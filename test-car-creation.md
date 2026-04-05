# Car Creation Form - Manual Test Plan

## Login
- URL: http://localhost:3000/ar/login
- Email: `saad123mn123@gmail.com`
- Password: `Nn011@25`

## Navigate to Form
After login, go to: http://localhost:3000/ar/provider/cars/new

---

## Test 1: Submit Empty Form
1. Click "Post Car" without filling anything
2. **Expected:** Red error box appears above the button listing all missing fields + toast notification + page scrolls to first error field
3. **Pass if:** User clearly sees what's wrong (not "nothing happens")

## Test 2: Fill Only Required Fields (Minimum Valid Submission)
Fill in these fields:

| Field | Value |
|-------|-------|
| Brand (Arabic) | تويوتا |
| Model (Arabic) | كامري |
| City (Arabic) | الرياض |
| Year | 2024 |
| Category | Select any (e.g. Sedan) |
| Transmission | Automatic |
| Fuel Type | Petrol |
| Seats | 5 |
| Currency | SAR |
| Price Per Day | 150 |

Leave everything else at defaults. Click "Post Car".

**Expected:** Loading spinner on button, then success toast, then redirect to `/provider/cars`

## Test 3: Full Submission With All Fields
Fill everything from Test 2, plus:

| Field | Value |
|-------|-------|
| Brand (English) | Toyota |
| Model (English) | Camry |
| City (English) | Riyadh |
| Pickup Type | Airport |
| Pickup Location (Arabic) | مطار الملك خالد |
| Pickup Location (English) | King Khalid Airport |
| Return Type | Same Location |
| Pickup From (time) | 08:00 |
| Pickup To (time) | 22:00 |
| Return From (time) | 08:00 |
| Return To (time) | 22:00 |
| Instant Book | Checked |
| Features | Select 2-3 (e.g. GPS, Bluetooth) |
| Images | Upload 1-2 car images |

Click "Post Car".

**Expected:** Success toast + redirect to car listings

## Test 4: Pickup Type = Branch
1. Select Pickup Type: "Company Branch"
2. **Expected:** Branch name fields (AR/EN) appear
3. Fill branch name: `فرع الرياض - العليا` / `Riyadh - Olaya Branch`
4. Select Return Type: "Different Branch"
5. **Expected:** Return branch name fields appear
6. Fill return branch name

## Test 5: Availability Dates (Instant Book OFF)
1. Uncheck "Instant Book"
2. **Expected:** "Available From" and "Available To" date pickers appear
3. Select a from date, then a to date
4. **Expected:** "To" date cannot be before "From" date

## Test 6: Image Upload
1. Upload 5 images
2. **Expected:** Upload area disappears (max reached)
3. Remove one image via X button
4. **Expected:** Upload area reappears

## Test 7: Geolocation
1. Click "Get Current Location"
2. Allow browser location permission
3. **Expected:** Button turns green "Location detected successfully", pickup location fields auto-fill

---

## Things to Watch For
- [ ] Error messages are in the correct language (Arabic if locale is `ar`)
- [ ] Form doesn't lose data when switching Pickup Type radio buttons
- [ ] All dropdowns (category, transmission, fuel) have proper options
- [ ] Price field doesn't accept 0 or negative numbers
- [ ] Year field is bounded (2000-2027)
- [ ] After successful creation, the new car appears in the provider's car list
