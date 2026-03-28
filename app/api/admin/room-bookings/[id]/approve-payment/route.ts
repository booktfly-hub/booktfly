import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'
import { logActivity } from '@/lib/activity-log'
import { shortId } from '@/lib/utils'
import { handleBookingConfirmedRewards } from '@/lib/points'

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
      .from('room_bookings')
      .select('*, room:rooms(name_ar, name_en, city_ar, city_en), provider:providers(user_id)')
      .eq('id', id)
      .single()

    if (!booking) return NextResponse.json({ error: 'Room booking not found' }, { status: 404 })
    if (booking.status !== 'payment_processing') {
      return NextResponse.json({ error: 'Booking is not awaiting payment' }, { status: 400 })
    }

    const ref = shortId(id)
    const roomInfo = booking.room as any

    if (action === 'approve') {
      await supabaseAdmin
        .from('room_bookings')
        .update({
          status: 'confirmed',
          paid_at: new Date().toISOString(),
          payment_reviewed_by: user.id,
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

      if (booking.buyer_id) {
        await notify({
          userId: booking.buyer_id,
          type: 'room_booking_confirmed',
          titleAr: 'تم تأكيد الدفع وتأكيد حجزك',
          titleEn: 'Payment confirmed, room booking confirmed',
          bodyAr: `تم تأكيد حجز الغرفة رقم ${ref} - ${roomInfo?.name_ar || ''}`,
          bodyEn: `Your room booking #${ref} for ${roomInfo?.name_en || roomInfo?.name_ar || ''} has been confirmed.`,
          data: { room_booking_id: id },
        })
      }

      const providerUserId = (booking.provider as any)?.user_id
      if (providerUserId) {
        await notify({
          userId: providerUserId,
          type: 'new_booking',
          titleAr: 'لديك حجز غرفة جديد مؤكد',
          titleEn: 'You have a new confirmed room booking',
          bodyAr: `حجز غرفة جديد رقم ${ref} - ${booking.rooms_count} غرف - تم إيداع ${booking.provider_payout} في محفظتك`,
          bodyEn: `New room booking #${ref} - ${booking.rooms_count} room(s) - ${booking.provider_payout} credited to your wallet`,
          data: { room_booking_id: id },
        })
      }

      logActivity('room_booking_confirmed', { metadata: { bookingId: id } })

      // Award referral points & customer first-booking bonus (off critical path)
      if (booking.buyer_id) {
        after(async () => {
          try {
            await handleBookingConfirmedRewards({
              buyerId: booking.buyer_id!,
              bookingId: id,
              totalAmount: booking.total_amount,
              type: 'room',
              refLabel: `#${ref}`,
            })
          } catch (err) {
            console.error('Room booking rewards error:', err)
          }
        })
      }
    } else {
      await supabaseAdmin
        .from('room_bookings')
        .update({
          status: 'payment_failed',
          payment_reviewed_by: user.id,
          payment_reviewed_at: new Date().toISOString(),
          payment_rejection_reason: reason || null,
        })
        .eq('id', id)

      if (booking.buyer_id) {
        await notify({
          userId: booking.buyer_id,
          type: 'payment_rejected',
          titleAr: 'تم رفض التحويل البنكي',
          titleEn: 'Bank transfer rejected',
          bodyAr: `تم رفض التحويل البنكي لحجز الغرفة رقم ${ref}${reason ? `. السبب: ${reason}` : ''}`,
          bodyEn: `Bank transfer for room booking #${ref} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
          data: { room_booking_id: id },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Approve room payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
