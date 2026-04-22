import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'
import { logActivity } from '@/lib/activity-log'
import { shortId } from '@/lib/utils'
import { rateLimit } from '@/lib/rate-limit'

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
      .from('package_bookings')
      .select('*, package:packages(title_ar, title_en, provider_id, provider:providers(user_id))')
      .eq('id', id)
      .single()

    if (!booking) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (booking.buyer_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    if (booking.status !== 'payment_processing') {
      return NextResponse.json({ error: 'already processed' }, { status: 400 })
    }

    const ref = shortId(id)
    const pkg = booking.package as { title_ar?: string; title_en?: string; provider?: { user_id?: string } } | null

    await supabaseAdmin
      .from('package_bookings')
      .update({
        status: 'confirmed',
        paid_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (booking.provider_payout && booking.provider_id) {
      await supabaseAdmin.rpc('credit_wallet', {
        p_provider_id: booking.provider_id,
        p_amount: booking.provider_payout,
        p_booking_id: id,
        p_desc_ar: `إيراد حجز باقة رقم ${ref}`,
        p_desc_en: `Revenue from package booking #${ref}`,
      })
    }

    await notify({
      userId: booking.buyer_id,
      type: 'package_booking_confirmed',
      titleAr: 'تم تأكيد الدفع وتأكيد حجزك',
      titleEn: 'Payment confirmed, package booking confirmed',
      bodyAr: `تم تأكيد حجز الباقة رقم ${ref}`,
      bodyEn: `Your package booking #${ref} has been confirmed.`,
      data: { package_booking_id: id },
    })

    const providerUserId = pkg?.provider?.user_id
    if (providerUserId) {
      await notify({
        userId: providerUserId,
        type: 'new_package_booking',
        titleAr: 'لديك حجز باقة جديد مؤكد',
        titleEn: 'You have a new confirmed package booking',
        bodyAr: `حجز باقة جديد رقم ${ref} - ${booking.number_of_people} أشخاص`,
        bodyEn: `New package booking #${ref} - ${booking.number_of_people} people`,
        data: { package_booking_id: id },
      })
    }

    logActivity('package_booking_confirmed', { userId: booking.buyer_id, metadata: { bookingId: id, method } })
    logActivity('payment_received', { metadata: { bookingId: id, amount: booking.total_amount, method, kind: 'package' } })

    after(async () => {
      try {
        // No rewards helper for packages yet; keep first-booking & marketeer rewards additive if needed later.
      } catch (err) {
        console.error('package dummy-pay after error:', err)
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('package dummy-pay error:', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
