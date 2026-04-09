'use client'

import { useLocale } from 'next-intl'
import { Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type Props = {
  compact?: boolean
  className?: string
}

export function LanguageSwitcher({ compact = false, className }: Props) {
  const locale = useLocale()
  const router = useRouter()

  const switchLocale = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar'
    const { pathname, search, hash } = window.location
    const localizedPath = pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${newLocale}`)

    router.replace(`${localizedPath}${search}${hash}`)
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      className={cn(
        'flex items-center rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        compact ? 'gap-0' : 'gap-1.5',
        className
      )}
      title={locale === 'ar' ? 'English' : 'العربية'}
      aria-label={locale === 'ar' ? 'Switch language to English' : 'التبديل إلى العربية'}
    >
      <Globe className="h-4 w-4" />
      <span
        className={cn(
          'overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300',
          compact ? 'ms-0 max-w-0 opacity-0' : 'max-w-16 opacity-100'
        )}
        aria-hidden={compact}
      >
        {locale === 'ar' ? 'EN' : 'عربي'}
      </span>
    </button>
  )
}
