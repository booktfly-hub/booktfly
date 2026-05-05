import 'server-only'

const AFFILIATE_ID = process.env.BOOKING_AFFILIATE_ID || ''

export type HotelTier = 'luxury' | 'comfort' | 'budget'

export interface HotelOffer {
  id: string
  city: string
  city_ar: string
  city_iata: string
  country: string
  country_ar: string
  country_code: string
  checkin: string
  checkout: string
  adults: number
  image_url: string
  affiliate_url: string
  source: 'booking'
  tier: HotelTier
  tier_label_en: string
  tier_label_ar: string
  star_rating: number
  price_from: number
  price_currency: string
  property_count: string
  property_type_en: string
  property_type_ar: string
}

interface CityMeta {
  en: string
  ar: string
  country_en: string
  country_ar: string
  country_code: string
  image: string
  tiers: Record<HotelTier, { price_from: number; count: string }>
}

const CITIES: Record<string, CityMeta> = {
  DXB: {
    en: 'Dubai', ar: 'دبي',
    country_en: 'United Arab Emirates', country_ar: 'الإمارات',
    country_code: 'ae',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
    tiers: { luxury: { price_from: 180, count: '1,200+' }, comfort: { price_from: 75, count: '3,500+' }, budget: { price_from: 28, count: '900+' } },
  },
  AUH: {
    en: 'Abu Dhabi', ar: 'أبوظبي',
    country_en: 'United Arab Emirates', country_ar: 'الإمارات',
    country_code: 'ae',
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
    tiers: { luxury: { price_from: 150, count: '600+' }, comfort: { price_from: 65, count: '1,800+' }, budget: { price_from: 25, count: '400+' } },
  },
  RUH: {
    en: 'Riyadh', ar: 'الرياض',
    country_en: 'Saudi Arabia', country_ar: 'المملكة العربية السعودية',
    country_code: 'sa',
    image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&q=80',
    tiers: { luxury: { price_from: 160, count: '500+' }, comfort: { price_from: 70, count: '1,500+' }, budget: { price_from: 25, count: '600+' } },
  },
  JED: {
    en: 'Jeddah', ar: 'جدة',
    country_en: 'Saudi Arabia', country_ar: 'المملكة العربية السعودية',
    country_code: 'sa',
    image: 'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800&q=80',
    tiers: { luxury: { price_from: 140, count: '350+' }, comfort: { price_from: 60, count: '1,200+' }, budget: { price_from: 22, count: '500+' } },
  },
  CAI: {
    en: 'Cairo', ar: 'القاهرة',
    country_en: 'Egypt', country_ar: 'مصر',
    country_code: 'eg',
    image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800&q=80',
    tiers: { luxury: { price_from: 80, count: '300+' }, comfort: { price_from: 35, count: '1,400+' }, budget: { price_from: 12, count: '700+' } },
  },
  IST: {
    en: 'Istanbul', ar: 'إسطنبول',
    country_en: 'Turkey', country_ar: 'تركيا',
    country_code: 'tr',
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80',
    tiers: { luxury: { price_from: 90, count: '600+' }, comfort: { price_from: 40, count: '3,200+' }, budget: { price_from: 15, count: '1,100+' } },
  },
  AMM: {
    en: 'Amman', ar: 'عمّان',
    country_en: 'Jordan', country_ar: 'الأردن',
    country_code: 'jo',
    image: 'https://images.unsplash.com/photo-1580834341580-8c17a3a630ca?w=800&q=80',
    tiers: { luxury: { price_from: 110, count: '200+' }, comfort: { price_from: 50, count: '700+' }, budget: { price_from: 18, count: '300+' } },
  },
  DOH: {
    en: 'Doha', ar: 'الدوحة',
    country_en: 'Qatar', country_ar: 'قطر',
    country_code: 'qa',
    image: 'https://images.unsplash.com/photo-1615378484786-5a1e1a50c7c1?w=800&q=80',
    tiers: { luxury: { price_from: 200, count: '400+' }, comfort: { price_from: 90, count: '900+' }, budget: { price_from: 35, count: '200+' } },
  },
  MCT: {
    en: 'Muscat', ar: 'مسقط',
    country_en: 'Oman', country_ar: 'عُمان',
    country_code: 'om',
    image: 'https://images.unsplash.com/photo-1617817557530-38e0b1f8ea9a?w=800&q=80',
    tiers: { luxury: { price_from: 130, count: '250+' }, comfort: { price_from: 55, count: '600+' }, budget: { price_from: 20, count: '200+' } },
  },
  KWI: {
    en: 'Kuwait City', ar: 'الكويت',
    country_en: 'Kuwait', country_ar: 'الكويت',
    country_code: 'kw',
    image: 'https://images.unsplash.com/photo-1633158829875-e5316a358c6f?w=800&q=80',
    tiers: { luxury: { price_from: 170, count: '180+' }, comfort: { price_from: 75, count: '500+' }, budget: { price_from: 28, count: '150+' } },
  },
  BAH: {
    en: 'Manama', ar: 'المنامة',
    country_en: 'Bahrain', country_ar: 'البحرين',
    country_code: 'bh',
    image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80',
    tiers: { luxury: { price_from: 145, count: '200+' }, comfort: { price_from: 65, count: '500+' }, budget: { price_from: 22, count: '180+' } },
  },
  BEY: {
    en: 'Beirut', ar: 'بيروت',
    country_en: 'Lebanon', country_ar: 'لبنان',
    country_code: 'lb',
    image: 'https://images.unsplash.com/photo-1597165945570-ca1e28de0e4f?w=800&q=80',
    tiers: { luxury: { price_from: 100, count: '150+' }, comfort: { price_from: 45, count: '400+' }, budget: { price_from: 15, count: '200+' } },
  },
  LHR: {
    en: 'London', ar: 'لندن',
    country_en: 'United Kingdom', country_ar: 'المملكة المتحدة',
    country_code: 'gb',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
    tiers: { luxury: { price_from: 250, count: '800+' }, comfort: { price_from: 100, count: '4,000+' }, budget: { price_from: 40, count: '1,500+' } },
  },
  CDG: {
    en: 'Paris', ar: 'باريس',
    country_en: 'France', country_ar: 'فرنسا',
    country_code: 'fr',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    tiers: { luxury: { price_from: 220, count: '700+' }, comfort: { price_from: 90, count: '3,800+' }, budget: { price_from: 35, count: '1,200+' } },
  },
  FCO: {
    en: 'Rome', ar: 'روما',
    country_en: 'Italy', country_ar: 'إيطاليا',
    country_code: 'it',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
    tiers: { luxury: { price_from: 180, count: '400+' }, comfort: { price_from: 75, count: '2,500+' }, budget: { price_from: 30, count: '900+' } },
  },
  KUL: {
    en: 'Kuala Lumpur', ar: 'كوالالمبور',
    country_en: 'Malaysia', country_ar: 'ماليزيا',
    country_code: 'my',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80',
    tiers: { luxury: { price_from: 70, count: '500+' }, comfort: { price_from: 30, count: '2,200+' }, budget: { price_from: 10, count: '900+' } },
  },
  BKK: {
    en: 'Bangkok', ar: 'بانكوك',
    country_en: 'Thailand', country_ar: 'تايلاند',
    country_code: 'th',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
    tiers: { luxury: { price_from: 60, count: '600+' }, comfort: { price_from: 25, count: '3,000+' }, budget: { price_from: 8, count: '1,400+' } },
  },
}

