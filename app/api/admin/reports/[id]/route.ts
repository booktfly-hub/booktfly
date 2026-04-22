import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const schema = z.object({
  status: z.enum(['reviewing', 'resolved', 'dismissed']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const update: Record<string, unknown> = { status: parsed.data.status }
  if (parsed.data.status === 'resolved' || parsed.data.status === 'dismissed') {
    update.resolved_by = user.id
    update.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('trip_reports')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })

  return NextResponse.json(data)
}
