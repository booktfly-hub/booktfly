import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { optimizeImage } from '@/lib/optimize-image'

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

    return NextResponse.json({ trip })
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
      'destination_code', 'departure_at', 'return_at', 'trip_type',
      'cabin_class', 'listing_type', 'currency', 'description_ar', 'description_en',
    ]

    for (const field of stringFields) {
      const val = formData.get(field)
      if (val !== null) {
        updates[field] = val || null
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
    if (seatsStr) {
      const seats = Number(seatsStr)
      if (seats >= existingTrip.booked_seats) updates.total_seats = seats
    }

    const isDirectStr = formData.get('is_direct')
    if (isDirectStr !== null) {
      updates.is_direct = isDirectStr === 'true'
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
      const { updated_at: _removed, ...changesOnly } = updates
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
