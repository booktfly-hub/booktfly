import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const providerId = searchParams.get('provider_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('trips')
      .select('*, provider:providers(company_name_ar, company_name_en)', { count: 'exact' })

    if (status) query = query.eq('status', status)
    if (providerId) query = query.eq('provider_id', providerId)
    if (dateFrom) query = query.gte('departure_at', dateFrom)
    if (dateTo) query = query.lte('departure_at', dateTo)
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: trips, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const tripIds = (trips || []).map(t => t.id)
    let bookingsMap: Record<string, number> = {}

    if (tripIds.length > 0) {
      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('trip_id, total_amount')
        .in('trip_id', tripIds)
        .eq('status', 'confirmed')

      for (const b of bookings || []) {
        bookingsMap[b.trip_id] = (bookingsMap[b.trip_id] || 0) + (b.total_amount || 0)
      }
    }

    const tripsWithStats = (trips || []).map(trip => ({
      ...trip,
      available_seats: trip.total_seats - trip.booked_seats,
      occupancy_rate: trip.total_seats > 0
        ? Math.round((trip.booked_seats / trip.total_seats) * 10000) / 100
        : 0,
      revenue: bookingsMap[trip.id] || 0,
    }))

    const { data: allTrips } = await supabaseAdmin
      .from('trips')
      .select('total_seats, booked_seats')

    const totalSeats = (allTrips || []).reduce((sum, t) => sum + t.total_seats, 0)
    const totalBooked = (allTrips || []).reduce((sum, t) => sum + t.booked_seats, 0)
    const totalAvailable = totalSeats - totalBooked
    const avgOccupancy = totalSeats > 0
      ? Math.round((totalBooked / totalSeats) * 10000) / 100
      : 0

    return NextResponse.json({
      trips: tripsWithStats,
      total: count || 0,
      page,
      limit,
      summary: {
        totalSeats,
        totalBooked,
        totalAvailable,
        avgOccupancy,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
