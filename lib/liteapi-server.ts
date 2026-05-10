import 'server-only'

const KEY = process.env.LITEAPI_KEY
const BASE = 'https://api.liteapi.travel/v3.0'

if (!KEY) console.warn('[liteapi] LITEAPI_KEY is not set')

export interface LiteApiHotel {
  hotel_id: string
  name: string
  stars: number
  review_score: number | null // 0-10 user rating
  review_count: number | null
  photo: string | null
  thumbnail: string | null
  latitude: number | null
  longitude: number | null
  address: string
  city: string
  country: string
  chain: string | null
  price_total: number // total for the stay in `price_currency`
  price_currency: string
  offer_id: string | null
}

interface DataHotel {
  id: string
  name: string
  stars?: number
  rating?: number
  reviewCount?: number
  main_photo?: string
  thumbnail?: string
  latitude?: number
  longitude?: number
  address?: string
  city?: string
  country?: string
  chain?: string
}

interface RateRoomType {
  offerId?: string
  offerRetailRate?: { amount?: number | string; currency?: string }
  suggestedSellingPrice?: { amount?: number | string; currency?: string }
}

interface RateHotel {
  hotelId: string
  roomTypes?: RateRoomType[]
}

const cache = new Map<string, { at: number; rows: LiteApiHotel[] }>()
const TTL = 5 * 60 * 1000

async function liteApiFetch<T>(
  path: string,
  init: RequestInit & { revalidate?: number } = {},
): Promise<T | null> {
  if (!KEY) return null
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'X-API-Key': KEY,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      next: { revalidate: init.revalidate ?? 300 },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`[liteapi] ${path} ${res.status}: ${text.slice(0, 200)}`)
      return null
    }
    return (await res.json()) as T
  } catch (err) {
    console.error('[liteapi] fetch error:', err)
    return null
  }
}

async function listHotels(opts: {
  cityName: string
  countryCode: string
  limit: number
}): Promise<DataHotel[]> {
  const params = new URLSearchParams({
    cityName: opts.cityName,
    countryCode: opts.countryCode,
    limit: String(opts.limit),
  })
  const json = await liteApiFetch<{ data: DataHotel[] }>(`/data/hotels?${params}`)
  return json?.data ?? []
}

async function fetchRates(opts: {
  hotelIds: string[]
  checkin: string
  checkout: string
  adults: number
  currency: string
  guestNationality: string
}): Promise<Map<string, { total: number; currency: string; offerId: string | null }>> {
  const rates = new Map<string, { total: number; currency: string; offerId: string | null }>()
  if (opts.hotelIds.length === 0) return rates

  const json = await liteApiFetch<{ data: RateHotel[] }>('/hotels/rates', {
    method: 'POST',
    body: JSON.stringify({
      checkin: opts.checkin,
      checkout: opts.checkout,
      currency: opts.currency,
      guestNationality: opts.guestNationality,
      occupancies: [{ adults: opts.adults }],
      hotelIds: opts.hotelIds,
    }),
    revalidate: 300,
  })
  if (!json?.data) return rates

  for (const h of json.data) {
    const rooms = h.roomTypes ?? []
    let cheapest: { amount: number; currency: string; offerId: string | null } | null = null
    for (const rt of rooms) {
      const r = rt.offerRetailRate
      const amount = r ? parseFloat(String(r.amount ?? 0)) : 0
      if (!amount || amount <= 0) continue
      if (!cheapest || amount < cheapest.amount) {
        cheapest = { amount, currency: r?.currency || opts.currency, offerId: rt.offerId ?? null }
      }
    }
    if (cheapest) {
      rates.set(h.hotelId, {
        total: cheapest.amount,
        currency: cheapest.currency,
        offerId: cheapest.offerId,
      })
    }
  }
  return rates
}

/**
 * Search LiteAPI for real hotels in a city with live rates for the date range.
 * Returns one row per hotel that has at least one available rate.
 */
export async function searchLiteApi(opts: {
  cityName: string
  countryCode: string // ISO-3166 alpha-2 (e.g. "AE", "SA")
  checkin: string // YYYY-MM-DD
  checkout: string // YYYY-MM-DD
  adults?: number
  currency?: string
  guestNationality?: string
  limit?: number
  catalogLimit?: number
}): Promise<LiteApiHotel[]> {
  if (!KEY) return []
  const cityName = opts.cityName.trim()
  const countryCode = opts.countryCode.toUpperCase()
  const adults = Math.max(1, Math.min(8, opts.adults ?? 2))
  const currency = (opts.currency || 'USD').toUpperCase()
  const guestNationality = (opts.guestNationality || countryCode).toUpperCase()
  const limit = Math.max(1, Math.min(20, opts.limit ?? 12))
  const catalogLimit = Math.max(limit, opts.catalogLimit ?? 24)

  const cacheKey = `${cityName}|${countryCode}|${opts.checkin}|${opts.checkout}|${adults}|${currency}|${limit}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < TTL) return hit.rows

  const directory = await listHotels({ cityName, countryCode, limit: catalogLimit })
  if (directory.length === 0) return []

  const hotelIds = directory.map((h) => h.id)
  const rates = await fetchRates({
    hotelIds,
    checkin: opts.checkin,
    checkout: opts.checkout,
    adults,
    currency,
    guestNationality,
  })

  const rows: LiteApiHotel[] = []
  for (const h of directory) {
    const rate = rates.get(h.id)
    if (!rate) continue
    rows.push({
      hotel_id: h.id,
      name: h.name,
      stars: Math.max(0, Math.min(5, Math.round(h.stars ?? 0))),
      review_score: typeof h.rating === 'number' ? h.rating : null,
      review_count: typeof h.reviewCount === 'number' ? h.reviewCount : null,
      photo: h.main_photo || null,
      thumbnail: h.thumbnail || null,
      latitude: typeof h.latitude === 'number' ? h.latitude : null,
      longitude: typeof h.longitude === 'number' ? h.longitude : null,
      address: h.address || '',
      city: h.city || cityName,
      country: h.country || countryCode,
      chain: h.chain || null,
      price_total: rate.total,
      price_currency: rate.currency,
      offer_id: rate.offerId,
    })
    if (rows.length >= limit) break
  }

  cache.set(cacheKey, { at: Date.now(), rows })
  return rows
}
