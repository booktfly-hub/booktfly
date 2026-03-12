import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { LocaleShell } from '@/components/layout/locale-shell'
import '@/app/globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bookitfly.com'),
  title: {
    default: 'BooktFly - بوكت فلاي',
    template: '%s | BooktFly',
  },
  description: 'منصة حجز رحلات الطيران بأسعار مخفضة - Discounted Flight Booking Platform',
  openGraph: {
    type: 'website',
    siteName: 'BooktFly',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'BooktFly' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'ar' | 'en')) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <LocaleShell>{children}</LocaleShell>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
