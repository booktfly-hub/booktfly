export type UserRole = 'buyer' | 'provider' | 'admin' | 'marketeer'
export type ProviderType = 'travel_agency' | 'hajj_umrah'
export type ApplicationStatus = 'pending_review' | 'approved' | 'rejected'
export type ProviderStatus = 'active' | 'suspended'
export type TripStatus = 'active' | 'sold_out' | 'expired' | 'removed' | 'deactivated'
export type BookingStatus = 'payment_processing' | 'confirmed' | 'payment_failed' | 'refunded' | 'cancelled' | 'rejected' | 'cancellation_pending'
export type TripType = 'one_way' | 'round_trip'
export type CabinClass = 'economy' | 'business' | 'first'
export type ListingType = 'seats' | 'trip'
export type Currency = 'SAR' | 'USD'
export type VisaType = 'tourist' | 'umrah' | 'hajj' | 'work' | 'family_visit' | 'business_visit' | 'private_visit'

export type Passenger = {
  first_name: string
  last_name: string
  date_of_birth: string
  id_number: string
  id_expiry_date: string
}

export type TripEditRequestStatus = 'pending' | 'approved' | 'rejected'

export type WalletTransactionType = 'credit' | 'debit' | 'withdrawal'
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export type RoomStatus = 'active' | 'deactivated' | 'removed'

export type FlypointsEventType =
  | 'registration_bonus'
  | 'booking_sale'
  | 'referral_client_signup'
  | 'referral_client_booking'
  | 'referral_marketeer'
  | 'weekly_bonus'
  | 'speed_bonus'
  | 'rating_bonus'
  | 'content_bonus'
  | 'share_bonus'
  | 'travel_bonus'
  | 'cancellation_penalty'
  | 'bad_rating_penalty'
  | 'no_response_penalty'
  | 'manual_adjustment'

export type NotificationType =
  | 'application_approved'
  | 'application_rejected'
  | 'new_booking'
  | 'trip_removed'
  | 'account_suspended'
  | 'booking_confirmed'
  | 'payment_failed'
  | 'booking_refunded'
  | 'booking_rejected'
  | 'new_application'
  | 'provider_reapplied'
  | 'trip_edit_approved'
  | 'trip_edit_rejected'
  | 'trip_updated'
  | 'cancellation_approved'
  | 'cancellation_rejected'
  | 'cancellation_requested'
  | 'payment_approved'
  | 'payment_rejected'
  | 'withdrawal_requested'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'new_room_booking'
  | 'room_booking_confirmed'
  | 'room_booking_rejected'
  | 'room_booking_cancelled'
  | 'room_booking_refunded'
  | 'room_removed'
  | 'marketeer_application_approved'
  | 'marketeer_application_rejected'
  | 'new_marketeer_application'
  | 'points_earned'

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
  iban: string | null
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
  listing_type: ListingType
  trip_type: TripType
  cabin_class: CabinClass
  total_seats: number
  booked_seats: number
  price_per_seat: number
  price_per_seat_one_way: number | null
  currency: Currency
  description_ar: string | null
  description_en: string | null
  is_direct: boolean
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
  buyer_id: string | null
  provider_id: string
  passenger_name: string
  passenger_phone: string
  passenger_email: string
  passenger_id_number: string | null
  passengers: Passenger[] | null
  booking_type: 'round_trip' | 'one_way'
  seats_count: number
  price_per_seat: number
  total_amount: number
  commission_rate: number
  commission_amount: number
  provider_payout: number
  status: BookingStatus
  moyasar_payment_id: string | null
  transfer_receipt_url: string | null
  transfer_confirmed_at: string | null
  payment_reviewed_by: string | null
  payment_reviewed_at: string | null
  payment_rejection_reason: string | null
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

export type TripEditRequest = {
  id: string
  trip_id: string
  provider_id: string
  changes: Record<string, unknown>
  status: TripEditRequestStatus
  admin_comment: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  trip?: Trip
  provider?: Provider
}

export type ProviderWallet = {
  id: string
  provider_id: string
  balance: number
  created_at: string
  updated_at: string
}

export type WalletTransaction = {
  id: string
  provider_id: string
  booking_id: string | null
  type: WalletTransactionType
  amount: number
  balance_after: number
  description_ar: string
  description_en: string
  created_at: string
}

export type WithdrawalRequest = {
  id: string
  provider_id: string
  amount: number
  provider_iban: string
  status: WithdrawalStatus
  admin_comment: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  provider?: Provider
}

export type Room = {
  id: string
  provider_id: string
  name_ar: string
  name_en: string | null
  description_ar: string | null
  description_en: string | null
  city_ar: string
  city_en: string | null
  address_ar: string | null
  address_en: string | null
  category: string
  price_per_night: number
  currency: Currency
  max_capacity: number
  amenities: string[]
  images: string[]
  instant_book: boolean
  available_from: string | null
  available_to: string | null
  status: RoomStatus
  removed_reason: string | null
  removed_by: string | null
  created_at: string
  updated_at: string
  provider?: Provider
}

export type RoomBooking = {
  id: string
  room_id: string
  buyer_id: string | null
  provider_id: string
  guest_name: string
  guest_phone: string | null
  guest_email: string | null
  check_in_date: string
  number_of_days: number
  number_of_people: number
  rooms_count: number
  price_per_night: number
  total_amount: number
  commission_rate: number
  commission_amount: number
  provider_payout: number
  status: BookingStatus
  transfer_receipt_url: string | null
  transfer_confirmed_at: string | null
  payment_reviewed_by: string | null
  payment_reviewed_at: string | null
  payment_rejection_reason: string | null
  paid_at: string | null
  refunded_at: string | null
  refunded_by: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  room?: Room
  provider?: Provider
  buyer?: Profile
}

export type PlatformSettings = {
  id: number
  default_commission_rate: number
  terms_content_ar: string | null
  terms_content_en: string | null
  bank_name_ar: string | null
  bank_name_en: string | null
  bank_iban: string | null
  bank_account_holder_ar: string | null
  bank_account_holder_en: string | null
  flypoints_sar_rate: number
  updated_at: string
}

export type MarkeeteerApplication = {
  id: string
  user_id: string
  full_name: string
  national_id: string
  date_of_birth: string
  phone: string
  phone_alt: string | null
  email: string
  national_address: string
  status: ApplicationStatus
  admin_comment: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type Marketeer = {
  id: string
  user_id: string
  application_id: string | null
  full_name: string
  national_id: string
  phone: string
  referral_code: string
  status: 'active' | 'suspended'
  created_at: string
  updated_at: string
}

export type FlypointsTransaction = {
  id: string
  marketeer_id: string
  points: number
  event_type: FlypointsEventType
  reference_id: string | null
  description_ar: string
  description_en: string
  expires_at: string
  created_at: string
}
