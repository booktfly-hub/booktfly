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

  const { data: alerts, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }

  return NextResponse.json({ alerts: alerts || [] })
}

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { limit: 10, windowMs: 60_000 })
    if (limited) return limited

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { origin_code, destination_code, origin_name_ar, origin_name_en, destination_name_ar, destination_name_en, target_price, cabin_class } = body

    if (!origin_code || !destination_code) {
      return NextResponse.json({ error: 'Origin and destination required' }, { status: 400 })
    }

    // Check if alert already exists for this route
    const { data: existing } = await supabase
      .from('price_alerts')
      .select('id')
      .eq('user_id', user.id)
      .eq('origin_code', origin_code)
      .eq('destination_code', destination_code)
      .eq('is_active', true)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Alert already exists for this route' }, { status: 409 })
    }

    const { data: alert, error } = await supabaseAdmin
      .from('price_alerts')
      .insert({
        user_id: user.id,
        origin_code,
        destination_code,
        origin_name_ar: origin_name_ar || null,
        origin_name_en: origin_name_en || null,
        destination_name_ar: destination_name_ar || null,
        destination_name_en: destination_name_en || null,
        target_price: target_price || null,
        cabin_class: cabin_class || 'economy',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
    }

    return NextResponse.json({ alert }, { status: 201 })
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
  const alertId = searchParams.get('id')

  if (!alertId) {
    return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
