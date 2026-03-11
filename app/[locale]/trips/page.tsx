'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  Search,
  SlidersHorizontal,
  X,
  Plane,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import { TripCard } from '@/components/trips/trip-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import type { Trip } from '@/types'

type Filters = {
  origin: string
  destination: string
  date_from: string
  date_to: string
  price_min: string
  price_max: string
  trip_type: string
  cabin_class: string
  sort: string
}

const initialFilters: Filters = {
  origin: '',
  destination: '',
  date_from: '',
  date_to: '',
  price_min: '',
  price_max: '',
  trip_type: '',
  cabin_class: '',
  sort: 'newest',
}

export default function TripsPage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [showFilters, setShowFilters] = useState(false)

  const debouncedOrigin = useDebounce(filters.origin, 400)
  const debouncedDestination = useDebounce(filters.destination, 400)

  const fetchTrips = useCallback(
    async (pageNum: number, append = false) => {
      if (!append) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = new URLSearchParams()
        params.set('page', String(pageNum))
        params.set('limit', '12')
        if (debouncedOrigin) params.set('origin', debouncedOrigin)
        if (debouncedDestination) params.set('destination', debouncedDestination)
        if (filters.date_from) params.set('date_from', filters.date_from)
        if (filters.date_to) params.set('date_to', filters.date_to)
        if (filters.price_min) params.set('price_min', filters.price_min)
        if (filters.price_max) params.set('price_max', filters.price_max)
        if (filters.trip_type) params.set('trip_type', filters.trip_type)
        if (filters.cabin_class) params.set('cabin_class', filters.cabin_class)
        if (filters.sort) params.set('sort', filters.sort)

        const res = await fetch(`/api/trips?${params.toString()}`)
        const data = await res.json()

        if (append) {
          setTrips((prev) => [...prev, ...(data.trips || [])])
        } else {
          setTrips(data.trips || [])
        }
        setTotalPages(data.totalPages || 1)
      } catch {
        // Error handled silently
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [debouncedOrigin, debouncedDestination, filters.date_from, filters.date_to, filters.price_min, filters.price_max, filters.trip_type, filters.cabin_class, filters.sort]
  )

  useEffect(() => {
    setPage(1)
    fetchTrips(1)
  }, [fetchTrips])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchTrips(nextPage, true)
  }

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(initialFilters)
  }

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => key !== 'sort' && val !== ''
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {t('trips.browse_title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('trips.search_placeholder')}
        </p>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Origin search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('trips.filter_origin')}
            value={filters.origin}
            onChange={(e) => updateFilter('origin', e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {/* Destination search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('trips.filter_destination')}
            value={filters.destination}
            onChange={(e) => updateFilter('destination', e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="appearance-none w-full sm:w-48 px-4 py-2.5 rounded-lg border bg-background text-sm pe-10 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="newest">{t('trips.sort_newest')}</option>
            <option value="price_asc">{t('trips.sort_price_asc')}</option>
            <option value="price_desc">{t('trips.sort_price_desc')}</option>
            <option value="date">{t('trips.sort_date')}</option>
          </select>
          <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
            showFilters
              ? 'bg-accent text-accent-foreground border-accent'
              : 'bg-background hover:bg-muted'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t('common.filter')}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border bg-card p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date range */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t('trips.filter_date')} ({t('common.from')})
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => updateFilter('date_from', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t('trips.filter_date')} ({t('common.to')})
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => updateFilter('date_to', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Price range */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t('trips.filter_price')} ({t('common.from')})
              </label>
              <input
                type="number"
                min="0"
                value={filters.price_min}
                onChange={(e) => updateFilter('price_min', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t('trips.filter_price')} ({t('common.to')})
              </label>
              <input
                type="number"
                min="0"
                value={filters.price_max}
                onChange={(e) => updateFilter('price_max', e.target.value)}
                placeholder="10000"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Trip type */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t('trips.filter_type')}
              </label>
              <select
                value={filters.trip_type}
                onChange={(e) => updateFilter('trip_type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('common.view_all')}</option>
                <option value="one_way">{t('trips.one_way')}</option>
                <option value="round_trip">{t('trips.round_trip')}</option>
              </select>
            </div>

            {/* Cabin class */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {t('trips.filter_cabin')}
              </label>
              <select
                value={filters.cabin_class}
                onChange={(e) => updateFilter('cabin_class', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('common.view_all')}</option>
                <option value="economy">{t('trips.economy')}</option>
                <option value="business">{t('trips.business')}</option>
                <option value="first">{t('trips.first')}</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                {t('common.cancel')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Plane}
          message={t('trips.no_trips')}
          actionLabel={hasActiveFilters ? t('common.cancel') : undefined}
          onAction={hasActiveFilters ? clearFilters : undefined}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>

          {/* Load more */}
          {page < totalPages && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {loadingMore ? t('common.loading') : t('common.view_all')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
