import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; code: string }> }
) {
  const { locale, code } = await params

  const response = NextResponse.redirect(new URL(`/${locale}/trips`, request.url))

  // Marketeer referral code (MKT-XXXXXX)
  if (code.startsWith('MKT-')) {
    const { data: marketeer } = await supabaseAdmin
      .from('marketeers')
      .select('referral_code, status')
      .eq('referral_code', code)
      .eq('status', 'active')
      .maybeSingle()

    if (marketeer) {
      response.cookies.set('ref_code', code, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      })
    }
  }

  // Customer referral code (USR-XXXXXX)
  if (code.startsWith('USR-')) {
    const { data: referrer } = await supabaseAdmin
      .from('profiles')
      .select('referral_code')
      .eq('referral_code', code)
      .maybeSingle()

    if (referrer) {
      response.cookies.set('cref_code', code, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      })
    }
  }

  return response
}
