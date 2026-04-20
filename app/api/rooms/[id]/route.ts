import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { roomSchema } from '@/lib/validations'
import { optimizeImage } from '@/lib/optimize-image'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: room, error } = await supabase
      .from('rooms')
      .select('*, provider:providers(*)')
      .eq('id', id)
      .single()

    if (error || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ room })
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

    const { data: existingRoom } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('id', id)
      .eq('provider_id', provider.id)
      .single()

    if (!existingRoom) {
      return NextResponse.json(
        { data: null, error: 'Room not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()

    const amenitiesRaw = formData.get('amenities') as string | null
    let amenities: string[] | undefined
    if (amenitiesRaw) {
      try {
        amenities = JSON.parse(amenitiesRaw)
      } catch {
        amenities = amenitiesRaw.split(',').map((s) => s.trim()).filter(Boolean)
      }
    }

    const rawData = {
      name_ar: (formData.get('name_ar') as string) || existingRoom.name_ar,
      name_en: (formData.get('name_en') as string) || existingRoom.name_en,
      description_ar: (formData.get('description_ar') as string) || existingRoom.description_ar,
      description_en: (formData.get('description_en') as string) || existingRoom.description_en,
      city_ar: (formData.get('city_ar') as string) || existingRoom.city_ar,
      city_en: (formData.get('city_en') as string) || existingRoom.city_en,
      address_ar: (formData.get('address_ar') as string) || existingRoom.address_ar,
      address_en: (formData.get('address_en') as string) || existingRoom.address_en,
      category: (formData.get('category') as string) || existingRoom.category,
      price_per_night: formData.get('price_per_night')
        ? Number(formData.get('price_per_night'))
        : existingRoom.price_per_night,
      currency: (formData.get('currency') as string) || existingRoom.currency,
      max_capacity: formData.get('max_capacity')
        ? Number(formData.get('max_capacity'))
        : existingRoom.max_capacity,
      amenities: amenities ?? existingRoom.amenities,
      instant_book: formData.get('instant_book') !== null
        ? formData.get('instant_book') === 'true'
        : existingRoom.instant_book,
      available_from: (formData.get('available_from') as string) || existingRoom.available_from,
      available_to: (formData.get('available_to') as string) || existingRoom.available_to,
      name_change_allowed: formData.get('name_change_allowed') !== null
        ? formData.get('name_change_allowed') === 'true'
        : existingRoom.name_change_allowed,
      name_change_fee: formData.get('name_change_fee') !== null
        ? Number(formData.get('name_change_fee'))
        : existingRoom.name_change_fee,
      name_change_is_refundable: formData.get('name_change_is_refundable') !== null
        ? formData.get('name_change_is_refundable') === 'true'
        : existingRoom.name_change_is_refundable,
    }

    const parsed = roomSchema.safeParse(rawData)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const existingImages: string[] = existingRoom.images || []
    const newImageFiles = formData.getAll('images') as File[]
    const newImageUrls: string[] = []

    for (let i = 0; i < newImageFiles.length; i++) {
      const file = newImageFiles[i]
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
        newImageUrls.push(publicUrl.publicUrl)
      }
    }

    const allImages = [...existingImages, ...newImageUrls]

    const { data: updatedRoom, error: updateError } = await supabaseAdmin
      .from('rooms')
      .update({
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
        images: allImages,
        instant_book: parsed.data.instant_book ?? false,
        available_from: parsed.data.available_from || null,
        available_to: parsed.data.available_to || null,
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
      console.error('Failed to update room:', updateError)
      return NextResponse.json(
        { data: null, error: 'Failed to update room' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedRoom, error: null })
  } catch (error) {
    console.error('Room PUT error:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
