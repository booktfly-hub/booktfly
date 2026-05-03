import { NextRequest, NextResponse } from 'next/server'
import { duffel } from '@/lib/duffel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  try {
    const res = await duffel.offers.get(id, { return_available_services: false })
    const o: any = res.data
    return NextResponse.json({
      offer: {
        id: o.id,
        total_amount: o.total_amount,
        total_currency: o.total_currency,
        tax_amount: o.tax_amount,
        expires_at: o.expires_at,
        owner: {
          name: o.owner?.name,
          iata_code: o.owner?.iata_code,
          logo: o.owner?.logo_symbol_url,
        },
        passengers: (o.passengers || []).map((p: any) => ({ id: p.id, type: p.type })),
        slices: (o.slices || []).map((s: any) => ({
          origin: { iata_code: s.origin?.iata_code, city: s.origin?.city_name ?? s.origin?.name },
          destination: {
            iata_code: s.destination?.iata_code,
            city: s.destination?.city_name ?? s.destination?.name,
          },
          duration: s.duration,
          departing_at: s.segments?.[0]?.departing_at,
          arriving_at: s.segments?.[s.segments.length - 1]?.arriving_at,
          segments: (s.segments || []).map((seg: any) => ({
            origin: seg.origin?.iata_code,
            destination: seg.destination?.iata_code,
            departing_at: seg.departing_at,
            arriving_at: seg.arriving_at,
            marketing_carrier: seg.marketing_carrier?.name,
            flight_number: `${seg.marketing_carrier?.iata_code ?? ''}${seg.marketing_carrier_flight_number ?? ''}`,
          })),
        })),
      },
    })
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? err?.message ?? 'duffel_error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