const TIER_META: Record<HotelTier, {
  label_en: string; label_ar: string
  stars: number
  type_en: string; type_ar: string
  nflt: string // Booking.com star filter
}> = {
  luxury: {
    label_en: 'Luxury', label_ar: 'فاخر',
    stars: 5,
    type_en: '5-Star Hotels & Resorts', type_ar: 'فنادق ومنتجعات 5 نجوم',
    nflt: 'class%3D5%3Bclass%3D4',
  },
  comfort: {
    label_en: 'Comfort', label_ar: 'مريح',
    stars: 4,
    type_en: '3 & 4-Star Hotels', type_ar: 'فنادق 3 و4 نجوم',
    nflt: 'class%3D4%3Bclass%3D3',
  },
  budget: {
    label_en: 'Budget', label_ar: 'اقتصادي',
    stars: 3,
    type_en: 'Budget & Apartments', type_ar: 'اقتصادي وشقق فندقية',
    nflt: 'class%3D3%3Bclass%3D2%3Bclass%3D1',
  },
}

// Tier images (different photo for each tier)
const TIER_IMAGES: Record<HotelTier, Record<string, string>> = {
  luxury: {
    DXB: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    RUH: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80',
    IST: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    CAI: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    DOH: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    default: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  },
  comfort: {
    DXB: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    IST: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
    CAI: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
    default: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
  },
  budget: {
    default: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
  },
}

