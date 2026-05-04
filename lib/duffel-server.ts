import 'server-only'
import { Duffel } from '@duffel/api'
import type { LiveOffer } from './travelpayouts-server'

const token = process.env.DUFFEL_ACCESS_TOKEN

let _client: Duffel | null = null
function getClient(): Duffel | null {
  if (!token) return null
  if (!_client) _client = new Duffel({ token })
  return _client
}

/** Parse ISO 8601 duration to minutes — e.g. "PT2H30M" → 150 */
function parseDuration(dur: string | null): number | null {
  if (!dur) return null
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return null
  return (parseInt(m[1] || '0') * 60) + parseInt(m[2] || '0')
}

/** Next calendar date N days from now as YYYY-MM-DD */
function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const offerCache = new Map<string, { at: number; offers: LiveOffer[] }>()
const OFFER_TTL = 5 * 60 * 1000 // 5 min

/**
 * Search Duffel for cheapest offers on a route.
 * Returns results normalised to the same LiveOffer shape used by Travelpayouts.
 */
export async function searchDuffelFlights(opts: {
  origin: string
  destination: string
  departure_date?: string // YYYY-MM-DD; defaults to 7 days from now
  cabin_class?: 'economy' | 'premium_economy' | 'business' | 'first'
  limit?: number
}): Promise<LiveOffer[]> {
  const client = getClient()
  if (!client) return []

  const origin = opts.origin.trim().toUpperCase()
  const destination = opts.destination.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) return []

  const dateStr = opts.departure_date || daysFromNow(7)
  const cabin = opts.cabin_class ?? 'economy'
  const cacheKey = `${origin}-${destination}-${dateStr}-${cabin}`
  const hit = offerCache.get(cacheKey)
  if (hit && Date.now() - hit.at < OFFER_TTL) return hit.offers

  try {
    const result = await client.offerRequests.create({
      slices: [{ origin, destination, departure_date: dateStr }],
      passengers: [{ type: 'adult' }],
      cabin_class: cabin as never,
      return_offers: true,
    } as never)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawOffers: any[] = (result.data as any).offers ?? []
    const limit = opts.limit ?? 10

    const offers: LiveOffer[] = rawOffers.slice(0, limit).map((o, i) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const slice: any = o.slices?.[0]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const segs: any[] = slice?.segments ?? []
      const firstSeg = segs[0]
      const lastSeg = segs[segs.length - 1] ?? firstSeg
      const transfers = Math.max(0, segs.length - 1)

      const originIata: string = firstSeg?.origin?.iata_code ?? origin
      const destIata: string = lastSeg?.destination?.iata_code ?? destination
      const departingAt: string = firstSeg?.departing_at ?? dateStr + 'T00:00:00'
      const arrivingAt: string | null = lastSeg?.arriving_at ?? null
      const durationMin = parseDuration(slice?.duration ?? null)

      const airline = o.owner ?? firstSeg?.marketing_carrier ?? {}
      const marketingCode: string = firstSeg?.marketing_carrier?.iata_code ?? airline?.iata_code ?? ''
      const flightNumber = `${marketingCode}${firstSeg?.marketing_carrier_flight_number ?? ''}`

      const sessionUrl = `/api/duffel/session?origin=${origin}&destination=${destination}&date=${dateStr}`

      return {
        id: `duffel-${o.id ?? i}`,
        origin_iata: originIata,
        destination_iata: destIata,
        origin_city: slice?.origin?.city_name || originIata,
        destination_city: slice?.destination?.city_name || destIata,
        departing_at: departingAt,
        arriving_at: arrivingAt,
        price_amount: parseFloat(o.total_amount),
        price_currency: o.total_currency ?? 'USD',
        airline_iata: airline?.iata_code ?? marketingCode,
        airline_name: airline?.name ?? marketingCode,
        flight_number: flightNumber,
        transfers,
        duration_minutes: durationMin,
        affiliate_url: sessionUrl,
        source: 'duffel' as const,
      } satisfies LiveOffer
    })

    offerCache.set(cacheKey, { at: Date.now(), offers })
    return offers
  } catch (err) {
    console.error('[duffel] offer search failed:', err)
    return []
  }
}

/**
 * Create a Duffel Links hosted-checkout session.
 * Returns the session URL to redirect the user to, or null on failure.
 */
export async function createDuffelSession(opts: {
  origin?: string
  destination?: string
  date?: string
  reference?: string
}): Promise<string | null> {
  const client = getClient()
  if (!client) return null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const ref = opts.reference ?? `${opts.origin ?? ''}-${opts.destination ?? ''}-${Date.now()}`

  try {
    const session = await (client as never as {
      links: { sessions: { create: (p: unknown) => Promise<{ data: { url: string } }> } }
    }).links.sessions.create({
      reference: ref,
      success_url: `${appUrl}/trips?booked=1`,
      failure_url: `${appUrl}/trips`,
      abandonment_url: `${appUrl}/trips`,
      logo_url: `${appUrl}/logo.png`,
    })
    return session.data.url
  } catch (err) {
    console.error('[duffel] session creation failed:', err)
    return null
  }
}
