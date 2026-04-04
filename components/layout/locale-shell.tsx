'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Toaster, toast } from '@/components/ui/toaster'
import { UserProvider } from '@/contexts/user-context'

type Props = {
  children: React.ReactNode
}

const HIDDEN_CHROME_SEGMENTS = new Set(['admin', 'provider', 'marketeer', 'auth'])

const ROLE_TOAST_KEYS: Record<string, string> = {
  buyer: 'access_denied_buyer',
  provider: 'access_denied_provider',
  marketeer: 'access_denied_marketeer',
  admin: 'access_denied_admin',
}

function AccessDeniedToast() {
  const t = useTranslations('errors')
  const searchParams = useSearchParams()

  useEffect(() => {
    const role = searchParams.get('access_denied')
    if (!role) return

    const key = ROLE_TOAST_KEYS[role] || 'access_denied_generic'
    toast({ title: t(key), variant: 'destructive' })

    const url = new URL(window.location.href)
    url.searchParams.delete('access_denied')
    window.history.replaceState({}, '', url.pathname)
  }, [searchParams, t])

  return null
}

export function LocaleShell({ children }: Props) {
  const pathname = usePathname()
  const segments = pathname.split('/')
  const segment = segments[2]
  const hidePublicChrome = segment ? HIDDEN_CHROME_SEGMENTS.has(segment) : false

  return (
    <UserProvider>
      {!hidePublicChrome && <Navbar />}
      <main className="flex-1">
        {hidePublicChrome ? (
          children
        ) : (
          <div className="flex min-h-[100svh] flex-col">
            <div className="flex-1">{children}</div>
          </div>
        )}
      </main>
      {!hidePublicChrome && <Footer />}
      <Suspense><AccessDeniedToast /></Suspense>
      <Toaster />
    </UserProvider>
  )
}
