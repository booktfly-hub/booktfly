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

    const { data: application } = await supabaseAdmin
      .from('marketeer_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ data: application, error: null })
  } catch (error) {
    console.error('Marketeer my-application error:', error)
    return NextResponse.json(
      { data: null, error: isAr ? 'خطأ في الخادم' : 'Internal server error' },
      { status: 500 }
    )
  }
}
