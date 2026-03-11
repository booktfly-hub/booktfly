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
}

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  pending_review: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
}
