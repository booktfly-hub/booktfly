import 'server-only'

const API = 'https://api.travelpayouts.com'

const token = process.env.TRAVELPAYOUTS_TOKEN
const marker = process.env.TRAVELPAYOUTS_MARKER

if (!token) console.warn('[travelpayouts] TRAVELPAYOUTS_TOKEN is not set')
if (!marker) console.warn('[travelpayouts] TRAVELPAYOUTS_MARKER is not set')

export type CabinClass = 'Y' | 'C' // Y = economy, C = business

// Flight Data API — Cheap prices for direction (cached results from real searches)
// https://support.travelpayouts.com/hc/en-us/articles/115005967468
export interface CheapFlight {
  origin: string
  destination: string
  departure_at: string // ISO datetime
  return_at: string | null
  expires_at: string
  airline: string
  flight_number: string | number
  price: number
  transfers: number
  duration?: number // minutes (one-way)
  link?: string // partial path on aviasales.com
}

export async function getCheapFlights(opts: {
  origin: string
  destination: string
  departure_at?: string // YYYY-MM or YYYY-MM-DD
  return_at?: string
  currency?: string
  one_way?: boolean
  limit?: number
  sorting?: 'price' | 'route'
  unique?: boolean
  direct?: boolean
  market?: string
}): Promise<CheapFlight[]> {
  const params = new URLSearchParams()
  params.set('origin', opts.origin.toUpperCase())
  params.set('destination', opts.destination.toUpperCase())
  if (opts.departure_at) params.set('departure_at', opts.departure_at)
  if (opts.return_at) params.set('return_at', opts.return_at)
  params.set('currency', opts.currency || 'usd')
  params.set('one_way', String(opts.one_way ?? true))
  params.set('limit', String(opts.limit ?? 30))
  params.set('sorting', opts.sorting || 'price')
  // unique=false returns all variants (different airlines/transfer counts) instead of one per route
  params.set('unique', String(opts.unique ?? false))
  if (opts.direct) params.set('direct', 'true')
  params.set('market', opts.market || 'sa')
  params.set('token', token || '')

  const res = await fetch(
    `${API}/aviasales/v3/prices_for_dates?${params.toString()}`,
    { next: { revalidate: 300 } }
  )
  if (!res.ok) {
    return []
  }
  const json = await res.json()
  return (json?.data || []) as CheapFlight[]
}

// Cheapest fare per day across a given month.
// Uses grouped_prices with group_by=departure_at to get one row per day.
export async function getMonthCalendar(opts: {
  origin: string
  destination: string
  month: string // YYYY-MM
  currency?: string
  market?: string
}): Promise<Record<string, { price: number; link?: string; airline: string }>> {
  const params = new URLSearchParams()
  params.set('origin', opts.origin.toUpperCase())
  params.set('destination', opts.destination.toUpperCase())
  params.set('departure_at', opts.month)
  params.set('group_by', 'departure_at')
  params.set('currency', opts.currency || 'usd')
  params.set('market', opts.market || 'sa')
  params.set('token', token || '')

  const res = await fetch(
    `${API}/aviasales/v3/grouped_prices?${params.toString()}`,
    { next: { revalidate: 1800 } } // 30 min
  )
  if (!res.ok) return {}
  const json = await res.json()
  const data = (json?.data || {}) as Record<
    string,
    { price: number; airline: string; flight_number?: string | number; departure_at: string; transfers?: number }
  >
  const out: Record<string, { price: number; link?: string; airline: string }> = {}
  for (const [day, row] of Object.entries(data)) {
    if (!row || typeof row.price !== 'number') continue
    out[day] = { price: row.price, airline: row.airline }
  }
  return out
}

// Deep link to Aviasales search results page with the affiliate marker attached.
// Format: https://www.aviasales.com/search/{ORIGIN}{DDMM}{DESTINATION}{RDDMM?}{PAX}?marker={MARKER}
export function buildSearchDeepLink(opts: {
  origin: string
  destination: string
  departure_at: string // YYYY-MM-DD
  return_at?: string
  adults?: number
  children?: number
  infants?: number
  cabin_class?: CabinClass
  sub_id?: string
}): string {
  const fmtDDMM = (iso: string) => {
    const d = new Date(iso)
    const dd = String(d.getUTCDate()).padStart(2, '0')
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    return `${dd}${mm}`
  }
  const adults = opts.adults ?? 1
  const children = opts.children ?? 0
  const infants = opts.infants ?? 0
  const cabin = opts.cabin_class || 'Y'

  let path = `${opts.origin}${fmtDDMM(opts.departure_at)}${opts.destination}`
  if (opts.return_at) path += fmtDDMM(opts.return_at)
  path += `${adults}${children}${infants}${cabin}`

  const url = new URL(`https://www.aviasales.com/search/${path}`)
  if (marker) url.searchParams.set('marker', marker)
  if (opts.sub_id) url.searchParams.set('sub_id', opts.sub_id)
  return url.toString()
}

// Deep link to a specific flight offer using the partial 'link' returned by Flight Data API.
// Aviasales returns partial URLs (e.g. "/search/RUH15080DXB1?...") that need the host + marker.
export function buildOfferDeepLink(partialLink: string, sub_id?: string): string {
  if (!partialLink) return ''
  const base = partialLink.startsWith('http')
    ? partialLink
    : `https://www.aviasales.com${partialLink.startsWith('/') ? partialLink : '/' + partialLink}`
  const url = new URL(base)
  if (marker && !url.searchParams.has('marker')) url.searchParams.set('marker', marker)
  if (sub_id) url.searchParams.set('sub_id', sub_id)
  return url.toString()
}

// Airline name lookup (English only from this endpoint; AR fallback handled via airports-i18n).
const airlineCache = new Map<string, string>()
export async function getAirlineName(iataCode: string): Promise<string> {
  const code = iataCode.toUpperCase()
  if (airlineCache.has(code)) return airlineCache.get(code)!
  try {
    const res = await fetch(`https://api.travelpayouts.com/data/en/airlines.json`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return code
    const list = (await res.json()) as { code: string; name: string }[]
    list.forEach((a) => airlineCache.set(a.code, a.name))
    return airlineCache.get(code) || code
  } catch {
    return code
  }
}
