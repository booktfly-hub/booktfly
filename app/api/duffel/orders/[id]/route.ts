import { NextRequest, NextResponse } from 'next/server'
import { duffel } from '@/lib/duffel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const res = await duffel.orders.get(id)
    const o: any = res.data
    return NextResponse.json({
      order: {
        id: o.id,
        booking_reference: o.booking_reference,
        total_amount: o.total_amount,
        total_currency: o.total_currency,
        created_at: o.created_at,
        owner: { name: o.owner?.name, iata_code: o.owner?.iata_code, logo: o.owner?.logo_symbol_url },
        passengers: (o.passengers || []).map((p: any) => ({
          given_name: p.given_name,
          family_name: p.family_name,
          email: p.email,
          type: p.type,
        })),
        slices: (o.slices || []).map((s: any) => ({
          origin: s.origin?.iata_code,
          destination: s.destination?.iata_code,
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
