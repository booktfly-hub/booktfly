import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: provider } = await supabaseAdmin
    .from('providers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!provider) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { pnr_code, ticket_number } = await request.json()

  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ pnr_code: pnr_code ?? null, ticket_number: ticket_number ?? null })
    .eq('id', id)
    .eq('provider_id', provider.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
