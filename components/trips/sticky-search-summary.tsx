'use client'

import { useEffect, useState, type RefObject } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, ArrowLeftRight, CalendarIcon, Pencil, Search, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/i18n-helpers'
import { format, parseISO, isValid } from 'date-fns'
import { enUS } from 'date-fns/locale'

interface StickySearchSummaryProps {
  watchRef: RefObject<HTMLElement | null>
  origin: string
  destination: string
  dateFrom: string
  dateTo: string
  tripType: string
  cabinClass: string
  adults: number
  children: number
  infants: number
  onEdit: () => void
  onSearch: () => void
}

const formatDate = (value: string): string | null => {
  if (!value) return null
  const d = parseISO(value)
  return isValid(d) ? format(d, 'd MMM', { locale: enUS }) : null
}

export function StickySearchSummary({
  watchRef,
  origin,
  destination,
  dateFrom,
  dateTo,
  tripType,
  cabinClass,
  adults,
  children,
  infants,
  onEdit,
  onSearch,
}: StickySearchSummaryProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = watchRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Card is "out of view" when its bottom is above the viewport top by some margin.
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      },
      { rootMargin: '-80px 0px 0px 0px', threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [watchRef])

  const totalPax = adults + children + infants
  const fromLabel = formatDate(dateFrom)
  const toLabel = formatDate(dateTo)
  const dateLabel =
    tripType !== 'one_way' && fromLabel && toLabel
      ? `${fromLabel} – ${toLabel}`
      : fromLabel || pick(locale, 'اختر التاريخ', 'Pick dates', 'Tarih seçin')

  const cabinKey =
    cabinClass === 'business' || cabinClass === 'first' ? cabinClass : 'economy'
  const cabinLabel = t(`trips.${cabinKey}` as 'trips.economy' | 'trips.business' | 'trips.first')

  const paxLabel = `${totalPax} ${pick(
    locale,
    totalPax === 1 ? 'مسافر' : 'مسافرين',
    totalPax === 1 ? 'passenger' : 'passengers',
    'yolcu',
  )}`

  const hasRoute = origin && destination

  return (
    <div
      className={cn(
        'fixed top-20 inset-x-0 z-30 transition-all duration-300 pointer-events-none',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
      )}
      aria-hidden={!visible}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div
          className={cn(
            'pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-lg shadow-slate-900/5 border border-slate-100',
            'flex items-center gap-2 sm:gap-3 p-2 sm:p-3',
          )}
          role="region"
          aria-label={pick(locale, 'ملخص البحث', 'Search summary', 'Arama özeti')}
        >
          {/* Route */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-slate-900 truncate">
                {origin || pick(locale, 'من', 'From', 'Nereden')}
              </span>
              {tripType === 'round_trip' ? (
                <ArrowLeftRight className="h-4 w-4 text-slate-400 shrink-0" />
              ) : (
                <ArrowRight className={cn('h-4 w-4 text-slate-400 shrink-0', isAr && 'rotate-180')} />
              )}
              <span className="text-sm font-bold text-slate-900 truncate">
                {destination || pick(locale, 'إلى', 'To', 'Nereye')}
              </span>
            </div>
            <div className="flex sm:hidden items-center gap-1 min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">
                {hasRoute ? `${origin} → ${destination}` : pick(locale, 'بحث جديد', 'Search', 'Ara')}
              </span>
            </div>

            <span className="hidden sm:block h-5 w-px bg-slate-200" />

            {/* Date */}
            <div className="hidden md:flex items-center gap-1.5 text-slate-600 shrink-0">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold whitespace-nowrap">{dateLabel}</span>
            </div>

            <span className="hidden md:block h-5 w-px bg-slate-200" />

            {/* Pax + Cabin */}
            <div className="hidden lg:flex items-center gap-1.5 text-slate-600 shrink-0">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold whitespace-nowrap">
                {paxLabel} · {cabinLabel}
              </span>
            </div>
          </div>

          {/* Actions */}
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-colors shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{pick(locale, 'تعديل', 'Edit', 'Düzenle')}</span>
          </button>
          <button
            type="button"
            onClick={onSearch}
            className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold transition-colors shrink-0 shadow-sm shadow-primary/20"
          >
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('common.search')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
