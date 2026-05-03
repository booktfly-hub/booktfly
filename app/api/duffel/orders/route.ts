import { NextRequest, NextResponse } from 'next/server'
import { duffel } from '@/lib/duffel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PassengerInput {
  id: string
  title: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr'
  given_name: string
  family_name: string
  born_on: string
  gender: 'm' | 'f'
  email: string
  phone_number: string
}

interface Body {
  offer_id: string
  passengers: PassengerInput[]
  total_amount: string
  total_currency: string
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { offer_id, passengers, total_amount, total_currency } = body
  if (!offer_id || !passengers?.length || !total_amount || !total_currency) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  try {
    const res = await duffel.orders.create({
      type: 'instant',
      selected_offers: [offer_id],
      passengers: passengers.map((p) => ({
        id: p.id,
        title: p.title,
        given_name: p.given_name,
        family_name: p.family_name,
        born_on: p.born_on,
        gender: p.gender,
        email: p.email,
        phone_number: p.phone_number,
      })) as any,
      payments: [
        {
          type: 'balance',
          amount: total_amount,
          currency: total_currency,
        },
      ],
    } as any)

    const o: any = res.data
    return NextResponse.json({
      order: {
        id: o.id,
        booking_reference: o.booking_reference,
        total_amount: o.total_amount,
        total_currency: o.total_currency,
        created_at: o.created_at,
      },
    })
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? err?.message ?? 'duffel_error'
    return NextResponse.json({ error: msg, raw: err?.errors }, { status: 500 })
  }
}
