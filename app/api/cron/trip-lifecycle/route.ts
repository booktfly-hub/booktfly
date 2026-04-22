import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import { supabaseAdmin } from '@/lib/supabase/admin'
import TripReminder from '@/emails/trip-reminder'
import TripDay from '@/emails/trip-day'
import TripReview from '@/emails/trip-review'
import SimilarTrips from '@/emails/similar-trips'

const resend = new Resend(process.env.RESEND_API_KEY)
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booktfly.com'
const FROM = 'BooktFly <noreply@booktfly.com>'

type TripRow = {
  origin_code: string | null
  destination_code: string | null
  origin_city_en: string | null
  origin_city_ar: string | null
  destination_city_en: string | null
  destination_city_ar: string | null
  departure_at: string
}

type BookingRow = {
  id: string
  buyer_id: string | null
  passenger_name: string | null
  passenger_email: string | null
  guest_token: string | null
  reference_code: string | null
  trip: TripRow | TripRow[] | null
}

function pickTrip(b: BookingRow): TripRow | null {
  if (!b.trip) return null
  return Array.isArray(b.trip) ? b.trip[0] ?? null : b.trip
}

function fmtRoute(trip: TripRow, locale: 'ar' | 'en') {
  const origin = locale === 'ar'
    ? trip.origin_city_ar || trip.origin_code || ''
    : trip.origin_city_en || trip.origin_code || ''
  const destination = locale === 'ar'
    ? trip.destination_city_ar || trip.destination_code || ''
    : trip.destination_city_en || trip.destination_code || ''
  return { origin, destination }
}

