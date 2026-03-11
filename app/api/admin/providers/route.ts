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

    // Fetch all providers with their profiles
    const { data: providers, error } = await supabaseAdmin
      .from('providers')
      .select('*, profiles:user_id(full_name, email, avatar_url)')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
    }

    // Fetch stats for each provider: trip count, booking count, total revenue
    const providerIds = (providers || []).map((p) => p.id)

    const [tripsResult, bookingsResult] = await Promise.all([
      supabaseAdmin
        .from('trips')
        .select('provider_id, id')
        .in('provider_id', providerIds.length > 0 ? providerIds : ['']),
      supabaseAdmin
        .from('bookings')
        .select('provider_id, total_amount, commission_amount, status')
        .in('provider_id', providerIds.length > 0 ? providerIds : [''])
        .eq('status', 'confirmed'),
    ])

    // Build stats map
    const statsMap: Record<string, { trip_count: number; booking_count: number; total_revenue: number; total_commission: number }> = {}

    for (const id of providerIds) {
      statsMap[id] = { trip_count: 0, booking_count: 0, total_revenue: 0, total_commission: 0 }
    }

    if (tripsResult.data) {
      for (const trip of tripsResult.data) {
        if (statsMap[trip.provider_id]) {
          statsMap[trip.provider_id].trip_count++
        }
      }
    }

    if (bookingsResult.data) {
      for (const booking of bookingsResult.data) {
        if (statsMap[booking.provider_id]) {
          statsMap[booking.provider_id].booking_count++
          statsMap[booking.provider_id].total_revenue += booking.total_amount
          statsMap[booking.provider_id].total_commission += booking.commission_amount
        }
      }
    }

    // Merge stats into providers
    const providersWithStats = (providers || []).map((provider) => ({
      ...provider,
      stats: statsMap[provider.id] || { trip_count: 0, booking_count: 0, total_revenue: 0, total_commission: 0 },
    }))

    return NextResponse.json(providersWithStats)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
