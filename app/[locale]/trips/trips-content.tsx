'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Loader2,
  ArrowLeftRight,
  CalendarIcon,
  Plane,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TripCard } from '@/components/trips/trip-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { CityAutocomplete } from '@/components/shared/city-autocomplete'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SortTabs, type SortKey } from '@/components/trips/sort-tabs'
import { PriceStrip } from '@/components/trips/price-strip'
import { computeRibbons } from '@/components/ui/ribbon-badge'
import { StaleSearchModal } from '@/components/ui/stale-search-modal'
import { CategoryHero } from '@/components/shared/category-hero'
import type { Trip } from '@/types'
import { useMemo } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { enUS } from 'date-fns/locale'

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

const emptyFilters: Filters = {
  origin: '',
  destination: '',
  date_from: '',
  date_to: '',
  price_min: '',
  price_max: '',
  trip_type: 'one_way',
  cabin_class: '',
  sort: 'newest',
}

const parseDateValue = (value: string) => {
  if (!value) return undefined
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

interface TripsContentProps {
  initialTrips: Trip[]
  initialTotalPages: number
  initialFilters: Filters
}

export function TripsContent({ initialTrips, initialTotalPages, initialFilters }: TripsContentProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)

  // Compute ribbon badges (best-value / cheapest / fastest) from the currently rendered set
  const tripRibbons = useMemo(
    () =>
      computeRibbons(
        trips.map((tr) => ({
          id: tr.id,
          price: tr.price_per_seat,
          duration_minutes: tr.duration_minutes ?? null,
        })),
      ),
    [trips],
  )

  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, ...initialFilters })
  const [showFilters, setShowFilters] = useState(false)
  const [searchOrigin, setSearchOrigin] = useState(initialFilters.origin)
  const [searchDestination, setSearchDestination] = useState(initialFilters.destination)
  const departureDate = parseDateValue(filters.date_from)
  const returnDate = parseDateValue(filters.date_to)

  const fetchTrips = useCallback(
    async (pageNum: number, append = false, overrideOrigin?: string, overrideDestination?: string) => {
      if (!append) setLoading(true)
      else setLoadingMore(true)

      const origin = overrideOrigin ?? searchOrigin
      const destination = overrideDestination ?? searchDestination

      try {
        const params = new URLSearchParams()
        params.set('page', String(pageNum))
        params.set('limit', '12')
        if (origin) params.set('origin', origin)
        if (destination) params.set('destination', destination)
        if (filters.date_from) params.set('date_from', filters.date_from)
        if (filters.trip_type !== 'one_way' && filters.date_to) params.set('date_to', filters.date_to)
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
    [searchOrigin, searchDestination, filters.date_from, filters.date_to, filters.price_min, filters.price_max, filters.trip_type, filters.cabin_class, filters.sort]
  )

  const handleSearch = useCallback(() => {
    setSearchOrigin(filters.origin)
    setSearchDestination(filters.destination)
    setPage(1)
    fetchTrips(1, false, filters.origin, filters.destination)
  }, [filters.origin, filters.destination, fetchTrips])

  const handleCitySelect = useCallback((field: 'origin' | 'destination', value: string) => {
    const newOrigin = field === 'origin' ? value : filters.origin
    const newDestination = field === 'destination' ? value : filters.destination
    setSearchOrigin(newOrigin)
    setSearchDestination(newDestination)
    updateFilter(field, value)
    setPage(1)
    fetchTrips(1, false, newOrigin, newDestination)
  }, [filters.origin, filters.destination, fetchTrips])

  const handleSwapLocations = () => {
    const newOrigin = filters.destination
    const newDestination = filters.origin
    setFilters((prev) => ({ ...prev, origin: newOrigin, destination: newDestination }))
    setSearchOrigin(newOrigin)
    setSearchDestination(newDestination)
    setPage(1)
    fetchTrips(1, false, newOrigin, newDestination)
  }

  const filterDepsRef = useRef({
    date_from: initialFilters.date_from,
    date_to: initialFilters.date_to,
    price_min: initialFilters.price_min,
    price_max: initialFilters.price_max,
    trip_type: initialFilters.trip_type,
    cabin_class: initialFilters.cabin_class,
    sort: initialFilters.sort,
  })

  useEffect(() => {
    const prev = filterDepsRef.current
    const changed =
      prev.date_from !== filters.date_from ||
      prev.date_to !== filters.date_to ||
      prev.price_min !== filters.price_min ||
      prev.price_max !== filters.price_max ||
      prev.trip_type !== filters.trip_type ||
      prev.cabin_class !== filters.cabin_class ||
      prev.sort !== filters.sort
    if (changed) {
      filterDepsRef.current = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        price_min: filters.price_min,
        price_max: filters.price_max,
        trip_type: filters.trip_type,
        cabin_class: filters.cabin_class,
        sort: filters.sort,
      }
      setPage(1)
      fetchTrips(1)
    }
  }, [filters.date_from, filters.date_to, filters.price_min, filters.price_max, filters.trip_type, filters.cabin_class, filters.sort, fetchTrips])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchTrips(nextPage, true)
  }

  const updateFilter = (key: keyof Filters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleTripTypeChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      trip_type: value,
      date_to: value === 'one_way' ? '' : prev.date_to,
    }))
  }

  const handleDepartureDateSelect = (date?: Date) => {
    const nextValue = date ? format(date, 'yyyy-MM-dd') : ''
    setFilters((prev) => ({
      ...prev,
      date_from: nextValue,
      date_to:
        prev.trip_type === 'one_way'
          ? ''
          : prev.date_to && date && parseISO(prev.date_to) < date
            ? ''
            : prev.date_to,
    }))
  }

  const handleReturnDateSelect = (date?: Date) => {
    updateFilter('date_to', date ? format(date, 'yyyy-MM-dd') : '')
  }

  const clearFilters = () => {
    setFilters(emptyFilters)
    setSearchOrigin('')
    setSearchDestination('')
  }

  const hasActiveFilters = Object.entries(filters).some(([key, val]) => key !== 'sort' && val !== '')

  const inputClass =
    'w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 border-none text-slate-700 text-sm md:text-base font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-colors hover:bg-slate-100'

  return (
    <>
      <CategoryHero
        eyebrow={t('category_heroes.trips.eyebrow')}
        title={t('category_heroes.trips.title')}
        description={t('category_heroes.trips.description')}
        image="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2400&q=85"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pt-0 pb-8 md:pb-16 lg:pb-20 animate-fade-in-up">
        {/* Main Search Bar */}
        <div className="bg-white rounded-3xl md:rounded-[2rem] p-4 md:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 relative z-20">

        {/* Row 1: Origin & Destination */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
          <CityAutocomplete
            locale={locale}
            value={filters.origin}
            onChange={(val) => updateFilter('origin', val)}
            onSelect={(val) => handleCitySelect('origin', val)}
            placeholder={t('trips.departure_from')}
            className="rounded-2xl h-14"
            showLocateButton
            myLocationLabel={t('common.my_location')}
          />

          <button
            type="button"
            onClick={handleSwapLocations}
            className="hidden sm:flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label={isAr ? 'تبديل الوجهتين' : 'Swap origin and destination'}
          >
            <ArrowLeftRight className="h-4 w-4 text-slate-400" />
          </button>
          <div className="sm:hidden w-full h-px bg-slate-100 my-1" />

          <CityAutocomplete
            locale={locale}
            value={filters.destination}
            onChange={(val) => updateFilter('destination', val)}
            onSelect={(val) => handleCitySelect('destination', val)}
            placeholder={t('trips.arrival_to')}
            className="rounded-2xl h-14"
            myLocationLabel={t('common.my_location')}
          />
        </div>

        {/* Row 2: Trip Type, Dates, Search */}
        <div className="grid grid-cols-3 gap-3">
          {/* Trip Type */}
          <div className="relative">
            <select
              value={filters.trip_type}
              onChange={(e) => handleTripTypeChange(e.target.value)}
              className="appearance-none w-full h-12 md:h-14 px-4 pe-10 rounded-2xl bg-slate-50 border-none text-slate-700 text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <option value="round_trip">{t('trips.round_trip')}</option>
              <option value="one_way">{t('trips.one_way')}</option>
            </select>
            <ChevronDown className="absolute end-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Departure Date */}
          <Popover>
            <PopoverTrigger
              className={cn(
                'w-full h-12 md:h-14 px-4 rounded-2xl bg-slate-50 border-none text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none hover:bg-slate-100 transition-colors flex items-center justify-between',
                departureDate ? 'text-slate-700' : 'text-slate-400'
              )}
            >
              {departureDate ? format(departureDate, 'd MMM yyyy', { locale: enUS }) : <span>{t('trips.departure_date')}</span>}
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={departureDate} onSelect={handleDepartureDateSelect} initialFocus />
            </PopoverContent>
          </Popover>

          {/* Return Date */}
          <Popover>
            <PopoverTrigger
              disabled={filters.trip_type === 'one_way'}
              className={cn(
                'w-full h-12 md:h-14 px-4 rounded-2xl bg-slate-50 border-none text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none hover:bg-slate-100 transition-colors flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed',
                returnDate ? 'text-slate-700' : 'text-slate-400'
              )}
            >
              {returnDate ? format(returnDate, 'd MMM yyyy', { locale: enUS }) : <span>{t('trips.return_date_filter')}</span>}
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={returnDate}
                onSelect={handleReturnDateSelect}
                disabled={(date) => Boolean(departureDate && date < departureDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-full mt-2">
          <button
            onClick={handleSearch}
            className="w-full flex items-center justify-center gap-2 h-12 md:h-14 px-6 rounded-2xl bg-primary text-white font-bold transition-all shadow-sm shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Search className="h-5 w-5" />
            <span>{t('common.search')}</span>
          </button>
        </div>

        {/* Row 3: Sort & More Filters */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="appearance-none w-40 md:w-48 h-10 px-4 pe-10 rounded-xl bg-slate-50 border-none text-slate-700 font-semibold text-xs md:text-sm focus:ring-2 focus:ring-primary focus:outline-none hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <option value="best">{isAr ? 'الأفضل' : 'Best'}</option>
                <option value="newest">{t('trips.sort_newest')}</option>
                <option value="price_asc">{t('trips.sort_price_asc')}</option>
                <option value="price_desc">{t('trips.sort_price_desc')}</option>
                <option value="date">{t('trips.sort_date')}</option>
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 h-10 px-4 rounded-xl font-bold text-xs md:text-sm transition-all',
                showFilters ? 'bg-accent text-white hover:bg-accent/90' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('common.filter')}
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-semibold text-destructive bg-destructive/10 px-3 py-1.5 rounded-full hover:bg-destructive/20 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              {t('common.cancel')}
            </button>
          )}
        </div>
      </div>

      {/* Extra Filter panel */}
      {showFilters && (
        <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 bg-white p-5 md:p-8 mb-8 md:mb-12 shadow-xl shadow-slate-200/40 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-5 md:mb-6">{t('common.filter')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="space-y-1.5 md:space-y-2">
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('trips.filter_price')} ({t('common.from')})
              </label>
              <input
                type="number"
                min="0"
                value={filters.price_min}
                onChange={(e) => updateFilter('price_min', e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('trips.filter_price')} ({t('common.to')})
              </label>
              <input
                type="number"
                min="0"
                value={filters.price_max}
                onChange={(e) => updateFilter('price_max', e.target.value)}
                placeholder="10000"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('trips.filter_cabin')}
              </label>
              <div className="relative">
                <select
                  value={filters.cabin_class}
                  onChange={(e) => updateFilter('cabin_class', e.target.value)}
                  className={cn(inputClass, 'appearance-none pe-10 cursor-pointer')}
                >
                  <option value="">{t('common.view_all')}</option>
                  <option value="economy">{t('trips.economy')}</option>
                  <option value="business">{t('trips.business')}</option>
                  <option value="first">{t('trips.first')}</option>
                </select>
                <ChevronDown className="absolute end-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7-day price strip under search (P0-2) */}
      {filters.origin && filters.destination && (
        <div className="mb-4">
          <PriceStrip
            originCode={filters.origin}
            destinationCode={filters.destination}
            cabinClass={filters.cabin_class || undefined}
            selectedDate={departureDate}
            onDateSelect={(d) => updateFilter('date_from', format(d, 'yyyy-MM-dd'))}
          />
        </div>
      )}

      {/* Sort tabs (P1-17) */}
      {!loading && trips.length > 0 && (
        <div className="mb-4">
          <SortTabs
            value={(filters.sort as SortKey) || 'newest'}
            onChange={(k) => updateFilter('sort', k)}
            previews={{
              price_asc: {
                price: trips.reduce((min, tr) => Math.min(min, tr.price_per_seat), trips[0]?.price_per_seat ?? 0),
                currency: trips[0]?.currency,
              },
              fastest: (() => {
                const withDur = trips.filter((tr) => tr.duration_minutes && tr.duration_minutes > 0)
                if (!withDur.length) return undefined
                return { durationMin: withDur.reduce((min, tr) => Math.min(min, tr.duration_minutes!), withDur[0].duration_minutes!) }
              })(),
              rating: (() => {
                const rated = trips.filter((tr) => tr.provider?.avg_rating && tr.provider.avg_rating > 0)
                if (!rated.length) return undefined
                const top = rated.reduce((a, b) => ((a.provider!.avg_rating || 0) >= (b.provider!.avg_rating || 0) ? a : b))
                return { rating: top.provider?.avg_rating ?? 0 }
              })(),
            }}
          />
        </div>
      )}

      {/* Stale-search modal (P2-26) */}
      <StaleSearchModal
        onRefresh={() => fetchTrips(1)}
        onNewSearch={() => clearFilters()}
      />

      {/* Results Count */}
      {!loading && trips.length > 0 && (
        <div className="mb-4" role="status" aria-live="polite">
          <span className="text-sm font-medium text-muted-foreground">
            {trips.length} {isAr ? 'رحلة وُجدت' : 'flights found'}
          </span>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <EmptyState
            icon={Plane}
            message={t('trips.no_trips')}
            actionLabel={hasActiveFilters ? t('common.cancel') : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {trips.map((trip, idx) => (
              <div key={trip.id} className="animate-fade-in-up" style={{ animationDelay: `${(idx % 6) * 100}ms` }}>
                <TripCard trip={trip} ribbon={tripRibbons.get(trip.id)} />
              </div>
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center mt-12 md:mt-16">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="group inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm md:text-base font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 hover:shadow-md hover:-translate-y-0.5"
              >
                {loadingMore && <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-primary" />}
                {loadingMore ? t('common.loading') : t('common.view_all')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
    </>
  )
}
