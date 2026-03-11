import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

// PATCH: Edit trip (provider only - price, seats, description, image)
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

    const priceStr = formData.get('price_per_seat')
    if (priceStr) {
      const price = Number(priceStr)
      if (price > 0) updates.price_per_seat = price
    }

    const seatsStr = formData.get('total_seats')
    if (seatsStr) {
      const seats = Number(seatsStr)
      if (seats >= existingTrip.booked_seats) updates.total_seats = seats
    }

    const descAr = formData.get('description_ar')
    if (descAr !== null) updates.description_ar = descAr || null

    const descEn = formData.get('description_en')
    if (descEn !== null) updates.description_en = descEn || null

    // Upload image if provided
    const imageFile = formData.get('image') as File | null
    if (imageFile && imageFile.size > 0) {
      const ext = imageFile.name.split('.').pop() || 'jpg'
      const filePath = `trips/${provider.id}/${Date.now()}.${ext}`
      const buffer = Buffer.from(await imageFile.arrayBuffer())

      const { error: uploadError } = await supabaseAdmin.storage
        .from('trip-images')
        .upload(filePath, buffer, {
          contentType: imageFile.type,
          upsert: true,
        })

      if (!uploadError) {
        const { data: publicUrl } = supabaseAdmin.storage
          .from('trip-images')
          .getPublicUrl(filePath)
        updates.image_url = publicUrl.publicUrl
      }
    }

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
