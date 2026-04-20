import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { roomSchema } from '@/lib/validations'
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
    const capacityMin = searchParams.get('capacity_min')
    const checkIn = searchParams.get('check_in')
    const days = parseInt(searchParams.get('days') || '0', 10)
    const providerId = searchParams.get('provider_id')
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)

    const offset = (page - 1) * limit

    let query = supabase
      .from('rooms')
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
      query = query.gte('price_per_night', parseFloat(priceMin))
    }

    if (priceMax) {
      query = query.lte('price_per_night', parseFloat(priceMax))
    }

    if (capacityMin) {
      query = query.gte('max_capacity', parseInt(capacityMin, 10))
    }

    if (checkIn) {
      const checkInDate = new Date(checkIn)
      const checkOutDate = days > 0
        ? new Date(checkInDate.getTime() + days * 24 * 60 * 60 * 1000)
        : checkInDate
      const checkInStr = checkInDate.toISOString().split('T')[0]
      const checkOutStr = checkOutDate.toISOString().split('T')[0]
      query = query.or(`available_from.is.null,available_from.lte.${checkInStr}`)
      query = query.or(`available_to.is.null,available_to.gte.${checkOutStr}`)
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('price_per_night', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price_per_night', { ascending: false })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    query = query.range(offset, offset + limit - 1)

    const { data: rooms, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      rooms: rooms || [],
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
        { data: null, error: 'Only providers can create rooms' },
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

    const amenitiesRaw = formData.get('amenities') as string | null
    let amenities: string[] = []
    if (amenitiesRaw) {
      try {
        amenities = JSON.parse(amenitiesRaw)
      } catch {
        amenities = amenitiesRaw.split(',').map((s) => s.trim()).filter(Boolean)
      }
    }

    const rawData = {
      name_ar: formData.get('name_ar') as string,
      name_en: (formData.get('name_en') as string) || undefined,
      description_ar: (formData.get('description_ar') as string) || undefined,
      description_en: (formData.get('description_en') as string) || undefined,
      city_ar: formData.get('city_ar') as string,
      city_en: (formData.get('city_en') as string) || undefined,
      address_ar: (formData.get('address_ar') as string) || undefined,
      address_en: (formData.get('address_en') as string) || undefined,
      category: formData.get('category') as string,
      price_per_night: Number(formData.get('price_per_night')),
      currency: (formData.get('currency') as string) || 'SAR',
      max_capacity: Number(formData.get('max_capacity')),
      amenities,
      instant_book: formData.get('instant_book') === 'true',
      available_from: (formData.get('available_from') as string) || undefined,
      available_to: (formData.get('available_to') as string) || undefined,
      name_change_allowed: formData.get('name_change_allowed') === 'true',
      name_change_fee: formData.get('name_change_fee') ? Number(formData.get('name_change_fee')) : undefined,
      name_change_is_refundable: formData.get('name_change_is_refundable') !== 'false',
    }

    const parsed = roomSchema.safeParse(rawData)
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

      const filePath = `rooms/${provider.id}/${Date.now()}-${i}.webp`
      const rawBuffer = Buffer.from(await file.arrayBuffer())
      const { buffer, contentType } = await optimizeImage(rawBuffer)

      const { error: uploadError } = await supabaseAdmin.storage
        .from('room-images')
        .upload(filePath, buffer, {
          contentType,
          upsert: true,
        })

      if (!uploadError) {
        const { data: publicUrl } = supabaseAdmin.storage
          .from('room-images')
          .getPublicUrl(filePath)
        imageUrls.push(publicUrl.publicUrl)
      }
    }

    const { data: room, error: insertError } = await supabaseAdmin
      .from('rooms')
      .insert({
        provider_id: provider.id,
        name_ar: parsed.data.name_ar,
        name_en: parsed.data.name_en || null,
        description_ar: parsed.data.description_ar || null,
        description_en: parsed.data.description_en || null,
        city_ar: parsed.data.city_ar,
        city_en: parsed.data.city_en || null,
        address_ar: parsed.data.address_ar || null,
        address_en: parsed.data.address_en || null,
        category: parsed.data.category,
        price_per_night: parsed.data.price_per_night,
        currency: parsed.data.currency,
        max_capacity: parsed.data.max_capacity,
        amenities: parsed.data.amenities || [],
        images: imageUrls,
        instant_book: parsed.data.instant_book ?? false,
        available_from: parsed.data.available_from || null,
        available_to: parsed.data.available_to || null,
        name_change_allowed: parsed.data.name_change_allowed ?? false,
        name_change_fee: parsed.data.name_change_fee ?? 0,
        name_change_is_refundable: parsed.data.name_change_is_refundable ?? true,
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert room:', insertError)
      return NextResponse.json(
        { data: null, error: 'Failed to create room' },
        { status: 500 }
      )
    }

    logActivity('room_created', { userId: user.id, metadata: { roomId: room.id } })

    // Award provider 200 pts for adding a new offer
    after(async () => {
      try {
        await supabaseAdmin.from('provider_points_transactions').insert({
          provider_id: provider.id,
          points: 200,
          event_type: 'add_offer',
          reference_id: room.id,
          description_ar: 'نقاط إضافة عرض سكن جديد',
          description_en: 'Points for adding a new room offer',
        })

        await notify({
          userId: user.id,
          type: 'points_earned',
          titleAr: 'حصلت على 200 نقطة!',
          titleEn: 'You earned 200 points!',
          bodyAr: 'حصلت على 200 نقطة لإضافة عرض سكن جديد',
          bodyEn: 'You earned 200 points for adding a new room offer',
          data: { points: '200', event: 'add_offer' },
        })
      } catch (err) {
        console.error('Provider add_offer points error:', err)
      }
    })

    return NextResponse.json({ data: room, error: null }, { status: 201 })
  } catch (error) {
    console.error('Room POST error:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
