'use client'

import { useLocale } from 'next-intl'
import { Globe } from 'lucide-react'
import { usePathname, useRouter } from '@/i18n/navigation'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar'
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={locale === 'ar' ? 'English' : 'العربية'}
    >
      <Globe className="h-4 w-4" />
      <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
    </button>
  )
}
