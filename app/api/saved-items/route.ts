import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const itemType = searchParams.get('item_type')
  const includeData = searchParams.get('include_data') === 'true'

  let query = supabase
    .from('saved_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (itemType) query = query.eq('item_type', itemType)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch saved items' }, { status: 500 })
  }

  const items = data || []

  if (!includeData || items.length === 0) {
    return NextResponse.json({ items })
  }

  const tripIds = items.filter(i => i.item_type === 'trip').map(i => i.item_id)
  const roomIds = items.filter(i => i.item_type === 'room').map(i => i.item_id)
  const carIds = items.filter(i => i.item_type === 'car').map(i => i.item_id)
  const packageIds = items.filter(i => i.item_type === 'package').map(i => i.item_id)

  const [tripsRes, roomsRes, carsRes, packagesRes] = await Promise.all([
    tripIds.length ? supabase.from('trips').select('*, provider:providers(*)').in('id', tripIds) : Promise.resolve({ data: [] }),
    roomIds.length ? supabase.from('rooms').select('*, provider:providers(*)').in('id', roomIds) : Promise.resolve({ data: [] }),
    carIds.length ? supabase.from('cars').select('*, provider:providers(*)').in('id', carIds) : Promise.resolve({ data: [] }),
    packageIds.length ? supabase.from('packages').select('*, provider:providers(*)').in('id', packageIds) : Promise.resolve({ data: [] }),
  ])

  return NextResponse.json({
    items,
    trips: tripsRes.data || [],
    rooms: roomsRes.data || [],
    cars: carsRes.data || [],
    packages: packagesRes.data || [],
  })
}

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { limit: 20, windowMs: 60_000 })
    if (limited) return limited

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { item_type, item_id } = await request.json()

    if (!item_type || !item_id) {
      return NextResponse.json({ error: 'item_type and item_id required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('saved_items')
      .insert({ user_id: user.id, item_type, item_id })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already saved' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to save item' }, { status: 500 })
    }

    return NextResponse.json({ item: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const itemType = searchParams.get('item_type')
  const itemId = searchParams.get('item_id')

  if (!itemType || !itemId) {
    return NextResponse.json({ error: 'item_type and item_id required' }, { status: 400 })
  }

  await supabase
    .from('saved_items')
    .delete()
    .eq('user_id', user.id)
    .eq('item_type', itemType)
    .eq('item_id', itemId)

  return NextResponse.json({ success: true })
}
