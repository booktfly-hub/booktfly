'use client'

import { useLocale } from 'next-intl'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/i18n-helpers'
import type { PriceTier } from '@/lib/price-tier'

interface PriceTierBadgeProps {
  tier: PriceTier
  className?: string
  /** Optional median price for a "vs. avg" tooltip. */
  median?: number | null
  currency?: string
}

export function PriceTierBadge({ tier, className, median, currency }: PriceTierBadgeProps) {
  const locale = useLocale()

  // Skip "typical" — only show when we have something meaningful to say.
  if (tier === 'typical') return null

  const isDeal = tier === 'good_deal'
  const Icon = isDeal ? TrendingDown : TrendingUp

  const label = isDeal
    ? pick(locale, 'صفقة جيدة', 'Good deal', 'İyi fırsat')
    : pick(locale, 'سعر مرتفع', 'High price', 'Yüksek fiyat')

  const tooltip =
    median && Number.isFinite(median)
      ? pick(
          locale,
          `مقارنة بمتوسط هذا المسار: ${Math.round(median)} ${currency || ''}`,
          `vs. route median ${Math.round(median)} ${currency || ''}`,
          `Bu rota ortalaması: ${Math.round(median)} ${currency || ''}`,
        )
      : undefined

  return (
    <span
      title={tooltip}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold',
        isDeal
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700',
        className,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  )
}
