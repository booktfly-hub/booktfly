import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type RouteParams = {
  params: Promise<{ id: string }>
}

// PATCH: Toggle trip active/deactivated status
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
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

    // Get provider
    const { data: provider } = await supabase
      .from('providers')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (!provider || provider.status !== 'active') {
      return NextResponse.json(
        { data: null, error: 'Provider account is not active' },
        { status: 403 }
      )
    }

    // Verify trip belongs to this provider
    const { data: existingTrip } = await supabaseAdmin
      .from('trips')
      .select('id, status, provider_id')
      .eq('id', id)
      .eq('provider_id', provider.id)
      .single()

    if (!existingTrip) {
      return NextResponse.json(
        { data: null, error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Only active or deactivated trips can be toggled
    if (existingTrip.status !== 'active' && existingTrip.status !== 'deactivated') {
      return NextResponse.json(
        {
          data: null,
          error: `Cannot toggle trip with status '${existingTrip.status}'`,
        },
        { status: 400 }
      )
    }

    const newStatus =
      existingTrip.status === 'active' ? 'deactivated' : 'active'

    const { data: updatedTrip, error: updateError } = await supabaseAdmin
      .from('trips')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to toggle trip status:', updateError)
      return NextResponse.json(
        { data: null, error: 'Failed to update trip status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedTrip, error: null })
  } catch (error) {
    console.error('Trip deactivate error:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
