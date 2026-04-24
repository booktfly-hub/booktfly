import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { carSchema } from '@/lib/validations'
import { optimizeImage } from '@/lib/optimize-image'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: car, error } = await supabase
      .from('cars')
      .select('*, provider:providers(*)')
      .eq('id', id)
      .single()

    if (error || !car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ car })
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

    const { data: existingCar } = await supabaseAdmin
      .from('cars')
      .select('*')
      .eq('id', id)
      .eq('provider_id', provider.id)
      .single()

    if (!existingCar) {
      return NextResponse.json(
        { data: null, error: 'Car not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()

    const featuresRaw = formData.get('features') as string | null
    let features: string[] | undefined
    if (featuresRaw) {
      try {
        features = JSON.parse(featuresRaw)
      } catch {
        features = featuresRaw.split(',').map((s) => s.trim()).filter(Boolean)
      }
    }

    const rawData = {
      brand_ar: (formData.get('brand_ar') as string) || existingCar.brand_ar,
      brand_en: (formData.get('brand_en') as string) || existingCar.brand_en,
      model_ar: (formData.get('model_ar') as string) || existingCar.model_ar,
      model_en: (formData.get('model_en') as string) || existingCar.model_en,
      year: formData.get('year')
        ? Number(formData.get('year'))
        : existingCar.year,
      city_ar: (formData.get('city_ar') as string) || existingCar.city_ar,
      city_en: (formData.get('city_en') as string) || existingCar.city_en,
      category: (formData.get('category') as string) || existingCar.category,
      price_per_day: formData.get('price_per_day')
        ? Number(formData.get('price_per_day'))
        : existingCar.price_per_day,
      currency: (formData.get('currency') as string) || existingCar.currency,
      seats_count: formData.get('seats_count')
        ? Number(formData.get('seats_count'))
        : existingCar.seats_count,
      transmission: (formData.get('transmission') as string) || existingCar.transmission,
      fuel_type: (formData.get('fuel_type') as string) || existingCar.fuel_type,
      features: features ?? existingCar.features,
      instant_book: formData.get('instant_book') !== null
        ? formData.get('instant_book') === 'true'
        : existingCar.instant_book,
      available_from: (formData.get('available_from') as string) || existingCar.available_from,
      available_to: (formData.get('available_to') as string) || existingCar.available_to,
      pickup_type: (formData.get('pickup_type') as string) || existingCar.pickup_type,
      pickup_branch_name_ar: (formData.get('pickup_branch_name_ar') as string) || existingCar.pickup_branch_name_ar,
      pickup_branch_name_en: (formData.get('pickup_branch_name_en') as string) || existingCar.pickup_branch_name_en,
      return_type: (formData.get('return_type') as string) || existingCar.return_type,
      return_branch_name_ar: (formData.get('return_branch_name_ar') as string) || existingCar.return_branch_name_ar,
      return_branch_name_en: (formData.get('return_branch_name_en') as string) || existingCar.return_branch_name_en,
      pickup_hour_from: (formData.get('pickup_hour_from') as string) || existingCar.pickup_hour_from,
      pickup_hour_to: (formData.get('pickup_hour_to') as string) || existingCar.pickup_hour_to,
      return_hour_from: (formData.get('return_hour_from') as string) || existingCar.return_hour_from,
      return_hour_to: (formData.get('return_hour_to') as string) || existingCar.return_hour_to,
      contact_phone: (formData.get('contact_phone') as string) || existingCar.contact_phone,
      name_change_allowed: formData.get('name_change_allowed') !== null
        ? formData.get('name_change_allowed') === 'true'
        : existingCar.name_change_allowed,
      name_change_fee: formData.get('name_change_fee') !== null
        ? Number(formData.get('name_change_fee'))
        : existingCar.name_change_fee,
      name_change_is_refundable: formData.get('name_change_is_refundable') !== null
        ? formData.get('name_change_is_refundable') === 'true'
        : existingCar.name_change_is_refundable,
    }

    const parsed = carSchema.safeParse(rawData)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const pickupData = {
      pickup_location_ar: (formData.get('pickup_location_ar') as string) || existingCar.pickup_location_ar,
      pickup_location_en: (formData.get('pickup_location_en') as string) || existingCar.pickup_location_en,
      pickup_latitude: formData.get('pickup_latitude')
        ? Number(formData.get('pickup_latitude'))
        : existingCar.pickup_latitude,
      pickup_longitude: formData.get('pickup_longitude')
        ? Number(formData.get('pickup_longitude'))
        : existingCar.pickup_longitude,
    }

    const existingImagesRaw = formData.get('existing_images') as string | null
    const keptImages: string[] = existingImagesRaw
      ? JSON.parse(existingImagesRaw)
      : existingCar.images || []
    const newImageFiles = formData.getAll('images') as File[]
    const newImageUrls: string[] = []

    for (let i = 0; i < newImageFiles.length; i++) {
      const file = newImageFiles[i]
      if (!file || file.size === 0) continue

      const filePath = `cars/${provider.id}/${Date.now()}-${i}.webp`
      const rawBuffer = Buffer.from(await file.arrayBuffer())
      const { buffer, contentType } = await optimizeImage(rawBuffer)

      const { error: uploadError } = await supabaseAdmin.storage
        .from('car-images')
        .upload(filePath, buffer, {
          contentType,
          upsert: true,
        })

      if (!uploadError) {
        const { data: publicUrl } = supabaseAdmin.storage
          .from('car-images')
          .getPublicUrl(filePath)
        newImageUrls.push(publicUrl.publicUrl)
      }
    }

    const allImages = [...keptImages, ...newImageUrls]

    const { data: updatedCar, error: updateError } = await supabaseAdmin
      .from('cars')
      .update({
        brand_ar: parsed.data.brand_ar,
        brand_en: parsed.data.brand_en || null,
        model_ar: parsed.data.model_ar,
        model_en: parsed.data.model_en || null,
        year: parsed.data.year,
        city_ar: parsed.data.city_ar,
        city_en: parsed.data.city_en || null,
        category: parsed.data.category,
        price_per_day: parsed.data.price_per_day,
        currency: parsed.data.currency,
        seats_count: parsed.data.seats_count,
        transmission: parsed.data.transmission,
        fuel_type: parsed.data.fuel_type,
        features: parsed.data.features || [],
        images: allImages,
        instant_book: parsed.data.instant_book ?? false,
        available_from: parsed.data.available_from || null,
        available_to: parsed.data.available_to || null,
        pickup_location_ar: pickupData.pickup_location_ar || null,
        pickup_location_en: pickupData.pickup_location_en || null,
        pickup_latitude: pickupData.pickup_latitude || null,
        pickup_longitude: pickupData.pickup_longitude || null,
        pickup_type: parsed.data.pickup_type || null,
        pickup_branch_name_ar: parsed.data.pickup_branch_name_ar || null,
        pickup_branch_name_en: parsed.data.pickup_branch_name_en || null,
        return_type: parsed.data.return_type || null,
        return_branch_name_ar: parsed.data.return_branch_name_ar || null,
        return_branch_name_en: parsed.data.return_branch_name_en || null,
        pickup_hour_from: parsed.data.pickup_hour_from || null,
        pickup_hour_to: parsed.data.pickup_hour_to || null,
        return_hour_from: parsed.data.return_hour_from || null,
        return_hour_to: parsed.data.return_hour_to || null,
        contact_phone: parsed.data.contact_phone || null,
        name_change_allowed: parsed.data.name_change_allowed ?? false,
        name_change_fee: parsed.data.name_change_fee ?? 0,
        name_change_is_refundable: parsed.data.name_change_is_refundable ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('provider_id', provider.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update car:', updateError)
      return NextResponse.json(
        { data: null, error: 'Failed to update car' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedCar, error: null })
  } catch (error) {
    console.error('Car PUT error:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
