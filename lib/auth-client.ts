import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { AuthError, SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

const AUTH_ERROR_MAP: Record<string, string> = {
  'invalid login credentials':            'invalid_credentials',
  'invalid credentials':                  'invalid_credentials',
  'email not confirmed':                  'email_not_confirmed',
  'user already registered':              'user_already_registered',
  'email already registered':             'user_already_registered',
  'password should be at least':          'weak_password',
  'should be at least 6':                 'weak_password',
  'email rate limit exceeded':            'rate_limit',
  'for security purposes':                'rate_limit',
  'email link is invalid or has expired': 'link_expired',
  'token has expired or is invalid':      'link_expired',
  'otp expired':                          'link_expired',
  'auth session missing':                 'session_missing',
  'new password should be different':     'same_password',
}

export function getAuthErrorKey(error: AuthError | Error): string {
  const msg = error.message.toLowerCase()
  for (const [pattern, key] of Object.entries(AUTH_ERROR_MAP)) {
    if (msg.includes(pattern)) return key
  }
  return 'generic'
}

type RedirectOptions = {
  locale: string
  redirectTo?: string | null
  role?: UserRole | null
}

type AuthCallbackOptions = Pick<RedirectOptions, 'locale' | 'redirectTo'> & {
  origin: string
}

export function getSafeRedirectPath(redirectTo?: string | null) {
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    return redirectTo
  }

  return null
}

export function getAuthCallbackUrl({
  origin,
  locale,
  redirectTo,
}: AuthCallbackOptions) {
  const callbackUrl = new URL(`/${locale}/auth/callback`, origin)
  const safeRedirect = getSafeRedirectPath(redirectTo)

  if (safeRedirect) {
    callbackUrl.searchParams.set('next', safeRedirect)
  }

  return callbackUrl.toString()
}

export function getPostLoginRedirect({
  locale,
  redirectTo,
  role,
}: RedirectOptions) {
  const safeRedirect = getSafeRedirectPath(redirectTo)

  if (safeRedirect) {
    return safeRedirect
  }

  if (role === 'admin') return `/${locale}/admin`
  if (role === 'provider') return `/${locale}/provider/dashboard`
  if (role === 'marketeer') return `/${locale}/marketeer/dashboard`
  return `/${locale}`
}

export function navigateAfterLogin(
  router: AppRouterInstance,
  options: RedirectOptions
) {
  router.replace(getPostLoginRedirect(options))
  router.refresh()
}

export async function signOutAndRedirect(
  supabase: SupabaseClient,
  locale: string
) {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out failed:', error.message)
  }

  window.location.replace(`/${locale}`)
}
