import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: settings, error } = await supabaseAdmin
      .from('platform_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { default_commission_rate, terms_content_ar, terms_content_en } = body as {
      default_commission_rate?: number
      terms_content_ar?: string
      terms_content_en?: string
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}

    if (default_commission_rate !== undefined) {
      if (default_commission_rate < 0 || default_commission_rate > 100) {
        return NextResponse.json({ error: 'Commission rate must be between 0 and 100' }, { status: 400 })
      }
      updateData.default_commission_rate = default_commission_rate
    }

    if (terms_content_ar !== undefined) {
      updateData.terms_content_ar = terms_content_ar
    }

    if (terms_content_en !== undefined) {
      updateData.terms_content_en = terms_content_en
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    // Fetch current settings to get the ID
    const { data: currentSettings } = await supabaseAdmin
      .from('platform_settings')
      .select('id')
      .limit(1)
      .single()

    if (!currentSettings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    const { data: settings, error } = await supabaseAdmin
      .from('platform_settings')
      .update(updateData)
      .eq('id', currentSettings.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
