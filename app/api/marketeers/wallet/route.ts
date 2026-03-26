import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const isAr = request.headers.get('accept-language')?.startsWith('ar')
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: isAr ? 'غير مصرح' : 'Unauthorized' }, { status: 401 })

    const { data: marketeer } = await supabaseAdmin
      .from('marketeers')
      .select('user_id')
      .eq('user_id', user.id)
      .single()
    if (!marketeer) return NextResponse.json({ error: isAr ? 'لم يتم العثور على المسوّق' : 'Marketeer not found' }, { status: 404 })

    const [balanceRes, settingsRes, withdrawalsRes] = await Promise.all([
      supabaseAdmin.from('marketeer_points_balance').select('balance').eq('marketeer_id', user.id).maybeSingle(),
      supabaseAdmin.from('platform_settings').select('flypoints_sar_rate').limit(1).maybeSingle(),
      supabaseAdmin.from('marketeer_withdrawal_requests').select('*').eq('marketeer_id', user.id).order('created_at', { ascending: false }),
    ])

    const balance = balanceRes.data?.balance ?? 0
    const sarRate = settingsRes.data?.flypoints_sar_rate ?? 0.05

    return NextResponse.json({
      data: {
        balance,
        sar_value: +(balance * sarRate).toFixed(2),
        sar_rate: sarRate,
        withdrawals: withdrawalsRes.data ?? [],
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const isAr = request.headers.get('accept-language')?.startsWith('ar')
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: isAr ? 'غير مصرح' : 'Unauthorized' }, { status: 401 })

    const { data: marketeer } = await supabaseAdmin
      .from('marketeers')
      .select('user_id')
      .eq('user_id', user.id)
      .single()
    if (!marketeer) return NextResponse.json({ error: isAr ? 'لم يتم العثور على المسوّق' : 'Marketeer not found' }, { status: 404 })

    const { iban, points } = await request.json() as { iban: string; points: number }

    if (!iban?.trim() || !points || points < 100) {
      return NextResponse.json(
        { error: isAr ? 'يجب إدخال رقم IBAN وعدد نقاط صحيح (100 على الأقل)' : 'Valid IBAN and minimum 100 points required' },
        { status: 400 }
      )
    }

    const { data: balanceRow } = await supabaseAdmin
      .from('marketeer_points_balance')
      .select('balance')
      .eq('marketeer_id', user.id)
      .maybeSingle()
    const balance = balanceRow?.balance ?? 0

    if (points > balance) {
      return NextResponse.json(
        { error: isAr ? 'رصيد النقاط غير كافٍ' : 'Insufficient points balance' },
        { status: 400 }
      )
    }

    // Check no pending request
    const { data: pending } = await supabaseAdmin
      .from('marketeer_withdrawal_requests')
      .select('id')
      .eq('marketeer_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()
    if (pending) {
      return NextResponse.json(
        { error: isAr ? 'لديك طلب سحب معلق بالفعل' : 'You already have a pending withdrawal request' },
        { status: 409 }
      )
    }

    const { data: settings } = await supabaseAdmin.from('platform_settings').select('flypoints_sar_rate').limit(1).maybeSingle()
    const sarRate = settings?.flypoints_sar_rate ?? 0.05
    const sarAmount = +(points * sarRate).toFixed(2)

    const { data, error } = await supabaseAdmin
      .from('marketeer_withdrawal_requests')
      .insert({ marketeer_id: user.id, points, sar_amount: sarAmount, iban: iban.trim() })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
