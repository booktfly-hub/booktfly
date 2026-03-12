'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Toaster } from '@/components/ui/toaster'

type Props = {
  children: React.ReactNode
}

const HIDDEN_CHROME_SEGMENTS = new Set(['admin', 'provider', 'auth'])

export function LocaleShell({ children }: Props) {
  const pathname = usePathname()
  const segments = pathname.split('/')
  const segment = segments[2]
  // Also hide if the segment is 'become-provider' and we are deep in it, but for now 'auth' is the main one we want to clean up.
  const hidePublicChrome = segment ? HIDDEN_CHROME_SEGMENTS.has(segment) : false

  return (
    <>
      {!hidePublicChrome && <Navbar />}
      <main className="flex-1">{children}</main>
      {!hidePublicChrome && <Footer />}
      <Toaster />
    </>
  )
}
