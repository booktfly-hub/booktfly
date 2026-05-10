'use client'

import { useTranslations } from 'next-intl'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DurationFilterProps {
  /** Current cap in hours; null means "no cap" (slider sits at max). */
  value: number | null
  onChange: (next: number | null) => void
  /** Min/max bounds derived from the result set (in hours). */
  min: number
  max: number
  className?: string
}

export function DurationFilter({ value, onChange, min, max, className }: DurationFilterProps) {
  const t = useTranslations('filters')

  // Clamp & guard
  const lo = Math.max(1, Math.floor(min))
  const hi = Math.max(lo + 1, Math.ceil(max))
  const current = value ?? hi

  const handleChange = (n: number) => {
    if (n >= hi) onChange(null)
    else onChange(n)
  }

  const active = value !== null && value < hi

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
          <Clock className="h-3.5 w-3.5" />
          {t('max_duration')}
        </h4>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs md:text-sm font-bold tabular-nums',
              active ? 'text-primary' : 'text-slate-700'
            )}
          >
            ≤ {current} {t('hours')}
          </span>
          {active && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="px-1">
        <input
          type="range"
          min={lo}
          max={hi}
          step={1}
          value={current}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="w-full h-2 accent-primary cursor-pointer"
          aria-label={t('max_duration')}
        />
        <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
          <span>{lo}h</span>
          <span>{hi}h</span>
        </div>
      </div>
    </div>
  )
}
