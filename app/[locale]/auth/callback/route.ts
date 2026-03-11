import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Extract locale from the URL path (e.g., /ar/auth/callback or /en/auth/callback)
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  const locale = pathSegments[1] || 'ar'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the user to determine their role
      const { data: userData } = await supabase.auth.getUser()

      if (userData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userData.user.id)
          .single()

        const role = profile?.role || 'buyer'

        if (role === 'admin') {
          return NextResponse.redirect(`${origin}/${locale}/admin`)
        } else if (role === 'provider') {
          return NextResponse.redirect(`${origin}/${locale}/provider/dashboard`)
        } else {
          return NextResponse.redirect(`${origin}/${locale}`)
        }
      }

      // Fallback: redirect to home if no user data
      return NextResponse.redirect(`${origin}/${locale}`)
    }
  }

  // If code exchange failed or no code, redirect to login with error
  return NextResponse.redirect(`${origin}/${locale}/auth/login`)
}
