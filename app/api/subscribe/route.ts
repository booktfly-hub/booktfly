import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { email, source } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const supabase = supabaseAdmin
    const { error } = await supabase
      .from('subscribers')
      .upsert({ email: normalized, source: source || 'modal' }, { onConflict: 'email' })

    if (error) {
      // Table might not exist yet — return success anyway to not block UX
      console.error('Subscribe upsert error:', error.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Subscribe route error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
