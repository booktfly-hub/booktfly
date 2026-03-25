import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'recovery' | 'invite' | null
  const next = searchParams.get('next')

  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  const locale = pathSegments[1] || 'ar'

  const supabase = await createClient()
  let error = null

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code)
    error = result.error
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    error = result.error
  }

  if (!error && (code || (tokenHash && type))) {
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const { data: userData } = await supabase.auth.getUser()

    if (userData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .maybeSingle()

      const role = profile?.role || 'buyer'

      if (role === 'admin') {
        return NextResponse.redirect(`${origin}/${locale}/admin`)
      } else if (role === 'provider') {
        return NextResponse.redirect(`${origin}/${locale}/provider/dashboard`)
      } else {
        return NextResponse.redirect(`${origin}/${locale}`)
      }
    }

    return NextResponse.redirect(`${origin}/${locale}`)
  }

  return NextResponse.redirect(`${origin}/${locale}/auth/login`)
}
