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
      .from('room_bookings')
      .select('*, room:rooms(name_ar, name_en, city_ar, city_en), provider:providers(user_id)')
      .eq('id', id)
      .single()

    if (!booking) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (booking.buyer_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    if (booking.status !== 'payment_processing') {
      return NextResponse.json({ error: 'already processed' }, { status: 400 })
    }

    const ref = shortId(id)
    const roomInfo = booking.room as { name_ar?: string; name_en?: string; city_ar?: string; city_en?: string } | null

    await supabaseAdmin
      .from('room_bookings')
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
      p_desc_ar: `إيراد حجز غرفة رقم ${ref}`,
      p_desc_en: `Revenue from room booking #${ref}`,
    })

    await notify({
      userId: booking.buyer_id,
      type: 'room_booking_confirmed',
      titleAr: 'تم تأكيد الدفع وتأكيد حجزك',
      titleEn: 'Payment confirmed, room booking confirmed',
      bodyAr: `تم تأكيد حجز الغرفة رقم ${ref}`,
      bodyEn: `Your room booking #${ref} has been confirmed.`,
      data: { room_booking_id: id },
    })

    const providerUserId = (booking.provider as { user_id?: string } | null)?.user_id
    if (providerUserId) {
      await notify({
        userId: providerUserId,
        type: 'new_booking',
        titleAr: 'لديك حجز غرفة جديد مؤكد',
        titleEn: 'You have a new confirmed room booking',
        bodyAr: `حجز غرفة جديد رقم ${ref} - ${booking.rooms_count} غرف`,
        bodyEn: `New room booking #${ref} - ${booking.rooms_count} room(s)`,
        data: { room_booking_id: id },
      })
    }

    logActivity('room_booking_confirmed', { userId: booking.buyer_id, metadata: { bookingId: id, method } })
    logActivity('payment_received', { metadata: { bookingId: id, amount: booking.total_amount, method, kind: 'room' } })

    after(async () => {
      try {
        const roomName = roomInfo?.name_en || roomInfo?.name_ar || ''
        const roomCity = roomInfo?.city_en || roomInfo?.city_ar || ''
        const receiptHtml = await render(PaymentReceipt({
          bookingRef: ref,
          type: 'room',
          origin: roomName,
          destination: roomCity,
          departureDate: booking.check_in_date || '',
          nights: booking.number_of_days,
          totalAmount: booking.total_amount,
          commissionFree: booking.total_amount,
          passengerName: booking.guest_name || 'Guest',
          locale: 'en',
        }))
        await notify({
          userId: booking.buyer_id,
          type: 'room_booking_confirmed',
          titleAr: 'إيصال الدفع',
          titleEn: 'Payment Receipt',
          bodyAr: `إيصال الدفع لحجز الغرفة رقم ${ref}`,
          bodyEn: `Payment receipt for room booking #${ref}`,
          data: { room_booking_id: id },
          email: { subject: `Payment Receipt - ${ref}`, html: receiptHtml },
        })
        await handleBookingConfirmedRewards({
          buyerId: booking.buyer_id,
          bookingId: id,
          totalAmount: booking.total_amount,
          type: 'room',
          refLabel: `#${ref}`,
        })
      } catch (err) {
        console.error('room dummy-pay rewards error:', err)
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('room dummy-pay error:', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
