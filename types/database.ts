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
export type SeatTier = 'up_front' | 'extra_legroom' | 'standard'

export type TripSeatMapConfig = {
  rows: number
  left_columns: string[]
  right_columns: string[]
  blocked_seats: string[]
  up_front_rows: number[]
  extra_legroom_rows: number[]
}

export type Passenger = {
  first_name: string
  last_name: string
  date_of_birth: string
  id_number: string
  id_expiry_date: string
  seat_number?: string
}

export type TripEditRequestStatus = 'pending' | 'approved' | 'rejected'
export type FlightRequestStatus = 'pending' | 'reviewed' | 'cancelled' | 'offered' | 'matched' | 'expired'
export type TripRequestOfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export type WalletTransactionType = 'credit' | 'debit' | 'withdrawal'
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export type RoomStatus = 'active' | 'deactivated' | 'removed'
export type CarStatus = 'active' | 'deactivated' | 'removed'
export type PackageStatus = 'active' | 'deactivated' | 'removed'
export type CarCategory = 'sedan' | 'suv' | 'luxury' | 'van' | 'economy'
export type TransmissionType = 'automatic' | 'manual'
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid'

export type FlypointsEventType =
  | 'registration_bonus'
  | 'booking_sale'
  | 'referral_client_signup'
  | 'referral_client_booking'
  | 'referral_marketeer'
  | 'invite_customer'
  | 'sell_ticket'
  | 'sell_hotel'
  | 'sell_full_trip'
  | 'reply_customer'
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

export type CustomerPointsEventType =
  | 'registration_bonus'
  | 'first_booking'
  | 'invite_friend'
  | 'rate_trip'
  | 'share_offer'
  | 'manual_adjustment'

export type ProviderPointsEventType =
  | 'registration_bonus'
  | 'add_offer'
  | 'big_discount'
  | 'exclusive_offer'
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
  | 'new_flight_request'
  | 'last_minute_deal'
  | 'last_minute_provider_alert'
  | 'new_car_booking'
  | 'car_booking_confirmed'
  | 'car_booking_rejected'
  | 'car_booking_cancelled'
  | 'car_booking_refunded'
  | 'car_removed'
  | 'trip_request_offer_received'
  | 'trip_request_offer_accepted'
  | 'trip_request_offer_rejected'
  | 'trip_request_trip_matched'
  | 'new_package_booking'
  | 'package_booking_confirmed'
  | 'package_booking_rejected'
  | 'package_booking_cancelled'
  | 'package_booking_refunded'
  | 'package_removed'
  | 'price_alert_triggered'
  | 'new_review'
  | 'contract_signed'
  | 'name_change_requested'
  | 'name_change_approved'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  locale: string
  referral_code: string | null
  referred_by: string | null
  signature_url: string | null
  created_at: string
  updated_at: string
}

export type PassengerAgeCategory = 'adult' | 'child' | 'infant'

export type ContractRole = 'client' | 'marketeer' | 'service_provider'

export type SiteVisit = {
  id: string
  session_id: string
  path: string
  country: string | null
  city: string | null
  region: string | null
  ip_hash: string | null
  user_agent: string | null
  user_id: string | null
  referrer: string | null
  created_at: string
}

export type EmailTemplate = {
  id: string
  slug: string
  subject_ar: string
  subject_en: string
  body_html_ar: string
  body_html_en: string
  body_text_ar: string | null
  body_text_en: string | null
  variables: string[]
  enabled: boolean
  created_at: string
  updated_at: string
}

export type WhatsappTemplate = {
  id: string
  slug: string
  body_ar: string
  body_en: string
  variables: string[]
  enabled: boolean
  created_at: string
  updated_at: string
}

