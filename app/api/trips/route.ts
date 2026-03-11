import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { tripSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    const tripType = searchParams.get('trip_type')
    const cabinClass = searchParams.get('cabin_class')
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)
    const providerId = searchParams.get('provider_id')

    const offset = (page - 1) * limit

    let query = supabase
      .from('trips')
      .select('*, provider:providers(*)', { count: 'exact' })
      .eq('status', 'active')

    if (providerId) {
      query = query.eq('provider_id', providerId)
    }

    if (origin) {
      query = query.or(
        `origin_city_ar.ilike.%${origin}%,origin_city_en.ilike.%${origin}%,origin_code.ilike.%${origin}%`
      )
    }

    if (destination) {
      query = query.or(
        `destination_city_ar.ilike.%${destination}%,destination_city_en.ilike.%${destination}%,destination_code.ilike.%${destination}%`
      )
    }

    if (dateFrom) {
      query = query.gte('departure_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('departure_at', dateTo)
    }

    if (priceMin) {
      query = query.gte('price_per_seat', parseFloat(priceMin))
    }

    if (priceMax) {
      query = query.lte('price_per_seat', parseFloat(priceMax))
    }

    if (tripType) {
      query = query.eq('trip_type', tripType)
    }

    if (cabinClass) {
      query = query.eq('cabin_class', cabinClass)
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('price_per_seat', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price_per_seat', { ascending: false })
        break
      case 'date':
        query = query.order('departure_at', { ascending: true })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    query = query.range(offset, offset + limit - 1)

    const { data: trips, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      trips: trips || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new trip (provider only)
export async function POST(request: NextRequest) {
  try {
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

    // Verify user is a provider
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'provider') {
      return NextResponse.json(
        { data: null, error: 'Only providers can create trips' },
        { status: 403 }
      )
    }

    // Get provider record
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

    // Parse form data
    const formData = await request.formData()

    const rawData = {
      airline: formData.get('airline') as string,
      flight_number: (formData.get('flight_number') as string) || undefined,
      origin_city_ar: formData.get('origin_city_ar') as string,
      origin_city_en: (formData.get('origin_city_en') as string) || undefined,
      origin_code: (formData.get('origin_code') as string) || undefined,
      destination_city_ar: formData.get('destination_city_ar') as string,
      destination_city_en: (formData.get('destination_city_en') as string) || undefined,
      destination_code: (formData.get('destination_code') as string) || undefined,
      departure_at: formData.get('departure_at') as string,
      return_at: (formData.get('return_at') as string) || undefined,
      trip_type: formData.get('trip_type') as string,
      cabin_class: formData.get('cabin_class') as string,
      total_seats: Number(formData.get('total_seats')),
      price_per_seat: Number(formData.get('price_per_seat')),
      description_ar: (formData.get('description_ar') as string) || undefined,
      description_en: (formData.get('description_en') as string) || undefined,
    }

    const parsed = tripSchema.safeParse(rawData)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    // Upload image if provided
    let imageUrl: string | null = null
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
        imageUrl = publicUrl.publicUrl
      }
    }

    // Insert trip using admin client
    const { data: trip, error: insertError } = await supabaseAdmin
      .from('trips')
      .insert({
        provider_id: provider.id,
        airline: parsed.data.airline,
        flight_number: parsed.data.flight_number || null,
        origin_city_ar: parsed.data.origin_city_ar,
        origin_city_en: parsed.data.origin_city_en || null,
        origin_code: parsed.data.origin_code || null,
        destination_city_ar: parsed.data.destination_city_ar,
        destination_city_en: parsed.data.destination_city_en || null,
        destination_code: parsed.data.destination_code || null,
        departure_at: parsed.data.departure_at,
        return_at: parsed.data.return_at || null,
        trip_type: parsed.data.trip_type,
        cabin_class: parsed.data.cabin_class,
        total_seats: parsed.data.total_seats,
        booked_seats: 0,
        price_per_seat: parsed.data.price_per_seat,
        description_ar: parsed.data.description_ar || null,
        description_en: parsed.data.description_en || null,
        image_url: imageUrl,
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert trip:', insertError)
      return NextResponse.json(
        { data: null, error: 'Failed to create trip' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: trip, error: null }, { status: 201 })
  } catch (error) {
    console.error('Trip POST error:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
