import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'
import { logActivity } from '@/lib/activity-log'
import { shortId } from '@/lib/utils'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: booking } = await supabaseAdmin
      .from('package_bookings')
      .select('*, package:packages(title_ar, title_en, current_bookings, provider_id, provider:providers(user_id))')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const pkg = booking.package as any
    const isOwner = booking.buyer_id === user.id
    const isProvider = pkg?.provider?.user_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isProvider && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 })
    }

    await supabaseAdmin
      .from('package_bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
      })
      .eq('id', id)

    if (pkg?.current_bookings > 0) {
      await supabaseAdmin
        .from('packages')
        .update({ current_bookings: pkg.current_bookings - 1 })
        .eq('id', booking.package_id)
    }

    const ref = shortId(id)
    const pkgNameAr = pkg?.title_ar || pkg?.title_en || ''
    const pkgNameEn = pkg?.title_en || pkg?.title_ar || ''

    after(async () => {
      if (isOwner && pkg?.provider?.user_id) {
        await notify({
          userId: pkg.provider.user_id,
          type: 'new_package_booking',
          titleAr: 'تم إلغاء حجز باقة',
          titleEn: 'Package booking cancelled',
          bodyAr: `تم إلغاء الحجز رقم ${ref} للباقة "${pkgNameAr}"`,
          bodyEn: `Booking #${ref} for package "${pkgNameEn}" has been cancelled`,
          data: { package_booking_id: id },
        })
      }

      if (!isOwner && booking.buyer_id) {
        await notify({
          userId: booking.buyer_id,
          type: 'new_package_booking',
          titleAr: 'تم إلغاء حجزك',
          titleEn: 'Your booking has been cancelled',
          bodyAr: `تم إلغاء حجزك رقم ${ref} للباقة "${pkgNameAr}"`,
          bodyEn: `Your booking #${ref} for package "${pkgNameEn}" has been cancelled`,
          data: { package_booking_id: id },
        })
      }

      await logActivity('package_booking_cancelled', {
        userId: user.id,
        metadata: { package_booking_id: id, cancelled_by: user.id },
      })
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
