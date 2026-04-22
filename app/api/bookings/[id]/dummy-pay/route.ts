import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'
import { logActivity } from '@/lib/activity-log'
import { shortId } from '@/lib/utils'
import { rateLimit } from '@/lib/rate-limit'
import { handleBookingConfirmedRewards, handleMarkeeteerDirectBookingRewards } from '@/lib/points'
import { render } from '@react-email/components'
import PaymentReceipt from '@/emails/payment-receipt'

/**
 * Dummy payment gateway — Mada / Apple Pay stubs.
 * Auto-confirms booking (no real charge). Product decision: no real gateway.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = rateLimit(request, { limit: 5, windowMs: 60_000 })
    if (limited) return limited

    const { id } = await params
    const { method = 'mada', guest_token } = await request.json().catch(() => ({}))
    if (method !== 'mada' && method !== 'apple_pay') {
      return NextResponse.json({ error: 'invalid method' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*, trip:trips(origin_city_ar, origin_city_en, destination_city_ar, destination_city_en, airline, departure_at), provider:providers(user_id)')
      .eq('id', id)
      .single()

    if (!booking) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const isOwner = booking.buyer_id && user?.id === booking.buyer_id
    const isGuestMatch = !booking.buyer_id && guest_token && booking.guest_token === guest_token
    if (!isOwner && !isGuestMatch) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    if (booking.status !== 'payment_processing') {
      return NextResponse.json({ error: 'already processed' }, { status: 400 })
    }

    const ref = shortId(id)
    const tripInfo = booking.trip as { origin_city_ar?: string; origin_city_en?: string; destination_city_ar?: string; destination_city_en?: string; airline?: string; departure_at?: string }

    await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
        paid_at: new Date().toISOString(),
        payment_reviewed_at: new Date().toISOString(),
        moyasar_payment_id: `DUMMY-${method.toUpperCase()}-${Date.now()}`,
      })
      .eq('id', id)

    await supabaseAdmin.rpc('credit_wallet', {
      p_provider_id: booking.provider_id,
      p_amount: booking.provider_payout,
      p_booking_id: id,
      p_desc_ar: `إيراد حجز رقم ${ref}`,
      p_desc_en: `Revenue from booking #${ref}`,
    })

    if (booking.buyer_id) {
      await notify({
        userId: booking.buyer_id,
        type: 'payment_approved',
        titleAr: 'تم تأكيد الدفع وتأكيد حجزك',
        titleEn: 'Payment confirmed, booking confirmed',
        bodyAr: `تم تأكيد حجزك رقم ${ref}`,
        bodyEn: `Your booking #${ref} has been confirmed.`,
        data: { booking_id: id },
      })
    }

    const providerUserId = (booking.provider as { user_id?: string })?.user_id
    if (providerUserId) {
      await notify({
        userId: providerUserId,
        type: 'new_booking',
        titleAr: 'لديك حجز جديد مؤكد',
        titleEn: 'You have a new confirmed booking',
        bodyAr: `حجز جديد رقم ${ref} - ${booking.seats_count} مقاعد`,
        bodyEn: `New booking #${ref} - ${booking.seats_count} seat(s)`,
        data: { booking_id: id },
      })
    }

    logActivity('booking_confirmed', { userId: booking.buyer_id, metadata: { bookingId: id, method } })
    logActivity('payment_received', { metadata: { bookingId: id, amount: booking.total_amount, method } })

    after(async () => {
      try {
        if (booking.buyer_id) {
          const receiptHtml = await render(PaymentReceipt({
            bookingRef: ref,
            type: 'flight',
            origin: tripInfo?.origin_city_en || tripInfo?.origin_city_ar || '',
            destination: tripInfo?.destination_city_en || tripInfo?.destination_city_ar || '',
            departureDate: tripInfo?.departure_at ? new Date(tripInfo.departure_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            airline: tripInfo?.airline,
            seats: booking.seats_count,
            totalAmount: booking.total_amount,
            commissionFree: booking.total_amount,
            passengerName: booking.passenger_name || 'Guest',
            locale: 'en',
          }))
          await notify({
            userId: booking.buyer_id,
            type: 'payment_approved',
            titleAr: 'إيصال الدفع',
            titleEn: 'Payment Receipt',
            bodyAr: `إيصال الدفع لحجزك رقم ${ref}`,
            bodyEn: `Payment receipt for your booking #${ref}`,
            data: { booking_id: id },
            email: { subject: `Payment Receipt - ${ref}`, html: receiptHtml },
          })
          await handleBookingConfirmedRewards({
            buyerId: booking.buyer_id,
            bookingId: id,
            totalAmount: booking.total_amount,
            type: 'flight',
            refLabel: `#${ref}`,
          })
        }
        if (booking.booked_by_marketeer_id) {
          await handleMarkeeteerDirectBookingRewards({
            marketeerDbId: booking.booked_by_marketeer_id,
            bookingId: id,
            totalAmount: booking.total_amount,
            passengerName: booking.passenger_name,
            type: 'flight',
            refLabel: `#${ref}`,
          })
        }
      } catch (err) {
        console.error('dummy-pay rewards error:', err)
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('dummy-pay error:', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
