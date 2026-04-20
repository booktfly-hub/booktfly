import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Create a 48h price freeze. Fee defaults to 3 % of frozen_price, min 25.
 * For simplicity this does NOT charge — it records the intent.
 * The real payment hook lives on the checkout side (reuse dummy-payment route).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json()
  const {
    trip_id, room_id, car_id, package_id,
    frozen_price, currency = 'SAR', guest_email,
  } = body

  if (!frozen_price || frozen_price <= 0) {
    return NextResponse.json({ error: 'frozen_price required' }, { status: 400 })
  }
  if (!trip_id && !room_id && !car_id && !package_id) {
    return NextResponse.json({ error: 'an item id is required' }, { status: 400 })
  }

  const fee = Math.max(25, Math.round(frozen_price * 0.03))
  const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('price_freezes')
    .insert({
      user_id: user?.id ?? null,
      guest_email: guest_email ?? null,
      trip_id: trip_id ?? null,
      room_id: room_id ?? null,
      car_id: car_id ?? null,
      package_id: package_id ?? null,
      frozen_price,
      currency,
      fee_paid: fee,
      expires_at,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ freeze: data, fee })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ freezes: [] })

  const { data } = await supabase
    .from('price_freezes')
    .select('*')
    .eq('user_id', user.id)
    .is('consumed_at', null)
    .is('refunded_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })

  return NextResponse.json({ freezes: data ?? [] })
}
