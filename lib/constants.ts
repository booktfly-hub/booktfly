export const APP_NAME = 'BooktFly'
export const APP_NAME_AR = 'بوكت فلاي'
export const APP_DOMAIN = 'booktfly.com'

export const DEFAULT_COMMISSION_RATE = 10.0

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

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  pending_review: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
}
