'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Loader2,
  ArrowUpDown,
  Plane,
  BedDouble,
  CarFront,
  Sparkles,
  Calendar,
  Users,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PackageCard } from '@/components/packages/package-card'
import { computeRibbons } from '@/components/ui/ribbon-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import type { Package as PackageType } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CategoryHero } from '@/components/shared/category-hero'

type Filters = {
  destination: string
  includes_flight: boolean
  includes_hotel: boolean
  includes_car: boolean
  price_min: string
  price_max: string
  sort: string
  start_date: string
  end_date: string
  travelers: string
}

const emptyFilters: Filters = {
  destination: '',
  includes_flight: false,
  includes_hotel: false,
  includes_car: false,
  price_min: '',
  price_max: '',
  sort: 'newest',
  start_date: '',
  end_date: '',
  travelers: '',
}

interface PackagesContentProps {
  initialPackages: PackageType[]
  initialTotalPages: number
  initialFilters: Filters
}

export function PackagesContent({ initialPackages, initialTotalPages, initialFilters }: PackagesContentProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [packages, setPackages] = useState<PackageType[]>(initialPackages)
  const packageRibbons = useMemo(
    () => computeRibbons(packages.map((p) => ({ id: p.id, price: p.total_price, duration_minutes: null }))),
    [packages],
  )
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)

  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, ...initialFilters })
  const [showFilters, setShowFilters] = useState(false)
  const [searchDestination, setSearchDestination] = useState(initialFilters.destination)

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
        if (filters.includes_flight) params.set('includes_flight', 'true')
        if (filters.includes_hotel) params.set('includes_hotel', 'true')
        if (filters.includes_car) params.set('includes_car', 'true')
        if (filters.price_min) params.set('price_min', filters.price_min)
        if (filters.price_max) params.set('price_max', filters.price_max)
        if (filters.sort) params.set('sort', filters.sort)
        if (filters.start_date) params.set('start_date', filters.start_date)
        if (filters.end_date) params.set('end_date', filters.end_date)
        if (filters.travelers) params.set('travelers', filters.travelers)

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
    [searchDestination, filters.includes_flight, filters.includes_hotel, filters.includes_car, filters.price_min, filters.price_max, filters.sort, filters.start_date, filters.end_date, filters.travelers]
  )

  const handleSearch = useCallback(() => {
    setSearchDestination(filters.destination)
    setPage(1)
    fetchPackages(1, false, filters.destination)
  }, [filters.destination, fetchPackages])

  const filterDepsRef = useRef({
    includes_flight: initialFilters.includes_flight,
    includes_hotel: initialFilters.includes_hotel,
    includes_car: initialFilters.includes_car,
    price_min: initialFilters.price_min,
    price_max: initialFilters.price_max,
    sort: initialFilters.sort,
    start_date: initialFilters.start_date,
    end_date: initialFilters.end_date,
    travelers: initialFilters.travelers,
  })

  useEffect(() => {
    const prev = filterDepsRef.current
    const changed =
      prev.includes_flight !== filters.includes_flight ||
      prev.includes_hotel !== filters.includes_hotel ||
      prev.includes_car !== filters.includes_car ||
      prev.price_min !== filters.price_min ||
      prev.price_max !== filters.price_max ||
      prev.sort !== filters.sort ||
      prev.start_date !== filters.start_date ||
      prev.end_date !== filters.end_date ||
      prev.travelers !== filters.travelers
    if (changed) {
      filterDepsRef.current = {
        includes_flight: filters.includes_flight,
        includes_hotel: filters.includes_hotel,
        includes_car: filters.includes_car,
        price_min: filters.price_min,
        price_max: filters.price_max,
        sort: filters.sort,
        start_date: filters.start_date,
        end_date: filters.end_date,
        travelers: filters.travelers,
      }
      setPage(1)
      fetchPackages(1)
    }
  }, [filters.includes_flight, filters.includes_hotel, filters.includes_car, filters.price_min, filters.price_max, filters.sort, filters.start_date, filters.end_date, filters.travelers, fetchPackages])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPackages(nextPage, true)
  }

  const updateFilter = (key: keyof Filters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(emptyFilters)
    setSearchDestination('')
  }

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => key !== 'sort' && val !== '' && val !== false
  )

  const activeFilterLabels = [
    searchDestination && `${pick(locale, 'الوجهة', 'Destination', 'Varış')}: ${searchDestination}`,
    filters.includes_flight && (pick(locale, 'رحلة طيران', 'Flight', 'Uçuş')),
    filters.includes_hotel && (pick(locale, 'فندق', 'Hotel', 'Otel')),
    filters.includes_car && (pick(locale, 'سيارة', 'Car', 'Araç')),
    filters.price_min && `${pick(locale, 'السعر من', 'Price from', 'Fiyat başlangıç')} ${filters.price_min}`,
    filters.price_max && `${pick(locale, 'السعر إلى', 'Price to', 'Fiyat bitiş')} ${filters.price_max}`,
  ].filter(Boolean) as string[]

  return (
    <>
      <CategoryHero
        eyebrow={t('category_heroes.packages.eyebrow')}
        title={t('category_heroes.packages.title')}
        description={t('category_heroes.packages.description')}
        image="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=2400&q=85"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-14 pt-0 pb-8 md:pb-16 lg:pb-20 animate-fade-in-up">
        {/* Search context banner */}
        {(filters.start_date || filters.end_date || filters.travelers) && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground bg-muted/50 rounded-2xl px-4 py-3 mb-6 relative z-20">
            {filters.start_date && (
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4" />
                {filters.start_date}
              </span>
            )}
            {filters.start_date && filters.end_date && (
              <ArrowRight className="h-4 w-4" />
            )}
            {filters.end_date && (
              <span className="flex items-center gap-1.5 font-medium">
                {!filters.start_date && <Calendar className="h-4 w-4" />}
                {filters.end_date}
              </span>
            )}
            {filters.travelers && (
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="h-4 w-4" />
                {filters.travelers} {pick(locale, 'مسافر', 'travelers', 'yolcu')}
              </span>
            )}
          </div>
        )}
        {/* Search Bar */}
        <div className="bg-white rounded-3xl md:rounded-[2rem] p-4 md:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 relative z-20">
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('packages.destination')}</span>
          </div>
          <Input
            type="text"
            value={filters.destination}
            onChange={(e) => updateFilter('destination', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={pick(locale, 'ابحث عن وجهة...', 'Search destination...', 'Varış noktası ara...')}
            className="h-12 md:h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-none hover:bg-slate-100"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => updateFilter('includes_flight', !filters.includes_flight)}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all',
              filters.includes_flight
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
            )}
          >
            <Plane className="h-4 w-4" />
            {t('packages.flight')}
          </button>
          <button
            type="button"
            onClick={() => updateFilter('includes_hotel', !filters.includes_hotel)}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all',
              filters.includes_hotel
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
            )}
          >
            <BedDouble className="h-4 w-4" />
            {t('packages.hotel')}
          </button>
          <button
            type="button"
            onClick={() => updateFilter('includes_car', !filters.includes_car)}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all',
              filters.includes_car
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
            )}
          >
            <CarFront className="h-4 w-4" />
            {t('packages.car')}
          </button>
        </div>

        <Button onClick={handleSearch} className="mb-4 h-12 w-full rounded-2xl px-6 font-bold shadow-sm shadow-primary/20 md:h-14">
          <Search className="h-5 w-5" />
          <span>{t('common.search')}</span>
        </Button>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger className="flex h-10 w-40 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700 shadow-none transition-colors hover:bg-slate-100 md:w-48 md:text-sm">
                <span className="flex items-center gap-2 truncate">
                  <ArrowUpDown className="h-4 w-4 text-slate-400" />
                  {filters.sort === 'price_asc'
                    ? pick(locale, 'السعر: الأقل', 'Price: Low to High', 'Fiyat: Düşükten Yükseğe')
                    : filters.sort === 'price_desc'
                    ? pick(locale, 'السعر: الأعلى', 'Price: High to Low', 'Fiyat: Yüksekten Düşüğe')
                    : pick(locale, 'الأحدث', 'Newest', 'En Yeni')}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="grid gap-1">
                  <Button variant={filters.sort === 'newest' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('sort', 'newest')}>{pick(locale, 'الأحدث', 'Newest', 'En Yeni')}</Button>
                  <Button variant={filters.sort === 'price_asc' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('sort', 'price_asc')}>{pick(locale, 'السعر: الأقل', 'Price: Low to High', 'Fiyat: Düşükten Yükseğe')}</Button>
                  <Button variant={filters.sort === 'price_desc' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('sort', 'price_desc')}>{pick(locale, 'السعر: الأعلى', 'Price: High to Low', 'Fiyat: Yüksekten Düşüğe')}</Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1.5 md:space-y-2">
              <Label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                {t('common.price')} ({t('common.from')})
              </Label>
              <Input type="number" min="0" value={filters.price_min} onChange={(e) => updateFilter('price_min', e.target.value)} placeholder="0" className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 shadow-none hover:bg-slate-100" />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                {t('common.price')} ({t('common.to')})
              </Label>
              <Input type="number" min="0" value={filters.price_max} onChange={(e) => updateFilter('price_max', e.target.value)} placeholder="10000" className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 shadow-none hover:bg-slate-100" />
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">
              {packages.length > 0
                ? pick(locale, `${packages.length} نتيجة معروضة`, `${packages.length} result${packages.length === 1 ? '' : 's'} shown`)
                : pick(locale, 'لا توجد نتائج حالياً', 'No results right now', 'Şu anda sonuç yok')}
            </p>
            <p className="text-xs font-medium text-slate-500">
              {pick(locale, 'حدّث الفلاتر أو وسّع البحث للعثور على خيارات أكثر', 'Adjust filters or widen the search to find more options', 'Daha fazla seçenek bulmak için filtreleri ayarlayın veya aramayı genişletin')}
            </p>
          </div>
          {activeFilterLabels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilterLabels.map((label) => (
                <Badge key={label} variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
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
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <EmptyState icon={Sparkles} message={t('packages.no_packages')} actionLabel={hasActiveFilters ? t('common.cancel') : undefined} onAction={hasActiveFilters ? clearFilters : undefined} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {packages.map((pkg, idx) => (
              <div key={pkg.id} className="animate-fade-in-up" style={{ animationDelay: `${(idx % 6) * 100}ms` }}>
                <PackageCard pkg={pkg} ribbon={packageRibbons.get(pkg.id)} />
              </div>
            ))}
          </div>
          {page < totalPages && (
            <div className="flex justify-center mt-12 md:mt-16">
              <Button onClick={handleLoadMore} disabled={loadingMore} variant="outline" className="h-auto rounded-2xl border-slate-200 px-6 py-3 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50 hover:shadow-md md:px-8 md:py-4 md:text-base">
                {loadingMore && <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-primary" />}
                {loadingMore ? t('common.loading') : t('common.view_all')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
    </>
  )
}
