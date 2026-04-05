import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/activity-log'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    const { data: provider } = await supabase
      .from('providers')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (!isAdmin && (!provider || provider.status !== 'active')) {
      return NextResponse.json(
        { data: null, error: 'Provider account is not active' },
        { status: 403 }
      )
    }

    let query = supabaseAdmin
      .from('packages')
      .select('id, status, provider_id')
      .eq('id', id)

    if (!isAdmin && provider) {
      query = query.eq('provider_id', provider.id)
    }

    const { data: existingPkg } = await query.single()

    if (!existingPkg) {
      return NextResponse.json(
        { data: null, error: 'Package not found' },
        { status: 404 }
      )
    }

    if (existingPkg.status !== 'active' && existingPkg.status !== 'deactivated') {
      return NextResponse.json(
        {
          data: null,
          error: `Cannot toggle package with status '${existingPkg.status}'`,
        },
        { status: 400 }
      )
    }

    const newStatus =
      existingPkg.status === 'active' ? 'deactivated' : 'active'

    const { data: updatedPkg, error: updateError } = await supabaseAdmin
      .from('packages')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to toggle package status:', updateError)
      return NextResponse.json(
        { data: null, error: 'Failed to update package status' },
        { status: 500 }
      )
    }

    logActivity('package_removed', {
      userId: user.id,
      metadata: { packageId: id, newStatus },
    })

    return NextResponse.json({ data: updatedPkg, error: null })
  } catch (error) {
    console.error('Package deactivate error:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
