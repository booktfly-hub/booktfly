import { NextRequest, NextResponse } from 'next/server'
import { duffel } from '@/lib/duffel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Body {
  origin: string
  destination: string
  departure_date: string
  return_date?: string
  adults?: number
  children?: number
  infants?: number
  cabin_class?: 'economy' | 'premium_economy' | 'business' | 'first'
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const {
    origin,
    destination,
    departure_date,
    return_date,
    adults = 1,
    children = 0,
    infants = 0,
    cabin_class = 'economy',
  } = body

  if (!origin || !destination || !departure_date) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const slices: { origin: string; destination: string; departure_date: string }[] = [
    { origin, destination, departure_date },
  ]
  if (return_date) {
    slices.push({
      origin: destination,
      destination: origin,
      departure_date: return_date,
    })
  }

  const passengers: { type: 'adult' | 'child' | 'infant_without_seat' }[] = []
  for (let i = 0; i < adults; i++) passengers.push({ type: 'adult' })
  for (let i = 0; i < children; i++) passengers.push({ type: 'child' })
  for (let i = 0; i < infants; i++) passengers.push({ type: 'infant_without_seat' })

  try {
    const res = await duffel.offerRequests.create({
      slices,
      passengers,
      cabin_class,
      return_offers: true,
    } as any)

    const offers = ((res.data as any).offers || []).slice(0, 30).map((o: any) => ({
      id: o.id,
      total_amount: o.total_amount,
      total_currency: o.total_currency,
      tax_amount: o.tax_amount,
      owner: { name: o.owner?.name, iata_code: o.owner?.iata_code, logo: o.owner?.logo_symbol_url },
      slices: (o.slices || []).map((s: any) => ({
        origin: { iata_code: s.origin?.iata_code, city: s.origin?.city_name ?? s.origin?.name },
        destination: {
          iata_code: s.destination?.iata_code,
          city: s.destination?.city_name ?? s.destination?.name,
        },
        duration: s.duration,
        segments_count: s.segments?.length ?? 0,
        departing_at: s.segments?.[0]?.departing_at,
        arriving_at: s.segments?.[s.segments.length - 1]?.arriving_at,
      })),
    }))

    return NextResponse.json({
      offer_request_id: res.data.id,
      offers,
    })
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? err?.message ?? 'duffel_error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
