export const APP_NAME = 'BooktFly'
export const APP_NAME_AR = 'بوكت فلاي'
export const APP_DOMAIN = 'booktfly.com'

export const DEFAULT_COMMISSION_RATE = 10.0
export const LAST_MINUTE_THRESHOLD_HOURS = 72

export const MAX_SEATS_PER_BOOKING = 10

export const PAYMENT_TIMEOUT_MINUTES = 30

export const PROVIDER_TYPES = {
  travel_agency: { ar: 'مكاتب سياحة', en: 'Travel Agency' },
  hajj_umrah: { ar: 'شركات حج وعمرة', en: 'Hajj & Umrah Company' },
} as const

export const LISTING_TYPES = {
  seats: { ar: 'مقاعد', en: 'Seats' },
  trip: { ar: 'رحلة كاملة', en: 'Full Trip' },
} as const

export const TRIP_TYPES = {
  one_way: { ar: 'ذهاب فقط', en: 'One Way' },
  round_trip: { ar: 'ذهاب وعودة', en: 'Round Trip' },
} as const

export const CABIN_CLASSES = {
  economy: { ar: 'اقتصادي', en: 'Economy' },
  business: { ar: 'أعمال', en: 'Business' },
  first: { ar: 'أولى', en: 'First' },
} as const

export const TRIP_STATUS_COLORS: Record<string, string> = {
  active: 'bg-success/10 text-success',
  sold_out: 'bg-destructive/10 text-destructive',
  expired: 'bg-muted text-muted-foreground',
  removed: 'bg-destructive/10 text-destructive',
  deactivated: 'bg-warning/10 text-warning',
}

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  payment_processing: 'bg-warning/10 text-warning',
  confirmed: 'bg-success/10 text-success',
  payment_failed: 'bg-destructive/10 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
  rejected: 'bg-destructive/10 text-destructive',
  cancellation_pending: 'bg-warning/10 text-warning',
}

export const EDIT_REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
}

export const WITHDRAWAL_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  completed: 'bg-success/10 text-success',
}

export const BOOKING_TYPES = {
  one_way: { ar: 'ذهاب فقط', en: 'One Way' },
  round_trip: { ar: 'ذهاب وعودة', en: 'Round Trip' },
} as const

export const VISA_TYPES = {
  tourist: { ar: 'سياحية', en: 'Tourist' },
  umrah: { ar: 'عمرة', en: 'Umrah' },
  hajj: { ar: 'حج', en: 'Hajj' },
  work: { ar: 'عمل', en: 'Work' },
  family_visit: { ar: 'زيارة عائلية', en: 'Family Visit' },
  business_visit: { ar: 'زيارة تجارية', en: 'Business Visit' },
  private_visit: { ar: 'زيارة خاصة', en: 'Private Visit' },
} as const

export const NATIONALITIES = [
  { code: 'SA', ar: 'سعودي', en: 'Saudi' },
  { code: 'AE', ar: 'إماراتي', en: 'Emirati' },
  { code: 'KW', ar: 'كويتي', en: 'Kuwaiti' },
  { code: 'BH', ar: 'بحريني', en: 'Bahraini' },
  { code: 'QA', ar: 'قطري', en: 'Qatari' },
  { code: 'OM', ar: 'عماني', en: 'Omani' },
  { code: 'EG', ar: 'مصري', en: 'Egyptian' },
  { code: 'JO', ar: 'أردني', en: 'Jordanian' },
  { code: 'LB', ar: 'لبناني', en: 'Lebanese' },
  { code: 'SY', ar: 'سوري', en: 'Syrian' },
  { code: 'IQ', ar: 'عراقي', en: 'Iraqi' },
  { code: 'YE', ar: 'يمني', en: 'Yemeni' },
  { code: 'PS', ar: 'فلسطيني', en: 'Palestinian' },
  { code: 'SD', ar: 'سوداني', en: 'Sudanese' },
  { code: 'LY', ar: 'ليبي', en: 'Libyan' },
  { code: 'TN', ar: 'تونسي', en: 'Tunisian' },
  { code: 'DZ', ar: 'جزائري', en: 'Algerian' },
  { code: 'MA', ar: 'مغربي', en: 'Moroccan' },
  { code: 'PK', ar: 'باكستاني', en: 'Pakistani' },
  { code: 'IN', ar: 'هندي', en: 'Indian' },
  { code: 'BD', ar: 'بنغلاديشي', en: 'Bangladeshi' },
  { code: 'ID', ar: 'إندونيسي', en: 'Indonesian' },
  { code: 'MY', ar: 'ماليزي', en: 'Malaysian' },
  { code: 'TR', ar: 'تركي', en: 'Turkish' },
  { code: 'PH', ar: 'فلبيني', en: 'Filipino' },
  { code: 'NG', ar: 'نيجيري', en: 'Nigerian' },
  { code: 'GB', ar: 'بريطاني', en: 'British' },
  { code: 'US', ar: 'أمريكي', en: 'American' },
  { code: 'FR', ar: 'فرنسي', en: 'French' },
  { code: 'DE', ar: 'ألماني', en: 'German' },
] as const

