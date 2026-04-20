'use client'

import { useTranslations } from 'next-intl'
import { Minus, Plus, User, Baby, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PassengerCounts {
  adults: number
  children: number
  infants: number
}

interface PassengerCategoryPickerProps {
  value: PassengerCounts
  onChange: (next: PassengerCounts) => void
  maxTotal?: number
  /** Show infant counter? defaults true */
  allowInfants?: boolean
  className?: string
  /** compact = single-column for mobile; wide = 3 columns */
  layout?: 'compact' | 'wide'
}

export function PassengerCategoryPicker({
  value,
  onChange,
  maxTotal = 10,
  allowInfants = true,
  className,
  layout = 'wide',
}: PassengerCategoryPickerProps) {
  const t = useTranslations('age_category')
  const total = value.adults + value.children + value.infants
  const canIncrease = total < maxTotal

  function patch(key: keyof PassengerCounts, delta: number) {
    const next = { ...value, [key]: Math.max(0, value[key] + delta) }
    if (key === 'adults') next.adults = Math.max(1, next.adults) // at least 1 adult
    // infants can't exceed adults (FAA/industry practice — one infant per lap)
    if (next.infants > next.adults) next.infants = next.adults
    const sum = next.adults + next.children + next.infants
    if (sum > maxTotal) return
    onChange(next)
  }

  const rows: Array<{
    key: keyof PassengerCounts
    title: string
    desc: string
    Icon: React.ComponentType<{ className?: string }>
    min: number
  }> = [
    { key: 'adults', title: t('adult'), desc: t('adult_desc'), Icon: User, min: 1 },
    { key: 'children', title: t('child'), desc: t('child_desc'), Icon: UserRound, min: 0 },
  ]
  if (allowInfants) rows.push({ key: 'infants', title: t('infant'), desc: t('infant_desc'), Icon: Baby, min: 0 })

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className={cn('grid gap-3', layout === 'wide' ? 'sm:grid-cols-3' : 'grid-cols-1')}>
        {rows.map(({ key, title, desc, Icon, min }) => {
          const count = value[key]
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-none">{title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  aria-label={`decrease ${title}`}
                  disabled={count <= min}
                  onClick={() => patch(key, -1)}
                  className="h-7 w-7 rounded-full border border-input bg-background flex items-center justify-center disabled:opacity-40 hover:bg-muted"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-sm font-semibold tabular-nums">{count}</span>
                <button
                  type="button"
                  aria-label={`increase ${title}`}
                  disabled={!canIncrease || (key === 'infants' && count >= value.adults)}
                  onClick={() => patch(key, 1)}
                  className="h-7 w-7 rounded-full border border-input bg-background flex items-center justify-center disabled:opacity-40 hover:bg-muted"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {t('total', { count: total })} · {t('limits', { max: maxTotal })}
      </p>
    </div>
  )
}
