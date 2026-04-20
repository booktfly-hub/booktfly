'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { formatHijri, gregorianToHijri, hijriDaysInMonth, hijriMonths, hijriToGregorian } from '@/lib/hijri'

type Mode = 'gregorian' | 'hijri'

interface HijriDatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  minDate?: Date
  maxDate?: Date
  showHijriToggle?: boolean
  /** start mode — defaults to gregorian unless locale is ar */
  defaultMode?: Mode
  className?: string
  disabled?: boolean
}

/**
 * Calendar wrapper that adds a Hijri <-> Gregorian toggle.
 * In Gregorian mode it renders the base <Calendar>.
 * In Hijri mode it renders 3 dropdowns (day / month / year) in Hijri and converts to Gregorian for the callback.
 */
export function HijriDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  showHijriToggle = true,
  defaultMode,
  className,
  disabled,
}: HijriDatePickerProps) {
  const locale = useLocale()
  const t = useTranslations('hijri')
  const isAr = locale === 'ar'

  const [mode, setMode] = useState<Mode>(defaultMode ?? (isAr ? 'hijri' : 'gregorian'))

  const hijriValue = useMemo(() => (value ? gregorianToHijri(value) : null), [value])
  const [hYear, setHYear] = useState<number>(hijriValue?.year ?? 1420)
  const [hMonth, setHMonth] = useState<number>(hijriValue?.month ?? 1)
  const [hDay, setHDay] = useState<number>(hijriValue?.day ?? 1)

  const monthNames = hijriMonths(isAr ? 'ar' : 'en')

  const yearOptions = useMemo(() => {
    const current = hYear || 1420
    const years: number[] = []
    for (let y = current - 80; y <= current + 20; y++) years.push(y)
    return years
  }, [hYear])

  const dayOptions = useMemo(() => {
    const max = hijriDaysInMonth(hYear, hMonth)
    return Array.from({ length: max }, (_, i) => i + 1)
  }, [hYear, hMonth])

  function commitHijri(y: number, m: number, d: number) {
    const safeDay = Math.min(d, hijriDaysInMonth(y, m))
    setHYear(y)
    setHMonth(m)
    setHDay(safeDay)
    const greg = hijriToGregorian({ year: y, month: m, day: safeDay })
    onChange(greg)
  }

  const currentHijri = value ? gregorianToHijri(value) : null

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showHijriToggle && (
        <div className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 self-start text-xs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setMode('gregorian')}
            className={cn(
              'rounded-md px-2.5 py-1 font-medium transition-colors',
              mode === 'gregorian' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t('gregorian')}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setMode('hijri')}
            className={cn(
              'rounded-md px-2.5 py-1 font-medium transition-colors',
              mode === 'hijri' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t('hijri')}
          </button>
        </div>
      )}

      {mode === 'gregorian' ? (
        <>
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            disabled={disabled ? true : (date) => {
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
          />
          {value && (
            <p className="text-[11px] text-muted-foreground">
              {t('hijri_label')}: {formatHijri(gregorianToHijri(value), isAr ? 'ar' : 'en')}
            </p>
          )}
        </>
      ) : (
        <div className="grid grid-cols-3 gap-2 min-w-[260px]">
          <select
            disabled={disabled}
            value={hDay}
            onChange={(e) => commitHijri(hYear, hMonth, Number(e.target.value))}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            aria-label={t('day')}
          >
            {dayOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            disabled={disabled}
            value={hMonth}
            onChange={(e) => commitHijri(hYear, Number(e.target.value), hDay)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            aria-label={t('month')}
          >
            {monthNames.map((name, idx) => (
              <option key={idx} value={idx + 1}>{name}</option>
            ))}
          </select>
          <select
            disabled={disabled}
            value={hYear}
            onChange={(e) => commitHijri(Number(e.target.value), hMonth, hDay)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            aria-label={t('year')}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {currentHijri && (
            <p className="col-span-3 text-[11px] text-muted-foreground mt-1">
              {t('gregorian_label')}: {value?.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
