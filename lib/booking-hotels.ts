import 'server-only'

const AFFILIATE_ID = process.env.BOOKING_AFFILIATE_ID || ''

export interface HotelOffer {
  id: string
  city: string
  city_iata: string
  country: string
  country_code: string
  checkin: string
  checkout: string
  adults: number
  image_url: string
  affiliate_url: string
  source: 'booking'
}

// Construct a Booking.com search deep link.
// affiliate_id is optional now — add BOOKING_AFFILIATE_ID to .env.local once approved.
export function buildBookingSearchUrl(opts: {
  city: string            // city name for ss= param
  checkin?: string        // YYYY-MM-DD
  checkout?: string       // YYYY-MM-DD
  adults?: number
  rooms?: number
  sub_id?: string
}): string {
  const url = new URL('https://www.booking.com/searchresults.html')
  url.searchParams.set('ss', opts.city)
  if (opts.checkin) url.searchParams.set('checkin', opts.checkin)
  if (opts.checkout) url.searchParams.set('checkout', opts.checkout)
  url.searchParams.set('group_adults', String(opts.adults ?? 2))
  url.searchParams.set('no_rooms', String(opts.rooms ?? 1))
  url.searchParams.set('lang', 'en-gb')
  if (AFFILIATE_ID) url.searchParams.set('aid', AFFILIATE_ID)
  if (opts.sub_id) url.searchParams.set('label', opts.sub_id)
  return url.toString()
}

// Popular destination city images (Unsplash, no API key required)
const CITY_IMAGES: Record<string, string> = {
  DXB: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  RUH: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&q=80',
  JED: 'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800&q=80',
  CAI: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800&q=80',
  IST: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80',
  AMM: 'https://images.unsplash.com/photo-1580834341580-8c17a3a630ca?w=800&q=80',
  BEY: 'https://images.unsplash.com/photo-1597165945570-ca1e28de0e4f?w=800&q=80',
  KWI: 'https://images.unsplash.com/photo-1633158829875-e5316a358c6f?w=800&q=80',
  BAH: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80',
  MCT: 'https://images.unsplash.com/photo-1617817557530-38e0b1f8ea9a?w=800&q=80',
  DOH: 'https://images.unsplash.com/photo-1615378484786-5a1e1a50c7c1?w=800&q=80',
  AUH: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
  LHR: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
  CDG: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  FCO: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
  BCN: 'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?w=800&q=80',
  KUL: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80',
  BKK: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
}

const CITY_NAMES: Record<string, { en: string; country: string; country_code: string }> = {
  DXB: { en: 'Dubai', country: 'United Arab Emirates', country_code: 'ae' },
  RUH: { en: 'Riyadh', country: 'Saudi Arabia', country_code: 'sa' },
  JED: { en: 'Jeddah', country: 'Saudi Arabia', country_code: 'sa' },
  CAI: { en: 'Cairo', country: 'Egypt', country_code: 'eg' },
  IST: { en: 'Istanbul', country: 'Turkey', country_code: 'tr' },
  AMM: { en: 'Amman', country: 'Jordan', country_code: 'jo' },
  BEY: { en: 'Beirut', country: 'Lebanon', country_code: 'lb' },
  KWI: { en: 'Kuwait City', country: 'Kuwait', country_code: 'kw' },
  BAH: { en: 'Manama', country: 'Bahrain', country_code: 'bh' },
  MCT: { en: 'Muscat', country: 'Oman', country_code: 'om' },
  DOH: { en: 'Doha', country: 'Qatar', country_code: 'qa' },
  AUH: { en: 'Abu Dhabi', country: 'United Arab Emirates', country_code: 'ae' },
  LHR: { en: 'London', country: 'United Kingdom', country_code: 'gb' },
  CDG: { en: 'Paris', country: 'France', country_code: 'fr' },
  FCO: { en: 'Rome', country: 'Italy', country_code: 'it' },
  BCN: { en: 'Barcelona', country: 'Spain', country_code: 'es' },
  KUL: { en: 'Kuala Lumpur', country: 'Malaysia', country_code: 'my' },
  BKK: { en: 'Bangkok', country: 'Thailand', country_code: 'th' },
}

// Returns hotel search offers for a given destination.
// No API call yet — returns deep links to Booking.com search results.
// Once Booking.com Demand API is approved, replace with real hotel data.
export function getHotelOffers(opts: {
  destination_iata: string
  checkin?: string
  checkout?: string
  adults?: number
}): HotelOffer[] {
  const iata = opts.destination_iata.toUpperCase()
  const info = CITY_NAMES[iata]
  if (!info) return []

  const checkin = opts.checkin || getDefaultCheckin()
  const checkout = opts.checkout || getDefaultCheckout(checkin)

  return [{
    id: `booking-${iata}-${checkin}`,
    city: info.en,
    city_iata: iata,
    country: info.country,
    country_code: info.country_code,
    checkin,
    checkout,
    adults: opts.adults ?? 2,
    image_url: CITY_IMAGES[iata] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    affiliate_url: buildBookingSearchUrl({
      city: info.en,
      checkin,
      checkout,
      adults: opts.adults ?? 2,
      sub_id: 'trips_hotel_banner',
    }),
    source: 'booking',
  }]
}

// Popular MENA destinations for the fallback (no search params set)
export function getPopularHotelOffers(): HotelOffer[] {
  const popular = ['DXB', 'IST', 'CAI', 'DOH', 'MCT']
  const checkin = getDefaultCheckin()
  const checkout = getDefaultCheckout(checkin)
  return popular.flatMap((iata) => getHotelOffers({ destination_iata: iata, checkin, checkout }))
}

function getDefaultCheckin(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

function getDefaultCheckout(checkin: string): string {
  const d = new Date(checkin)
  d.setDate(d.getDate() + 3)
  return d.toISOString().slice(0, 10)
}
