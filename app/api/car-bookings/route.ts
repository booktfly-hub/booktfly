import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { carBookingSchema } from '@/lib/validations'
import { DEFAULT_COMMISSION_RATE } from '@/lib/constants'
import { rateLimit } from '@/lib/rate-limit'
import { notify } from '@/lib/notifications'
import { shortId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { limit: 5, windowMs: 60_000 })
    if (limited) return limited

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const parsed = carBookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      car_id,
      guest_name,
      guest_phone,
      guest_email,
      pickup_date,
      return_date,
      number_of_days,
      pickup_time,
      return_time,
    } = parsed.data

    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('*, provider:providers(*)')
      .eq('id', car_id)
      .single()

    if (carError || !car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      )
    }

    if (car.status !== 'active') {
      return NextResponse.json(
        { error: 'Car is not available for booking' },
        { status: 400 }
      )
    }

    if (!car.instant_book) {
      const pickup = new Date(pickup_date)
      if (car.available_from && pickup < new Date(car.available_from)) {
        return NextResponse.json(
          { error: 'Pickup date is before the available period' },
          { status: 400 }
        )
      }
      const returnD = new Date(return_date)
      if (car.available_to && returnD > new Date(car.available_to)) {
        return NextResponse.json(
          { error: 'Return date is after the available period' },
          { status: 400 }
        )
      }
    }

    const totalAmount = car.price_per_day * number_of_days

    let commissionRate = DEFAULT_COMMISSION_RATE

    if (car.provider?.commission_rate != null) {
      commissionRate = car.provider.commission_rate
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
      .from('car_bookings')
      .insert({
        car_id,
        buyer_id: user?.id || null,
        provider_id: car.provider_id,
        guest_name,
        guest_phone,
        guest_email,
        pickup_date,
        return_date,
        number_of_days,
        pickup_time: pickup_time || null,
        return_time: return_time || null,
        price_per_day: car.price_per_day,
        total_amount: totalAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        provider_payout: providerPayout,
        status: 'payment_processing',
      })
      .select('*, car:cars(*), provider:providers(*)')
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    const ref = shortId(booking.id)
    const carNameAr = `${car.brand_ar} ${car.model_ar}`
    const carNameEn = `${car.brand_en || car.brand_ar} ${car.model_en || car.model_ar}`
    const city = car.city_ar || car.city_en || ''
    const cityEn = car.city_en || city

    if (user?.id) {
      await notify({
        userId: user.id,
        type: 'new_car_booking',
        titleAr: 'تم إنشاء حجزك بنجاح',
        titleEn: 'Your car booking has been created',
        bodyAr: `تم إنشاء حجزك رقم ${ref} للسيارة "${carNameAr}" في ${city}. يرجى إتمام الدفع.`,
        bodyEn: `Your booking #${ref} for car "${carNameEn}" in ${cityEn} has been created. Please complete payment.`,
        data: { car_booking_id: booking.id },
      })
    }

    if (car.provider?.user_id) {
      await notify({
        userId: car.provider.user_id,
        type: 'new_car_booking',
        titleAr: 'لديك حجز سيارة جديد',
        titleEn: 'You have a new car booking',
        bodyAr: `تم استلام حجز جديد رقم ${ref} للسيارة "${carNameAr}" في ${city} - ${number_of_days} أيام`,
        bodyEn: `New booking #${ref} received for car "${carNameEn}" in ${cityEn} - ${number_of_days} day(s).`,
        data: { car_booking_id: booking.id },
      })
    }

    return NextResponse.json({ bookingId: booking.id }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