export const MAX_ROOMS_PER_BOOKING = 10

export const ROOM_STATUS_COLORS: Record<string, string> = {
  active: 'bg-success/10 text-success',
  deactivated: 'bg-warning/10 text-warning',
  removed: 'bg-destructive/10 text-destructive',
}

export const ROOM_CATEGORIES = {
  hotel: { ar: 'فندق', en: 'Hotel' },
  hostel: { ar: 'نزل', en: 'Hostel' },
  apartment: { ar: 'شقة مفروشة', en: 'Furnished Apartment' },
  chalet: { ar: 'شاليه', en: 'Chalet' },
  resort: { ar: 'منتجع', en: 'Resort' },
  villa: { ar: 'فيلا', en: 'Villa' },
} as const

export const ROOM_AMENITIES = {
  wifi: { ar: 'واي فاي', en: 'WiFi' },
  parking: { ar: 'موقف سيارات', en: 'Parking' },
  pool: { ar: 'مسبح', en: 'Pool' },
  breakfast: { ar: 'فطور', en: 'Breakfast' },
  ac: { ar: 'تكييف', en: 'Air Conditioning' },
  gym: { ar: 'صالة رياضية', en: 'Gym' },
  kitchen: { ar: 'مطبخ', en: 'Kitchen' },
  laundry: { ar: 'غسيل', en: 'Laundry' },
  elevator: { ar: 'مصعد', en: 'Elevator' },
  room_service: { ar: 'خدمة الغرف', en: 'Room Service' },
  beach_access: { ar: 'وصول للشاطئ', en: 'Beach Access' },
  bbq: { ar: 'شواء', en: 'BBQ' },
  haram_view: { ar: 'إطلالة على الحرم', en: 'Haram View' },
} as const

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  pending_review: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
}

export const CAR_CATEGORIES = {
  sedan: { ar: 'سيدان', en: 'Sedan' },
  suv: { ar: 'دفع رباعي', en: 'SUV' },
  luxury: { ar: 'فاخرة', en: 'Luxury' },
  van: { ar: 'فان', en: 'Van' },
  economy: { ar: 'اقتصادية', en: 'Economy' },
} as const

export const CAR_FEATURES = {
  gps: { ar: 'نظام ملاحة', en: 'GPS' },
  bluetooth: { ar: 'بلوتوث', en: 'Bluetooth' },
  cruise_control: { ar: 'مثبت السرعة', en: 'Cruise Control' },
  backup_camera: { ar: 'كاميرا خلفية', en: 'Backup Camera' },
  sunroof: { ar: 'فتحة سقف', en: 'Sunroof' },
  leather_seats: { ar: 'مقاعد جلد', en: 'Leather Seats' },
  heated_seats: { ar: 'مقاعد مدفأة', en: 'Heated Seats' },
  apple_carplay: { ar: 'أبل كاربلاي', en: 'Apple CarPlay' },
  android_auto: { ar: 'أندرويد أوتو', en: 'Android Auto' },
  child_seat: { ar: 'كرسي أطفال', en: 'Child Seat' },
  usb_charger: { ar: 'شاحن USB', en: 'USB Charger' },
  spare_tire: { ar: 'إطار احتياطي', en: 'Spare Tire' },
} as const

export const TRANSMISSION_TYPES = {
  automatic: { ar: 'أوتوماتيك', en: 'Automatic' },
  manual: { ar: 'عادي', en: 'Manual' },
} as const

export const FUEL_TYPES = {
  petrol: { ar: 'بنزين', en: 'Petrol' },
  diesel: { ar: 'ديزل', en: 'Diesel' },
  electric: { ar: 'كهربائي', en: 'Electric' },
  hybrid: { ar: 'هجين', en: 'Hybrid' },
} as const

export const CAR_STATUS_COLORS: Record<string, string> = {
  active: 'bg-success/10 text-success',
  deactivated: 'bg-warning/10 text-warning',
  removed: 'bg-destructive/10 text-destructive',
}

export const FLIGHT_REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  offered: 'bg-sky-100 text-sky-700',
  matched: 'bg-success/10 text-success',
  reviewed: 'bg-success/10 text-success',
  cancelled: 'bg-muted text-muted-foreground',
  expired: 'bg-muted text-muted-foreground',
}

export const TRIP_REQUEST_OFFER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  accepted: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  expired: 'bg-muted text-muted-foreground',
}

export const MAX_DAYS_PER_CAR_BOOKING = 30
