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
    const providerType = searchParams.get('provider_type')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('providers')
      .select('*', { count: 'exact' })

    if (status) query = query.eq('status', status)
    if (providerType) query = query.eq('provider_type', providerType)

    if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data: providers, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const providerIds = (providers || []).map(p => p.id)

    if (providerIds.length === 0) {
      return NextResponse.json({
        providers: [],
        total: 0,
        page,
        limit,
      })
    }

    const [
      { data: trips },
      { data: bookings },
    ] = await Promise.all([
      supabaseAdmin
        .from('trips')
        .select('id, provider_id, total_seats, booked_seats')
        .in('provider_id', providerIds),
      supabaseAdmin
        .from('bookings')
        .select('provider_id, total_amount, status')
        .in('provider_id', providerIds)
        .eq('status', 'confirmed'),
    ])

    const statsMap: Record<string, {
      tripCount: number
      bookingCount: number
      revenue: number
      totalSeats: number
      bookedSeats: number
    }> = {}

    for (const id of providerIds) {
      statsMap[id] = { tripCount: 0, bookingCount: 0, revenue: 0, totalSeats: 0, bookedSeats: 0 }
    }

    for (const trip of trips || []) {
      const s = statsMap[trip.provider_id]
      if (s) {
        s.tripCount++
        s.totalSeats += trip.total_seats
        s.bookedSeats += trip.booked_seats
      }
    }

    for (const booking of bookings || []) {
      const s = statsMap[booking.provider_id]
      if (s) {
        s.bookingCount++
        s.revenue += booking.total_amount || 0
      }
    }

    let providersWithStats = (providers || []).map(provider => ({
      ...provider,
      stats: {
        ...statsMap[provider.id],
        occupancy: statsMap[provider.id].totalSeats > 0
          ? Math.round((statsMap[provider.id].bookedSeats / statsMap[provider.id].totalSeats) * 10000) / 100
          : 0,
      },
    }))

    if (sortBy === 'revenue') {
      providersWithStats.sort((a, b) => b.stats.revenue - a.stats.revenue)
    } else if (sortBy === 'bookings') {
      providersWithStats.sort((a, b) => b.stats.bookingCount - a.stats.bookingCount)
    }

    return NextResponse.json({
      providers: providersWithStats,
      total: count || 0,
      page,
      limit,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
