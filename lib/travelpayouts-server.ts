import 'server-only'
import {
  getCheapFlights,
  getMonthCalendar,
  buildOfferDeepLink,
  buildSearchDeepLink,
  getAirlineName,
} from './travelpayouts'

const calendarCache = new Map<string, { at: number; data: Record<string, { price: number; affiliate_url: string }> }>()
const CALENDAR_TTL = 30 * 60 * 1000

export async function fetchMonthCalendar(opts: {
  origin: string
  destination: string
  month: string // YYYY-MM
  currency?: string
}): Promise<Record<string, { price: number; affiliate_url: string }>> {
  const origin = opts.origin?.trim().toUpperCase()
  const destination = opts.destination?.trim().toUpperCase()
  if (!origin || !destination) return {}
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) return {}

  const key = `${origin}-${destination}-${opts.month}-${opts.currency ?? 'usd'}`
  const hit = calendarCache.get(key)
  if (hit && Date.now() - hit.at < CALENDAR_TTL) return hit.data

  const raw = await getMonthCalendar({
    origin,
    destination,
    month: opts.month,
    currency: opts.currency || 'usd',
  })

  const out: Record<string, { price: number; affiliate_url: string }> = {}
  for (const [day, info] of Object.entries(raw)) {
    out[day] = {
      price: info.price,
      affiliate_url: info.link
        ? buildOfferDeepLink(info.link, 'price_strip')
        : buildSearchDeepLink({
            origin,
            destination,
            departure_at: day,
            adults: 1,
            sub_id: 'price_strip',
          }),
    }
  }

  calendarCache.set(key, { at: Date.now(), data: out })
  return out
}

export interface LiveOffer {
  id: string
  origin_iata: string
  destination_iata: string
  origin_city: string // localized later via airports-i18n
  destination_city: string
  departing_at: string
  arriving_at: string | null
  price_amount: number
  price_currency: string
  airline_iata: string
  airline_name: string
  flight_number: string
  transfers: number
  duration_minutes: number | null
  affiliate_url: string
  source?: 'travelpayouts' | 'duffel'
}

const ttl = 60_000
const cache = new Map<string, { at: number; offers: LiveOffer[] }>()

export async function fetchLiveFlights(opts: {
  origin: string // IATA
  destination: string // IATA
  departure_date?: string // YYYY-MM-DD
  return_date?: string
  currency?: string
  limit?: number
}): Promise<LiveOffer[]> {
  const origin = opts.origin?.trim().toUpperCase()
  const destination = opts.destination?.trim().toUpperCase()
  if (!origin || !destination) return []
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) return []

  const cacheKey = `${origin}-${destination}-${opts.departure_date ?? ''}-${opts.return_date ?? ''}-${opts.currency ?? 'usd'}-${opts.limit ?? 30}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < ttl) return hit.offers

  const raw = await getCheapFlights({
    origin,
    destination,
    departure_at: opts.departure_date,
    return_at: opts.return_date,
    currency: opts.currency || 'usd',
    one_way: !opts.return_date,
    limit: opts.limit ?? 30,
    sorting: 'price',
    unique: false,
  })

  // De-duplicate near-identical offers (same airline + flight number + date + price)
  const seen = new Set<string>()
  const deduped = raw.filter((r) => {
    const k = `${r.airline}-${r.flight_number}-${r.departure_at?.slice(0, 10)}-${r.price}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  // Resolve airline names in parallel
  const airlineCodes = Array.from(new Set(deduped.map((r) => r.airline)))
  const airlineNames = new Map<string, string>()
  await Promise.all(
    airlineCodes.map(async (code) => {
      airlineNames.set(code, await getAirlineName(code))
    })
  )

  const offers: LiveOffer[] = deduped.map((r, i) => ({
    id: `${r.origin}-${r.destination}-${r.departure_at}-${r.airline}-${r.flight_number}-${i}`,
    origin_iata: r.origin,
    destination_iata: r.destination,
    origin_city: r.origin,
    destination_city: r.destination,
    departing_at: r.departure_at,
    arriving_at: r.return_at,
    price_amount: r.price,
    price_currency: (opts.currency || 'usd').toUpperCase(),
    airline_iata: r.airline,
    airline_name: airlineNames.get(r.airline) || r.airline,
    flight_number: `${r.airline}${r.flight_number}`,
    transfers: r.transfers ?? 0,
    duration_minutes: r.duration ?? null,
    affiliate_url: r.link
      ? buildOfferDeepLink(r.link, 'trips_grid')
      : buildSearchDeepLink({
          origin: r.origin,
          destination: r.destination,
          departure_at: r.departure_at.slice(0, 10),
          return_at: r.return_at?.slice(0, 10),
          adults: 1,
          sub_id: 'trips_grid',
        }),
    source: 'travelpayouts',
  }))

  cache.set(cacheKey, { at: Date.now(), offers })
  return offers
}

// Resolve a city/airport name string -> IATA code via Travelpayouts autocomplete.
const placeCache = new Map<string, { at: number; iata: string | null }>()
export async function resolveIata(query: string): Promise<string | null> {
  const q = query?.trim()
  if (!q) return null
  if (/^[A-Za-z]{3}$/.test(q)) return q.toUpperCase()
  const key = q.toLowerCase()
  const hit = placeCache.get(key)
  if (hit && Date.now() - hit.at < 86_400_000) return hit.iata
  try {
    const res = await fetch(
      `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(q)}&locale=en&types[]=city&types[]=airport`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) {
      placeCache.set(key, { at: Date.now(), iata: null })
      return null
    }
    const list = (await res.json()) as Array<{ code: string; type: string }>
    const first = list.find((p) => p.type === 'city') || list[0]
    const iata = first?.code?.toUpperCase() ?? null
    placeCache.set(key, { at: Date.now(), iata })
    return iata
  } catch {
    return null
  }
}

export async function fetchLiveFlightsByName(opts: {
  origin: string
  destination: string
  departure_date?: string
  return_date?: string
  currency?: string
  limit?: number
}): Promise<LiveOffer[]> {
  const [originIata, destIata] = await Promise.all([
    resolveIata(opts.origin),
    resolveIata(opts.destination),
  ])
  if (!originIata || !destIata) return []
  return fetchLiveFlights({ ...opts, origin: originIata, destination: destIata })
}
