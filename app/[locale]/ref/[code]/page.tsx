import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { setRequestLocale } from 'next-intl/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Props = {
  params: Promise<{ locale: string; code: string }>
}

export default async function ReferralPage({ params }: Props) {
  const { locale, code } = await params
  setRequestLocale(locale)

  // Validate the code exists
  const { data: marketeer } = await supabaseAdmin
    .from('marketeers')
    .select('referral_code, status')
    .eq('referral_code', code)
    .eq('status', 'active')
    .maybeSingle()

  // Set referral cookie (30 days) even if marketeer not found — store code for later validation
  if (marketeer) {
    const cookieStore = await cookies()
    // Non-httpOnly so the client-side signup page can read it
    cookieStore.set('ref_code', code, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    })
  }

  // Redirect to trips (main landing for buyers)
  redirect(`/${locale}/trips`)
}
