import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { reason } = body as { reason: string }

    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Removal reason is required' }, { status: 400 })
    }

    // Fetch the trip to get provider info
    const { data: trip, error: fetchError } = await supabaseAdmin
      .from('trips')
      .select('*, providers:provider_id(user_id, company_name_ar)')
      .eq('id', id)
      .single()

    if (fetchError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.status === 'removed') {
      return NextResponse.json({ error: 'Trip is already removed' }, { status: 400 })
    }

    // Update trip status
    const { error: updateError } = await supabaseAdmin
      .from('trips')
      .update({
        status: 'removed',
        removed_reason: reason,
        removed_by: user.id,
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to remove trip' }, { status: 500 })
    }

    // Notify the provider
    const providerUserId = (trip.providers as { user_id: string })?.user_id
    if (providerUserId) {
      await notify({
        userId: providerUserId,
        type: 'trip_removed',
        titleAr: 'تم حذف رحلة',
        titleEn: 'Trip Removed',
        bodyAr: `تم حذف رحلتك من ${trip.origin_city_ar} إلى ${trip.destination_city_ar}. السبب: ${reason}`,
        bodyEn: `Your trip from ${trip.origin_city_en || trip.origin_city_ar} to ${trip.destination_city_en || trip.destination_city_ar} has been removed. Reason: ${reason}`,
        data: { trip_id: trip.id },
        email: {
          subject: 'Trip Removed - BooktFly',
          html: `<p>Your trip from <strong>${trip.origin_city_ar}</strong> to <strong>${trip.destination_city_ar}</strong> has been removed by an administrator.</p><p><strong>Reason:</strong> ${reason}</p>`,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
