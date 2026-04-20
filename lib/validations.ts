import { z } from 'zod'

import ar from '@/messages/ar.json'
import en from '@/messages/en.json'

type Locale = 'ar' | 'en'

const messages = { ar, en } as const

function v(locale: Locale, key: keyof typeof ar.validation): string {
  return messages[locale].validation[key]
}

const seatMapConfigSchema = z.object({
  rows: z.number().int().min(1).max(80),
  left_columns: z.array(z.string().regex(/^[A-Z]$/)).min(1).max(6),
  right_columns: z.array(z.string().regex(/^[A-Z]$/)).min(1).max(6),
  blocked_seats: z.array(z.string().regex(/^\d+[A-Z]$/)).default([]),
  up_front_rows: z.array(z.number().int().min(1)).default([]),
  extra_legroom_rows: z.array(z.number().int().min(1)).default([]),
})

export function getSignupSchema(locale: Locale = 'ar') {
  return z.object({
    full_name: z.string().min(2, v(locale, 'name_required')),
    email: z.string().email(v(locale, 'email_invalid')),
    password: z.string().min(6, v(locale, 'password_min')),
    phone: z.string().optional(),
  })
}

export function getLoginSchema(locale: Locale = 'ar') {
  return z.object({
    email: z.string().email(v(locale, 'email_invalid')),
    password: z.string().min(1, v(locale, 'password_required')),
  })
}

export function getMagicLinkSchema(locale: Locale = 'ar') {
  return z.object({
    email: z.string().email(v(locale, 'email_invalid')),
  })
}

export function getProviderApplicationSchema(locale: Locale = 'ar') {
  return z.object({
    provider_type: z.enum(['travel_agency', 'hajj_umrah']),
    company_name_ar: z.string().min(2, v(locale, 'company_name_ar_required')),
    company_name_en: z.string().optional(),
    company_description_ar: z.string().optional(),
    company_description_en: z.string().optional(),
    contact_email: z.string().email(v(locale, 'email_invalid')),
    contact_phone: z.string().min(9, v(locale, 'phone_required')),
    terms_accepted: z.literal(true, { message: v(locale, 'terms_required') }),
  })
}

export function getTripSchema(locale: Locale = 'ar') {
  return z.object({
    listing_type: z.enum(['seats', 'trip']),
    airline: z.string().min(1, v(locale, 'airline_required')),
    flight_number: z.string().optional(),
    origin_city_ar: z.string().min(1, v(locale, 'origin_required')),
    origin_city_en: z.string().optional(),
    origin_code: z.string().optional().transform(v => v?.toUpperCase()),
    destination_city_ar: z.string().min(1, v(locale, 'destination_required')),
    destination_city_en: z.string().optional(),
    destination_code: z.string().optional().transform(v => v?.toUpperCase()),
    departure_at: z.string().min(1, v(locale, 'departure_required')),
    return_at: z.string().optional(),
    cabin_class: z.enum(['economy', 'business', 'first']),
    total_seats: z.number().min(1, v(locale, 'seats_required')),
    price_per_seat: z.number().min(1, v(locale, 'price_required')),
    price_per_seat_one_way: z.number().min(1, v(locale, 'price_required')),
    currency: z.enum(['SAR', 'USD']),
    checked_baggage_kg: z.number().min(0).optional(),
    cabin_baggage_kg: z.number().min(0).optional(),
    meal_included: z.boolean().optional(),
    seat_selection_included: z.boolean().optional(),
    seat_map_enabled: z.boolean().optional(),
    seat_map_config: seatMapConfigSchema.optional(),
    description_ar: z.string().optional(),
    description_en: z.string().optional(),
    // Name-change policy
    name_change_allowed: z.boolean().optional(),
    name_change_fee: z.number().min(0).optional(),
    name_change_is_refundable: z.boolean().optional(),
    // Age-based and special discounts
    child_discount_percentage: z.number().min(0).max(100).optional(),
    infant_discount_percentage: z.number().min(0).max(100).optional(),
    special_discount_percentage: z.number().min(0).max(100).optional(),
    special_discount_label_ar: z.string().optional(),
    special_discount_label_en: z.string().optional(),
    // Admin-only per-trip commission override
    commission_rate_override: z.number().min(0).max(50).optional(),
    // Familiarity upgrades (P0-6 fare tiers + P3-29 map view geocoords)
    fare_tiers: z.array(z.object({
      code: z.string().min(1),
      name_ar: z.string().min(1),
      name_en: z.string().min(1),
      price: z.number().min(0),
      cabin_kg: z.number().min(0).nullable().optional(),
      checked_kg: z.number().min(0).nullable().optional(),
      refundable: z.boolean().optional(),
      changeable: z.boolean().optional(),
      seat_selection: z.boolean().optional(),
      badge_ar: z.string().nullable().optional(),
      badge_en: z.string().nullable().optional(),
      description_ar: z.string().nullable().optional(),
      description_en: z.string().nullable().optional(),
    })).optional(),
    duration_minutes: z.number().int().min(15).max(2880).optional(),
    origin_lat: z.number().min(-90).max(90).nullable().optional(),
    origin_lon: z.number().min(-180).max(180).nullable().optional(),
    destination_lat: z.number().min(-90).max(90).nullable().optional(),
    destination_lon: z.number().min(-180).max(180).nullable().optional(),
  })
}

