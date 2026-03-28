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
      .select('role, referral_code')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    if (profile.role === 'buyer' || profile.role === 'marketeer') {
      const { data: transactions } = await supabaseAdmin
        .from('customer_points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const balance = transactions?.reduce((sum, t) => sum + t.points, 0) ?? 0

      const { count: referralCount } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', profile.referral_code)

      return NextResponse.json({
        balance,
        referral_code: profile.referral_code,
        referral_count: referralCount ?? 0,
        transactions: transactions ?? [],
      })
    }

    if (profile.role === 'provider') {
      const { data: provider } = await supabaseAdmin
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 })

      const { data: transactions } = await supabaseAdmin
        .from('provider_points_transactions')
        .select('*')
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const balance = transactions?.reduce((sum, t) => sum + t.points, 0) ?? 0

      return NextResponse.json({
        balance,
        transactions: transactions ?? [],
      })
    }

    return NextResponse.json({ balance: 0, transactions: [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
