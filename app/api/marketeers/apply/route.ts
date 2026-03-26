import { after, NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { markeeteerApplicationSchema } from '@/lib/validations'
import { notifyAdmin } from '@/lib/notifications'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const isAr = request.headers.get('accept-language')?.startsWith('ar')
  try {
    const limited = rateLimit(request, { limit: 3, windowMs: 60_000 })
    if (limited) return limited

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: isAr ? 'يرجى تسجيل الدخول' : 'Unauthorized' },
        { status: 401 }
      )
    }

    let { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      const { data: created } = await supabaseAdmin
        .from('profiles')
        .insert({ id: user.id, email: user.email, full_name: user.user_metadata?.full_name ?? user.email, role: 'buyer' })
        .select('role')
        .single()
      profile = created
    }

    if (!profile || profile.role !== 'buyer') {
      return NextResponse.json(
        { data: null, error: isAr ? 'يمكن للمشترين فقط التقديم كمسوّقين' : 'Only buyers can apply to become marketeers' },
        { status: 403 }
      )
    }

    const { data: existing } = await supabaseAdmin
      .from('marketeer_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['pending_review', 'approved'])
      .limit(1)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { data: null, error: isAr ? 'لديك طلب معلق أو مقبول بالفعل' : 'You already have a pending or approved application' },
        { status: 409 }
      )
    }

    const body = await request.json()
    const parsed = markeeteerApplicationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message || (isAr ? 'بيانات غير صالحة' : 'Invalid input') },
        { status: 400 }
      )
    }

    const { data: application, error: insertError } = await supabaseAdmin
      .from('marketeer_applications')
      .insert({
        user_id:          user.id,
        full_name:        parsed.data.full_name,
        national_id:      parsed.data.national_id,
        date_of_birth:    parsed.data.date_of_birth,
        phone:            parsed.data.phone,
        phone_alt:        parsed.data.phone_alt || null,
        email:            parsed.data.email,
        national_address: parsed.data.national_address,
        status:           'pending_review',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert marketeer application:', insertError)
      return NextResponse.json(
        { data: null, error: isAr ? 'فشل في إرسال الطلب' : 'Failed to submit application' },
        { status: 500 }
      )
    }

    after(async () => {
      try {
        await notifyAdmin({
          type: 'new_marketeer_application',
          titleAr: 'طلب مسوّق جديد',
          titleEn: 'New Marketeer Application',
          bodyAr: `تم تقديم طلب انضمام مسوّق جديد من ${parsed.data.full_name}`,
          bodyEn: `New marketeer application received from ${parsed.data.full_name}`,
          data: { application_id: application.id },
        })
      } catch (err) {
        console.error('Failed to notify admin for marketeer application:', err)
      }
    })

    return NextResponse.json({ data: application, error: null })
  } catch (error) {
    console.error('Marketeer apply error:', error)
    return NextResponse.json(
      { data: null, error: isAr ? 'خطأ في الخادم' : 'Internal server error' },
      { status: 500 }
    )
  }
}
