import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; code: string }> }
) {
  const { locale, code } = await params

  const { data: marketeer } = await supabaseAdmin
    .from('marketeers')
    .select('referral_code, status')
    .eq('referral_code', code)
    .eq('status', 'active')
    .maybeSingle()

  const response = NextResponse.redirect(new URL(`/${locale}/trips`, request.url))

  if (marketeer) {
    response.cookies.set('ref_code', code, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    })
  }

  return response
}
