import 'server-only'
import { duffel } from './duffel'

export interface LiveOffer {
  id: string
  total_amount: string
  total_currency: string
  airline: { name: string; iata_code: string; logo: string | null }
  origin_iata: string
  destination_iata: string
  origin_city: string
  destination_city: string
  departing_at: string
  arriving_at: string
  duration: string
  segments_count: number
}

const ttl = 60_000
const cache = new Map<string, { at: number; iata: string | null }>()
const offersCache = new Map<string, { at: number; offers: LiveOffer[] }>()

async function resolveIata(query: string): Promise<string | null> {
  const q = query.trim()
  if (!q) return null
  if (/^[A-Z]{3}$/.test(q)) return q
  const key = q.toLowerCase()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < ttl) return hit.iata
  try {
    const res: any = await duffel.suggestions.list({ query: q })
    const first = (res.data || []).find((p: any) => p.iata_code) || (res.data || [])[0]
    const iata = first?.iata_code || first?.iata_city_code || null
    cache.set(key, { at: Date.now(), iata })
    return iata
  } catch {
    return null
  }
}

export async function fetchLiveFlights(opts: {
  origin: string
  destination: string
  departure_date: string
  return_date?: string
  cabin_class?: 'economy' | 'premium_economy' | 'business' | 'first'
  adults?: number
}): Promise<LiveOffer[]> {
  const { origin, destination, departure_date, return_date, cabin_class = 'economy', adults = 1 } = opts
  if (!origin || !destination || !departure_date) return []

  const [originIata, destIata] = await Promise.all([resolveIata(origin), resolveIata(destination)])
  if (!originIata || !destIata) return []

  const cacheKey = `${originIata}-${destIata}-${departure_date}-${return_date ?? ''}-${cabin_class}-${adults}`
  const cached = offersCache.get(cacheKey)
  if (cached && Date.now() - cached.at < ttl) return cached.offers

  const slices: any[] = [{ origin: originIata, destination: destIata, departure_date }]
  if (return_date) slices.push({ origin: destIata, destination: originIata, departure_date: return_date })

  const passengers: any[] = []
  for (let i = 0; i < adults; i++) passengers.push({ type: 'adult' })

  try {
    const res: any = await duffel.offerRequests.create({
      slices,
      passengers,
      cabin_class,
      return_offers: true,
    } as any)
    const offers: LiveOffer[] = (res.data.offers || []).slice(0, 6).map((o: any) => {
      const s0 = o.slices?.[0]
      return {
        id: o.id,
        total_amount: o.total_amount,
        total_currency: o.total_currency,
        airline: {
          name: o.owner?.name,
          iata_code: o.owner?.iata_code,
          logo: o.owner?.logo_symbol_url,
        },
        origin_iata: s0?.origin?.iata_code,
        destination_iata: s0?.destination?.iata_code,
        origin_city: s0?.origin?.city_name ?? s0?.origin?.name,
        destination_city: s0?.destination?.city_name ?? s0?.destination?.name,
        departing_at: s0?.segments?.[0]?.departing_at,
        arriving_at: s0?.segments?.[s0.segments.length - 1]?.arriving_at,
        duration: s0?.duration,
        segments_count: s0?.segments?.length ?? 0,
      }
    })
    offersCache.set(cacheKey, { at: Date.now(), offers })
    return offers
  } catch {
    return []
  }
}
