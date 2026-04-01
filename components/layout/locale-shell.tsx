'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Toaster } from '@/components/ui/toaster'
import { UserProvider } from '@/contexts/user-context'

type Props = {
  children: React.ReactNode
}

const HIDDEN_CHROME_SEGMENTS = new Set(['admin', 'provider', 'marketeer', 'auth'])

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
      <Toaster />
    </UserProvider>
  )
}