const englishNameRegex = /^[a-zA-Z\s\-'.]+$/

export const passengerSchema = z.object({
  first_name: z.string().min(2, 'First name is required').regex(englishNameRegex, 'Please enter name in English only'),
  last_name: z.string().min(2, 'Last name is required').regex(englishNameRegex, 'Please enter name in English only'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  id_number: z.string().min(4, 'ID/Passport number is required').regex(/^[a-zA-Z0-9]+$/, 'Please enter ID number in English only'),
  id_expiry_date: z.string().min(1, 'ID expiry date is required'),
  seat_number: z.string().regex(/^\d+[A-Z]$/, 'Invalid seat number').optional(),
  age_category: z.enum(['adult', 'child', 'infant']).optional(),
})

export const bookingContactSchema = z.object({
  phone: z.string().min(9, 'Phone number is required'),
  email: z.string().email('Invalid email'),
})

export function getBookingSchema(locale: Locale = 'ar') {
  return z.object({
    trip_id: z.string().uuid(),
    seats_count: z.number().min(1).max(10),
    selected_seat_numbers: z.array(z.string().regex(/^\d+[A-Z]$/)).optional(),
    contact: bookingContactSchema,
    passengers: z.array(passengerSchema).min(1),
  })
}

export function getUpdatePasswordSchema(locale: Locale = 'ar') {
  return z.object({
    password: z.string().min(6, v(locale, 'new_password_min')),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: v(locale, 'passwords_mismatch'),
    path: ['confirmPassword'],
  })
}

export const adminReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comment: z.string().optional(),
})

export const platformSettingsSchema = z.object({
  default_commission_rate: z.number().min(0).max(100),
  terms_content_ar: z.string().optional(),
  terms_content_en: z.string().optional(),
})

export function getRoomSchema(locale: Locale = 'ar') {
  return z.object({
    name_ar: z.string().min(2, v(locale, 'room_name_required')),
    name_en: z.string().optional(),
    description_ar: z.string().optional(),
    description_en: z.string().optional(),
    city_ar: z.string().min(1, v(locale, 'city_required')),
    city_en: z.string().optional(),
    address_ar: z.string().optional(),
    address_en: z.string().optional(),
    category: z.string().min(1, v(locale, 'category_required')),
    price_per_night: z.number().min(1, v(locale, 'price_required')),
    currency: z.enum(['SAR', 'USD']),
    max_capacity: z.number().min(1),
    amenities: z.array(z.string()).optional(),
    instant_book: z.boolean(),
    available_from: z.string().optional(),
    available_to: z.string().optional(),
    name_change_allowed: z.boolean().optional(),
    name_change_fee: z.number().min(0).optional(),
    name_change_is_refundable: z.boolean().optional(),
  })
}

export function getRoomBookingSchema(locale: Locale = 'ar') {
  return z.object({
    room_id: z.string().uuid(),
    guest_name: z.string().min(2, v(locale, 'name_required')),
    guest_phone: z.string().optional(),
    guest_email: z.string().email(v(locale, 'email_invalid')).optional(),
    check_in_date: z.string().min(1, v(locale, 'checkin_required')),
    number_of_days: z.number().min(1, v(locale, 'days_required')),
    number_of_people: z.number().min(1),
    rooms_count: z.number().min(1).max(10),
  })
}

