'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Award, TrendingDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RibbonKind = 'best_value' | 'cheapest' | 'fastest'

interface RibbonBadgeProps {
  kind: RibbonKind
  className?: string
}

const RIBBON_STYLES: Record<RibbonKind, { bg: string; text: string; border: string; Icon: React.ComponentType<{ className?: string }> }> = {
  best_value: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
    Icon: Award,
  },
  cheapest: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
    Icon: TrendingDown,
  },
  fastest: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    Icon: Zap,
  },
}

export function RibbonBadge({ kind, className }: RibbonBadgeProps) {
  const t = useTranslations('ribbon')
  const locale = useLocale()
  const isAr = locale === 'ar'

  const style = RIBBON_STYLES[kind]
  const { Icon } = style

  const label = isAr
    ? kind === 'best_value' ? 'أفضل قيمة' : kind === 'cheapest' ? 'الأرخص' : 'الأسرع'
    : t(kind)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold',
        style.bg,
        style.text,
        style.border,
        className,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  )
}

/**
 * Given an array of items with price and duration, compute which item gets which ribbon.
 * Returns a Map<itemId, RibbonKind>.
 */
export function computeRibbons<T extends { id: string; price: number; duration_minutes?: number | null }>(
  items: T[],
): Map<string, RibbonKind> {
  const map = new Map<string, RibbonKind>()
  if (items.length === 0) return map

  // Cheapest
  const cheapest = items.reduce((a, b) => (a.price <= b.price ? a : b))
  map.set(cheapest.id, 'cheapest')

  // Fastest (only if duration available)
  const withDuration = items.filter((i) => typeof i.duration_minutes === 'number' && i.duration_minutes! > 0)
  if (withDuration.length > 1) {
    const fastest = withDuration.reduce((a, b) => (a.duration_minutes! <= b.duration_minutes! ? a : b))
    if (!map.has(fastest.id)) {
      map.set(fastest.id, 'fastest')
    }
  }

  // Best value (price rank + duration rank composite; only if we have >= 3 items with duration)
  if (withDuration.length >= 3) {
    const sortedByPrice = [...items].sort((a, b) => a.price - b.price)
    const sortedByDuration = [...withDuration].sort((a, b) => (a.duration_minutes! - b.duration_minutes!))
    const priceRank = new Map(sortedByPrice.map((i, idx) => [i.id, idx + 1]))
    const durationRank = new Map(sortedByDuration.map((i, idx) => [i.id, idx + 1]))
    let bestId: string | null = null
    let bestScore = Infinity
    for (const item of withDuration) {
      if (map.has(item.id)) continue
      const p = priceRank.get(item.id) ?? withDuration.length
      const d = durationRank.get(item.id) ?? withDuration.length
      const score = p + d
      if (score < bestScore) {
        bestScore = score
        bestId = item.id
      }
    }
    if (bestId) map.set(bestId, 'best_value')
  }

  return map
}
