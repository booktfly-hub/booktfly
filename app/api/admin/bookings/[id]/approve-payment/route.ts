import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'
import { logActivity } from '@/lib/activity-log'
import { shortId } from '@/lib/utils'
import { handleBookingConfirmedRewards, handleMarkeeteerDirectBookingRewards } from '@/lib/points'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const { action, reason } = body as { action: 'approve' | 'reject'; reason?: string }

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*, trip:trips(origin_city_ar, origin_city_en, destination_city_ar, destination_city_en), provider:providers(user_id)')
      .eq('id', id)
      .single()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status !== 'payment_processing') {
      return NextResponse.json({ error: 'Booking is not awaiting payment' }, { status: 400 })
    }

    const ref = shortId(id)
    const tripInfo = booking.trip as any

    if (action === 'approve') {
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'confirmed',
          paid_at: new Date().toISOString(),
          payment_reviewed_by: user.id,
          payment_reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)

      // Credit provider wallet
      await supabaseAdmin.rpc('credit_wallet', {
        p_provider_id: booking.provider_id,
        p_amount: booking.provider_payout,
        p_booking_id: id,
        p_desc_ar: `إيراد حجز رقم ${ref}`,
        p_desc_en: `Revenue from booking #${ref}`,
      })

      // Notify buyer
      if (booking.buyer_id) {
        await notify({
          userId: booking.buyer_id,
          type: 'payment_approved',
          titleAr: 'تم تأكيد الدفع وتأكيد حجزك',
          titleEn: 'Payment confirmed, booking confirmed',
          bodyAr: `تم تأكيد حجزك رقم ${ref} للرحلة من ${tripInfo?.origin_city_ar || ''} إلى ${tripInfo?.destination_city_ar || ''}`,
          bodyEn: `Your booking #${ref} for the trip from ${tripInfo?.origin_city_en || ''} to ${tripInfo?.destination_city_en || ''} has been confirmed.`,
          data: { booking_id: id },
        })
      }

      // Notify provider
      const providerUserId = (booking.provider as any)?.user_id
      if (providerUserId) {
        await notify({
          userId: providerUserId,
          type: 'new_booking',
          titleAr: 'لديك حجز جديد مؤكد',
          titleEn: 'You have a new confirmed booking',
          bodyAr: `حجز جديد رقم ${ref} - ${booking.seats_count} مقاعد - تم إيداع ${booking.provider_payout} في محفظتك`,
          bodyEn: `New booking #${ref} - ${booking.seats_count} seat(s) - ${booking.provider_payout} credited to your wallet`,
          data: { booking_id: id },
        })
      }

      logActivity('booking_confirmed', { userId: booking.buyer_id, metadata: { bookingId: id } })
      logActivity('payment_received', { metadata: { bookingId: id, amount: booking.total_amount } })

      // Award referral points & customer first-booking bonus (off critical path)
      after(async () => {
        try {
          // If booked by a marketeer directly (guest booking)
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
          // If buyer has an account, award customer & referral marketeer points
          if (booking.buyer_id) {
            await handleBookingConfirmedRewards({
              buyerId: booking.buyer_id,
              bookingId: id,
              totalAmount: booking.total_amount,
              type: 'flight',
              refLabel: `#${ref}`,
            })
          }
        } catch (err) {
          console.error('Booking rewards error:', err)
        }
      })
    } else {
      // Reject payment
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'payment_failed',
          payment_reviewed_by: user.id,
          payment_reviewed_at: new Date().toISOString(),
          payment_rejection_reason: reason || null,
        })
        .eq('id', id)

      // Release seats
      await supabaseAdmin.rpc('release_seats', {
        p_trip_id: booking.trip_id,
        p_seats: booking.seats_count,
      })

      // Notify buyer
      if (booking.buyer_id) {
        await notify({
          userId: booking.buyer_id,
          type: 'payment_rejected',
          titleAr: 'تم رفض التحويل البنكي',
          titleEn: 'Bank transfer rejected',
          bodyAr: `تم رفض التحويل البنكي للحجز رقم ${ref}${reason ? `. السبب: ${reason}` : ''}`,
          bodyEn: `Bank transfer for booking #${ref} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
          data: { booking_id: id },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Approve payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