export function getMarkeeteerApplicationSchema(locale: Locale = 'ar') {
  return z.object({
    full_name:        z.string().min(2, v(locale, 'name_required')),
    national_id:      z.string().min(10, v(locale, 'national_id_required')),
    date_of_birth:    z.string().min(1, v(locale, 'date_of_birth_required')),
    phone:            z.string().min(9, v(locale, 'phone_required')),
    phone_alt:        z.string().optional(),
    email:            z.string().email(v(locale, 'email_invalid')),
    national_address: z.string().min(5, v(locale, 'national_address_required')),
  })
}

export function getFlightRequestSchema(locale: Locale = 'ar') {
  return z.object({
    name: z.string().min(2, v(locale, 'name_required')),
    email: z.string().email(v(locale, 'email_invalid')),
    phone: z.string().min(9, v(locale, 'phone_required')),
    origin: z.string().min(2, v(locale, 'origin_required')),
    destination: z.string().min(2, v(locale, 'destination_required')),
    departure_date: z.string().min(1, v(locale, 'departure_required')),
    return_date: z.string().optional(),
    seats_needed: z.number().min(1, v(locale, 'seats_required')).max(20),
    cabin_class: z.enum(['economy', 'business', 'first']),
    budget_max: z.number().min(0).optional(),
    notes: z.string().optional(),
  })
}

export function getCarSchema(locale: Locale = 'ar') {
  return z.object({
    brand_ar: z.string().min(1, v(locale, 'car_brand_required')),
    brand_en: z.string().optional(),
    model_ar: z.string().min(1, v(locale, 'car_model_required')),
    model_en: z.string().optional(),
    year: z.number().min(2000, v(locale, 'car_year_required')).max(2027, v(locale, 'car_year_required')),
    city_ar: z.string().min(1, v(locale, 'city_required')),
    city_en: z.string().optional(),
    category: z.string().min(1, v(locale, 'category_required')),
    price_per_day: z.number().min(1, v(locale, 'price_required')).max(999999, v(locale, 'price_required')),
    currency: z.enum(['SAR', 'USD']),
    seats_count: z.number().min(1),
    transmission: z.enum(['automatic', 'manual']),
    fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
    features: z.array(z.string()).optional(),
    instant_book: z.boolean(),
    available_from: z.string().optional(),
    available_to: z.string().optional(),
    pickup_location_ar: z.string().optional(),
    pickup_location_en: z.string().optional(),
    pickup_latitude: z.preprocess(v => (typeof v === 'number' && isNaN(v)) ? undefined : v, z.number().optional()),
    pickup_longitude: z.preprocess(v => (typeof v === 'number' && isNaN(v)) ? undefined : v, z.number().optional()),
    pickup_type: z.enum(['airport', 'branch']).optional(),
    pickup_branch_name_ar: z.string().optional(),
    pickup_branch_name_en: z.string().optional(),
    return_type: z.enum(['same_location', 'airport', 'branch']).optional(),
    return_branch_name_ar: z.string().optional(),
    return_branch_name_en: z.string().optional(),
    pickup_hour_from: z.string().optional(),
    pickup_hour_to: z.string().optional(),
    return_hour_from: z.string().optional(),
    return_hour_to: z.string().optional(),
    name_change_allowed: z.boolean().optional(),
    name_change_fee: z.number().min(0).optional(),
    name_change_is_refundable: z.boolean().optional(),
  })
}

export function getCarBookingSchema(locale: Locale = 'ar') {
  return z.object({
    car_id: z.string().uuid(),
    guest_name: z.string().min(2, v(locale, 'name_required')),
    guest_phone: z.string().optional(),
    guest_email: z.string().email(v(locale, 'email_invalid')).optional(),
    pickup_date: z.string().min(1, v(locale, 'pickup_required')),
    return_date: z.string().min(1, v(locale, 'return_required')),
    number_of_days: z.number().min(1, v(locale, 'days_required')),
    pickup_time: z.string().optional(),
    return_time: z.string().optional(),
  })
}

