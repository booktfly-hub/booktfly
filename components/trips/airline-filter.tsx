'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AirlineEntry = {
  code: string
  name: string
  count: number
  minPrice: number
  currency?: string
  logoUrl?: string
}

interface AirlineFilterProps {
  airlines: AirlineEntry[]
  value: string[]
  onChange: (next: string[]) => void
  className?: string
  initialVisible?: number
}

export function AirlineFilter({
  airlines,
  value,
  onChange,
  className,
  initialVisible = 6,
}: AirlineFilterProps) {
  const t = useTranslations('filters')
  const [expanded, setExpanded] = useState(false)

  if (airlines.length === 0) return null

  const sorted = [...airlines].sort((a, b) => a.minPrice - b.minPrice)
  const visible = expanded ? sorted : sorted.slice(0, initialVisible)
  const hiddenCount = Math.max(0, sorted.length - initialVisible)

  const toggle = (code: string) => {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code])
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
          {t('provider_filter')}
        </h4>
        {value.length > 0 && (
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
        {visible.map((a) => {
          const active = value.includes(a.code)
          return (
            <button
              key={a.code}
              type="button"
              onClick={() => toggle(a.code)}
              aria-pressed={active}
              className={cn(
                'group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs md:text-sm font-bold transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-slate-900'
              )}
            >
              {a.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.logoUrl}
                  alt=""
                  className="h-4 w-4 rounded-sm object-contain bg-white"
                  loading="lazy"
                />
              ) : (
                <span
                  className={cn(
                    'inline-flex items-center justify-center h-5 w-5 rounded-sm text-[10px] font-bold',
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {a.code.slice(0, 2)}
                </span>
              )}
              <span className="truncate max-w-32">{a.name}</span>
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-1.5 min-w-5 h-5 text-[10px] font-bold',
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                )}
              >
                {a.count}
              </span>
              <span
                className={cn(
                  'text-[11px] font-semibold',
                  active ? 'text-white/90' : 'text-primary'
                )}
              >
                {Math.round(a.minPrice)} {a.currency || ''}
              </span>
            </button>
          )
        })}

        {hiddenCount > 0 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs md:text-sm font-bold text-slate-600 hover:border-primary/40 hover:text-slate-900 transition-colors"
          >
            +{hiddenCount}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
        {expanded && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex items-center rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs md:text-sm font-bold text-slate-600 hover:border-primary/40 hover:text-slate-900 transition-colors"
          >
            −
          </button>
        )}
      </div>
    </div>
  )
}
