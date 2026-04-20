import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

async function requireAdmin() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const kind = new URL(request.url).searchParams.get('kind') || 'email'
  const table = kind === 'whatsapp' ? 'whatsapp_templates' : 'email_templates'
  const { data } = await supabaseAdmin.from(table).select('*').order('slug', { ascending: true })
  return NextResponse.json({ data: data ?? [] })
}

const emailUpdateSchema = z.object({
  id: z.string().uuid(),
  subject_ar: z.string().min(1),
  subject_en: z.string().min(1),
  body_html_ar: z.string().min(1),
  body_html_en: z.string().min(1),
  enabled: z.boolean().optional(),
})

const whatsappUpdateSchema = z.object({
  id: z.string().uuid(),
  body_ar: z.string().min(1),
  body_en: z.string().min(1),
  enabled: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const kind = new URL(request.url).searchParams.get('kind') || 'email'
  const body = await request.json()
  if (kind === 'whatsapp') {
    const parsed = whatsappUpdateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const { id, ...patch } = parsed.data
    const { error } = await supabaseAdmin
      .from('whatsapp_templates')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const parsed = emailUpdateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const { id, ...patch } = parsed.data
    const { error } = await supabaseAdmin
      .from('email_templates')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
