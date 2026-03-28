import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [
      { count: totalUsers },
      { count: buyerCount },
      { count: providerCount },
      { count: marketeerCount },
      { count: adminCount },
      { count: registeredToday },
      { count: registeredWeek },
      { count: registeredMonth },
      { count: activeTrips },
      { count: totalTrips },
      { count: totalBookings },
      { count: confirmedBookings },
      { data: revenueMonthData },
      { data: revenueTodayData },
      { count: activeProviders },
      { count: pendingApplications },
      { count: usersWhoBooked },
      { data: recentActivity },
      { data: activeAlerts },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'buyer'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'marketeer'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabaseAdmin.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('trips').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabaseAdmin.from('bookings').select('total_amount').eq('status', 'confirmed').gte('created_at', monthStart),
      supabaseAdmin.from('bookings').select('total_amount').eq('status', 'confirmed').gte('created_at', todayStart),
      supabaseAdmin.from('providers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('provider_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabaseAdmin.from('bookings').select('buyer_id', { count: 'exact', head: true }).eq('status', 'confirmed').not('buyer_id', 'is', null),
      supabaseAdmin.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('admin_alerts').select('*').eq('dismissed', false).order('created_at', { ascending: false }),
    ])

    const revenueMonth = (revenueMonthData || []).reduce((sum, b) => sum + (b.total_amount || 0), 0)
    const revenueToday = (revenueTodayData || []).reduce((sum, b) => sum + (b.total_amount || 0), 0)

    const conversionRate = (totalUsers && totalUsers > 0 && usersWhoBooked)
      ? Math.round((usersWhoBooked / totalUsers) * 10000) / 100
      : 0

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        buyers: buyerCount || 0,
        providers: providerCount || 0,
        marketeers: marketeerCount || 0,
        admins: adminCount || 0,
        registeredToday: registeredToday || 0,
        registeredWeek: registeredWeek || 0,
        registeredMonth: registeredMonth || 0,
      },
      trips: {
        active: activeTrips || 0,
        total: totalTrips || 0,
      },
      bookings: {
        total: totalBookings || 0,
        confirmed: confirmedBookings || 0,
        revenueMonth,
        revenueToday,
      },
      providers: {
        active: activeProviders || 0,
        pendingApplications: pendingApplications || 0,
      },
      conversionRate,
      recentActivity: recentActivity || [],
      activeAlerts: activeAlerts || [],
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
