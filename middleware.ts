import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/provider': ['provider', 'admin'],
  '/admin': ['admin'],
  '/my-bookings': ['buyer', 'provider', 'admin'],
  '/become-provider/apply': ['buyer'],
  '/become-provider/status': ['buyer'],
}

const AUTH_REQUIRED_PATTERNS = [
  '/provider',
  '/admin',
  '/my-bookings',
  '/become-provider/apply',
  '/become-provider/status',
  '/checkout',
]

function isBookingRoute(pathname: string): boolean {
  return /^\/trips\/[^/]+\/book$/.test(pathname)
}

export async function middleware(request: NextRequest) {
  // Strip locale prefix to get the path
  const pathname = request.nextUrl.pathname
  const localeMatch = pathname.match(/^\/(ar|en)(.*)$/)
  const pathWithoutLocale = localeMatch ? localeMatch[2] || '/' : pathname

  // Check if this is an API route - skip i18n for API
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Run Supabase session refresh
  const { user, supabaseResponse, supabase } = await updateSession(request)

  // Check if auth is required
  const requiresAuth =
    AUTH_REQUIRED_PATTERNS.some((p) => pathWithoutLocale.startsWith(p)) ||
    isBookingRoute(pathWithoutLocale)

  if (requiresAuth && !user) {
    const locale = localeMatch ? localeMatch[1] : 'ar'
    const loginUrl = new URL(`/${locale}/auth/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'buyer'

    for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
      if (pathWithoutLocale.startsWith(route)) {
        if (!allowedRoles.includes(role)) {
          const locale = localeMatch ? localeMatch[1] : 'ar'
          return NextResponse.redirect(new URL(`/${locale}`, request.url))
        }
      }
    }

    // Booking routes require any authenticated user
    if (isBookingRoute(pathWithoutLocale) && !user) {
      const locale = localeMatch ? localeMatch[1] : 'ar'
      const loginUrl = new URL(`/${locale}/auth/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Provider routes: check if provider is suspended
    if (pathWithoutLocale.startsWith('/provider') && role === 'provider') {
      const { data: provider } = await supabase
        .from('providers')
        .select('status')
        .eq('user_id', user.id)
        .single()

      if (provider?.status === 'suspended') {
        const locale = localeMatch ? localeMatch[1] : 'ar'
        return NextResponse.redirect(
          new URL(`/${locale}/provider/suspended`, request.url)
        )
      }
    }

    // If buyer already a provider, redirect from apply page
    if (pathWithoutLocale === '/become-provider/apply' && role === 'provider') {
      const locale = localeMatch ? localeMatch[1] : 'ar'
      return NextResponse.redirect(
        new URL(`/${locale}/provider/dashboard`, request.url)
      )
    }
  }

  // Run intl middleware and merge cookies
  const intlResponse = intlMiddleware(request)

  // Copy Supabase cookies to intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value)
  })

  return intlResponse
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
}
