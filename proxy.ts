import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { getGeoFromRequest, hashIp } from '@/lib/geo'

const intlMiddleware = createMiddleware(routing)

const VISIT_COOKIE = 'bf_visit'
const VISIT_WINDOW_MS = 30 * 60 * 1000 // 30 minutes

async function logVisitFireAndForget(request: NextRequest, userId: string | null, sessionId: string) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return
    const geo = getGeoFromRequest(request)
    const path = request.nextUrl.pathname
    const payload = {
      session_id: sessionId,
      path,
      country: geo.country,
      city: geo.city,
      region: geo.region,
      ip_hash: hashIp(geo.rawIp),
      user_agent: geo.userAgent,
      referrer: geo.referrer,
      user_id: userId,
    }
    // Use PostgREST directly — Edge-runtime safe (no Node-only deps).
    await fetch(`${url}/rest/v1/site_visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    }).catch(() => {})
  } catch {
    // Never fail the request for logging
  }
}

const PROTECTED_ROUTES: Record<string, string[]> = {
  '/provider': ['provider', 'admin'],
  '/admin': ['admin'],
  '/marketeer': ['marketeer', 'admin'],
  '/my-bookings': ['buyer', 'provider', 'admin'],
  '/become-provider/apply': ['buyer'],
  '/become-provider/status': ['buyer'],
  '/become-marketeer/apply': ['buyer'],
  '/become-marketeer/status': ['buyer'],
}

const AUTH_REQUIRED_PATTERNS = [
  '/provider',
  '/admin',
  '/marketeer',
  '/my-bookings',
  '/become-provider/apply',
  '/become-provider/status',
  '/become-marketeer/apply',
  '/become-marketeer/status',
]

export async function proxy(request: NextRequest) {
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
    AUTH_REQUIRED_PATTERNS.some((p) => pathWithoutLocale.startsWith(p))

  if (requiresAuth && !user) {
    const locale = localeMatch ? localeMatch[1] : 'ar'
    const loginUrl = new URL(`/${locale}/auth/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access (only fetch profile when on a protected route)
  const needsRoleCheck = user && AUTH_REQUIRED_PATTERNS.some((p) => pathWithoutLocale.startsWith(p))
  if (needsRoleCheck) {
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
          const url = new URL(`/${locale}`, request.url)
          url.searchParams.set('access_denied', role)
          return NextResponse.redirect(url)
        }
      }
    }

    // Provider routes: check if provider is suspended (exempt /provider/suspended to avoid loop)
    if (pathWithoutLocale.startsWith('/provider') && pathWithoutLocale !== '/provider/suspended' && role === 'provider') {
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

  // Visitor tracking — one row per (session, 30-min window)
  try {
    if (!pathname.startsWith('/_next') && !pathname.match(/\.[a-zA-Z0-9]+$/)) {
      const cookie = request.cookies.get(VISIT_COOKIE)
      const now = Date.now()
      let sessionId = ''
      let shouldLog = true
      if (cookie?.value) {
        const [sid, tsStr] = cookie.value.split('|')
        const ts = Number(tsStr)
        if (sid && Number.isFinite(ts) && now - ts < VISIT_WINDOW_MS) {
          sessionId = sid
          shouldLog = false
        }
      }
      if (!sessionId) sessionId = crypto.randomUUID()
      if (shouldLog) {
        // Fire-and-forget — do not await
        logVisitFireAndForget(request, user?.id ?? null, sessionId)
      }
      intlResponse.cookies.set(VISIT_COOKIE, `${sessionId}|${now}`, {
        maxAge: 60 * 60 * 24, // 24h
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
      })
    }
  } catch {
    // Non-fatal
  }

  return intlResponse
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
}
