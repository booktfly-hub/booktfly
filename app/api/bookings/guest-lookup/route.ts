import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Guest booking lookup by email + reference code.
 * Returns the guest_token (or a short-lived lookup token) so the browser
 * can redirect the user into the existing /guest/booking/[token] flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = (searchParams.get('email') || '').trim().toLowerCase()
  const reference = (searchParams.get('reference') || '').trim().toUpperCase()

  if (!email || !reference) {
    return NextResponse.json({ error: 'email and reference are required' }, { status: 400 })
  }

  // Search across all 4 booking tables in parallel
  const tables: Array<{ name: string; kind: string }> = [
    { name: 'bookings', kind: 'trip' },
    { name: 'room_bookings', kind: 'room' },
    { name: 'car_bookings', kind: 'car' },
    { name: 'package_bookings', kind: 'package' },
  ]

  const queries = tables.map(async ({ name, kind }) => {
    const { data } = await supabaseAdmin
      .from(name)
      .select('id, guest_token, passenger_email, guest_email, reference_code')
      .eq('reference_code', reference)
      .limit(1)
      .maybeSingle()
    if (!data) return null
    const storedEmail = (data.passenger_email || data.guest_email || '').toLowerCase()
    if (storedEmail !== email) return null
    return { kind, id: data.id, token: data.guest_token, reference: data.reference_code }
  })

  const results = await Promise.all(queries)
  const match = results.find(Boolean)

  if (!match) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json(match)
}
