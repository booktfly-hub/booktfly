import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { packageBookingSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'
import { notify } from '@/lib/notifications'
import { logActivity } from '@/lib/activity-log'
import { shortId } from '@/lib/utils'
import { DEFAULT_COMMISSION_RATE } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { limit: 10, windowMs: 60_000 })
    if (limited) return limited

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const parsed = packageBookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      package_id,
      guest_name,
      guest_phone,
      guest_email,
      number_of_people,
      start_date,
      end_date,
    } = parsed.data

    const guest_token = body.guest_token as string | undefined

    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select('*, provider:providers(*)')
      .eq('id', package_id)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    if (pkg.status !== 'active') {
      return NextResponse.json(
        { error: 'Package is not available for booking' },
        { status: 400 }
      )
    }

    if (pkg.current_bookings >= pkg.max_bookings) {
      return NextResponse.json(
        { error: 'Package is fully booked' },
        { status: 400 }
      )
    }

    const totalAmount = pkg.total_price * number_of_people

    let commissionRate = DEFAULT_COMMISSION_RATE

    if (pkg.provider?.commission_rate != null) {
      commissionRate = pkg.provider.commission_rate
    } else {
      const { data: settings } = await supabaseAdmin
        .from('platform_settings')
        .select('default_commission_rate')
        .limit(1)
        .single()

      if (settings?.default_commission_rate != null) {
        commissionRate = settings.default_commission_rate
      }
    }

    const commissionAmount = (totalAmount * commissionRate) / 100
    const providerPayout = totalAmount - commissionAmount

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('package_bookings')
      .insert({
        package_id,
        buyer_id: user?.id || null,
        provider_id: pkg.provider_id,
        guest_name,
        guest_phone,
        guest_email,
        number_of_people,
        start_date,
        end_date,
        total_amount: totalAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        provider_payout: providerPayout,
        status: 'payment_processing',
      })
      .select('*, package:packages(*, provider:providers(*))')
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    await supabaseAdmin
      .from('packages')
      .update({ current_bookings: pkg.current_bookings + 1 })
      .eq('id', package_id)

    const ref = shortId(booking.id)
    const pkgNameAr = pkg.title_ar || pkg.title_en || ''
    const pkgNameEn = pkg.title_en || pkg.title_ar || ''

    after(async () => {
      if (pkg.provider?.user_id) {
        await notify({
          userId: pkg.provider.user_id,
          type: 'new_package_booking',
          titleAr: 'لديك حجز باقة جديد',
          titleEn: 'You have a new package booking',
          bodyAr: `تم استلام حجز جديد رقم ${ref} للباقة "${pkgNameAr}" - ${number_of_people} أشخاص`,
          bodyEn: `New booking #${ref} received for package "${pkgNameEn}" - ${number_of_people} person(s).`,
          data: { package_booking_id: booking.id },
        })
      }

      if (user?.id) {
        await notify({
          userId: user.id,
          type: 'new_package_booking',
          titleAr: 'تم إنشاء حجزك بنجاح',
          titleEn: 'Your package booking has been created',
          bodyAr: `تم إنشاء حجزك رقم ${ref} للباقة "${pkgNameAr}". يرجى إتمام الدفع.`,
          bodyEn: `Your booking #${ref} for package "${pkgNameEn}" has been created. Please complete payment.`,
          data: { package_booking_id: booking.id },
        })
      }

      await logActivity('package_booking_created', {
        userId: user?.id,
        metadata: { package_booking_id: booking.id, package_id, number_of_people, total_amount: totalAmount },
      })
    })

    return NextResponse.json({ bookingId: booking.id }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
