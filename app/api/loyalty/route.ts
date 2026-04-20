import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const [walletRes, txRes] = await Promise.all([
    supabase.from('loyalty_wallets').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('loyalty_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ])

  return NextResponse.json({
    wallet: walletRes.data ?? { user_id: user.id, balance_points: 0, lifetime_points: 0, tier: 'silver' },
    transactions: txRes.data ?? [],
  })
}
