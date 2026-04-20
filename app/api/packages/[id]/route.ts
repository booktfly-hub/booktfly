import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { packageSchema } from '@/lib/validations'
import { optimizeImage } from '@/lib/optimize-image'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: pkg, error } = await supabase
      .from('packages')
      .select('*, provider:providers(*), trip:trips(*), room:rooms(*), car:cars(*)')
      .eq('id', id)
      .single()

    if (error || !pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ package: pkg })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { data: existingPkg } = await supabaseAdmin
      .from('packages')
      .select('*')
      .eq('id', id)
      .eq('provider_id', provider.id)
      .single()

    if (!existingPkg) {
      return NextResponse.json(
        { data: null, error: 'Package not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()

    const rawData = {
      name_ar: (formData.get('name_ar') as string) || existingPkg.name_ar,
      name_en: (formData.get('name_en') as string) || existingPkg.name_en,
      description_ar: (formData.get('description_ar') as string) || existingPkg.description_ar,
      description_en: (formData.get('description_en') as string) || existingPkg.description_en,
      destination_city_ar: (formData.get('destination_city_ar') as string) || existingPkg.destination_city_ar,
      destination_city_en: (formData.get('destination_city_en') as string) || existingPkg.destination_city_en,
      includes_flight: formData.get('includes_flight') !== null
        ? formData.get('includes_flight') === 'true'
        : existingPkg.includes_flight,
      includes_hotel: formData.get('includes_hotel') !== null
        ? formData.get('includes_hotel') === 'true'
        : existingPkg.includes_hotel,
      includes_car: formData.get('includes_car') !== null
        ? formData.get('includes_car') === 'true'
        : existingPkg.includes_car,
      trip_id: (formData.get('trip_id') as string) || existingPkg.trip_id,
      room_id: (formData.get('room_id') as string) || existingPkg.room_id,
      car_id: (formData.get('car_id') as string) || existingPkg.car_id,
      flight_airline: (formData.get('flight_airline') as string) || existingPkg.flight_airline,
      flight_number: (formData.get('flight_number') as string) || existingPkg.flight_number,
      flight_origin_ar: (formData.get('flight_origin_ar') as string) || existingPkg.flight_origin_ar,
      flight_origin_en: (formData.get('flight_origin_en') as string) || existingPkg.flight_origin_en,
      flight_origin_code: (formData.get('flight_origin_code') as string) || existingPkg.flight_origin_code,
      flight_destination_ar: (formData.get('flight_destination_ar') as string) || existingPkg.flight_destination_ar,
      flight_destination_en: (formData.get('flight_destination_en') as string) || existingPkg.flight_destination_en,
      flight_destination_code: (formData.get('flight_destination_code') as string) || existingPkg.flight_destination_code,
      flight_departure_at: (formData.get('flight_departure_at') as string) || existingPkg.flight_departure_at,
      flight_return_at: (formData.get('flight_return_at') as string) || existingPkg.flight_return_at,
      flight_cabin_class: (formData.get('flight_cabin_class') as string) || existingPkg.flight_cabin_class,
      flight_seats_included: formData.get('flight_seats_included')
        ? Number(formData.get('flight_seats_included'))
        : existingPkg.flight_seats_included,
      hotel_name_ar: (formData.get('hotel_name_ar') as string) || existingPkg.hotel_name_ar,
      hotel_name_en: (formData.get('hotel_name_en') as string) || existingPkg.hotel_name_en,
      hotel_category: (formData.get('hotel_category') as string) || existingPkg.hotel_category,
      hotel_nights: formData.get('hotel_nights')
        ? Number(formData.get('hotel_nights'))
        : existingPkg.hotel_nights,
      hotel_city_ar: (formData.get('hotel_city_ar') as string) || existingPkg.hotel_city_ar,
      hotel_city_en: (formData.get('hotel_city_en') as string) || existingPkg.hotel_city_en,
      car_brand_ar: (formData.get('car_brand_ar') as string) || existingPkg.car_brand_ar,
      car_brand_en: (formData.get('car_brand_en') as string) || existingPkg.car_brand_en,
      car_model_ar: (formData.get('car_model_ar') as string) || existingPkg.car_model_ar,
      car_model_en: (formData.get('car_model_en') as string) || existingPkg.car_model_en,
      car_category: (formData.get('car_category') as string) || existingPkg.car_category,
      car_rental_days: formData.get('car_rental_days')
        ? Number(formData.get('car_rental_days'))
        : existingPkg.car_rental_days,
      trip_price: formData.get('trip_price') ? Number(formData.get('trip_price')) : undefined,
      car_price: formData.get('car_price') ? Number(formData.get('car_price')) : undefined,
      hotel_price: formData.get('hotel_price') ? Number(formData.get('hotel_price')) : undefined,
      offer_price: formData.get('offer_price') ? Number(formData.get('offer_price')) : undefined,
      total_price: formData.get('total_price')
        ? Number(formData.get('total_price'))
        : existingPkg.total_price,
      original_price: existingPkg.original_price,
      currency: (formData.get('currency') as string) || existingPkg.currency,
      start_date: (formData.get('start_date') as string) || existingPkg.start_date,
      end_date: (formData.get('end_date') as string) || existingPkg.end_date,
      max_bookings: formData.get('max_bookings')
        ? Number(formData.get('max_bookings'))
        : existingPkg.max_bookings,
      name_change_allowed: formData.get('name_change_allowed') !== null
        ? formData.get('name_change_allowed') === 'true'
        : existingPkg.name_change_allowed,
      name_change_fee: formData.get('name_change_fee') !== null
        ? Number(formData.get('name_change_fee'))
        : existingPkg.name_change_fee,
      name_change_is_refundable: formData.get('name_change_is_refundable') !== null
        ? formData.get('name_change_is_refundable') === 'true'
        : existingPkg.name_change_is_refundable,
    }

    const parsed = packageSchema.safeParse(rawData)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const existingImagesRaw = formData.get('existing_images') as string | null
    const keptImages: string[] = existingImagesRaw
      ? JSON.parse(existingImagesRaw)
      : existingPkg.images || []
    const newImageFiles = formData.getAll('images') as File[]
    const newImageUrls: string[] = []

    for (let i = 0; i < newImageFiles.length; i++) {
      const file = newImageFiles[i]
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
        newImageUrls.push(publicUrl.publicUrl)
      }
    }

    const allImages = [...keptImages, ...newImageUrls]

    const { data: updatedPkg, error: updateError } = await supabaseAdmin
      .from('packages')
      .update({
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
        name_change_allowed: parsed.data.name_change_allowed ?? false,
        name_change_fee: parsed.data.name_change_fee ?? 0,
        name_change_is_refundable: parsed.data.name_change_is_refundable ?? true,
        images: allImages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('provider_id', provider.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update package:', updateError)
      return NextResponse.json(
        { data: null, error: 'Failed to update package' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedPkg, error: null })
  } catch (error) {
    console.error('Package PUT error:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
