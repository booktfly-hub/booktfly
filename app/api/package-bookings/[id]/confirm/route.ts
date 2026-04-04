import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'
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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: booking } = await supabaseAdmin
      .from('package_bookings')
      .select('*, package:packages(title_ar, title_en, provider_id, provider:providers(user_id))')
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

    const isOwner = booking.buyer_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (booking.status !== 'payment_processing') {
      return NextResponse.json({ error: 'Booking cannot be confirmed in current status' }, { status: 400 })
    }

    await supabaseAdmin
      .from('package_bookings')
      .update({
        status: 'confirmed',
        paid_at: new Date().toISOString(),
      })
      .eq('id', id)

    const ref = shortId(id)
    const pkg = booking.package as any
    const pkgNameAr = pkg?.title_ar || pkg?.title_en || ''
    const pkgNameEn = pkg?.title_en || pkg?.title_ar || ''

    after(async () => {
      if (pkg?.provider?.user_id) {
        await notify({
          userId: pkg.provider.user_id,
          type: 'new_package_booking',
          titleAr: 'تم تأكيد حجز باقة',
          titleEn: 'Package booking confirmed',
          bodyAr: `تم تأكيد الدفع للحجز رقم ${ref} للباقة "${pkgNameAr}"`,
          bodyEn: `Payment confirmed for booking #${ref} for package "${pkgNameEn}"`,
          data: { package_booking_id: id },
        })
      }

      await logActivity('package_booking_confirmed', {
        userId: user.id,
        metadata: { package_booking_id: id },
      })
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
