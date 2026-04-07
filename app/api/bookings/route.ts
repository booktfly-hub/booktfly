import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { bookingSchema } from '@/lib/validations'
import { DEFAULT_COMMISSION_RATE } from '@/lib/constants'
import { rateLimit } from '@/lib/rate-limit'
import { notify } from '@/lib/notifications'
import { shortId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { limit: 5, windowMs: 60_000 })
    if (limited) return limited

    const supabase = await createClient()

    // Auth is optional - guests can book
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const parsed = bookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { trip_id, seats_count, passengers, contact, selected_seat_numbers = [] } = parsed.data
    const booking_type = (body.booking_type === 'one_way' ? 'one_way' : 'round_trip') as 'one_way' | 'round_trip'
    const normalizedSelectedSeats = Array.from(new Set(selected_seat_numbers.map((seat) => seat.toUpperCase())))
    const normalizedPassengers = normalizedSelectedSeats.length > 0
      ? passengers.map((passenger, index) => ({ ...passenger, seat_number: normalizedSelectedSeats[index] }))
      : passengers
    const firstPassenger = normalizedPassengers[0]
    const passenger_name = `${firstPassenger.first_name} ${firstPassenger.last_name}`
    const passenger_phone = contact.phone
    const passenger_email = contact.email

    // Fetch trip details
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*, provider:providers(*)')
      .eq('id', trip_id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    if (trip.status !== 'active') {
      return NextResponse.json(
        { error: 'Trip is not available for booking' },
        { status: 400 }
      )
    }

    const requestedSeatsCount = trip.seat_map_enabled ? normalizedSelectedSeats.length : seats_count

    if (trip.seat_map_enabled) {
      if (!trip.seat_map_config) {
        return NextResponse.json(
          { error: 'Seat map is not configured for this trip' },
          { status: 400 }
        )
      }

      if (normalizedSelectedSeats.length === 0 || normalizedSelectedSeats.length !== seats_count) {
        return NextResponse.json(
          { error: 'Please select the required seats before booking' },
          { status: 400 }
        )
      }
    }

    const remaining = trip.total_seats - trip.booked_seats
    if (requestedSeatsCount > remaining) {
      return NextResponse.json(
        { error: 'Not enough seats available' },
        { status: 400 }
      )
    }

    // Calculate commission
    let commissionRate = DEFAULT_COMMISSION_RATE

    if (trip.provider?.commission_rate != null) {
      commissionRate = trip.provider.commission_rate
    } else {
      // Fetch platform default
      const { data: settings } = await supabaseAdmin
        .from('platform_settings')
        .select('default_commission_rate')
        .limit(1)
        .single()

      if (settings?.default_commission_rate != null) {
        commissionRate = settings.default_commission_rate
      }
    }

    // Use one-way price if booking type is one-way on a round-trip
    const effectivePrice = (trip.trip_type === 'round_trip' && booking_type === 'one_way' && trip.price_per_seat_one_way)
      ? trip.price_per_seat_one_way
      : trip.price_per_seat
    const totalAmount = effectivePrice * requestedSeatsCount
    const commissionAmount = (totalAmount * commissionRate) / 100
    const providerPayout = totalAmount - commissionAmount
    const bookingId = crypto.randomUUID()

    // Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        id: bookingId,
        trip_id,
        buyer_id: user?.id || null,
        provider_id: trip.provider_id,
        passenger_name,
        passenger_phone,
        passenger_email,
        passenger_id_number: firstPassenger.id_number || null,
        passengers: normalizedPassengers || null,
        booking_type,
        seats_count: requestedSeatsCount,
        price_per_seat: effectivePrice,
        total_amount: totalAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        provider_payout: providerPayout,
        status: 'payment_processing',
      })
      .select('*, trip:trips(*), provider:providers(*)')
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    const reservationError = trip.seat_map_enabled
      ? await supabaseAdmin.rpc('assign_trip_seats_to_booking', {
          p_booking_id: booking.id,
          p_trip_id: trip_id,
          p_seat_numbers: normalizedSelectedSeats,
        }).then(({ error }) => error)
      : await supabase.rpc('book_seats', {
          p_trip_id: trip_id,
          p_seats: requestedSeatsCount,
        }).then(({ error }) => error)

    if (reservationError) {
      await supabaseAdmin.from('bookings').delete().eq('id', booking.id)
      return NextResponse.json(
        { error: 'Failed to reserve seats. Please try again.' },
        { status: 400 }
      )
    }

    // Send notifications
    const ref = shortId(booking.id)
    const tripOrigin = trip.origin_city_ar || ''
    const tripDest = trip.destination_city_ar || ''
    const tripOriginEn = trip.origin_city_en || tripOrigin
    const tripDestEn = trip.destination_city_en || tripDest

    if (user?.id) {
      await notify({
        userId: user.id,
        type: 'new_booking',
        titleAr: 'تم إنشاء حجزك بنجاح',
        titleEn: 'Your booking has been created',
        bodyAr: `تم إنشاء حجزك رقم ${ref} للرحلة من ${tripOrigin} إلى ${tripDest}. يرجى إتمام الدفع.`,
        bodyEn: `Your booking #${ref} for the trip from ${tripOriginEn} to ${tripDestEn} has been created. Please complete payment.`,
        data: { booking_id: booking.id },
      })
    }

    if (trip.provider?.user_id) {
      await notify({
        userId: trip.provider.user_id,
        type: 'new_booking',
        titleAr: 'لديك حجز جديد',
        titleEn: 'You have a new booking',
        bodyAr: `تم استلام حجز جديد رقم ${ref} للرحلة من ${tripOrigin} إلى ${tripDest} - ${requestedSeatsCount} مقاعد`,
        bodyEn: `New booking #${ref} received for the trip from ${tripOriginEn} to ${tripDestEn} - ${requestedSeatsCount} seat(s).`,
        data: { booking_id: booking.id },
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
