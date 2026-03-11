export type UserRole = 'buyer' | 'provider' | 'admin'
export type ProviderType = 'travel_agency' | 'hajj_umrah'
export type ApplicationStatus = 'pending_review' | 'approved' | 'rejected'
export type ProviderStatus = 'active' | 'suspended'
export type TripStatus = 'active' | 'sold_out' | 'expired' | 'removed' | 'deactivated'
export type BookingStatus = 'payment_processing' | 'confirmed' | 'payment_failed' | 'refunded' | 'cancelled'
export type TripType = 'one_way' | 'round_trip'
export type CabinClass = 'economy' | 'business' | 'first'
export type NotificationType =
  | 'application_approved'
  | 'application_rejected'
  | 'new_booking'
  | 'trip_removed'
  | 'account_suspended'
  | 'booking_confirmed'
  | 'payment_failed'
  | 'booking_refunded'
  | 'new_application'
  | 'provider_reapplied'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  locale: string
  created_at: string
  updated_at: string
}

export type ProviderApplication = {
  id: string
  user_id: string
  provider_type: ProviderType
  company_name_ar: string
  company_name_en: string | null
  company_description_ar: string | null
  company_description_en: string | null
  contact_email: string
  contact_phone: string
  doc_hajj_permit_url: string | null
  doc_commercial_reg_url: string | null
  doc_tourism_permit_url: string | null
  doc_civil_aviation_url: string | null
  doc_iata_permit_url: string | null
  terms_accepted_at: string
  status: ApplicationStatus
  admin_comment: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type Provider = {
  id: string
  user_id: string
  application_id: string
  provider_type: ProviderType
  company_name_ar: string
  company_name_en: string | null
  company_description_ar: string | null
  company_description_en: string | null
  logo_url: string | null
  contact_email: string
  contact_phone: string
  commission_rate: number | null
  status: ProviderStatus
  suspended_reason: string | null
  has_hajj_permit: boolean
  has_commercial_reg: boolean
  has_tourism_permit: boolean
  has_civil_aviation: boolean
  has_iata_permit: boolean
  created_at: string
  updated_at: string
}

export type Trip = {
  id: string
  provider_id: string
  airline: string
  flight_number: string | null
  origin_city_ar: string
  origin_city_en: string | null
  origin_code: string | null
  destination_city_ar: string
  destination_city_en: string | null
  destination_code: string | null
  departure_at: string
  return_at: string | null
  trip_type: TripType
  cabin_class: CabinClass
  total_seats: number
  booked_seats: number
  price_per_seat: number
  description_ar: string | null
  description_en: string | null
  image_url: string | null
  status: TripStatus
  removed_reason: string | null
  removed_by: string | null
  created_at: string
  updated_at: string
  provider?: Provider
}

export type Booking = {
  id: string
  trip_id: string
  buyer_id: string
  provider_id: string
  passenger_name: string
  passenger_phone: string
  passenger_email: string
  passenger_id_number: string | null
  seats_count: number
  price_per_seat: number
  total_amount: number
  commission_rate: number
  commission_amount: number
  provider_payout: number
  status: BookingStatus
  moyasar_payment_id: string | null
  paid_at: string | null
  refunded_at: string | null
  refunded_by: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  trip?: Trip
  provider?: Provider
  buyer?: Profile
}

export type Notification = {
  id: string
  user_id: string
  type: NotificationType
  title_ar: string
  title_en: string
  body_ar: string
  body_en: string
  data: Record<string, string> | null
  read: boolean
  created_at: string
}

export type PlatformSettings = {
  id: number
  default_commission_rate: number
  terms_content_ar: string | null
  terms_content_en: string | null
  updated_at: string
}
