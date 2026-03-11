import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'

export async function GET(
  _request: Request,
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

    const { data: provider, error } = await supabaseAdmin
      .from('providers')
      .select('*, profiles:user_id(full_name, email, avatar_url)')
      .eq('id', id)
      .single()

    if (error || !provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Fetch provider stats
    const [tripsResult, bookingsResult] = await Promise.all([
      supabaseAdmin
        .from('trips')
        .select('id, status')
        .eq('provider_id', id),
      supabaseAdmin
        .from('bookings')
        .select('id, total_amount, commission_amount, status')
        .eq('provider_id', id)
        .eq('status', 'confirmed'),
    ])

    const stats = {
      trip_count: tripsResult.data?.length || 0,
      active_trip_count: tripsResult.data?.filter((t) => t.status === 'active').length || 0,
      booking_count: bookingsResult.data?.length || 0,
      total_revenue: bookingsResult.data?.reduce((sum, b) => sum + b.total_amount, 0) || 0,
      total_commission: bookingsResult.data?.reduce((sum, b) => sum + b.commission_amount, 0) || 0,
    }

    return NextResponse.json({ ...provider, stats })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { action, reason, commission_rate } = body as {
      action: 'suspend' | 'unsuspend' | 'update_commission'
      reason?: string
      commission_rate?: number
    }

    // Fetch provider
    const { data: provider, error: fetchError } = await supabaseAdmin
      .from('providers')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    if (action === 'suspend') {
      if (!reason?.trim()) {
        return NextResponse.json({ error: 'Suspension reason is required' }, { status: 400 })
      }

      const { error: updateError } = await supabaseAdmin
        .from('providers')
        .update({
          status: 'suspended',
          suspended_reason: reason,
        })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to suspend provider' }, { status: 500 })
      }

      // Notify provider
      await notify({
        userId: provider.user_id,
        type: 'account_suspended',
        titleAr: 'تم تعليق حسابك',
        titleEn: 'Account Suspended',
        bodyAr: `سبب التعليق: ${reason}`,
        bodyEn: `Reason: ${reason}`,
        data: { provider_id: provider.id },
        email: {
          subject: 'Account Suspended - BooktFly',
          html: `<p>Your provider account for <strong>${provider.company_name_ar}</strong> has been suspended.</p><p><strong>Reason:</strong> ${reason}</p><p>Please contact support for more information.</p>`,
        },
      })

      return NextResponse.json({ success: true, action: 'suspended' })
    }

    if (action === 'unsuspend') {
      const { error: updateError } = await supabaseAdmin
        .from('providers')
        .update({
          status: 'active',
          suspended_reason: null,
        })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to unsuspend provider' }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'unsuspended' })
    }

    if (action === 'update_commission') {
      if (commission_rate === undefined || commission_rate === null) {
        return NextResponse.json({ error: 'Commission rate is required' }, { status: 400 })
      }

      if (commission_rate < 0 || commission_rate > 100) {
        return NextResponse.json({ error: 'Commission rate must be between 0 and 100' }, { status: 400 })
      }

      const { error: updateError } = await supabaseAdmin
        .from('providers')
        .update({ commission_rate })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update commission rate' }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'commission_updated', commission_rate })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
