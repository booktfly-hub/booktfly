import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { packageSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'
import { optimizeImage } from '@/lib/optimize-image'
import { notify } from '@/lib/notifications'
import { logActivity } from '@/lib/activity-log'

export async function GET(request: NextRequest) {
  try {
    const limited = rateLimit(request, { limit: 30, windowMs: 60_000 })
    if (limited) return limited

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const destination = searchParams.get('destination')
    const includesFlight = searchParams.get('includes_flight')
    const includesHotel = searchParams.get('includes_hotel')
    const includesCar = searchParams.get('includes_car')
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const providerId = searchParams.get('provider_id')
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    const offset = (page - 1) * limit

    let query = supabase
      .from('packages')
      .select('*, provider:providers(*), trip:trips(*), room:rooms(*), car:cars(*)', { count: 'exact' })
      .eq('status', 'active')

    if (providerId) {
      query = query.eq('provider_id', providerId)
    }

    if (destination) {
      query = query.or(
        `destination_city_ar.ilike.%${destination}%,destination_city_en.ilike.%${destination}%`
      )
    }

    if (includesFlight === 'true') {
      query = query.eq('includes_flight', true)
    }

    if (includesHotel === 'true') {
      query = query.eq('includes_hotel', true)
    }

    if (includesCar === 'true') {
      query = query.eq('includes_car', true)
    }

    if (priceMin) {
      query = query.gte('total_price', parseFloat(priceMin))
    }

    if (priceMax) {
      query = query.lte('total_price', parseFloat(priceMax))
    }

    if (startDate) {
      const start = new Date(startDate)
      const startStr = start.toISOString().split('T')[0]
      query = query.or(`start_date.is.null,start_date.gte.${startStr}`)
    }

    if (endDate) {
      const end = new Date(endDate)
      const endStr = end.toISOString().split('T')[0]
      query = query.or(`end_date.is.null,end_date.lte.${endStr}`)
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('total_price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('total_price', { ascending: false })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    query = query.range(offset, offset + limit - 1)

    const { data: packages, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      packages: packages || [],
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

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { limit: 10, windowMs: 60_000 })
    if (limited) return limited

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'provider') {
      return NextResponse.json(
        { data: null, error: 'Only providers can create packages' },
        { status: 403 }
      )
    }

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

    const formData = await request.formData()

    const rawData = {
      name_ar: formData.get('name_ar') as string,
      name_en: (formData.get('name_en') as string) || undefined,
      description_ar: (formData.get('description_ar') as string) || undefined,
      description_en: (formData.get('description_en') as string) || undefined,
      destination_city_ar: formData.get('destination_city_ar') as string,
      destination_city_en: (formData.get('destination_city_en') as string) || undefined,
      includes_flight: formData.get('includes_flight') === 'true',
      includes_hotel: formData.get('includes_hotel') === 'true',
      includes_car: formData.get('includes_car') === 'true',
      trip_id: (formData.get('trip_id') as string) || undefined,
      room_id: (formData.get('room_id') as string) || undefined,
      car_id: (formData.get('car_id') as string) || undefined,
      flight_airline: (formData.get('flight_airline') as string) || undefined,
      flight_number: (formData.get('flight_number') as string) || undefined,
      flight_origin_ar: (formData.get('flight_origin_ar') as string) || undefined,
      flight_origin_en: (formData.get('flight_origin_en') as string) || undefined,
      flight_origin_code: (formData.get('flight_origin_code') as string) || undefined,
      flight_destination_ar: (formData.get('flight_destination_ar') as string) || undefined,
      flight_destination_en: (formData.get('flight_destination_en') as string) || undefined,
      flight_destination_code: (formData.get('flight_destination_code') as string) || undefined,
      flight_departure_at: (formData.get('flight_departure_at') as string) || undefined,
      flight_return_at: (formData.get('flight_return_at') as string) || undefined,
      flight_cabin_class: (formData.get('flight_cabin_class') as string) || undefined,
      flight_seats_included: formData.get('flight_seats_included')
        ? Number(formData.get('flight_seats_included'))
        : undefined,
      hotel_name_ar: (formData.get('hotel_name_ar') as string) || undefined,
      hotel_name_en: (formData.get('hotel_name_en') as string) || undefined,
      hotel_category: (formData.get('hotel_category') as string) || undefined,
      hotel_nights: formData.get('hotel_nights')
        ? Number(formData.get('hotel_nights'))
        : undefined,
      duration_days: formData.get('duration_days')
        ? Number(formData.get('duration_days'))
        : undefined,
      room_basis: (formData.get('room_basis') as string) || undefined,
      breakfast_included: formData.get('breakfast_included') === 'true',
      airport_transfer_included: formData.get('airport_transfer_included') === 'true',
      tour_guide_included: formData.get('tour_guide_included') === 'true',
      sightseeing_tours_included: formData.get('sightseeing_tours_included') === 'true',
      hotel_city_ar: (formData.get('hotel_city_ar') as string) || undefined,
      hotel_city_en: (formData.get('hotel_city_en') as string) || undefined,
      car_brand_ar: (formData.get('car_brand_ar') as string) || undefined,
      car_brand_en: (formData.get('car_brand_en') as string) || undefined,
      car_model_ar: (formData.get('car_model_ar') as string) || undefined,
      car_model_en: (formData.get('car_model_en') as string) || undefined,
      car_category: (formData.get('car_category') as string) || undefined,
      car_rental_days: formData.get('car_rental_days')
        ? Number(formData.get('car_rental_days'))
        : undefined,
      trip_price: formData.get('trip_price') ? Number(formData.get('trip_price')) : undefined,
      car_price: formData.get('car_price') ? Number(formData.get('car_price')) : undefined,
      hotel_price: formData.get('hotel_price') ? Number(formData.get('hotel_price')) : undefined,
      offer_price: formData.get('offer_price') ? Number(formData.get('offer_price')) : undefined,
      total_price: Number(formData.get('total_price')),
      original_price: formData.get('original_price')
        ? Number(formData.get('original_price'))
        : undefined,
      currency: (formData.get('currency') as string) || 'SAR',
      start_date: (formData.get('start_date') as string) || undefined,
      end_date: (formData.get('end_date') as string) || undefined,
      max_bookings: formData.get('max_bookings')
        ? Number(formData.get('max_bookings'))
        : undefined,
    }

    const parsed = packageSchema.safeParse(rawData)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const imageFiles = formData.getAll('images') as File[]
    const imageUrls: string[] = []

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      if (!file || file.size === 0) continue

      const filePath = `packages/${provider.id}/${Date.now()}-${i}.webp`
      const rawBuffer = Buffer.from(await file.arrayBuffer())
      const { buffer, contentType } = await optimizeImage(rawBuffer)

      const { error: uploadError } = await supabaseAdmin.storage
        .from('package-images')
        .upload(filePath, buffer, {
          contentType,
          upsert: true,
        })

      if (!uploadError) {
        const { data: publicUrl } = supabaseAdmin.storage
          .from('package-images')
          .getPublicUrl(filePath)
        imageUrls.push(publicUrl.publicUrl)
      }
    }

    const { data: pkg, error: insertError } = await supabaseAdmin
      .from('packages')
      .insert({
        provider_id: provider.id,
        name_ar: parsed.data.name_ar,
        name_en: parsed.data.name_en || null,
        description_ar: parsed.data.description_ar || null,
        description_en: parsed.data.description_en || null,
        destination_city_ar: parsed.data.destination_city_ar,
        destination_city_en: parsed.data.destination_city_en || null,
        includes_flight: parsed.data.includes_flight,
        includes_hotel: parsed.data.includes_hotel,
        includes_car: parsed.data.includes_car,
        trip_id: parsed.data.trip_id || null,
        room_id: parsed.data.room_id || null,
        car_id: parsed.data.car_id || null,
        flight_airline: parsed.data.flight_airline || null,
        flight_number: parsed.data.flight_number || null,
        flight_origin_ar: parsed.data.flight_origin_ar || null,
        flight_origin_en: parsed.data.flight_origin_en || null,
        flight_origin_code: parsed.data.flight_origin_code || null,
        flight_destination_ar: parsed.data.flight_destination_ar || null,
        flight_destination_en: parsed.data.flight_destination_en || null,
        flight_destination_code: parsed.data.flight_destination_code || null,
        flight_departure_at: parsed.data.flight_departure_at || null,
        flight_return_at: parsed.data.flight_return_at || null,
        flight_cabin_class: parsed.data.flight_cabin_class || null,
        flight_seats_included: parsed.data.flight_seats_included || null,
        hotel_name_ar: parsed.data.hotel_name_ar || null,
        hotel_name_en: parsed.data.hotel_name_en || null,
        hotel_category: parsed.data.hotel_category || null,
        hotel_nights: parsed.data.hotel_nights || null,
        duration_days: parsed.data.duration_days || null,
        room_basis: parsed.data.room_basis || null,
        breakfast_included: parsed.data.breakfast_included || false,
        airport_transfer_included: parsed.data.airport_transfer_included || false,
        tour_guide_included: parsed.data.tour_guide_included || false,
        sightseeing_tours_included: parsed.data.sightseeing_tours_included || false,
        hotel_city_ar: parsed.data.hotel_city_ar || null,
        hotel_city_en: parsed.data.hotel_city_en || null,
        car_brand_ar: parsed.data.car_brand_ar || null,
        car_brand_en: parsed.data.car_brand_en || null,
        car_model_ar: parsed.data.car_model_ar || null,
        car_model_en: parsed.data.car_model_en || null,
        car_category: parsed.data.car_category || null,
        car_rental_days: parsed.data.car_rental_days || null,
        trip_price: parsed.data.trip_price ?? null,
        car_price: parsed.data.car_price ?? null,
        hotel_price: parsed.data.hotel_price ?? null,
        total_price: parsed.data.offer_price ?? parsed.data.total_price,
        original_price: parsed.data.offer_price ? parsed.data.total_price : null,
        currency: parsed.data.currency,
        start_date: parsed.data.start_date || null,
        end_date: parsed.data.end_date || null,
        max_bookings: parsed.data.max_bookings || null,
        images: imageUrls,
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert package:', insertError)
      return NextResponse.json(
        { data: null, error: 'Failed to create package' },
        { status: 500 }
      )
    }

    logActivity('package_created', { userId: user.id, metadata: { packageId: pkg.id } })

    after(async () => {
      try {
        await supabaseAdmin.from('provider_points_transactions').insert({
          provider_id: provider.id,
          points: 200,
          event_type: 'add_offer',
          reference_id: pkg.id,
          description_ar: 'نقاط إضافة باقة جديدة',
          description_en: 'Points for adding a new package offer',
        })

        await notify({
          userId: user.id,
          type: 'points_earned',
          titleAr: 'حصلت على 200 نقطة!',
          titleEn: 'You earned 200 points!',
          bodyAr: 'حصلت على 200 نقطة لإضافة باقة جديدة',
          bodyEn: 'You earned 200 points for adding a new package offer',
          data: { points: '200', event: 'add_offer' },
        })
      } catch (err) {
        console.error('Provider add_offer points error:', err)
      }
    })

    return NextResponse.json({ data: pkg, error: null }, { status: 201 })
  } catch (error) {
    console.error('Package POST error:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
