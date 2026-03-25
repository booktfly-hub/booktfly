import { z } from 'zod'

import ar from '@/messages/ar.json'
import en from '@/messages/en.json'

type Locale = 'ar' | 'en'

const messages = { ar, en } as const

function v(locale: Locale, key: keyof typeof ar.validation): string {
  return messages[locale].validation[key]
}

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
    trip_type: z.enum(['one_way', 'round_trip']),
    cabin_class: z.enum(['economy', 'business', 'first']),
    total_seats: z.number().min(1, v(locale, 'seats_required')),
    price_per_seat: z.number().min(1, v(locale, 'price_required')),
    price_per_seat_one_way: z.number().optional(),
    currency: z.enum(['SAR', 'USD']),
    description_ar: z.string().optional(),
    description_en: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.trip_type === 'round_trip' && (!data.price_per_seat_one_way || data.price_per_seat_one_way < 1)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: v(locale, 'price_required'), path: ['price_per_seat_one_way'] })
    }
  })
}

export const passengerSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  id_number: z.string().min(4, 'ID/Passport number is required'),
  id_expiry_date: z.string().min(1, 'ID expiry date is required'),
})

export const bookingContactSchema = z.object({
  phone: z.string().min(9, 'Phone number is required'),
  email: z.string().email('Invalid email'),
})

export function getBookingSchema(locale: Locale = 'ar') {
  return z.object({
    trip_id: z.string().uuid(),
    seats_count: z.number().min(1).max(10),
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
export const markeeteerApplicationSchema = getMarkeeteerApplicationSchema('ar')
