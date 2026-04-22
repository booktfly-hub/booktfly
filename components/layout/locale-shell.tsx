'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { Toaster, toast } from '@/components/ui/toaster'
import { UserProvider } from '@/contexts/user-context'
import { SavedItemsProvider } from '@/contexts/saved-items-context'

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

const DETAIL_PAGE_PATTERNS = [/\/trips\/[^/]+/, /\/rooms\/[^/]+/, /\/cars\/[^/]+/, /\/packages\/[^/]+/]

export function LocaleShell({ children }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const segments = pathname.split('/')
  const segment = segments[2]
  const hidePublicChrome = segment ? HIDDEN_CHROME_SEGMENTS.has(segment) : false
  const isDetailPage = DETAIL_PAGE_PATTERNS.some(p => p.test(pathname))

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search])

  return (
    <UserProvider>
      <SavedItemsProvider>
      {!hidePublicChrome && <Navbar />}
      <main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-28 focus:outline-none">
        {hidePublicChrome ? (
          children
        ) : (
          <div className="flex min-h-[100svh] flex-col">
            <div className={isDetailPage ? 'flex-1' : 'flex-1 pb-16 md:pb-0'}>{children}</div>
          </div>
        )}
      </main>
      {!hidePublicChrome && <Footer />}
      {!hidePublicChrome && <MobileBottomNav />}
      <Suspense><AccessDeniedToast /></Suspense>
      <Toaster />
      </SavedItemsProvider>
    </UserProvider>
  )
}
