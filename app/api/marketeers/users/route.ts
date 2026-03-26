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
      .select('referral_code')
      .eq('user_id', user.id)
      .single()

    if (!marketeer) return NextResponse.json({ error: isAr ? 'لم يتم العثور على المسوّق' : 'Marketeer not found' }, { status: 404 })

    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('referred_by', marketeer.referral_code)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: users ?? [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
