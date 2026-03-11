'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar'
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={locale === 'ar' ? 'English' : 'العربية'}
    >
      <Globe className="h-4 w-4" />
      <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
    </button>
  )
}
