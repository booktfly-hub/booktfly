import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only the trip's provider or an admin can view
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    const { data: trip } = await supabaseAdmin
      .from('trips')
      .select('provider:providers(user_id)')
      .eq('id', id)
      .single()
    type ProvRef = { user_id?: string | null }
    const prov = (Array.isArray(trip?.provider) ? trip?.provider?.[0] : trip?.provider) as ProvRef | null
    if (prov?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('trip_price_history')
    .select('id, old_price, new_price, changed_at')
    .eq('trip_id', id)
    .order('changed_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
