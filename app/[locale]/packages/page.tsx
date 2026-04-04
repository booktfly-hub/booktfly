'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Loader2,
  ArrowUpDown,
  CalendarIcon,
  Plane,
  BedDouble,
  CarFront,
  Sparkles,
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { arSA, enUS } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { PackageCard } from '@/components/packages/package-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import type { Package as PackageType } from '@/types/database'

type Filters = {
  destination: string
  includes_flight: string
  includes_hotel: string
  includes_car: string
  price_min: string
  price_max: string
  start_date: string
  sort: string
}

const initialFilters: Filters = {
  destination: '',
  includes_flight: '',
  includes_hotel: '',
  includes_car: '',
  price_min: '',
  price_max: '',
  start_date: '',
  sort: 'newest',
}

function PackagesContent() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const searchParams = useSearchParams()

  const [packages, setPackages] = useState<PackageType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [filters, setFilters] = useState<Filters>(() => ({
    ...initialFilters,
    destination: searchParams.get('destination') || '',
    includes_flight: searchParams.get('includes_flight') || '',
    includes_hotel: searchParams.get('includes_hotel') || '',
    includes_car: searchParams.get('includes_car') || '',
  }))

  const [showFilters, setShowFilters] = useState(false)
  const [searchDestination, setSearchDestination] = useState(filters.destination)

  const fetchPackages = useCallback(
    async (pageNum: number, append = false, overrideDestination?: string) => {
      if (!append) setLoading(true)
      else setLoadingMore(true)

      const destination = overrideDestination ?? searchDestination

      try {
        const params = new URLSearchParams()
        params.set('page', String(pageNum))
        params.set('limit', '12')
        if (destination) params.set('destination', destination)
        if (filters.includes_flight) params.set('includes_flight', filters.includes_flight)
        if (filters.includes_hotel) params.set('includes_hotel', filters.includes_hotel)
        if (filters.includes_car) params.set('includes_car', filters.includes_car)
        if (filters.price_min) params.set('price_min', filters.price_min)
        if (filters.price_max) params.set('price_max', filters.price_max)
        if (filters.start_date) params.set('start_date', filters.start_date)
        if (filters.sort) params.set('sort', filters.sort)

        const res = await fetch(`/api/packages?${params.toString()}`)
        const data = await res.json()

        if (append) {
          setPackages((prev) => [...prev, ...(data.packages || [])])
        } else {
          setPackages(data.packages || [])
        }
        setTotalPages(data.totalPages || 1)
      } catch {
        // Error handled silently
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [searchDestination, filters.includes_flight, filters.includes_hotel, filters.includes_car, filters.price_min, filters.price_max, filters.start_date, filters.sort]
  )

  const handleSearch = useCallback(() => {
    setSearchDestination(filters.destination)
    setPage(1)
    fetchPackages(1, false, filters.destination)
  }, [filters.destination, fetchPackages])

  const filterDepsRef = useRef({
    includes_flight: filters.includes_flight,
    includes_hotel: filters.includes_hotel,
    includes_car: filters.includes_car,
    price_min: filters.price_min,
    price_max: filters.price_max,
    start_date: filters.start_date,
    sort: filters.sort,
  })
  const initialLoadDone = useRef(false)

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      fetchPackages(1)
      filterDepsRef.current = {
        includes_flight: filters.includes_flight,
        includes_hotel: filters.includes_hotel,
        includes_car: filters.includes_car,
        price_min: filters.price_min,
        price_max: filters.price_max,
        start_date: filters.start_date,
        sort: filters.sort,
      }
      return
    }
    const prev = filterDepsRef.current
    const changed =
      prev.includes_flight !== filters.includes_flight ||
      prev.includes_hotel !== filters.includes_hotel ||
      prev.includes_car !== filters.includes_car ||
      prev.price_min !== filters.price_min ||
      prev.price_max !== filters.price_max ||
      prev.start_date !== filters.start_date ||
      prev.sort !== filters.sort
    if (changed) {
      filterDepsRef.current = {
        includes_flight: filters.includes_flight,
        includes_hotel: filters.includes_hotel,
        includes_car: filters.includes_car,
        price_min: filters.price_min,
        price_max: filters.price_max,
        start_date: filters.start_date,
        sort: filters.sort,
      }
      setPage(1)
      fetchPackages(1)
    }
  }, [filters.includes_flight, filters.includes_hotel, filters.includes_car, filters.price_min, filters.price_max, filters.start_date, filters.sort, fetchPackages])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPackages(nextPage, true)
  }

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    setSearchDestination('')
  }

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => key !== 'sort' && val !== ''
  )

  const activeFilterLabels = [
    searchDestination && `${isAr ? 'الوجهة' : 'Destination'}: ${searchDestination}`,
    filters.includes_flight && (isAr ? 'يشمل رحلة' : 'Includes Flight'),
    filters.includes_hotel && (isAr ? 'يشمل فندق' : 'Includes Hotel'),
    filters.includes_car && (isAr ? 'يشمل سيارة' : 'Includes Car'),
    filters.start_date && `${isAr ? 'من' : 'From'}: ${filters.start_date}`,
    filters.price_min && `${isAr ? 'السعر من' : 'Price from'} ${filters.price_min}`,
    filters.price_max && `${isAr ? 'السعر إلى' : 'Price to'} ${filters.price_max}`,
  ].filter(Boolean) as string[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-32 md:pb-16 lg:pt-36 lg:pb-20 animate-fade-in-up">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-3 md:mb-4">
          {t('packages.title')}
        </h1>
        <p className="text-base md:text-lg text-slate-500 font-medium px-4">
          {t('packages.browse_packages')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-3xl md:rounded-[2rem] p-4 md:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 relative z-20">
        {/* Destination Input */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
            <Input
              type="text"
              value={filters.destination}
              onChange={(e) => updateFilter('destination', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={isAr ? 'ابحث عن الوجهة...' : 'Search destination...'}
              className="h-12 md:h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-none hover:bg-slate-100"
            />

            {/* Start Date */}
            <Popover>
              <PopoverTrigger className={cn(
                'flex h-12 md:h-14 w-full sm:w-48 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold transition-colors hover:bg-slate-100',
                filters.start_date ? 'text-slate-700' : 'text-slate-500'
              )}>
                <span className="flex items-center gap-2 truncate">
                  <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                  {filters.start_date && isValid(parseISO(filters.start_date))
                    ? format(parseISO(filters.start_date), 'dd MMM yyyy', { locale: isAr ? arSA : enUS })
                    : (isAr ? 'تاريخ البدء' : 'Start Date')}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.start_date ? parseISO(filters.start_date) : undefined}
                  onSelect={(date) => updateFilter('start_date', date ? format(date, 'yyyy-MM-dd') : '')}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Toggle Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => updateFilter('includes_flight', filters.includes_flight ? '' : 'true')}
            className={cn(
              'flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all',
              filters.includes_flight
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30'
            )}
          >
            <Plane className="h-4 w-4" />
            {t('packages.flight')}
          </button>
          <button
            onClick={() => updateFilter('includes_hotel', filters.includes_hotel ? '' : 'true')}
            className={cn(
              'flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all',
              filters.includes_hotel
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30'
            )}
          >
            <BedDouble className="h-4 w-4" />
            {t('packages.hotel')}
          </button>
          <button
            onClick={() => updateFilter('includes_car', filters.includes_car ? '' : 'true')}
            className={cn(
              'flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all',
              filters.includes_car
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30'
            )}
          >
            <CarFront className="h-4 w-4" />
            {t('packages.car')}
          </button>
        </div>

        {/* Search button */}
        <Button
          onClick={handleSearch}
          className="mb-4 h-12 w-full rounded-2xl px-6 font-bold shadow-sm shadow-primary/20 md:h-14"
        >
          <Search className="h-5 w-5" />
          <span>{t('common.search')}</span>
        </Button>

        {/* Sort & More Filters */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger className="flex h-10 w-40 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700 shadow-none transition-colors hover:bg-slate-100 md:w-48 md:text-sm">
                <span className="flex items-center gap-2 truncate">
                  <ArrowUpDown className="h-4 w-4 text-slate-400" />
                  {filters.sort === 'price_asc' ? (isAr ? 'السعر: من الأقل' : 'Price: Low to High') : filters.sort === 'price_desc' ? (isAr ? 'السعر: من الأعلى' : 'Price: High to Low') : (isAr ? 'الأحدث أولاً' : 'Newest First')}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="grid gap-1">
                  <Button variant={filters.sort === 'newest' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('sort', 'newest')}>{isAr ? 'الأحدث أولاً' : 'Newest First'}</Button>
                  <Button variant={filters.sort === 'price_asc' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('sort', 'price_asc')}>{isAr ? 'السعر: من الأقل' : 'Price: Low to High'}</Button>
                  <Button variant={filters.sort === 'price_desc' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('sort', 'price_desc')}>{isAr ? 'السعر: من الأعلى' : 'Price: High to Low'}</Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className={cn('h-10 rounded-xl px-4 font-bold text-xs md:text-sm', showFilters && 'bg-accent text-white hover:bg-accent/90')}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('common.filter')}
            </Button>
          </div>

          {hasActiveFilters && (
            <Button variant="destructive" onClick={clearFilters} className="rounded-full px-3 py-1.5 text-xs font-semibold">
              <X className="h-3.5 w-3.5" />
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </div>

      {/* Extra Filter panel */}
      {showFilters && (
        <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 bg-white p-5 md:p-8 mb-8 md:mb-12 shadow-xl shadow-slate-200/40 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-5 md:mb-6">{t('common.filter')}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Price min */}
            <div className="space-y-1.5 md:space-y-2">
              <Label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                {t('packages.total_price')} ({t('common.from')})
              </Label>
              <Input
                type="number"
                min="0"
                value={filters.price_min}
                onChange={(e) => updateFilter('price_min', e.target.value)}
                placeholder="0"
                className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 shadow-none hover:bg-slate-100"
              />
            </div>

            {/* Price max */}
            <div className="space-y-1.5 md:space-y-2">
              <Label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                {t('packages.total_price')} ({t('common.to')})
              </Label>
              <Input
                type="number"
                min="0"
                value={filters.price_max}
                onChange={(e) => updateFilter('price_max', e.target.value)}
                placeholder="10000"
                className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 shadow-none hover:bg-slate-100"
              />
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">
              {packages.length > 0
                ? (isAr ? `${packages.length} نتيجة معروضة` : `${packages.length} result${packages.length === 1 ? '' : 's'} shown`)
                : (isAr ? 'لا توجد نتائج حالياً' : 'No results right now')}
            </p>
            <p className="text-xs font-medium text-slate-500">
              {isAr
                ? 'حدّث الفلاتر أو وسّع البحث للعثور على خيارات أكثر'
                : 'Adjust filters or widen the search to find more options'}
            </p>
          </div>

          {activeFilterLabels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilterLabels.map((label) => (
                <Badge
                  key={label}
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
                >
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <EmptyState
            icon={Sparkles}
            message={t('packages.no_packages')}
            actionLabel={hasActiveFilters ? t('common.cancel') : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {packages.map((pkg, idx) => (
              <div key={pkg.id} className="animate-fade-in-up" style={{ animationDelay: `${(idx % 6) * 100}ms` }}>
                <PackageCard pkg={pkg} />
              </div>
            ))}
          </div>

          {/* Load more */}
          {page < totalPages && (
            <div className="flex justify-center mt-12 md:mt-16">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="h-auto rounded-2xl border-slate-200 px-6 py-3 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50 hover:shadow-md md:px-8 md:py-4 md:text-base"
              >
                {loadingMore && <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-primary" />}
                {loadingMore ? t('common.loading') : t('common.view_all')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function PackagesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-32">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <PackagesContent />
    </Suspense>
  )
}
