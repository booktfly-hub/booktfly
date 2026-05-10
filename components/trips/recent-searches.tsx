'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { ArrowLeftRight, ArrowRight, CalendarIcon, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/i18n-helpers'
import { format, parseISO, isValid } from 'date-fns'
import { enUS } from 'date-fns/locale'

const STORAGE_KEY = 'bookitfly:recent_searches'
const MAX_ENTRIES = 6

export type RecentSearch = {
  origin: string
  destination: string
  date_from?: string
  date_to?: string
  trip_type?: string
  cabin_class?: string
  adults?: number
  children?: number
  infants?: number
  ts: number
}

export function loadRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is RecentSearch =>
        e && typeof e.origin === 'string' && typeof e.destination === 'string' && typeof e.ts === 'number',
    )
  } catch {
    return []
  }
}

export function saveRecentSearch(entry: Omit<RecentSearch, 'ts'>) {
  if (typeof window === 'undefined') return
  if (!entry.origin || !entry.destination) return
  const list = loadRecentSearches()
  const key = `${entry.origin.toUpperCase()}-${entry.destination.toUpperCase()}-${entry.date_from || ''}`
  const filtered = list.filter(
    (e) => `${e.origin.toUpperCase()}-${e.destination.toUpperCase()}-${e.date_from || ''}` !== key,
  )
  const next = [{ ...entry, ts: Date.now() }, ...filtered].slice(0, MAX_ENTRIES)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage full or disabled — ignore.
  }
}

export function clearRecentSearches() {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem(STORAGE_KEY) } catch {}
}

const formatDate = (value?: string): string | null => {
  if (!value) return null
  const d = parseISO(value)
  return isValid(d) ? format(d, 'd MMM', { locale: enUS }) : null
}

interface RecentSearchesProps {
  onSelect: (entry: RecentSearch) => void
  className?: string
  /** Bumping this value re-reads localStorage (e.g. after a new search). */
  refreshKey?: number
}

export function RecentSearches({ onSelect, className, refreshKey = 0 }: RecentSearchesProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [items, setItems] = useState<RecentSearch[]>([])

  useEffect(() => {
    setItems(loadRecentSearches())
  }, [refreshKey])

  const remove = useCallback((entry: RecentSearch) => {
    const list = loadRecentSearches().filter(
      (e) =>
        !(
          e.origin === entry.origin &&
          e.destination === entry.destination &&
          (e.date_from || '') === (entry.date_from || '')
        ),
    )
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    }
    setItems(list)
  }, [])

  if (items.length === 0) return null

  return (
    <div className={cn('animate-fade-in-up', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
          {pick(locale, 'عمليات بحث أخيرة', 'Recent searches', 'Son aramalar')}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((e) => {
          const fromLabel = formatDate(e.date_from)
          const toLabel = formatDate(e.date_to)
          const dateLabel =
            e.trip_type === 'round_trip' && fromLabel && toLabel
              ? `${fromLabel} – ${toLabel}`
              : fromLabel
          return (
            <div
              key={`${e.origin}-${e.destination}-${e.date_from || ''}-${e.ts}`}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-primary/40 hover:text-slate-900 transition-colors"
            >
              <button
                type="button"
                onClick={() => onSelect(e)}
                className="inline-flex items-center gap-1.5"
              >
                <span>{e.origin}</span>
                {e.trip_type === 'round_trip' ? (
                  <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ArrowRight className={cn('h-3.5 w-3.5 text-slate-400', isAr && 'rotate-180')} />
                )}
                <span>{e.destination}</span>
                {dateLabel && (
                  <>
                    <span className="mx-1 h-3 w-px bg-slate-200" />
                    <CalendarIcon className="h-3 w-3 text-slate-400" />
                    <span className="font-semibold text-slate-500">{dateLabel}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => remove(e)}
                aria-label={pick(locale, 'إزالة', 'Remove', 'Kaldır')}
                className="text-slate-300 hover:text-slate-700 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