export function getTripRequestOfferSchema(locale: Locale = 'ar') {
  return z.object({
    price_per_seat: z.number().min(1, v(locale, 'price_required')),
    notes: z.string().optional(),
  })
}

export const tripRequestOfferSchema = getTripRequestOfferSchema('ar')

export function getPackageSchema(locale: Locale = 'ar') {
  return z.object({
    name_ar: z.string().min(2, v(locale, 'name_required')),
    name_en: z.string().optional(),
    description_ar: z.string().optional(),
    description_en: z.string().optional(),
    destination_city_ar: z.string().min(1, v(locale, 'destination_required')),
    destination_city_en: z.string().optional(),
    includes_flight: z.boolean(),
    includes_hotel: z.boolean(),
    includes_car: z.boolean(),
    trip_id: z.string().uuid().optional().nullable(),
    room_id: z.string().uuid().optional().nullable(),
    car_id: z.string().uuid().optional().nullable(),
    flight_airline: z.string().optional(),
    flight_number: z.string().optional(),
    flight_origin_ar: z.string().optional(),
    flight_origin_en: z.string().optional(),
    flight_origin_code: z.string().optional(),
    flight_destination_ar: z.string().optional(),
    flight_destination_en: z.string().optional(),
    flight_destination_code: z.string().optional(),
    flight_departure_at: z.string().optional(),
    flight_return_at: z.string().optional(),
    flight_cabin_class: z.string().optional(),
    flight_seats_included: z.number().optional(),
    hotel_name_ar: z.string().optional(),
    hotel_name_en: z.string().optional(),
    hotel_category: z.string().optional(),
    hotel_nights: z.number().optional(),
    duration_days: z.number().optional(),
    room_basis: z.string().optional(),
    breakfast_included: z.boolean().optional(),
    airport_transfer_included: z.boolean().optional(),
    tour_guide_included: z.boolean().optional(),
    sightseeing_tours_included: z.boolean().optional(),
    hotel_city_ar: z.string().optional(),
    hotel_city_en: z.string().optional(),
    car_brand_ar: z.string().optional(),
    car_brand_en: z.string().optional(),
    car_model_ar: z.string().optional(),
    car_model_en: z.string().optional(),
    car_category: z.string().optional(),
    car_rental_days: z.number().optional(),
    trip_price: z.number().min(0).optional(),
    car_price: z.number().min(0).optional(),
    hotel_price: z.number().min(0).optional(),
    offer_price: z.number().min(0).optional(),
    total_price: z.number().min(1, v(locale, 'price_required')),
    original_price: z.number().optional(),
    currency: z.enum(['SAR', 'USD']),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    max_bookings: z.number().min(1).optional(),
    name_change_allowed: z.boolean().optional(),
    name_change_fee: z.number().min(0).optional(),
    name_change_is_refundable: z.boolean().optional(),
  })
}

export function getPackageBookingSchema(locale: Locale = 'ar') {
  return z.object({
    package_id: z.string().uuid(),
    guest_name: z.string().min(2, v(locale, 'name_required')),
    guest_phone: z.string().optional(),
    guest_email: z.string().email(v(locale, 'email_invalid')).optional(),
    number_of_people: z.number().min(1),
    start_date: z.string().min(1, v(locale, 'departure_required')),
    end_date: z.string().min(1, v(locale, 'return_required')),
  })
}

// Default Arabic schemas for backward compatibility (used in API routes)
export const signupSchema = getSignupSchema('ar')
export const loginSchema = getLoginSchema('ar')
export const magicLinkSchema = getMagicLinkSchema('ar')
export const providerApplicationSchema = getProviderApplicationSchema('ar')
export const tripSchema = getTripSchema('ar')
export const bookingSchema = getBookingSchema('ar')
export const updatePasswordSchema = getUpdatePasswordSchema('ar')
export const roomSchema = getRoomSchema('ar')
export const roomBookingSchema = getRoomBookingSchema('ar')
export const carSchema = getCarSchema('ar')
export const carBookingSchema = getCarBookingSchema('ar')
export const markeeteerApplicationSchema = getMarkeeteerApplicationSchema('ar')
export const flightRequestSchema = getFlightRequestSchema('ar')
export const packageSchema = getPackageSchema('ar')
export const packageBookingSchema = getPackageBookingSchema('ar')
