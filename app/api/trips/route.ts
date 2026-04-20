import { after, NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { tripSchema } from '@/lib/validations'
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

    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    const tripType = searchParams.get('trip_type')
    const cabinClass = searchParams.get('cabin_class')
    const directOnly = searchParams.get('direct_only')
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
      if (tripType === 'one_way') {
        // Show both one_way trips AND round_trip trips (user can book one-way on round-trip)
        query = query.in('trip_type', ['one_way', 'round_trip'])
      } else {
        query = query.eq('trip_type', tripType)
      }
    }

    if (cabinClass) {
      query = query.eq('cabin_class', cabinClass)
    }

    if (directOnly === 'true') {
      query = query.eq('is_direct', true)
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
      listing_type: (formData.get('listing_type') as string) || 'seats',
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
      cabin_class: formData.get('cabin_class') as string,
      total_seats: Number(formData.get('total_seats')),
      price_per_seat: Number(formData.get('price_per_seat')),
      price_per_seat_one_way: Number(formData.get('price_per_seat_one_way')),
      currency: (formData.get('currency') as string) || 'SAR',
      checked_baggage_kg: formData.get('checked_baggage_kg')
        ? Number(formData.get('checked_baggage_kg'))
        : undefined,
      cabin_baggage_kg: formData.get('cabin_baggage_kg')
        ? Number(formData.get('cabin_baggage_kg'))
        : undefined,
      meal_included: formData.get('meal_included') === 'true',
      seat_selection_included: formData.get('seat_selection_included') === 'true',
      seat_map_enabled: formData.get('seat_map_enabled') === 'true',
      seat_map_config: formData.get('seat_map_config')
        ? JSON.parse(formData.get('seat_map_config') as string)
        : undefined,
      description_ar: (formData.get('description_ar') as string) || undefined,
      description_en: (formData.get('description_en') as string) || undefined,
      name_change_allowed: formData.get('name_change_allowed') === 'true',
      name_change_fee: formData.get('name_change_fee') ? Number(formData.get('name_change_fee')) : undefined,
      name_change_is_refundable: formData.get('name_change_is_refundable') !== 'false',
      child_discount_percentage: formData.get('child_discount_percentage') ? Number(formData.get('child_discount_percentage')) : undefined,
      infant_discount_percentage: formData.get('infant_discount_percentage') ? Number(formData.get('infant_discount_percentage')) : undefined,
      special_discount_percentage: formData.get('special_discount_percentage') ? Number(formData.get('special_discount_percentage')) : undefined,
      special_discount_label_ar: (formData.get('special_discount_label_ar') as string) || undefined,
      special_discount_label_en: (formData.get('special_discount_label_en') as string) || undefined,
      commission_rate_override: formData.get('commission_rate_override') ? Number(formData.get('commission_rate_override')) : undefined,
      duration_minutes: formData.get('duration_minutes') ? Number(formData.get('duration_minutes')) : undefined,
      fare_tiers: formData.get('fare_tiers')
        ? JSON.parse(formData.get('fare_tiers') as string)
        : undefined,
    }

    const flightRequestId = (formData.get('flight_request_id') as string) || null

    const parsed = tripSchema.safeParse(rawData)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    // Upload image if provided
    let imageUrl: string | null = null
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
        imageUrl = publicUrl.publicUrl
      }
    }

    // Insert trip using admin client
    const { data: trip, error: insertError } = await supabaseAdmin
      .from('trips')
      .insert({
        provider_id: provider.id,
        listing_type: parsed.data.listing_type,
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
        trip_type: 'round_trip',
        cabin_class: parsed.data.cabin_class,
        total_seats: parsed.data.total_seats,
        booked_seats: 0,
        price_per_seat: parsed.data.price_per_seat,
        price_per_seat_one_way: parsed.data.price_per_seat_one_way,
        currency: parsed.data.currency,
        checked_baggage_kg: parsed.data.checked_baggage_kg || null,
        cabin_baggage_kg: parsed.data.cabin_baggage_kg || null,
        meal_included: parsed.data.meal_included || false,
        seat_selection_included: parsed.data.seat_selection_included || false,
        seat_map_enabled: parsed.data.seat_map_enabled || false,
        seat_map_config: parsed.data.seat_map_config || null,
        description_ar: parsed.data.description_ar || null,
        description_en: parsed.data.description_en || null,
        image_url: imageUrl,
        flight_request_id: flightRequestId,
        name_change_allowed: parsed.data.name_change_allowed || false,
        name_change_fee: parsed.data.name_change_fee ?? 0,
        name_change_is_refundable: parsed.data.name_change_is_refundable ?? true,
        child_discount_percentage: parsed.data.child_discount_percentage ?? 0,
        infant_discount_percentage: parsed.data.infant_discount_percentage ?? 0,
        special_discount_percentage: parsed.data.special_discount_percentage ?? 0,
        special_discount_label_ar: parsed.data.special_discount_label_ar || null,
        special_discount_label_en: parsed.data.special_discount_label_en || null,
        commission_rate_override: parsed.data.commission_rate_override ?? null,
        duration_minutes: parsed.data.duration_minutes ?? null,
        fare_tiers: parsed.data.fare_tiers ?? [],
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

    logActivity('trip_created', { userId: user.id, metadata: { tripId: trip.id } })

    // Notify buyer if this trip is linked to a flight request
    if (flightRequestId) {
      after(async () => {
        try {
          const { data: fr } = await supabaseAdmin
            .from('flight_requests')
            .select('user_id, marketeer_id, name, origin, destination')
            .eq('id', flightRequestId)
            .single()

          if (fr) {
            await supabaseAdmin
              .from('flight_requests')
              .update({ status: 'matched' })
              .eq('id', flightRequestId)

            const notifyUserId = fr.user_id || fr.marketeer_id
            if (notifyUserId) {
              await notify({
                userId: notifyUserId,
                type: 'trip_request_trip_matched',
                titleAr: 'تم إنشاء رحلة لطلبك!',
                titleEn: 'A trip was created for your request!',
                bodyAr: `تم إنشاء رحلة من ${fr.origin} إلى ${fr.destination} بناءً على طلبك`,
                bodyEn: `A trip from ${fr.origin} to ${fr.destination} was created based on your request`,
                data: { flight_request_id: flightRequestId, trip_id: trip.id },
              })
            }
          }
        } catch (err) {
          console.error('Flight request match notification error:', err)
        }
      })
    }

    // Award provider 200 pts for adding a new offer
    after(async () => {
      try {
        await supabaseAdmin.from('provider_points_transactions').insert({
          provider_id: provider.id,
          points: 200,
          event_type: 'add_offer',
          reference_id: trip.id,
          description_ar: 'نقاط إضافة عرض رحلة جديد',
          description_en: 'Points for adding a new trip offer',
        })

        await notify({
          userId: user.id,
          type: 'points_earned',
          titleAr: 'حصلت على 200 نقطة!',
          titleEn: 'You earned 200 points!',
          bodyAr: 'حصلت على 200 نقطة لإضافة عرض رحلة جديد',
          bodyEn: 'You earned 200 points for adding a new trip offer',
          data: { points: '200', event: 'add_offer' },
        })
      } catch (err) {
        console.error('Provider add_offer points error:', err)
      }
    })

    return NextResponse.json({ data: trip, error: null }, { status: 201 })
  } catch (error) {
    console.error('Trip POST error:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
