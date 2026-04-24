'use client'

import { useLocale } from 'next-intl'
import { Globe, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

type Locale = 'ar' | 'en' | 'tr'

type Props = {
  compact?: boolean
  className?: string
}

const LOCALES: { code: Locale; label: string; native: string }[] = [
  { code: 'ar', label: 'AR', native: 'العربية' },
  { code: 'en', label: 'EN', native: 'English' },
  { code: 'tr', label: 'TR', native: 'Türkçe' },
]

export function LanguageSwitcher({ compact = false, className }: Props) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const switchLocale = (newLocale: Locale) => {
    const { pathname, search, hash } = window.location
    const localizedPath = pathname.replace(/^\/(ar|en|tr)(?=\/|$)/, `/${newLocale}`)
    router.replace(`${localizedPath}${search}${hash}`)
    setOpen(false)
  }

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
          compact ? 'gap-0' : 'gap-1.5',
          className || 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        aria-label="Change language"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" />
        <span
          className={cn(
            'overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300',
            compact ? 'ms-0 max-w-0 opacity-0' : 'max-w-16 opacity-100'
          )}
          aria-hidden={compact}
        >
          {current.label}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 mt-2 min-w-[10rem] rounded-xl border bg-white py-1 shadow-lg z-50"
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              role="menuitem"
              onClick={() => switchLocale(l.code)}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-slate-50',
                l.code === locale ? 'font-semibold text-slate-900' : 'text-slate-600'
              )}
            >
              <span>{l.native}</span>
              {l.code === locale && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
