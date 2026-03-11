import { z } from 'zod'

export const signupSchema = z.object({
  full_name: z.string().min(2, 'الاسم مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  phone: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})

export const magicLinkSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
})

export const providerApplicationSchema = z.object({
  provider_type: z.enum(['travel_agency', 'hajj_umrah']),
  company_name_ar: z.string().min(2, 'اسم الشركة بالعربية مطلوب'),
  company_name_en: z.string().optional(),
  company_description_ar: z.string().optional(),
  company_description_en: z.string().optional(),
  contact_email: z.string().email('البريد الإلكتروني غير صالح'),
  contact_phone: z.string().min(9, 'رقم الهاتف مطلوب'),
  terms_accepted: z.literal(true, { errorMap: () => ({ message: 'يجب الموافقة على الشروط والأحكام' }) }),
})

export const tripSchema = z.object({
  airline: z.string().min(1, 'اسم شركة الطيران مطلوب'),
  flight_number: z.string().optional(),
  origin_city_ar: z.string().min(1, 'مدينة المغادرة مطلوبة'),
  origin_city_en: z.string().optional(),
  origin_code: z.string().optional(),
  destination_city_ar: z.string().min(1, 'مدينة الوصول مطلوبة'),
  destination_city_en: z.string().optional(),
  destination_code: z.string().optional(),
  departure_at: z.string().min(1, 'تاريخ المغادرة مطلوب'),
  return_at: z.string().optional(),
  trip_type: z.enum(['one_way', 'round_trip']),
  cabin_class: z.enum(['economy', 'business', 'first']),
  total_seats: z.number().min(1, 'عدد المقاعد مطلوب'),
  price_per_seat: z.number().min(1, 'السعر مطلوب'),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
})

export const bookingSchema = z.object({
  trip_id: z.string().uuid(),
  passenger_name: z.string().min(2, 'اسم المسافر مطلوب'),
  passenger_phone: z.string().min(9, 'رقم الهاتف مطلوب'),
  passenger_email: z.string().email('البريد الإلكتروني غير صالح'),
  passenger_id_number: z.string().optional(),
  seats_count: z.number().min(1).max(10),
})

export const adminReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comment: z.string().optional(),
})

export const platformSettingsSchema = z.object({
  default_commission_rate: z.number().min(0).max(100),
  terms_content_ar: z.string().optional(),
  terms_content_en: z.string().optional(),
})
