import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ searches: [] })
  }

  const { data } = await supabase
    .from('recent_searches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({ searches: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: true })
  }

  const body = await request.json()

  await supabaseAdmin.from('recent_searches').insert({
    user_id: user.id,
    search_type: body.search_type || 'flight',
    origin_code: body.origin_code || null,
    destination_code: body.destination_code || null,
    origin_name_ar: body.origin_name_ar || null,
    origin_name_en: body.origin_name_en || null,
    destination_name_ar: body.destination_name_ar || null,
    destination_name_en: body.destination_name_en || null,
    departure_date: body.departure_date || null,
    return_date: body.return_date || null,
    trip_type: body.trip_type || null,
    passengers: body.passengers || 1,
    cabin_class: body.cabin_class || null,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
