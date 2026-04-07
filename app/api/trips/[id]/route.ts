import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { optimizeImage } from '@/lib/optimize-image'
import { tripSchema } from '@/lib/validations'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: trip, error } = await supabase
      .from('trips')
      .select('*, provider:providers(*)')
      .eq('id', id)
      .single()

    if (error || !trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    const { data: seatAssignments } = await supabaseAdmin
      .from('trip_seat_assignments')
      .select('seat_number')
      .eq('trip_id', id)

    const unavailableSeatNumbers = (seatAssignments || []).map((item) => item.seat_number)

    return NextResponse.json({ trip: { ...trip, unavailable_seat_numbers: unavailableSeatNumbers } })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Edit trip (provider only - all fields)
// If trip has bookings, creates an edit request for admin approval
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get provider
    const { data: provider } = await supabase
      .from('providers')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (!provider || provider.status !== 'active') {
      return NextResponse.json(
        { data: null, error: 'Provider account is not active' },
        { status: 403 }
      )
    }

    // Verify trip belongs to this provider
    const { data: existingTrip } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('id', id)
      .eq('provider_id', provider.id)
      .single()

    if (!existingTrip) {
      return NextResponse.json(
        { data: null, error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // All editable fields
    const stringFields = [
      'airline', 'flight_number', 'origin_city_ar', 'origin_city_en',
      'origin_code', 'destination_city_ar', 'destination_city_en',
      'destination_code', 'departure_at', 'return_at',
      'cabin_class', 'listing_type', 'currency', 'description_ar', 'description_en',
    ]

    for (const field of stringFields) {
      const val = formData.get(field)
      if (val !== null) {
        let finalVal: string | null = (val as string) || null
        if (finalVal && (field === 'origin_code' || field === 'destination_code')) {
          finalVal = finalVal.toUpperCase()
        }
        updates[field] = finalVal
      }
    }

    const priceStr = formData.get('price_per_seat')
    if (priceStr) {
      const price = Number(priceStr)
      if (price > 0) updates.price_per_seat = price
    }

    const priceOneWayStr = formData.get('price_per_seat_one_way')
    if (priceOneWayStr !== null) {
      const price = Number(priceOneWayStr)
      updates.price_per_seat_one_way = price > 0 ? price : null
    }

    const seatsStr = formData.get('total_seats')
    if (seatsStr !== null) {
      const seatsValue = (seatsStr as string).trim()
      if (seatsValue) {
        const seats = Number(seatsValue)
        if (!Number.isFinite(seats) || seats < existingTrip.booked_seats) {
          return NextResponse.json(
            { data: null, error: 'Total seats cannot be less than the number already booked' },
            { status: 400 }
          )
        }
        updates.total_seats = seats
      }
    }

    const isDirectStr = formData.get('is_direct')
    if (isDirectStr !== null) {
      updates.is_direct = isDirectStr === 'true'
    }

    const checkedBaggageStr = formData.get('checked_baggage_kg')
    if (checkedBaggageStr !== null) {
      const value = (checkedBaggageStr as string).trim()
      if (!value) {
        updates.checked_baggage_kg = null
      } else {
        const checkedBaggageKg = Number(value)
        if (!Number.isFinite(checkedBaggageKg) || checkedBaggageKg < 0) {
          return NextResponse.json(
            { data: null, error: 'Checked baggage must be a valid non-negative number' },
            { status: 400 }
          )
        }
        updates.checked_baggage_kg = checkedBaggageKg
      }
    }

    const cabinBaggageStr = formData.get('cabin_baggage_kg')
    if (cabinBaggageStr !== null) {
      const value = (cabinBaggageStr as string).trim()
      if (!value) {
        updates.cabin_baggage_kg = null
      } else {
        const cabinBaggageKg = Number(value)
        if (!Number.isFinite(cabinBaggageKg) || cabinBaggageKg < 0) {
          return NextResponse.json(
            { data: null, error: 'Cabin baggage must be a valid non-negative number' },
            { status: 400 }
          )
        }
        updates.cabin_baggage_kg = cabinBaggageKg
      }
    }

    const mealIncludedStr = formData.get('meal_included')
    if (mealIncludedStr !== null) {
      updates.meal_included = mealIncludedStr === 'true'
    }

    const seatSelectionIncludedStr = formData.get('seat_selection_included')
    if (seatSelectionIncludedStr !== null) {
      updates.seat_selection_included = seatSelectionIncludedStr === 'true'
    }

    const seatMapEnabledStr = formData.get('seat_map_enabled')
    if (seatMapEnabledStr !== null) {
      const nextSeatMapEnabled = seatMapEnabledStr === 'true'
      updates.seat_map_enabled = nextSeatMapEnabled

      if (nextSeatMapEnabled) {
        const seatMapConfigRaw = formData.get('seat_map_config')
        if (typeof seatMapConfigRaw !== 'string' || !seatMapConfigRaw.trim()) {
          return NextResponse.json(
            { data: null, error: 'Seat map config is required when seat map mode is enabled' },
            { status: 400 }
          )
        }

        let parsedSeatMapConfig: unknown
        try {
          parsedSeatMapConfig = JSON.parse(seatMapConfigRaw)
        } catch {
          return NextResponse.json(
            { data: null, error: 'Seat map config is invalid' },
            { status: 400 }
          )
        }

        const validatedSeatMapConfig = tripSchema.shape.seat_map_config.safeParse(parsedSeatMapConfig)
        if (!validatedSeatMapConfig.success || !validatedSeatMapConfig.data) {
          return NextResponse.json(
            { data: null, error: 'Seat map config is invalid' },
            { status: 400 }
          )
        }

        updates.seat_map_config = validatedSeatMapConfig.data
      } else {
        updates.seat_map_config = null
      }
    }

    // Upload image if provided
    const imageFile = formData.get('image') as File | null
    if (imageFile && imageFile.size > 0) {
      const filePath = `trips/${provider.id}/${Date.now()}.webp`
      const rawBuffer = Buffer.from(await imageFile.arrayBuffer())
      const { buffer, contentType } = await optimizeImage(rawBuffer)

      const { error: uploadError } = await supabaseAdmin.storage
        .from('trip-images')
        .upload(filePath, buffer, {
          contentType,
          upsert: true,
        })

      if (!uploadError) {
        const { data: publicUrl } = supabaseAdmin.storage
          .from('trip-images')
          .getPublicUrl(filePath)
        updates.image_url = publicUrl.publicUrl
      }
    }

    // Check if trip has confirmed bookings
    const { count: bookingCount } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('trip_id', id)
      .in('status', ['confirmed', 'payment_processing'])

    const hasBookings = (bookingCount || 0) > 0

    if (hasBookings) {
      // Create edit request for admin approval
      const changesOnly = Object.fromEntries(
        Object.entries(updates).filter(([key]) => key !== 'updated_at')
      )
      const { data: editRequest, error: editError } = await supabaseAdmin
        .from('trip_edit_requests')
        .insert({
          trip_id: id,
          provider_id: provider.id,
          changes: changesOnly,
          status: 'pending',
        })
        .select()
        .single()

      if (editError) {
        console.error('Failed to create edit request:', editError)
        return NextResponse.json(
          { data: null, error: 'Failed to submit edit request' },
          { status: 500 }
        )
      }

      // Notify admin
      const { notifyAdmin } = await import('@/lib/notifications')
      await notifyAdmin({
        type: 'trip_edit_approved',
        titleAr: 'طلب تعديل رحلة جديد',
        titleEn: 'New Trip Edit Request',
        bodyAr: `طلب تعديل رحلة من ${existingTrip.origin_city_ar} إلى ${existingTrip.destination_city_ar}`,
        bodyEn: `Trip edit request for ${existingTrip.origin_city_en || existingTrip.origin_city_ar} to ${existingTrip.destination_city_en || existingTrip.destination_city_ar}`,
        data: { trip_id: id, edit_request_id: editRequest.id },
      })

      return NextResponse.json({
        data: existingTrip,
        pending_approval: true,
        error: null,
      })
    }

    // No bookings - apply changes directly
    const { data: updatedTrip, error: updateError } = await supabaseAdmin
      .from('trips')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update trip:', updateError)
      return NextResponse.json(
        { data: null, error: 'Failed to update trip' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedTrip, error: null })
  } catch (error) {
    console.error('Trip PATCH error:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
