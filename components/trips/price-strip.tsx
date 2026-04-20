'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PriceStripProps {
  originCode: string
  destinationCode: string
  cabinClass?: string
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  className?: string
  /** how many days to show */
  daysToShow?: number
}

/**
 * Horizontal 7-day price strip under the search widget.
 * Shows cheapest price per day, highlights the selected day, lets user scroll to next week.
 */
export function PriceStrip({
  originCode,
  destinationCode,
  cabinClass,
  selectedDate,
  onDateSelect,
  className,
  daysToShow = 7,
}: PriceStripProps) {
  const locale = useLocale()
  const t = useTranslations('price_strip')
  const isAr = locale === 'ar'

  const [anchor, setAnchor] = useState<Date>(() => {
    if (selectedDate) {
      const d = new Date(selectedDate)
      d.setDate(d.getDate() - Math.floor(daysToShow / 2))
      return d
    }
    return new Date()
  })

  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  const days = useMemo(() => {
    const arr: Date[] = []
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(anchor)
      d.setDate(d.getDate() + i)
      arr.push(d)
    }
    return arr
  }, [anchor, daysToShow])

  const fetchPrices = useCallback(async () => {
    if (!originCode || !destinationCode) return
    setLoading(true)
    try {
      const monthStr = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}`
      const params = new URLSearchParams({
        origin: originCode,
        destination: destinationCode,
        month: monthStr,
      })
      if (cabinClass) params.set('cabin_class', cabinClass)
      const res = await fetch(`/api/trips/price-calendar?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPrices(data.prices ?? {})
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [anchor, originCode, destinationCode, cabinClass])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  const minPrice = useMemo(() => {
    const vals = days.map((d) => prices[formatYMD(d)]).filter((v): v is number => typeof v === 'number')
    return vals.length ? Math.min(...vals) : null
  }, [days, prices])

  function shift(amount: number) {
    const d = new Date(anchor)
    d.setDate(d.getDate() + amount)
    setAnchor(d)
  }

  function isSelected(d: Date) {
    if (!selectedDate) return false
    return formatYMD(d) === formatYMD(selectedDate)
  }

  function isToday(d: Date) {
    return formatYMD(d) === formatYMD(new Date())
  }

  if (!originCode || !destinationCode) return null

  return (
    <div className={cn('rounded-xl border border-border bg-card p-2 shadow-sm', className)}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => shift(-daysToShow)}
          aria-label={t('prev_week')}
          className="shrink-0 h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
        >
          {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${daysToShow}, minmax(0, 1fr))` }}>
          {days.map((d) => {
            const ymd = formatYMD(d)
            const price = prices[ymd]
            const selected = isSelected(d)
            const today = isToday(d)
            const isCheapest = price != null && minPrice != null && price === minPrice
            return (
              <button
                key={ymd}
                type="button"
                disabled={!price}
                onClick={() => onDateSelect(d)}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg px-1 py-2 text-xs transition-colors min-h-[64px]',
                  selected
                    ? 'bg-primary text-primary-foreground'
                    : price
                    ? 'hover:bg-primary/10 cursor-pointer'
                    : 'opacity-40 cursor-not-allowed',
                  today && !selected && 'ring-1 ring-primary/40',
                )}
              >
                <span className="text-[10px] font-semibold uppercase opacity-80">
                  {d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'short' })}
                </span>
                <span className="text-sm font-bold leading-tight mt-0.5">
                  {d.getDate()} {d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short' })}
                </span>
                {price != null ? (
                  <span
                    className={cn(
                      'text-[11px] mt-1 font-bold tabular-nums',
                      selected
                        ? 'text-primary-foreground'
                        : isCheapest
                        ? 'text-emerald-600'
                        : 'text-foreground',
                    )}
                  >
                    {price >= 1000 ? `${(price / 1000).toFixed(1)}k` : price}
                  </span>
                ) : (
                  <span className="text-[10px] mt-1 text-muted-foreground">—</span>
                )}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => shift(daysToShow)}
          aria-label={t('next_week')}
          className="shrink-0 h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
        >
          {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-muted-foreground">
        <span>{loading ? t('loading') : t('cheapest_hint')}</span>
        {minPrice != null && (
          <span className="font-semibold text-emerald-600">
            {t('from', { amount: minPrice })}
          </span>
        )}
      </div>
    </div>
  )
}

function formatYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
