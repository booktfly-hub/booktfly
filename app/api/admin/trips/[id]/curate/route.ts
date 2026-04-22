import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/activity-log'
import type { CuratedCategory } from '@/types'

const CURATED_CATEGORIES: CuratedCategory[] = [
  'last_minute',
  'weekend_getaway',
  'hajj_season',
  'umrah_offer',
  'family_friendly',
  'featured',
]

type Body = {
  is_featured?: boolean
  featured_days?: number
  curated_category?: CuratedCategory | null
}

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
  const body = (await request.json()) as Body

  const update: Record<string, unknown> = {}

  if (typeof body.is_featured === 'boolean') {
    update.is_featured = body.is_featured
    if (body.is_featured) {
      const days = Math.min(Math.max(body.featured_days ?? 7, 1), 90)
      update.featured_until = new Date(Date.now() + days * 86_400_000).toISOString()
      update.featured_by = user.id
    } else {
      update.featured_until = null
      update.featured_by = null
    }
  }

  if ('curated_category' in body) {
    if (body.curated_category === null) {
      update.curated_category = null
    } else if (body.curated_category && CURATED_CATEGORIES.includes(body.curated_category)) {
      update.curated_category = body.curated_category
    } else {
      return NextResponse.json({ error: 'Invalid curated_category' }, { status: 400 })
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('trips')
    .update(update)
    .eq('id', id)
    .select('id, is_featured, featured_until, curated_category')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
  }

  logActivity('trip_curated', { userId: user.id, metadata: { tripId: id, ...update } })

  return NextResponse.json(data)
}
