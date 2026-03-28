import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { DEFAULT_COMMISSION_RATE } from '@/lib/constants'
import { notify } from '@/lib/notifications'
import { shortId } from '@/lib/utils'
import { render } from '@react-email/components'
import GuestBooking from '@/emails/guest-booking'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const schema = z.object({
  trip_id: z.string().uuid(),
  seats_count: z.number().int().min(1).max(10),
  booking_type: z.enum(['one_way', 'round_trip']),
  passenger_name: z.string().min(2).max(100),
  passenger_email: z.string().email(),
  passenger_phone: z.string().min(5).max(20),
  passenger_id_number: z.string().optional(),
  passengers: z.array(z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    date_of_birth: z.string(),
    id_number: z.string(),
    id_expiry_date: z.string(),
  })).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'marketeer') return NextResponse.json({ error: 'Only marketeers can use this endpoint' }, { status: 403 })

    const { data: marketeer } = await supabaseAdmin
      .from('marketeers')
      .select('id, status, full_name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!marketeer) return NextResponse.json({ error: 'Marketeer account not active' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { trip_id, seats_count, booking_type, passenger_name, passenger_email, passenger_phone, passenger_id_number, passengers } = parsed.data

    // Fetch trip
    const { data: trip } = await supabaseAdmin
      .from('trips')
      .select('*, provider:providers(*)')
      .eq('id', trip_id)
      .single()

    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    if (trip.status !== 'active') return NextResponse.json({ error: 'Trip is not available' }, { status: 400 })

    const remaining = trip.total_seats - trip.booked_seats
    if (seats_count > remaining) return NextResponse.json({ error: 'Not enough seats' }, { status: 400 })

    // Book seats
    const { error: rpcError } = await supabaseAdmin.rpc('book_seats', {
      p_trip_id: trip_id,
      p_seats: seats_count,
    })

    if (rpcError) return NextResponse.json({ error: 'Failed to reserve seats' }, { status: 400 })

    // Commission calculation
    let commissionRate = DEFAULT_COMMISSION_RATE
    if (trip.provider?.commission_rate != null) {
      commissionRate = trip.provider.commission_rate
    } else {
      const { data: settings } = await supabaseAdmin
        .from('platform_settings')
        .select('default_commission_rate')
        .limit(1)
        .single()
      if (settings?.default_commission_rate != null) commissionRate = settings.default_commission_rate
    }

    const effectivePrice = (trip.trip_type === 'round_trip' && booking_type === 'one_way' && trip.price_per_seat_one_way)
      ? trip.price_per_seat_one_way
      : trip.price_per_seat
    const totalAmount = effectivePrice * seats_count
    const commissionAmount = (totalAmount * commissionRate) / 100
    const providerPayout = totalAmount - commissionAmount

    // Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        trip_id,
        buyer_id: null,
        provider_id: trip.provider_id,
        booked_by_marketeer_id: marketeer.id,
        passenger_name,
        passenger_phone,
        passenger_email,
        passenger_id_number: passenger_id_number || null,
        passengers: passengers || null,
        booking_type,
        seats_count,
        price_per_seat: effectivePrice,
        total_amount: totalAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        provider_payout: providerPayout,
        status: 'payment_processing',
      })
      .select('id, guest_token')
      .single()

    if (bookingError || !booking) {
      await supabaseAdmin.rpc('release_seats', { p_trip_id: trip_id, p_seats: seats_count })
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    const ref = shortId(booking.id)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booktfly.com'
    const paymentUrl = `${baseUrl}/en/guest/booking/${booking.guest_token}`

    // Fetch bank info
    const { data: bankInfo } = await supabaseAdmin
      .from('platform_settings')
      .select('bank_name_en, bank_iban, bank_account_holder_en')
      .limit(1)
      .single()

    // Send email to guest
    try {
      const departureDate = new Date(trip.departure_at).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })

      const emailHtml = await render(GuestBooking({
        passengerName: passenger_name,
        origin: trip.origin_city_en || trip.origin_city_ar,
        destination: trip.destination_city_en || trip.destination_city_ar,
        departureDate,
        seats: seats_count,
        amount: totalAmount,
        bankName: bankInfo?.bank_name_en || 'N/A',
        bankIban: bankInfo?.bank_iban || 'N/A',
        bankHolder: bankInfo?.bank_account_holder_en || 'N/A',
        paymentUrl,
      }))

      await resend.emails.send({
        from: 'BooktFly <noreply@booktfly.com>',
        to: passenger_email,
        subject: `Your Flight Booking #${ref} - Complete Payment`,
        html: emailHtml,
      })
    } catch (emailErr) {
      console.error('Failed to send guest booking email:', emailErr)
    }

    // Notify marketeer
    await notify({
      userId: user.id,
      type: 'new_booking',
      titleAr: 'تم إنشاء حجز لعميلك',
      titleEn: 'Booking created for your customer',
      bodyAr: `تم إنشاء حجز رقم ${ref} لـ ${passenger_name}. بانتظار الدفع.`,
      bodyEn: `Booking #${ref} created for ${passenger_name}. Awaiting payment.`,
      data: { booking_id: booking.id },
    })

    // Notify provider
    if (trip.provider?.user_id) {
      await notify({
        userId: trip.provider.user_id,
        type: 'new_booking',
        titleAr: 'لديك حجز جديد',
        titleEn: 'You have a new booking',
        bodyAr: `حجز جديد رقم ${ref} - ${seats_count} مقاعد - بانتظار الدفع`,
        bodyEn: `New booking #${ref} - ${seats_count} seat(s) - Awaiting payment`,
        data: { booking_id: booking.id },
      })
    }

    return NextResponse.json({
      bookingId: booking.id,
      guestToken: booking.guest_token,
      paymentUrl,
      ref,
    }, { status: 201 })
  } catch (error) {
    console.error('Marketeer book error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