function fmtDate(iso: string, locale: 'ar' | 'en') {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function claimUrlFor(b: BookingRow, locale: 'ar' | 'en') {
  if (b.buyer_id || !b.guest_token) return undefined
  return `${baseUrl}/${locale}/claim/${b.guest_token}`
}

const SELECT = 'id, buyer_id, passenger_name, passenger_email, guest_token, reference_code, trip:trips(origin_code, destination_code, origin_city_en, origin_city_ar, destination_city_en, destination_city_ar, departure_at)'

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const auth = request.headers.get('authorization') || ''
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const now = Date.now()
  const locale: 'ar' | 'en' = 'ar'
  let sent7d = 0, sentDay = 0, sentReview = 0, sentSimilar = 0
  const errors: string[] = []

  // 7-day reminder window: departure in [6.75d, 7.25d]
  const w7 = {
    from: new Date(now + 6.75 * 24 * 3600 * 1000).toISOString(),
    to: new Date(now + 7.25 * 24 * 3600 * 1000).toISOString(),
  }
  const { data: c7 } = await supabaseAdmin
    .from('bookings')
    .select(SELECT)
    .eq('status', 'confirmed')
    .is('trip_reminder_7d_sent_at', null)
    .returns<BookingRow[]>()

  for (const b of (c7 ?? [])) {
    const trip = pickTrip(b)
    if (!trip || !b.passenger_email) continue
    if (trip.departure_at < w7.from || trip.departure_at > w7.to) continue
    try {
      const { origin, destination } = fmtRoute(trip, locale)
      const html = await render(TripReminder({
        passengerName: b.passenger_name || undefined,
        origin, destination,
        departureDate: fmtDate(trip.departure_at, locale),
        bookingRef: b.reference_code || b.id.slice(0, 8).toUpperCase(),
        locale,
        claimUrl: claimUrlFor(b, locale),
      }))
      await resend.emails.send({
        from: FROM,
        to: b.passenger_email,
        subject: locale === 'ar' ? `رحلتك إلى ${destination} بعد 7 أيام` : `Your trip to ${destination} is in 7 days`,
        html,
      })
      await supabaseAdmin.from('bookings').update({ trip_reminder_7d_sent_at: new Date().toISOString() }).eq('id', b.id)
      sent7d++
    } catch (e) { errors.push(`7d ${b.id}: ${String(e)}`) }
  }

  // Trip-day window: departure in [now - 2h, now + 10h]
  const wDay = {
    from: new Date(now - 2 * 3600 * 1000).toISOString(),
    to: new Date(now + 10 * 3600 * 1000).toISOString(),
  }
  const { data: cDay } = await supabaseAdmin
    .from('bookings')
    .select(SELECT)
    .eq('status', 'confirmed')
    .is('trip_day_sent_at', null)
    .returns<BookingRow[]>()

  for (const b of (cDay ?? [])) {
    const trip = pickTrip(b)
    if (!trip || !b.passenger_email) continue
    if (trip.departure_at < wDay.from || trip.departure_at > wDay.to) continue
    try {
      const { origin, destination } = fmtRoute(trip, locale)
      const html = await render(TripDay({
        passengerName: b.passenger_name || undefined,
        origin, destination,
        departureDate: fmtDate(trip.departure_at, locale),
        bookingRef: b.reference_code || b.id.slice(0, 8).toUpperCase(),
        locale,
      }))
      await resend.emails.send({
        from: FROM,
        to: b.passenger_email,
        subject: locale === 'ar' ? `رحلة سعيدة إلى ${destination} ✈️` : `Safe travels to ${destination} ✈️`,
        html,
      })
      await supabaseAdmin.from('bookings').update({ trip_day_sent_at: new Date().toISOString() }).eq('id', b.id)
      sentDay++
    } catch (e) { errors.push(`day ${b.id}: ${String(e)}`) }
  }

  // Review: 1 day after departure
  const wReviewFrom = new Date(now - 1.5 * 24 * 3600 * 1000).toISOString()
  const wReviewTo = new Date(now - 0.75 * 24 * 3600 * 1000).toISOString()
  const { data: cReview } = await supabaseAdmin
    .from('bookings')
    .select(SELECT)
    .eq('status', 'confirmed')
    .is('trip_review_sent_at', null)
    .returns<BookingRow[]>()

  for (const b of (cReview ?? [])) {
    const trip = pickTrip(b)
    if (!trip || !b.passenger_email) continue
    if (trip.departure_at < wReviewFrom || trip.departure_at > wReviewTo) continue
    try {
      const { origin, destination } = fmtRoute(trip, locale)
      const claimUrl = claimUrlFor(b, locale)
      const reviewUrl = b.buyer_id ? `${baseUrl}/${locale}/my-bookings?review=${b.id}` : undefined
      const html = await render(TripReview({
        passengerName: b.passenger_name || undefined,
        origin, destination,
        bookingRef: b.reference_code || b.id.slice(0, 8).toUpperCase(),
        locale,
        claimUrl,
        reviewUrl,
      }))
      await resend.emails.send({
        from: FROM,
        to: b.passenger_email,
        subject: locale === 'ar' ? `كيف كانت رحلتك إلى ${destination}؟` : `How was your trip to ${destination}?`,
        html,
      })
      await supabaseAdmin.from('bookings').update({ trip_review_sent_at: new Date().toISOString() }).eq('id', b.id)
      sentReview++
    } catch (e) { errors.push(`review ${b.id}: ${String(e)}`) }
  }

  // Similar trips: 3 days after departure
  const wSimFrom = new Date(now - 3.5 * 24 * 3600 * 1000).toISOString()
  const wSimTo = new Date(now - 2.75 * 24 * 3600 * 1000).toISOString()
  const { data: cSim } = await supabaseAdmin
    .from('bookings')
    .select(SELECT)
    .eq('status', 'confirmed')
    .is('similar_trips_sent_at', null)
    .returns<BookingRow[]>()

  for (const b of (cSim ?? [])) {
    const trip = pickTrip(b)
    if (!trip || !b.passenger_email) continue
    if (trip.departure_at < wSimFrom || trip.departure_at > wSimTo) continue
    try {
      const { destination } = fmtRoute(trip, locale)
      const { data: similar } = await supabaseAdmin
        .from('trips')
        .select('id, origin_city_en, origin_city_ar, destination_city_en, destination_city_ar, origin_code, destination_code, departure_at, price_per_seat')
        .eq('destination_code', trip.destination_code || '')
        .gt('departure_at', new Date(now + 24 * 3600 * 1000).toISOString())
        .eq('status', 'active')
        .order('departure_at', { ascending: true })
        .limit(4)

      const trips = (similar ?? []).map((s) => ({
        id: s.id as string,
        origin: (locale === 'ar' ? s.origin_city_ar : s.origin_city_en) || s.origin_code || '',
        destination: (locale === 'ar' ? s.destination_city_ar : s.destination_city_en) || s.destination_code || '',
        departureDate: fmtDate(s.departure_at as string, locale),
        price: Number(s.price_per_seat ?? 0),
      }))

      const html = await render(SimilarTrips({
        passengerName: b.passenger_name || undefined,
        destination,
        trips,
        locale,
        claimUrl: claimUrlFor(b, locale),
        appUrl: baseUrl,
      }))
      await resend.emails.send({
        from: FROM,
        to: b.passenger_email,
        subject: locale === 'ar' ? `رحلات مشابهة إلى ${destination}` : `More trips to ${destination}`,
        html,
      })
      await supabaseAdmin.from('bookings').update({ similar_trips_sent_at: new Date().toISOString() }).eq('id', b.id)
      sentSimilar++
    } catch (e) { errors.push(`similar ${b.id}: ${String(e)}`) }
  }

  return NextResponse.json({
    sent_7d: sent7d,
    sent_day: sentDay,
    sent_review: sentReview,
    sent_similar: sentSimilar,
    errors: errors.slice(0, 20),
  })
}

export async function GET() {
  return NextResponse.json({ error: 'use POST' }, { status: 405 })
}