function getTierImage(tier: HotelTier, iata: string): string {
  return TIER_IMAGES[tier][iata] || TIER_IMAGES[tier].default
}

export function buildBookingSearchUrl(opts: {
  city: string
  checkin?: string
  checkout?: string
  adults?: number
  rooms?: number
  nflt?: string
  sub_id?: string
}): string {
  const url = new URL('https://www.booking.com/searchresults.html')
  url.searchParams.set('ss', opts.city)
  if (opts.checkin) url.searchParams.set('checkin', opts.checkin)
  if (opts.checkout) url.searchParams.set('checkout', opts.checkout)
  url.searchParams.set('group_adults', String(opts.adults ?? 2))
  url.searchParams.set('no_rooms', String(opts.rooms ?? 1))
  url.searchParams.set('lang', 'en-gb')
  if (opts.nflt) url.searchParams.set('nflt', opts.nflt)
  if (AFFILIATE_ID) url.searchParams.set('aid', AFFILIATE_ID)
  if (opts.sub_id) url.searchParams.set('label', opts.sub_id)
  return url.toString()
}

function makeOffer(iata: string, meta: CityMeta, tier: HotelTier, checkin: string, checkout: string, adults: number): HotelOffer {
  const tm = TIER_META[tier]
  return {
    id: `booking-${iata}-${tier}-${checkin}`,
    city: meta.en,
    city_ar: meta.ar,
    city_iata: iata,
    country: meta.country_en,
    country_ar: meta.country_ar,
    country_code: meta.country_code,
    checkin,
    checkout,
    adults,
    image_url: getTierImage(tier, iata),
    affiliate_url: buildBookingSearchUrl({
      city: meta.en,
      checkin,
      checkout,
      adults,
      nflt: tm.nflt,
      sub_id: `hotel_${tier}`,
    }),
    source: 'booking',
    tier,
    tier_label_en: tm.label_en,
    tier_label_ar: tm.label_ar,
    star_rating: tm.stars,
    price_from: meta.tiers[tier].price_from,
    price_currency: 'USD',
    property_count: meta.tiers[tier].count,
    property_type_en: tm.type_en,
    property_type_ar: tm.type_ar,
  }
}

// Get all 3 tiers for a specific IATA destination
export function getHotelOffers(opts: {
  destination_iata: string
  checkin?: string
  checkout?: string
  adults?: number
}): HotelOffer[] {
  const iata = opts.destination_iata.toUpperCase()
  const meta = CITIES[iata]
  if (!meta) return []
  const checkin = opts.checkin || defaultCheckin()
  const checkout = opts.checkout || defaultCheckout(checkin)
  const adults = opts.adults ?? 2
  return (['luxury', 'comfort', 'budget'] as HotelTier[]).map((tier) => makeOffer(iata, meta, tier, checkin, checkout, adults))
}

