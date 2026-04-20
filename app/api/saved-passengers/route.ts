import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('saved_passengers')
    .select('*')
    .eq('user_id', user.id)
    .order('is_self', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ passengers: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json()
  const required = ['first_name', 'last_name', 'date_of_birth', 'id_number', 'id_expiry_date']
  for (const key of required) {
    if (!body[key]) return NextResponse.json({ error: `${key} is required` }, { status: 400 })
  }

  const payload = {
    user_id: user.id,
    label: body.label ?? null,
    first_name: String(body.first_name).trim(),
    last_name: String(body.last_name).trim(),
    date_of_birth: body.date_of_birth,
    nationality_iso: body.nationality_iso ?? null,
    id_number: String(body.id_number).trim(),
    id_expiry_date: body.id_expiry_date,
    is_self: Boolean(body.is_self),
  }

  const { data, error } = await supabase
    .from('saved_passengers')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ passenger: data })
}
