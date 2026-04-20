import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { carSchema } from '@/lib/validations'
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

    const city = searchParams.get('city')
    const category = searchParams.get('category')
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    const transmission = searchParams.get('transmission')
    const fuelType = searchParams.get('fuel_type')
    const pickupDate = searchParams.get('pickup_date')
    const returnDate = searchParams.get('return_date')
    const providerId = searchParams.get('provider_id')
    const pickupType = searchParams.get('pickup_type')
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    const offset = (page - 1) * limit

    let query = supabase
      .from('cars')
      .select('*, provider:providers(*)', { count: 'exact' })
      .eq('status', 'active')

    if (providerId) {
      query = query.eq('provider_id', providerId)
    }

    if (city) {
      query = query.or(
        `city_ar.ilike.%${city}%,city_en.ilike.%${city}%`
      )
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (priceMin) {
      query = query.gte('price_per_day', parseFloat(priceMin))
    }

    if (priceMax) {
      query = query.lte('price_per_day', parseFloat(priceMax))
    }

    if (transmission) {
      query = query.eq('transmission', transmission)
    }

    if (fuelType) {
      query = query.eq('fuel_type', fuelType)
    }

    if (pickupType) {
      query = query.eq('pickup_type', pickupType)
    }

    if (pickupDate) {
      const pickup = new Date(pickupDate)
      const pickupStr = pickup.toISOString().split('T')[0]
      query = query.or(`available_from.is.null,available_from.lte.${pickupStr}`)
    }

    if (returnDate) {
      const returnD = new Date(returnDate)
      const returnStr = returnD.toISOString().split('T')[0]
      query = query.or(`available_to.is.null,available_to.gte.${returnStr}`)
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('price_per_day', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price_per_day', { ascending: false })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    query = query.range(offset, offset + limit - 1)

    const { data: cars, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      cars: cars || [],
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
        { data: null, error: 'Only providers can create cars' },
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

    const featuresRaw = formData.get('features') as string | null
    let features: string[] = []
    if (featuresRaw) {
      try {
        features = JSON.parse(featuresRaw)
      } catch {
        features = featuresRaw.split(',').map((s) => s.trim()).filter(Boolean)
      }
    }

    const pickupLat = formData.get('pickup_latitude') as string | null
    const pickupLng = formData.get('pickup_longitude') as string | null

    const rawData = {
      brand_ar: formData.get('brand_ar') as string,
      brand_en: (formData.get('brand_en') as string) || undefined,
      model_ar: formData.get('model_ar') as string,
      model_en: (formData.get('model_en') as string) || undefined,
      year: Number(formData.get('year')),
      city_ar: formData.get('city_ar') as string,
      city_en: (formData.get('city_en') as string) || undefined,
      category: formData.get('category') as string,
      price_per_day: Number(formData.get('price_per_day')),
      currency: (formData.get('currency') as string) || 'SAR',
      seats_count: Number(formData.get('seats_count')),
      transmission: formData.get('transmission') as string,
      fuel_type: formData.get('fuel_type') as string,
      features,
      instant_book: formData.get('instant_book') === 'true',
      available_from: (formData.get('available_from') as string) || undefined,
      available_to: (formData.get('available_to') as string) || undefined,
      pickup_location_ar: (formData.get('pickup_location_ar') as string) || undefined,
      pickup_location_en: (formData.get('pickup_location_en') as string) || undefined,
      pickup_latitude: pickupLat ? Number(pickupLat) : undefined,
      pickup_longitude: pickupLng ? Number(pickupLng) : undefined,
      pickup_type: (formData.get('pickup_type') as string) || undefined,
      pickup_branch_name_ar: (formData.get('pickup_branch_name_ar') as string) || undefined,
      pickup_branch_name_en: (formData.get('pickup_branch_name_en') as string) || undefined,
      return_type: (formData.get('return_type') as string) || undefined,
      return_branch_name_ar: (formData.get('return_branch_name_ar') as string) || undefined,
      return_branch_name_en: (formData.get('return_branch_name_en') as string) || undefined,
      pickup_hour_from: (formData.get('pickup_hour_from') as string) || undefined,
      pickup_hour_to: (formData.get('pickup_hour_to') as string) || undefined,
      return_hour_from: (formData.get('return_hour_from') as string) || undefined,
      return_hour_to: (formData.get('return_hour_to') as string) || undefined,
      name_change_allowed: formData.get('name_change_allowed') === 'true',
      name_change_fee: formData.get('name_change_fee') ? Number(formData.get('name_change_fee')) : undefined,
      name_change_is_refundable: formData.get('name_change_is_refundable') !== 'false',
    }

    const parsed = carSchema.safeParse(rawData)
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
        imageUrls.push(publicUrl.publicUrl)
      }
    }

    const { data: car, error: insertError } = await supabaseAdmin
      .from('cars')
      .insert({
        provider_id: provider.id,
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
        images: imageUrls,
        instant_book: parsed.data.instant_book ?? false,
        available_from: parsed.data.available_from || null,
        available_to: parsed.data.available_to || null,
        pickup_location_ar: parsed.data.pickup_location_ar || null,
        pickup_location_en: parsed.data.pickup_location_en || null,
        pickup_latitude: parsed.data.pickup_latitude || null,
        pickup_longitude: parsed.data.pickup_longitude || null,
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
        name_change_allowed: parsed.data.name_change_allowed ?? false,
        name_change_fee: parsed.data.name_change_fee ?? 0,
        name_change_is_refundable: parsed.data.name_change_is_refundable ?? true,
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert car:', insertError)
      return NextResponse.json(
        { data: null, error: 'Failed to create car' },
        { status: 500 }
      )
    }

    logActivity('car_created', { userId: user.id, metadata: { carId: car.id } })

    // Award provider 200 pts for adding a new offer
    after(async () => {
      try {
        await supabaseAdmin.from('provider_points_transactions').insert({
          provider_id: provider.id,
          points: 200,
          event_type: 'add_offer',
          reference_id: car.id,
          description_ar: 'نقاط إضافة عرض سيارة جديد',
          description_en: 'Points for adding a new car offer',
        })

        await notify({
          userId: user.id,
          type: 'points_earned',
          titleAr: 'حصلت على 200 نقطة!',
          titleEn: 'You earned 200 points!',
          bodyAr: 'حصلت على 200 نقطة لإضافة عرض سيارة جديد',
          bodyEn: 'You earned 200 points for adding a new car offer',
          data: { points: '200', event: 'add_offer' },
        })
      } catch (err) {
        console.error('Provider add_offer points error:', err)
      }
    })

    return NextResponse.json({ data: car, error: null }, { status: 201 })
  } catch (error) {
    console.error('Car POST error:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
