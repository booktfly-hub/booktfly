import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; code: string }> }
) {
  const { locale, code } = await params
  const url = new URL(request.url)

  const target = url.searchParams.get('to') || `/${locale}/trips`
  const response = NextResponse.redirect(new URL(target, request.url))

  const utmSource = url.searchParams.get('utm_source')
  const utmCampaign = url.searchParams.get('utm_campaign')
  const utmMedium = url.searchParams.get('utm_medium')
  const utmOptions = { maxAge: 60 * 60 * 24 * 30, path: '/', httpOnly: false, sameSite: 'lax' as const }
  if (utmSource) response.cookies.set('utm_source', utmSource, utmOptions)
  if (utmCampaign) response.cookies.set('utm_campaign', utmCampaign, utmOptions)
  if (utmMedium) response.cookies.set('utm_medium', utmMedium, utmOptions)

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
