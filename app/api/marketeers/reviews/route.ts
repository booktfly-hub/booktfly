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

    const { data, error } = await supabaseAdmin
      .from('marketeer_reviews')
      .select('*')
      .eq('marketeer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const reviews = data ?? []
    const avg = reviews.length > 0
      ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : 0

    return NextResponse.json({ data: { reviews, avg_rating: avg, total: reviews.length } })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
