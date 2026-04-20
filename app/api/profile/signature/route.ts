import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({
  signature_data_url: z.string().regex(/^data:image\/png;base64,/),
})

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 10, windowMs: 60_000 })
  if (limited) return limited

  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const b64 = parsed.data.signature_data_url.replace(/^data:image\/png;base64,/, '')
  const buffer = Buffer.from(b64, 'base64')
  if (buffer.byteLength > 300 * 1024) return NextResponse.json({ error: 'Signature too large' }, { status: 413 })

  const path = `${user.id}/profile-${Date.now()}.png`
  const { error: uploadError } = await supabaseAdmin.storage
    .from('signatures')
    .upload(path, buffer, { contentType: 'image/png', upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: signed } = await supabaseAdmin.storage
    .from('signatures')
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10)
  const signature_url = signed?.signedUrl || path

  const { error } = await supabaseAdmin.from('profiles').update({ signature_url }).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, signature_url })
}

export async function DELETE() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabaseAdmin.from('profiles').update({ signature_url: null }).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
