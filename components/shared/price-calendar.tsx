'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isBefore } from 'date-fns'
import { ar as arLocale, enUS } from 'date-fns/locale'

interface PriceCalendarProps {
  originCode: string
  destinationCode: string
  cabinClass?: string
  onDateSelect: (date: Date) => void
  selectedDate?: Date
}

type PriceMap = Record<string, number>

export function PriceCalendar({
  originCode,
  destinationCode,
  cabinClass,
  onDateSelect,
  selectedDate,
}: PriceCalendarProps) {
  const locale = useLocale()
  const t = useTranslations('common')
  const isAr = locale === 'ar'
  const dateLocale = isAr ? arLocale : enUS

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const [prices, setPrices] = useState<PriceMap>({})
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchPrices = useCallback(async () => {
    if (!originCode || !destinationCode) return
    setLoading(true)
    try {
      const monthStr = format(currentMonth, 'yyyy-MM')
      const params = new URLSearchParams({
        origin: originCode,
        destination: destinationCode,
        month: monthStr,
      })
      if (cabinClass) params.set('cabin_class', cabinClass)

      const res = await fetch(`/api/trips/price-calendar?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPrices(data.prices)
        setMinPrice(data.min_price)
        setMaxPrice(data.max_price)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [originCode, destinationCode, currentMonth, cabinClass])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const startDay = getDay(startOfMonth(currentMonth))
  const blanks = Array(startDay).fill(null)

  function getPriceColor(price: number): string {
    if (maxPrice === minPrice) return 'text-success'
    const ratio = (price - minPrice) / (maxPrice - minPrice)
    if (ratio <= 0.33) return 'text-success font-semibold'
    if (ratio <= 0.66) return 'text-warning'
    return 'text-destructive'
  }

  const weekDays = isAr
    ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-lg w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          aria-label="Previous month"
        >
          {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <h3 className="font-semibold text-sm">
          {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          aria-label="Next month"
        >
          {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const price = prices[dateStr]
          const isPast = isBefore(day, new Date()) && !isToday(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <button
              key={dateStr}
              onClick={() => !isPast && price && onDateSelect(day)}
              disabled={isPast || !price}
              className={cn(
                'flex flex-col items-center justify-center rounded-lg py-1.5 px-0.5 text-xs transition-colors min-h-[52px]',
                isPast && 'opacity-30 cursor-not-allowed',
                !price && !isPast && 'opacity-50',
                price && !isPast && 'hover:bg-primary/5 cursor-pointer',
                isSelected && 'bg-primary/10 ring-1 ring-primary',
                isToday(day) && 'font-bold'
              )}
            >
              <span className="text-foreground">{day.getDate()}</span>
              {price && (
                <span className={cn('text-[10px] mt-0.5', getPriceColor(price))}>
                  {price >= 1000 ? `${(price / 1000).toFixed(1)}k` : price}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="text-center text-xs text-muted-foreground mt-3">
          {t('loading')}
        </div>
      )}

      {/* Legend */}
      {minPrice > 0 && (
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px]">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success" />
            {t('price')}: {minPrice} {t('sar')}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            {maxPrice} {t('sar')}
          </span>
        </div>
      )}
    </div>
  )
}
