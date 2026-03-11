'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'

export function Footer() {
  const t = useTranslations()
  const locale = useLocale()

  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image src="/booktfly-logo-symbol.png" alt="BooktFly" width={36} height={36} className="h-9 w-auto brightness-0 invert" />
              <span className="text-lg font-bold">BooktFly</span>
            </div>
            <p className="text-sm text-primary-foreground/70">
              {locale === 'ar'
                ? 'منصة حجز رحلات الطيران بأسعار مخفضة في المملكة العربية السعودية'
                : 'Discounted flight booking platform in Saudi Arabia'}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">
              {locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h3>
            <div className="space-y-2">
              <Link
                href={`/${locale}/trips`}
                className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                {t('nav.browse_trips')}
              </Link>
              <Link
                href={`/${locale}/become-provider`}
                className="block text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                {t('nav.become_provider')}
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">
              {locale === 'ar' ? 'معلومات' : 'Information'}
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-primary-foreground/70">{t('footer.terms')}</p>
              <p className="text-sm text-primary-foreground/70">{t('footer.privacy')}</p>
              <p className="text-sm text-primary-foreground/70">{t('footer.contact')}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-primary-foreground/60">{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
