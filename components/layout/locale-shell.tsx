'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Toaster } from '@/components/ui/toaster'
import { createClient } from '@/lib/supabase/client'

type Props = {
  children: React.ReactNode
}

const HIDDEN_CHROME_SEGMENTS = new Set(['admin', 'provider', 'marketeer', 'auth'])

export function LocaleShell({ children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const supabase = useRef(createClient()).current
  const segments = pathname.split('/')
  const segment = segments[2]
  const hidePublicChrome = segment ? HIDDEN_CHROME_SEGMENTS.has(segment) : false

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace(`/${locale}/auth/update-password`)
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, router, locale])

  return (
    <>
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
      <Toaster />
    </>
  )
}
