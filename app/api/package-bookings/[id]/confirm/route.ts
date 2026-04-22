import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify, notifyAdmin } from '@/lib/notifications'
import { logActivity } from '@/lib/activity-log'
import { shortId } from '@/lib/utils'
import { rateLimit } from '@/lib/rate-limit'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const limited = rateLimit(request, { limit: 5, windowMs: 60_000 })
    if (limited) return limited

    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Parse body (optional receipt URL + optional guest token)
    let receiptUrlInput: string | undefined
    let guestToken: string | undefined
    try {
      const body = await request.json()
      if (body?.transfer_receipt_url) receiptUrlInput = body.transfer_receipt_url
      if (body?.guest_token) guestToken = body.guest_token
    } catch {
      // No body or invalid JSON is fine
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('package_bookings')
      .select('*, package:packages(name_ar, name_en, provider_id)')
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found', details: bookingError?.message }, { status: 404 })
    }

    let providerUserId: string | null = null
    const pkgProviderId = (booking.package as any)?.provider_id
    if (pkgProviderId) {
      const { data: providerRow } = await supabaseAdmin
        .from('providers')
        .select('user_id')
        .eq('id', pkgProviderId)
        .single()
      providerUserId = providerRow?.user_id ?? null
    }

    let profile: { role: string } | null = null
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      profile = data
    }

    const isOwner = !!user && booking.buyer_id === user.id
    const isAdmin = profile?.role === 'admin'
    const hasNoBuyer = !booking.buyer_id
    const guestTokenOk = !booking.guest_token || booking.guest_token === guestToken
    const isGuest = hasNoBuyer && guestTokenOk

    if (!isOwner && !isAdmin && !isGuest) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (booking.status !== 'payment_processing') {
      return NextResponse.json({ error: 'Booking cannot be confirmed in current status' }, { status: 400 })
    }

    const receiptUrl = receiptUrlInput || booking.transfer_receipt_url

    await supabaseAdmin
      .from('package_bookings')
      .update({
        transfer_confirmed_at: new Date().toISOString(),
        transfer_receipt_url: receiptUrl,
      })
      .eq('id', id)

    const ref = shortId(id)
    const pkg = booking.package as any
    const pkgNameAr = pkg?.name_ar || pkg?.name_en || ''
    const pkgNameEn = pkg?.name_en || pkg?.name_ar || ''

    await notifyAdmin({
      type: 'payment_approved',
      titleAr: 'تحويل بنكي بانتظار المراجعة',
      titleEn: 'Bank transfer pending review',
      bodyAr: `حجز باقة رقم ${ref} - تم تأكيد التحويل البنكي ويحتاج مراجعة`,
      bodyEn: `Package booking #${ref} - Bank transfer confirmed, needs review`,
      data: { package_booking_id: id },
    })

    after(async () => {
      if (providerUserId) {
        await notify({
          userId: providerUserId,
          type: 'new_package_booking',
          titleAr: 'تأكيد تحويل حجز باقة',
          titleEn: 'Package booking transfer confirmed',
          bodyAr: `تم تأكيد التحويل للحجز رقم ${ref} للباقة "${pkgNameAr}" - بانتظار مراجعة الإدارة`,
          bodyEn: `Transfer confirmed for booking #${ref} for package "${pkgNameEn}" - pending admin review`,
          data: { package_booking_id: id },
        })
      }

      await logActivity('package_booking_transfer_confirmed', {
        userId: user?.id,
        metadata: { package_booking_id: id },
      })
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