// Get hotel offers for a city name string (used by rooms page)
export function getHotelOffersForCity(opts: {
  city: string       // plain city name e.g. "Dubai"
  checkin?: string
  checkout?: string
  adults?: number
}): HotelOffer[] {
  const cityLower = opts.city.trim().toLowerCase()
  const entry = Object.entries(CITIES).find(([, m]) =>
    m.en.toLowerCase() === cityLower || m.ar === opts.city.trim()
  )
  if (!entry) {
    // Unknown city — return generic deep links using the raw city name
    const checkin = opts.checkin || defaultCheckin()
    const checkout = opts.checkout || defaultCheckout(checkin);
    (['luxury', 'comfort', 'budget'] as HotelTier[]).map((tier) => {
      const tm = TIER_META[tier]
      return {
        id: `booking-custom-${tier}-${checkin}`,
        city: opts.city,
        city_ar: opts.city,
        city_iata: '',
        country: '',
        country_ar: '',
        country_code: '',
        checkin,
        checkout,
        adults: opts.adults ?? 2,
        image_url: TIER_IMAGES[tier].default,
        affiliate_url: buildBookingSearchUrl({ city: opts.city, checkin, checkout, adults: opts.adults ?? 2, nflt: tm.nflt, sub_id: `hotel_${tier}` }),
        source: 'booking' as const,
        tier,
        tier_label_en: tm.label_en,
        tier_label_ar: tm.label_ar,
        star_rating: tm.stars,
        price_from: tier === 'luxury' ? 150 : tier === 'comfort' ? 60 : 20,
        price_currency: 'USD',
        property_count: '200+',
        property_type_en: tm.type_en,
        property_type_ar: tm.type_ar,
      }
    })
    // Fall through to using city name with generic entry
    const checkinF = opts.checkin || defaultCheckin()
    const checkoutF = opts.checkout || defaultCheckout(checkinF)
    return (['luxury', 'comfort', 'budget'] as HotelTier[]).map((tier) => {
      const tm = TIER_META[tier]
      return {
        id: `booking-custom-${tier}-${checkinF}`,
        city: opts.city,
        city_ar: opts.city,
        city_iata: '',
        country: '',
        country_ar: '',
        country_code: '',
        checkin: checkinF,
        checkout: checkoutF,
        adults: opts.adults ?? 2,
        image_url: TIER_IMAGES[tier].default,
        affiliate_url: buildBookingSearchUrl({ city: opts.city, checkin: checkinF, checkout: checkoutF, adults: opts.adults ?? 2, nflt: tm.nflt, sub_id: `hotel_${tier}` }),
        source: 'booking' as const,
        tier,
        tier_label_en: tm.label_en,
        tier_label_ar: tm.label_ar,
        star_rating: tm.stars,
        price_from: tier === 'luxury' ? 150 : tier === 'comfort' ? 60 : 20,
        price_currency: 'USD',
        property_count: '200+',
        property_type_en: tm.type_en,
        property_type_ar: tm.type_ar,
      }
    })
  }
  const [iata, meta] = entry
  return getHotelOffers({ destination_iata: iata, checkin: opts.checkin, checkout: opts.checkout, adults: opts.adults })
}

// 3 popular destinations for fallback on trips page (no search params)
export function getPopularHotelOffers(): HotelOffer[] {
  const destinations = ['DXB', 'IST', 'CAI']
  const checkin = defaultCheckin()
  const checkout = defaultCheckout(checkin)
  return destinations.flatMap((iata) => getHotelOffers({ destination_iata: iata, checkin, checkout }))
}

function defaultCheckin(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

function defaultCheckout(checkin: string): string {
  const d = new Date(checkin)
  d.setDate(d.getDate() + 3)
  return d.toISOString().slice(0, 10)
}
