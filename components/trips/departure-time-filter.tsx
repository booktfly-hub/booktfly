'use client'

import { useTranslations } from 'next-intl'
import { Sunrise, Sun, Sunset, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night'

export const timeBucketFromHour = (hour: number): TimeBucket => {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 24) return 'evening'
  return 'night'
}

export const timeBucketFromIso = (iso: string | null | undefined): TimeBucket | null => {
  if (!iso) return null
  // Parse the hour from the ISO string. Use UTC to avoid the user's local TZ
  // shifting buckets — the offer's "morning" should mean morning at the origin.
  const m = /T(\d{2}):/.exec(iso)
  if (!m) return null
  const h = parseInt(m[1], 10)
  if (Number.isNaN(h)) return null
  return timeBucketFromHour(h)
}

interface DepartureTimeFilterProps {
  value: TimeBucket[]
  onChange: (next: TimeBucket[]) => void
  counts?: Partial<Record<TimeBucket, number>>
  className?: string
}

const BUCKET_ICON: Record<TimeBucket, React.ComponentType<{ className?: string }>> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
}

export function DepartureTimeFilter({ value, onChange, counts, className }: DepartureTimeFilterProps) {
  const t = useTranslations('filters')

  const buckets: TimeBucket[] = ['morning', 'afternoon', 'evening', 'night']

  const toggle = (b: TimeBucket) => {
    onChange(value.includes(b) ? value.filter((x) => x !== b) : [...value, b])
  }

  const hasActive = value.length > 0

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
          {t('departure_time')}
        </h4>
        {hasActive && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {buckets.map((b) => {
          const Icon = BUCKET_ICON[b]
          const active = value.includes(b)
          const count = counts?.[b]
          return (
            <button
              key={b}
              type="button"
              onClick={() => toggle(b)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs md:text-sm font-bold transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(b)}</span>
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
            </button>
          )
        })}
      </div>
    </div>
  )
}