export type TripPriceHistory = {
  id: string
  trip_id: string
  old_price: number | null
  new_price: number
  changed_by: string | null
  changed_at: string
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
  signature_url: string | null
  contract_signed_at: string | null
  contract_version: string | null
  contract_archive_url: string | null
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
  avg_rating: number
  review_count: number
  is_verified: boolean
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
  checked_baggage_kg: number | null
  cabin_baggage_kg: number | null
  meal_included: boolean
  seat_selection_included: boolean
  description_ar: string | null
  description_en: string | null
  is_direct: boolean
  seat_map_enabled: boolean
  seat_map_config: TripSeatMapConfig | null
  unavailable_seat_numbers?: string[]
  image_url: string | null
  is_last_minute: boolean
  original_price: number | null
  discount_percentage: number
  flight_request_id: string | null
  name_change_allowed: boolean
  name_change_fee: number
  name_change_is_refundable: boolean
  child_discount_percentage: number
  infant_discount_percentage: number
  special_discount_percentage: number
  special_discount_label_ar: string | null
  special_discount_label_en: string | null
  commission_rate_override: number | null
  // Added by familiarity-upgrades migration
  fare_tiers: FareTier[] | null
  duration_minutes: number | null
  origin_lat: number | null
  origin_lon: number | null
  destination_lat: number | null
  destination_lon: number | null
  status: TripStatus
  removed_reason: string | null
  removed_by: string | null
  created_at: string
  updated_at: string
  provider?: Provider
}

export type FareTier = {
  code: string
  name_ar: string
  name_en: string
  price: number
  cabin_kg?: number | null
  checked_kg?: number | null
  refundable?: boolean
  changeable?: boolean
  seat_selection?: boolean
  badge_ar?: string | null
  badge_en?: string | null
  description_ar?: string | null
  description_en?: string | null
}

export type SavedPassenger = {
  id: string
  user_id: string
  label: string | null
  first_name: string
  last_name: string
  date_of_birth: string
  nationality_iso: string | null
  id_number: string
  id_expiry_date: string
  is_self: boolean
  created_at: string
  updated_at: string
}

export type LoyaltyWallet = {
  user_id: string
  balance_points: number
  lifetime_points: number
  tier: 'silver' | 'gold' | 'platinum'
  updated_at: string
}

export type LoyaltyTransaction = {
  id: string
  user_id: string
  kind: 'earn' | 'redeem' | 'adjustment' | 'expire'
  points: number
  booking_id: string | null
  booking_kind: string | null
  description: string | null
  created_at: string
}

export type PriceFreeze = {
  id: string
  user_id: string | null
  guest_email: string | null
  trip_id: string | null
  room_id: string | null
  car_id: string | null
  package_id: string | null
  frozen_price: number
  currency: string
  fee_paid: number
  expires_at: string
  consumed_at: string | null
  booking_id: string | null
  refunded_at: string | null
  created_at: string
}

