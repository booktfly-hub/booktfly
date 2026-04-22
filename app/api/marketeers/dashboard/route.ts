import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const isAr = request.headers.get('accept-language')?.startsWith('ar')
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: isAr ? 'يرجى تسجيل الدخول' : 'Unauthorized' },
        { status: 401 }
      )
    }

    // Load marketeer profile
    const { data: marketeer, error: mktError } = await supabaseAdmin
      .from('marketeers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (mktError || !marketeer) {
      return NextResponse.json(
        { data: null, error: isAr ? 'لم يتم العثور على ملف المسوّق' : 'Marketeer profile not found' },
        { status: 404 }
      )
    }

    // Active points balance
    const { data: balanceRow } = await supabaseAdmin
      .from('marketeer_points_balance')
      .select('balance')
      .eq('marketeer_id', user.id)
      .maybeSingle()

    const balance = balanceRow?.balance ?? 0

    // Recent transactions (last 50)
    const { data: transactions } = await supabaseAdmin
      .from('flypoints_transactions')
      .select('*')
      .eq('marketeer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Stats: total earned (only positive points)
    const { data: totalEarnedRow } = await supabaseAdmin
      .from('flypoints_transactions')
      .select('points')
      .eq('marketeer_id', user.id)
      .gt('points', 0)

    const totalEarned = (totalEarnedRow ?? []).reduce((sum, r) => sum + r.points, 0)

    // Referral count (unique users who signed up via this code)
    const { count: referralCount } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', marketeer.referral_code)

    // FlyPoints SAR rate from platform settings
    const { data: settings } = await supabaseAdmin
      .from('platform_settings')
      .select('flypoints_sar_rate')
      .limit(1)
      .maybeSingle()

    const sarRate = settings?.flypoints_sar_rate ?? 0.05

    // Attributed bookings (direct or via UTM campaign = referral code)
    const { data: attributed } = await supabaseAdmin
      .from('bookings')
      .select('id, status, total_amount, commission_amount, trip_id, created_at, trip:trips(origin_city_ar, origin_city_en, destination_city_ar, destination_city_en, origin_code, destination_code)')
      .or(`booked_by_marketeer_id.eq.${marketeer.id},utm_campaign.eq.${marketeer.referral_code}`)
      .order('created_at', { ascending: false })
      .limit(500)

    const rows = attributed ?? []
    const confirmedRows = rows.filter((r) => r.status === 'confirmed' || r.status === 'completed')
    const totalRevenue = confirmedRows.reduce((sum, r) => sum + Number(r.total_amount || 0), 0)
    const conversionRate = rows.length > 0 ? confirmedRows.length / rows.length : 0

    const tripAgg = new Map<string, { trip_id: string; label_ar: string; label_en: string; bookings: number; revenue: number }>()
    for (const r of confirmedRows) {
      const trip = Array.isArray(r.trip) ? r.trip[0] : r.trip
      if (!trip || !r.trip_id) continue
      const label_ar = `${trip.origin_city_ar || trip.origin_code || ''} → ${trip.destination_city_ar || trip.destination_code || ''}`
      const label_en = `${trip.origin_city_en || trip.origin_code || ''} → ${trip.destination_city_en || trip.destination_code || ''}`
      const agg = tripAgg.get(r.trip_id) ?? { trip_id: r.trip_id, label_ar, label_en, bookings: 0, revenue: 0 }
      agg.bookings++
      agg.revenue += Number(r.total_amount || 0)
      tripAgg.set(r.trip_id, agg)
    }
    const topTrips = Array.from(tripAgg.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    // Pending payout: unredeemed positive points × SAR rate
    const { data: redeemedRow } = await supabaseAdmin
      .from('flypoints_transactions')
      .select('points')
      .eq('marketeer_id', user.id)
      .lt('points', 0)
    const redeemedPoints = Math.abs((redeemedRow ?? []).reduce((sum, r) => sum + r.points, 0))
    const pendingPayout = +((totalEarned - redeemedPoints) * sarRate).toFixed(2)

    return NextResponse.json({
      data: {
        marketeer,
        balance,
        sar_value: +(balance * sarRate).toFixed(2),
        sar_rate: sarRate,
        total_earned: totalEarned,
        referral_count: referralCount ?? 0,
        transactions: transactions ?? [],
        attributed_count: rows.length,
        confirmed_count: confirmedRows.length,
        conversion_rate: +(conversionRate * 100).toFixed(1),
        attributed_revenue: totalRevenue,
        pending_payout: pendingPayout,
        top_trips: topTrips,
      },
      error: null,
    })
  } catch (error) {
    console.error('Marketeer dashboard error:', error)
    return NextResponse.json(
      { data: null, error: isAr ? 'خطأ في الخادم' : 'Internal server error' },
      { status: 500 }
    )
  }
}
