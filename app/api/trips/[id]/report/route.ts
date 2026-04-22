import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { logActivity } from '@/lib/activity-log'
import { notifyAdmin } from '@/lib/notifications'

const schema = z.object({
  reason: z.enum(['spam', 'misleading_price', 'wrong_details', 'unreachable_provider', 'offensive', 'other']),
  details: z.string().max(1000).optional(),
  reporter_email: z.string().email().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, { limit: 3, windowMs: 60_000 })
  if (limited) return limited

  const { id: tripId } = await params
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trip } = await supabaseAdmin
    .from('trips')
    .select('id, origin_city_ar, destination_city_ar')
    .eq('id', tripId)
    .single()

  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  const { error } = await supabaseAdmin.from('trip_reports').insert({
    trip_id: tripId,
    reporter_id: user?.id ?? null,
    reporter_email: parsed.data.reporter_email ?? user?.email ?? null,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }

  logActivity('trip_reported', { userId: user?.id, metadata: { tripId, reason: parsed.data.reason } })

  await notifyAdmin({
    type: 'trip_reported',
    titleAr: 'بلاغ جديد عن رحلة',
    titleEn: 'New trip report',
    bodyAr: `بلاغ عن رحلة ${trip.origin_city_ar} إلى ${trip.destination_city_ar}: ${parsed.data.reason}`,
    bodyEn: `Trip reported (${trip.origin_city_ar} → ${trip.destination_city_ar}): ${parsed.data.reason}`,
    data: { trip_id: tripId, reason: parsed.data.reason },
  })

  return NextResponse.json({ success: true })
}
