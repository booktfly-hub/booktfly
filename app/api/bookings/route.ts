import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { bookingSchema } from '@/lib/validations'
import { DEFAULT_COMMISSION_RATE } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = bookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { trip_id, passenger_name, passenger_phone, passenger_email, passenger_id_number, seats_count } = parsed.data

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

    const remaining = trip.total_seats - trip.booked_seats
    if (seats_count > remaining) {
      return NextResponse.json(
        { error: 'Not enough seats available' },
        { status: 400 }
      )
    }

    // Book seats via RPC
    const { error: rpcError } = await supabase.rpc('book_seats', {
      p_trip_id: trip_id,
      p_seats: seats_count,
    })

    if (rpcError) {
      return NextResponse.json(
        { error: 'Failed to reserve seats. Please try again.' },
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

    const totalAmount = trip.price_per_seat * seats_count
    const commissionAmount = (totalAmount * commissionRate) / 100
    const providerPayout = totalAmount - commissionAmount

    // Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        trip_id,
        buyer_id: user.id,
        provider_id: trip.provider_id,
        passenger_name,
        passenger_phone,
        passenger_email,
        passenger_id_number: passenger_id_number || null,
        seats_count,
        price_per_seat: trip.price_per_seat,
        total_amount: totalAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        provider_payout: providerPayout,
        status: 'payment_processing',
      })
      .select()
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({ bookingId: booking.id }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
