import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Fetch booking with related data
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, trip:trips(*, provider:providers(*)), provider:providers(*), buyer:profiles(*)')
      .eq('id', id)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Authorization: buyer who owns it, provider whose trip, or admin
    const isOwner = booking.buyer_id === user.id
    const isProvider = booking.provider_id === user.id || booking.provider?.user_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isProvider && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({ booking })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
