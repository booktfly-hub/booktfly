'use client'

import { pick } from '@/lib/i18n-helpers'
import { useLocale, useTranslations } from 'next-intl'
import { TrendingDown, TrendingUp, Zap, Star, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortKey = 'price_asc' | 'price_desc' | 'fastest' | 'newest' | 'rating'

export interface SortTabPreview {
  /** cheapest/fastest/etc price to preview in tab chip */
  price?: number | null
  /** duration in minutes to preview */
  durationMin?: number | null
  /** rating 0–5 */
  rating?: number | null
  currency?: string
}

interface SortTabsProps {
  value: SortKey
  onChange: (next: SortKey) => void
  previews?: Partial<Record<SortKey, SortTabPreview>>
  options?: SortKey[]
  className?: string
}

const DEFAULT_OPTIONS: SortKey[] = ['price_asc', 'fastest', 'rating', 'newest']

export function SortTabs({
  value,
  onChange,
  previews = {},
  options = DEFAULT_OPTIONS,
  className,
}: SortTabsProps) {
  const t = useTranslations('sort_tabs')
  const locale = useLocale()
  const isAr = locale === 'ar'

  function icon(k: SortKey) {
    switch (k) {
      case 'price_asc': return TrendingDown
      case 'price_desc': return TrendingUp
      case 'fastest': return Zap
      case 'rating': return Star
      case 'newest': return Clock
    }
  }

  function previewLabel(k: SortKey): string | null {
    const p = previews[k]
    if (!p) return null
    const cur = p.currency ?? 'SAR'
    switch (k) {
      case 'price_asc':
      case 'price_desc':
        if (p.price == null) return null
        return pick(locale, `من ${p.price.toLocaleString('ar-SA')} ${cur === 'SAR' ? 'ر.س' : cur}`, `from ${p.price.toLocaleString('en-US')} ${cur}`)
      case 'fastest':
        if (p.durationMin == null) return null
        return formatDuration(p.durationMin, isAr)
      case 'rating':
        if (p.rating == null) return null
        return `${p.rating.toFixed(1)} ★`
      default:
        return null
    }
  }

  return (
    <div className={cn('overflow-x-auto scrollbar-none -mx-1 px-1', className)}>
      <div className="inline-flex items-stretch gap-2">
        {options.map((opt) => {
          const Icon = icon(opt)
          const active = value === opt
          const preview = previewLabel(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={active}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors min-w-[110px]',
                active
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card hover:bg-muted/40',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-muted-foreground')} />
              <div className="flex flex-col items-start">
                <span className="font-bold whitespace-nowrap">{t(opt)}</span>
                {preview && (
                  <span className={cn('text-[10px] mt-0.5', active ? 'text-primary/80' : 'text-muted-foreground')}>
                    {preview}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function formatDuration(min: number, isAr: boolean) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (isAr) return `${h} س ${m} د`
  return `${h}h ${m}m`
}
