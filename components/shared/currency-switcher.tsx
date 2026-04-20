'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { DollarSign, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DisplayCurrency = 'SAR' | 'AED' | 'USD' | 'EUR' | 'GBP'

const LOCAL_KEY = 'bookitfly.display_currency'

const CURRENCY_LABEL: Record<DisplayCurrency, { ar: string; en: string; symbol: string }> = {
  SAR: { ar: 'ريال سعودي', en: 'Saudi Riyal', symbol: 'ر.س' },
  AED: { ar: 'درهم إماراتي', en: 'UAE Dirham', symbol: 'د.إ' },
  USD: { ar: 'دولار أمريكي', en: 'US Dollar', symbol: '$' },
  EUR: { ar: 'يورو', en: 'Euro', symbol: '€' },
  GBP: { ar: 'جنيه استرليني', en: 'GB Pound', symbol: '£' },
}

/**
 * Currency switcher. Stores choice in localStorage.
 * Pages can read the current display currency with `getDisplayCurrency()` and convert on-the-fly.
 */
export function CurrencySwitcher({ className }: { className?: string }) {
  const t = useTranslations('currency')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [cur, setCur] = useState<DisplayCurrency>('SAR')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const saved = (localStorage.getItem(LOCAL_KEY) as DisplayCurrency | null) ?? 'SAR'
    setCur(saved)
  }, [])

  function pick(next: DisplayCurrency) {
    setCur(next)
    localStorage.setItem(LOCAL_KEY, next)
    setOpen(false)
    window.dispatchEvent(new CustomEvent('bookitfly:currency-change', { detail: next }))
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('change_currency')}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold hover:bg-muted"
      >
        <DollarSign className="h-3 w-3" />
        {cur}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute end-0 top-full mt-1 rounded-lg border border-border bg-popover shadow-lg min-w-[180px] py-1 z-50">
          {(Object.keys(CURRENCY_LABEL) as DisplayCurrency[]).map((code) => {
            const info = CURRENCY_LABEL[code]
            return (
              <button
                key={code}
                type="button"
                onClick={() => pick(code)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted text-start',
                  code === cur && 'bg-muted font-bold',
                )}
              >
                <span className="font-mono w-8">{code}</span>
                <span className="flex-1">{isAr ? info.ar : info.en}</span>
                <span className="text-muted-foreground">{info.symbol}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function getDisplayCurrency(): DisplayCurrency {
  if (typeof window === 'undefined') return 'SAR'
  return (localStorage.getItem(LOCAL_KEY) as DisplayCurrency | null) ?? 'SAR'
}