export type Booking = {
  id: string
  trip_id: string
  buyer_id: string | null
  provider_id: string
  booked_by_marketeer_id: string | null
  guest_token: string | null
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
  buyer_signature_url: string | null
  contract_signed_at: string | null
  contract_version: string | null
  contract_archive_url: string | null
  name_change_count: number
  name_change_fee_paid: number
  price_breakdown: Record<string, unknown> | null
  // Added by familiarity-upgrades migration
  reference_code: string
  selected_fare_tier: string | null
  extra_checked_bags: number
  extra_bag_fee: number
  booked_for_other: boolean
  checkin_reminder_24h_sent_at: string | null
  checkin_reminder_3h_sent_at: string | null
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

export type FlightRequest = {
  id: string
  user_id: string | null
  marketeer_id: string | null
  name: string
  email: string
  phone: string
  origin: string
  destination: string
  departure_date: string
  return_date: string | null
  seats_needed: number
  cabin_class: CabinClass
  budget_max: number | null
  notes: string | null
  status: FlightRequestStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
  offers?: TripRequestOffer[]
}

export type TripRequestOffer = {
  id: string
  request_id: string
  provider_id: string
  price_per_seat: number
  total_price: number
  notes: string | null
  status: TripRequestOfferStatus
  responded_at: string | null
  created_at: string
  updated_at: string
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

export type NameChangePolicy = {
  name_change_allowed: boolean
  name_change_fee: number
  name_change_is_refundable: boolean
}

export type Room = NameChangePolicy & {
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
  is_last_minute: boolean
  original_price: number | null
  discount_percentage: number
  status: RoomStatus
  removed_reason: string | null
  removed_by: string | null
  created_at: string
  updated_at: string
  provider?: Provider
}

type BookingSigningFields = {
  buyer_signature_url: string | null
  contract_signed_at: string | null
  contract_version: string | null
  contract_archive_url: string | null
}

export type RoomBooking = BookingSigningFields & {
  id: string
  room_id: string
  buyer_id: string | null
  provider_id: string
  booked_by_marketeer_id: string | null
  guest_token: string | null
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
  last_minute_threshold_hours: number
  max_discount_percentage: number
  auto_last_minute_notify: boolean
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
  signature_url: string | null
  contract_signed_at: string | null
  contract_version: string | null
  contract_archive_url: string | null
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
  referred_by_marketeer_id: string | null
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

export type CustomerPointsTransaction = {
  id: string
  user_id: string
  points: number
  event_type: CustomerPointsEventType
  reference_id: string | null
  description_ar: string
  description_en: string
  created_at: string
}

export type ProviderPointsTransaction = {
  id: string
  provider_id: string
  points: number
  event_type: ProviderPointsEventType
  reference_id: string | null
  description_ar: string
  description_en: string
  created_at: string
}

export type ActivityEventType =
  | 'site_visit'
  | 'user_registered'
  | 'user_login'
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_refunded'
  | 'payment_received'
  | 'provider_joined'
  | 'provider_suspended'
  | 'trip_created'
  | 'trip_removed'
  | 'trip_expired'
  | 'trip_sold_out'
  | 'room_created'
  | 'room_removed'
  | 'room_booking_created'
  | 'room_booking_confirmed'
  | 'marketeer_joined'
  | 'marketeer_application'
  | 'provider_application'
  | 'withdrawal_requested'
  | 'withdrawal_completed'
  | 'flight_request_created'
  | 'email_registered'
  | 'seat_reserved'
  | 'seat_released'
  | 'car_created'
  | 'car_removed'
  | 'car_booking_created'
  | 'car_booking_confirmed'
  | 'trip_request_offer_created'
  | 'trip_request_offer_accepted'
  | 'package_created'
  | 'package_removed'
  | 'package_booking_created'
  | 'package_booking_confirmed'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export type ActivityLog = {
  id: string
  event_type: ActivityEventType
  user_id: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export type AdminAlert = {
  id: string
  alert_type: string
  severity: AlertSeverity
  title_ar: string
  title_en: string
  body_ar: string | null
  body_en: string | null
  metadata: Record<string, unknown>
  dismissed: boolean
  dismissed_by: string | null
  dismissed_at: string | null
  created_at: string
}

export type PickupReturnType = 'airport' | 'branch'
export type ReturnLocationType = 'same_location' | 'airport' | 'branch'

export type Car = NameChangePolicy & {
  id: string
  provider_id: string
  brand_ar: string
  brand_en: string | null
  model_ar: string
  model_en: string | null
  year: number
  city_ar: string
  city_en: string | null
  category: CarCategory
  price_per_day: number
  currency: Currency
  seats_count: number
  transmission: TransmissionType
  fuel_type: FuelType
  features: string[]
  images: string[]
  available_from: string | null
  available_to: string | null
  instant_book: boolean
  is_last_minute: boolean
  original_price: number | null
  discount_percentage: number
  pickup_location_ar: string | null
  pickup_location_en: string | null
  pickup_latitude: number | null
  pickup_longitude: number | null
  pickup_type: PickupReturnType | null
  pickup_branch_name_ar: string | null
  pickup_branch_name_en: string | null
  return_type: ReturnLocationType | null
  return_branch_name_ar: string | null
  return_branch_name_en: string | null
  pickup_hour_from: string | null
  pickup_hour_to: string | null
  return_hour_from: string | null
  return_hour_to: string | null
  status: CarStatus
  removed_reason: string | null
  removed_by: string | null
  created_at: string
  updated_at: string
  provider?: Provider
}

export type CarBooking = BookingSigningFields & {
  id: string
  car_id: string
  buyer_id: string | null
  provider_id: string
  booked_by_marketeer_id: string | null
  guest_token: string | null
  guest_name: string
  guest_phone: string | null
  guest_email: string | null
  pickup_date: string
  return_date: string
  number_of_days: number
  price_per_day: number
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
  pickup_time: string | null
  return_time: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  car?: Car
  provider?: Provider
  buyer?: Profile
}

export type Package = NameChangePolicy & {
  id: string
  provider_id: string
  name_ar: string
  name_en: string | null
  description_ar: string | null
  description_en: string | null
  destination_city_ar: string
  destination_city_en: string | null
  includes_flight: boolean
  includes_hotel: boolean
  includes_car: boolean
  trip_id: string | null
  room_id: string | null
  car_id: string | null
  flight_airline: string | null
  flight_number: string | null
  flight_origin_ar: string | null
  flight_origin_en: string | null
  flight_origin_code: string | null
  flight_destination_ar: string | null
  flight_destination_en: string | null
  flight_destination_code: string | null
  flight_departure_at: string | null
  flight_return_at: string | null
  flight_cabin_class: string | null
  flight_seats_included: number | null
  hotel_name_ar: string | null
  hotel_name_en: string | null
  hotel_category: string | null
  hotel_nights: number | null
  duration_days: number | null
  room_basis: string | null
  breakfast_included: boolean
  airport_transfer_included: boolean
  tour_guide_included: boolean
  sightseeing_tours_included: boolean
  hotel_city_ar: string | null
  hotel_city_en: string | null
  car_brand_ar: string | null
  car_brand_en: string | null
  car_model_ar: string | null
  car_model_en: string | null
  car_category: string | null
  car_rental_days: number | null
  trip_price: number | null
  car_price: number | null
  hotel_price: number | null
  total_price: number
  original_price: number | null
  discount_percentage: number
  currency: Currency
  start_date: string | null
  end_date: string | null
  images: string[]
  max_bookings: number
  current_bookings: number
  is_last_minute: boolean
  status: PackageStatus
  removed_reason: string | null
  removed_by: string | null
  created_at: string
  updated_at: string
  provider?: Provider
  trip?: Trip
  room?: Room
  car?: Car
}

export type PackageBooking = BookingSigningFields & {
  id: string
  package_id: string
  buyer_id: string | null
  provider_id: string
  booked_by_marketeer_id: string | null
  guest_token: string | null
  guest_name: string
  guest_phone: string | null
  guest_email: string | null
  number_of_people: number
  start_date: string
  end_date: string
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
  package?: Package
  provider?: Provider
  buyer?: Profile
}

export type MarketeerCustomer = {
  id: string
  marketeer_id: string
  name: string | null
  email: string | null
  phone: string | null
  source: 'manual' | 'excel' | 'referral'
  created_at: string
}

export type ReviewItemType = 'trip' | 'room' | 'car' | 'package'

export type Review = {
  id: string
  booking_id: string
  reviewer_id: string
  provider_id: string
  trip_id: string | null
  room_id: string | null
  car_id: string | null
  item_type: ReviewItemType
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
  reviewer?: Profile
  provider?: Provider
  trip?: Trip
}

export type PriceAlert = {
  id: string
  user_id: string
  origin_code: string
  origin_name_ar: string | null
  origin_name_en: string | null
  destination_code: string
  destination_name_ar: string | null
  destination_name_en: string | null
  target_price: number | null
  cabin_class: string
  is_active: boolean
  last_notified_at: string | null
  created_at: string
}

export type SavedItemType = 'trip' | 'room' | 'car' | 'package'

export type SavedItem = {
  id: string
  user_id: string
  item_type: SavedItemType
  item_id: string
  created_at: string
}

export type RecentSearch = {
  id: string
  user_id: string
  search_type: 'flight' | 'hotel' | 'car'
  origin_code: string | null
  destination_code: string | null
  origin_name_ar: string | null
  origin_name_en: string | null
  destination_name_ar: string | null
  destination_name_en: string | null
  departure_date: string | null
  return_date: string | null
  trip_type: string | null
  passengers: number
  cabin_class: string | null
  created_at: string
}

export type FaqCategory = 'booking' | 'payment' | 'cancellation' | 'provider' | 'account' | 'general'

export type FaqItem = {
  id: string
  category: FaqCategory
  question_ar: string
  question_en: string | null
  answer_ar: string
  answer_en: string | null
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}
