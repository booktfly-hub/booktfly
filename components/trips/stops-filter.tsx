'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export type StopValue = 'direct' | '1' | '2+'

interface StopsFilterProps {
  value: StopValue[]
  onChange: (next: StopValue[]) => void
  counts?: Partial<Record<StopValue, number>>
  minPrices?: Partial<Record<StopValue, { price: number; currency?: string }>>
  className?: string
}

export function StopsFilter({ value, onChange, counts, minPrices, className }: StopsFilterProps) {
  const t = useTranslations('filters')

  const options: { value: StopValue; label: string }[] = [
    { value: 'direct', label: t('direct') },
    { value: '1', label: t('one_stop') },
    { value: '2+', label: t('two_plus_stops') },
  ]

  const toggle = (v: StopValue) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  const clear = () => onChange([])

  const hasActive = value.length > 0

  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto scrollbar-thin -mx-1 px-1 py-1',
        className
      )}
      role="group"
      aria-label="Stops filter"
    >
      {options.map((opt) => {
        const active = value.includes(opt.value)
        const count = counts?.[opt.value]
        const min = minPrices?.[opt.value]
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            aria-pressed={active}
            className={cn(
              'group shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs md:text-sm font-bold transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-slate-900'
            )}
          >
            <span>{opt.label}</span>
            {typeof count === 'number' && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-1.5 min-w-5 h-5 text-[10px] font-bold',
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                )}
              >
                {count}
              </span>
            )}
            {min && (
              <span
                className={cn(
                  'text-[11px] font-semibold',
                  active ? 'text-white/90' : 'text-primary'
                )}
              >
                {Math.round(min.price)} {min.currency || ''}
              </span>
            )}
          </button>
        )
      })}
      {hasActive && (
        <button
          type="button"
          onClick={clear}
          className="shrink-0 inline-flex items-center rounded-full px-3 py-2 text-[11px] font-semibold text-slate-500 hover:text-slate-900"
        >
          ×
        </button>
      )}
    </div>
  )
}
