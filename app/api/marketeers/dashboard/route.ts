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

    return NextResponse.json({
      data: {
        marketeer,
        balance,
        sar_value: +(balance * sarRate).toFixed(2),
        sar_rate: sarRate,
        total_earned: totalEarned,
        referral_count: referralCount ?? 0,
        transactions: transactions ?? [],
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
