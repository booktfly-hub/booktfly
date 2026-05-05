import type { Metadata } from 'next'
import Script from 'next/script'
import { lkey } from '@/lib/i18n-helpers'
import { Cairo } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { LocaleShell } from '@/components/layout/locale-shell'
import '@/app/globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
})

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
  other: {
    'domain-verification': '3bf540c518655b10dbb0c9f4f871136b1dabc286f5fac8040154a10cc7a7b196',
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

  if (!routing.locales.includes(lkey(locale))) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  const tpMarker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {tpMarker && (
          <Script
            id="travelpayouts-drive"
            strategy="afterInteractive"
            src={`https://emrldtp.cc/${Buffer.from(tpMarker).toString('base64')}.js?t=${tpMarker}`}
          />
        )}
      </head>
      <body className={`min-h-screen flex flex-col font-sans antialiased ${cairo.variable}`}>
        <NextIntlClientProvider messages={messages}>
          <a href="#main-content" className="skip-nav">
            {locale === 'ar' ? 'تخطي إلى المحتوى الرئيسي' : 'Skip to main content'}
          </a>
          <LocaleShell>{children}</LocaleShell>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
