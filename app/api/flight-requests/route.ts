import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyAdmin } from '@/lib/notifications'
import { flightRequestSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = flightRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { data } = parsed

    const { data: flightRequest, error } = await supabaseAdmin
      .from('flight_requests')
      .insert({
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
      })
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
