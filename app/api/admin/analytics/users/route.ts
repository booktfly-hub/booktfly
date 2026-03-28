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
    const period = searchParams.get('period') || 'all'
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const now = new Date()
    let dateFilter: string | null = null
    if (period === 'today') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    } else if (period === 'week') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()
    } else if (period === 'month') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    } else if (period === 'year') {
      dateFilter = new Date(now.getFullYear(), 0, 1).toISOString()
    }

    let query = supabaseAdmin.from('profiles').select('*', { count: 'exact' })
    if (dateFilter) query = query.gte('created_at', dateFilter)
    if (role) query = query.eq('role', role)
    if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: users, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const [
      { count: buyerCount },
      { count: providerCount },
      { count: marketeerCount },
      { count: adminCount },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'buyer'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'marketeer'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    ])

    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    const { data: recentRegistrations } = await supabaseAdmin
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    const trend: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      trend[d.toISOString().split('T')[0]] = 0
    }
    for (const reg of recentRegistrations || []) {
      const day = reg.created_at.split('T')[0]
      if (trend[day] !== undefined) trend[day]++
    }

    return NextResponse.json({
      users: users || [],
      total: count || 0,
      page,
      limit,
      roleBreakdown: {
        buyers: buyerCount || 0,
        providers: providerCount || 0,
        marketeers: marketeerCount || 0,
        admins: adminCount || 0,
      },
      registrationTrend: Object.entries(trend).map(([date, count]) => ({ date, count })),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
