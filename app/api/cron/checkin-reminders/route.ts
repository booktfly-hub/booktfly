import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Dispatched by pg_cron every 15 min.
 * Sends check-in reminder emails for flights departing in ~24h (T-24) and ~3h (T-3).
 * Uses notifications table + Resend template (configured elsewhere).
 *
 * Auth: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const auth = request.headers.get('authorization') || ''
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const now = Date.now()

  const window = (targetMs: number, halfHours = 0.25) => {
    const target = now + targetMs * 60 * 60 * 1000
    return {
      from: new Date(target - halfHours * 60 * 60 * 1000).toISOString(),
      to: new Date(target + halfHours * 60 * 60 * 1000).toISOString(),
    }
  }

  const w24 = window(24)
  const w3 = window(3, 0.25)

  // 24h reminders
  const { data: candidates24 } = await supabaseAdmin
    .from('bookings')
    .select('id, buyer_id, passenger_email, trip:trips(origin_code, destination_code, departure_at, airline, flight_number)')
    .eq('status', 'confirmed')
    .is('checkin_reminder_24h_sent_at', null)

  const due24 = (candidates24 ?? []).filter((b) => {
    const dep = b.trip && !Array.isArray(b.trip) ? (b.trip as { departure_at?: string }).departure_at : undefined
    if (!dep) return false
    return dep >= w24.from && dep <= w24.to
  })

  for (const b of due24) {
    await supabaseAdmin.from('notifications').insert({
      user_id: b.buyer_id,
      type: 'checkin_reminder_24h',
      title_ar: 'موعد تسجيل الوصول يقترب',
      title_en: 'Online check-in opens soon',
      body_ar: 'تقلع رحلتك بعد 24 ساعة. تذكّر تسجيل الوصول مع شركة الطيران.',
      body_en: 'Your flight departs in 24 hours. Please check in online.',
      data: { booking_id: b.id },
    })
    await supabaseAdmin
      .from('bookings')
      .update({ checkin_reminder_24h_sent_at: new Date().toISOString() })
      .eq('id', b.id)
  }

  // 3h reminders
  const { data: candidates3 } = await supabaseAdmin
    .from('bookings')
    .select('id, buyer_id, passenger_email, trip:trips(departure_at)')
    .eq('status', 'confirmed')
    .is('checkin_reminder_3h_sent_at', null)

  const due3 = (candidates3 ?? []).filter((b) => {
    const dep = b.trip && !Array.isArray(b.trip) ? (b.trip as { departure_at?: string }).departure_at : undefined
    if (!dep) return false
    return dep >= w3.from && dep <= w3.to
  })

  for (const b of due3) {
    await supabaseAdmin.from('notifications').insert({
      user_id: b.buyer_id,
      type: 'checkin_reminder_3h',
      title_ar: 'حان موعد التوجه للمطار',
      title_en: 'Time to head to the airport',
      body_ar: 'تقلع رحلتك بعد 3 ساعات. نتمنى لك رحلة سعيدة.',
      body_en: 'Your flight departs in 3 hours. Safe travels!',
      data: { booking_id: b.id },
    })
    await supabaseAdmin
      .from('bookings')
      .update({ checkin_reminder_3h_sent_at: new Date().toISOString() })
      .eq('id', b.id)
  }

  return NextResponse.json({
    sent_24h: due24.length,
    sent_3h: due3.length,
  })
}

export async function GET() {
  return NextResponse.json({ error: 'use POST' }, { status: 405 })
}
