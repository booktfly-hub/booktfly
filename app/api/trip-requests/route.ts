import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyAdmin } from '@/lib/notifications'
import { flightRequestSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { limit: 10, windowMs: 60_000 })
    if (limited) return limited

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name, email, phone')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = flightRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { data } = parsed

    const isMarketeer = profile.role === 'marketeer'

    const insertData: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      origin: data.origin,
      destination: data.destination,
      departure_date: data.departure_date,
      return_date: data.return_date || null,
      seats_needed: data.seats_needed,
      cabin_class: data.cabin_class,
      budget_max: data.budget_max || null,
      notes: data.notes || null,
      status: 'pending',
    }

    if (isMarketeer) {
      insertData.marketeer_id = user.id
    } else {
      insertData.user_id = user.id
    }

    const { data: flightRequest, error } = await supabaseAdmin
      .from('flight_requests')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    await notifyAdmin({
      type: 'new_flight_request',
      titleAr: 'طلب رحلة جديد',
      titleEn: 'New Flight Request',
      bodyAr: `${data.name} يبحث عن رحلة من ${data.origin} إلى ${data.destination}`,
      bodyEn: `${data.name} is looking for a flight from ${data.origin} to ${data.destination}`,
      data: { flight_request_id: flightRequest.id },
    })

    return NextResponse.json({ success: true, id: flightRequest.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
