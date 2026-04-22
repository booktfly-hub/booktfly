import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'
import { logActivity } from '@/lib/activity-log'
import { shortId } from '@/lib/utils'
import { rateLimit } from '@/lib/rate-limit'
import { handleBookingConfirmedRewards } from '@/lib/points'
import { render } from '@react-email/components'
import PaymentReceipt from '@/emails/payment-receipt'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = rateLimit(request, { limit: 5, windowMs: 60_000 })
    if (limited) return limited

    const { id } = await params
    const { method = 'mada' } = await request.json().catch(() => ({}))
    if (method !== 'mada' && method !== 'apple_pay') {
      return NextResponse.json({ error: 'invalid method' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: booking } = await supabaseAdmin
      .from('car_bookings')
      .select('*, car:cars(brand_ar, brand_en, model_ar, model_en, city_ar, city_en), provider:providers(user_id)')
      .eq('id', id)
      .single()

    if (!booking) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (booking.buyer_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    if (booking.status !== 'payment_processing') {
      return NextResponse.json({ error: 'already processed' }, { status: 400 })
    }

    const ref = shortId(id)
    const carInfo = booking.car as { brand_ar?: string; brand_en?: string; model_ar?: string; model_en?: string; city_ar?: string; city_en?: string } | null

    await supabaseAdmin
      .from('car_bookings')
      .update({
        status: 'confirmed',
        paid_at: new Date().toISOString(),
        payment_reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    await supabaseAdmin.rpc('credit_wallet', {
      p_provider_id: booking.provider_id,
      p_amount: booking.provider_payout,
      p_booking_id: id,
      p_desc_ar: `إيراد حجز سيارة رقم ${ref}`,
      p_desc_en: `Revenue from car booking #${ref}`,
    })

    await notify({
      userId: booking.buyer_id,
      type: 'car_booking_confirmed',
      titleAr: 'تم تأكيد الدفع وتأكيد حجزك',
      titleEn: 'Payment confirmed, car booking confirmed',
      bodyAr: `تم تأكيد حجز السيارة رقم ${ref}`,
      bodyEn: `Your car booking #${ref} has been confirmed.`,
      data: { car_booking_id: id },
    })

    const providerUserId = (booking.provider as { user_id?: string } | null)?.user_id
    if (providerUserId) {
      await notify({
        userId: providerUserId,
        type: 'new_car_booking',
        titleAr: 'لديك حجز سيارة جديد مؤكد',
        titleEn: 'You have a new confirmed car booking',
        bodyAr: `حجز سيارة جديد رقم ${ref} - ${booking.number_of_days} أيام`,
        bodyEn: `New car booking #${ref} - ${booking.number_of_days} day(s)`,
        data: { car_booking_id: id },
      })
    }

    logActivity('car_booking_confirmed', { userId: booking.buyer_id, metadata: { bookingId: id, method } })
    logActivity('payment_received', { metadata: { bookingId: id, amount: booking.total_amount, method, kind: 'car' } })

    after(async () => {
      try {
        const carName = `${carInfo?.brand_en || carInfo?.brand_ar || ''} ${carInfo?.model_en || carInfo?.model_ar || ''}`.trim()
        const carCity = carInfo?.city_en || carInfo?.city_ar || ''
        const receiptHtml = await render(PaymentReceipt({
          bookingRef: ref,
          type: 'car',
          origin: carName,
          destination: carCity,
          departureDate: booking.pickup_date || '',
          carBrand: carName,
          days: booking.number_of_days,
          totalAmount: booking.total_amount,
          commissionFree: booking.total_amount,
          passengerName: booking.guest_name || 'Guest',
          locale: 'en',
        }))
        await notify({
          userId: booking.buyer_id,
          type: 'car_booking_confirmed',
          titleAr: 'إيصال الدفع',
          titleEn: 'Payment Receipt',
          bodyAr: `إيصال الدفع لحجز السيارة رقم ${ref}`,
          bodyEn: `Payment receipt for car booking #${ref}`,
          data: { car_booking_id: id },
          email: { subject: `Payment Receipt - ${ref}`, html: receiptHtml },
        })
        await handleBookingConfirmedRewards({
          buyerId: booking.buyer_id,
          bookingId: id,
          totalAmount: booking.total_amount,
          type: 'car',
          refLabel: `#${ref}`,
        })
      } catch (err) {
        console.error('car dummy-pay rewards error:', err)
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('car dummy-pay error:', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
