'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  Search,
  SlidersHorizontal,
  X,
  Car,
  ChevronDown,
  Loader2,
  Users,
  ArrowUpDown,
  Fuel,
  Gauge,
  CalendarIcon,
  ArrowLeftRight,
  Plane,
  Building,
  MapPin as MapPinIcon,
  ArrowRightLeft,
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { arSA, enUS } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { CarCard } from '@/components/cars/car-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { CAR_CATEGORIES, TRANSMISSION_TYPES, FUEL_TYPES } from '@/lib/constants'
import { CityAutocomplete } from '@/components/shared/city-autocomplete'
import type { Car as CarType } from '@/types'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Filters = {
  city: string
  category: string
  transmission: string
  fuel_type: string
  price_min: string
  price_max: string
  seats_min: string
  sort: string
  pickup_type: string
  return_same: boolean
  return_city: string
  pickup_date: string
  return_date: string
}

const initialFilters: Filters = {
  city: '',
  category: '',
  transmission: '',
  fuel_type: '',
  price_min: '',
  price_max: '',
  seats_min: '',
  sort: 'newest',
  pickup_type: '',
  return_same: true,
  return_city: '',
  pickup_date: '',
  return_date: '',
}

function CarsContent() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const searchParams = useSearchParams()

  const [cars, setCars] = useState<CarType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [filters, setFilters] = useState<Filters>(() => ({
    ...initialFilters,
    city: searchParams.get('city') || '',
    category: searchParams.get('category') || '',
    pickup_date: searchParams.get('pickup_date') || '',
    return_date: searchParams.get('return_date') || '',
  }))

  const [showFilters, setShowFilters] = useState(false)
  const [searchCity, setSearchCity] = useState(filters.city)

  const fetchCars = useCallback(
    async (pageNum: number, append = false, overrideCity?: string) => {
      if (!append) setLoading(true)
      else setLoadingMore(true)

      const city = overrideCity ?? searchCity

      try {
        const params = new URLSearchParams()
        params.set('page', String(pageNum))
        params.set('limit', '12')
        if (city) params.set('city', city)
        if (filters.category) params.set('category', filters.category)
        if (filters.transmission) params.set('transmission', filters.transmission)
        if (filters.fuel_type) params.set('fuel_type', filters.fuel_type)
        if (filters.price_min) params.set('price_min', filters.price_min)
        if (filters.price_max) params.set('price_max', filters.price_max)
        if (filters.seats_min) params.set('seats_min', filters.seats_min)
        if (filters.sort) params.set('sort', filters.sort)
        if (filters.pickup_type) params.set('pickup_type', filters.pickup_type)
        if (filters.pickup_date) params.set('pickup_date', filters.pickup_date)
        if (filters.return_date) params.set('return_date', filters.return_date)

        const res = await fetch(`/api/cars?${params.toString()}`)
        const data = await res.json()

        if (append) {
          setCars((prev) => [...prev, ...(data.cars || [])])
        } else {
          setCars(data.cars || [])
        }
        setTotalPages(data.totalPages || 1)
      } catch {
        // Error handled silently
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [searchCity, filters.category, filters.transmission, filters.fuel_type, filters.price_min, filters.price_max, filters.seats_min, filters.sort, filters.pickup_type, filters.pickup_date, filters.return_date]
  )

  const handleSearch = useCallback(() => {
    setSearchCity(filters.city)
    setPage(1)
    fetchCars(1, false, filters.city)
  }, [filters.city, fetchCars])

  const filterDepsRef = useRef({ category: filters.category, transmission: filters.transmission, fuel_type: filters.fuel_type, price_min: filters.price_min, price_max: filters.price_max, seats_min: filters.seats_min, sort: filters.sort, pickup_type: filters.pickup_type })
  const initialLoadDone = useRef(false)

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      fetchCars(1)
      filterDepsRef.current = { category: filters.category, transmission: filters.transmission, fuel_type: filters.fuel_type, price_min: filters.price_min, price_max: filters.price_max, seats_min: filters.seats_min, sort: filters.sort, pickup_type: filters.pickup_type }
      return
    }
    const prev = filterDepsRef.current
    const changed = prev.category !== filters.category || prev.transmission !== filters.transmission || prev.fuel_type !== filters.fuel_type || prev.price_min !== filters.price_min || prev.price_max !== filters.price_max || prev.seats_min !== filters.seats_min || prev.sort !== filters.sort || prev.pickup_type !== filters.pickup_type
    if (changed) {
      filterDepsRef.current = { category: filters.category, transmission: filters.transmission, fuel_type: filters.fuel_type, price_min: filters.price_min, price_max: filters.price_max, seats_min: filters.seats_min, sort: filters.sort, pickup_type: filters.pickup_type }
      setPage(1)
      fetchCars(1)
    }
  }, [filters.category, filters.transmission, filters.fuel_type, filters.price_min, filters.price_max, filters.seats_min, filters.sort, filters.pickup_type, fetchCars])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchCars(nextPage, true)
  }

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    setSearchCity('')
  }

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => key !== 'sort' && key !== 'return_same' && val !== '' && val !== false
  )
  const activeFilterLabels = [
    searchCity && `${isAr ? 'المدينة' : 'City'}: ${searchCity}`,
    filters.pickup_type && `${isAr ? 'الاستلام' : 'Pickup'}: ${filters.pickup_type === 'airport' ? (isAr ? 'مطار' : 'Airport') : (isAr ? 'فرع' : 'Branch')}`,
    filters.pickup_date && `${isAr ? 'من' : 'From'}: ${filters.pickup_date}`,
    filters.return_date && `${isAr ? 'إلى' : 'To'}: ${filters.return_date}`,
    filters.category && `${isAr ? 'الفئة' : 'Category'}: ${isAr ? CAR_CATEGORIES[filters.category as keyof typeof CAR_CATEGORIES]?.ar : CAR_CATEGORIES[filters.category as keyof typeof CAR_CATEGORIES]?.en}`,
    filters.transmission && `${isAr ? 'ناقل الحركة' : 'Transmission'}: ${isAr ? TRANSMISSION_TYPES[filters.transmission as keyof typeof TRANSMISSION_TYPES]?.ar : TRANSMISSION_TYPES[filters.transmission as keyof typeof TRANSMISSION_TYPES]?.en}`,
    filters.fuel_type && `${isAr ? 'نوع الوقود' : 'Fuel'}: ${isAr ? FUEL_TYPES[filters.fuel_type as keyof typeof FUEL_TYPES]?.ar : FUEL_TYPES[filters.fuel_type as keyof typeof FUEL_TYPES]?.en}`,
    filters.seats_min && `${isAr ? 'المقاعد من' : 'Min seats'} ${filters.seats_min}`,
    filters.price_min && `${isAr ? 'السعر من' : 'Price from'} ${filters.price_min}`,
    filters.price_max && `${isAr ? 'السعر إلى' : 'Price to'} ${filters.price_max}`,
  ].filter(Boolean) as string[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-32 md:pb-16 lg:pt-36 lg:pb-20 animate-fade-in-up">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-3 md:mb-4">
          {t('cars.title')}
        </h1>
        <p className="text-base md:text-lg text-slate-500 font-medium px-4">
          {t('cars.subtitle')}
        </p>
      </div>

      {/* Rental-style Search Bar */}
      <div className="bg-white rounded-3xl md:rounded-[2rem] p-4 md:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 relative z-20">
        {/* Row 1: Pickup Location */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPinIcon className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{isAr ? 'موقع الاستلام' : 'Pickup Location'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
            {/* Pickup Type + City */}
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger className={cn(
                  'flex h-12 md:h-14 shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold transition-colors hover:bg-slate-100',
                  filters.pickup_type ? 'text-slate-700' : 'text-slate-500'
                )}>
                  {filters.pickup_type === 'airport' ? <Plane className="h-4 w-4 text-primary" /> : filters.pickup_type === 'branch' ? <Building className="h-4 w-4 text-primary" /> : <Car className="h-4 w-4 text-slate-400" />}
                  <span className="hidden sm:inline">{filters.pickup_type === 'airport' ? (isAr ? 'مطار' : 'Airport') : filters.pickup_type === 'branch' ? (isAr ? 'فرع' : 'Branch') : (isAr ? 'الكل' : 'All')}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="grid gap-1">
                    <Button variant={!filters.pickup_type ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl gap-2" onClick={() => updateFilter('pickup_type', '')}>
                      <Car className="h-4 w-4" /> {isAr ? 'الكل' : 'All'}
                    </Button>
                    <Button variant={filters.pickup_type === 'airport' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl gap-2" onClick={() => updateFilter('pickup_type', 'airport')}>
                      <Plane className="h-4 w-4" /> {isAr ? 'مطار' : 'Airport'}
                    </Button>
                    <Button variant={filters.pickup_type === 'branch' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl gap-2" onClick={() => updateFilter('pickup_type', 'branch')}>
                      <Building className="h-4 w-4" /> {isAr ? 'فرع' : 'Branch'}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                type="text"
                value={filters.city}
                onChange={(e) => updateFilter('city', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={isAr ? 'المدينة أو المطار' : 'City or Airport'}
                className="h-12 md:h-14 flex-1 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-none hover:bg-slate-100"
              />
            </div>

            {/* Same/Different toggle */}
            <button
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, return_same: !prev.return_same, return_city: '' }))}
              className={cn(
                'flex h-10 w-10 mx-auto items-center justify-center rounded-full border-2 transition-all',
                filters.return_same
                  ? 'border-slate-200 bg-slate-50 text-slate-400 hover:border-primary/30 hover:text-primary'
                  : 'border-primary bg-primary/10 text-primary'
              )}
              title={isAr ? 'التسليم في مكان مختلف' : 'Return to different location'}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>

            {/* Return location */}
            <Input
              type="text"
              value={filters.return_same ? '' : filters.return_city}
              onChange={(e) => updateFilter('return_city', e.target.value)}
              disabled={filters.return_same}
              placeholder={filters.return_same ? (isAr ? 'نفس موقع الاستلام' : 'Same as pickup') : (isAr ? 'مدينة أو مطار الإرجاع' : 'Return city or airport')}
              className={cn(
                'h-12 md:h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm font-semibold shadow-none hover:bg-slate-100',
                filters.return_same && 'opacity-50 cursor-not-allowed'
              )}
            />
          </div>
        </div>

        {/* Row 2: Dates + Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Pickup Date */}
          <Popover>
            <PopoverTrigger className={cn(
              'flex h-12 md:h-14 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold transition-colors hover:bg-slate-100',
              filters.pickup_date ? 'text-slate-700' : 'text-slate-500'
            )}>
              <span className="flex items-center gap-2 truncate">
                <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                {filters.pickup_date && isValid(parseISO(filters.pickup_date))
                  ? format(parseISO(filters.pickup_date), 'dd MMM yyyy', { locale: isAr ? arSA : enUS })
                  : (isAr ? 'تاريخ الاستلام' : 'Pickup Date')}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.pickup_date ? parseISO(filters.pickup_date) : undefined}
                onSelect={(date) => updateFilter('pickup_date', date ? format(date, 'yyyy-MM-dd') : '')}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Return Date */}
          <Popover>
            <PopoverTrigger className={cn(
              'flex h-12 md:h-14 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold transition-colors hover:bg-slate-100',
              filters.return_date ? 'text-slate-700' : 'text-slate-500'
            )}>
              <span className="flex items-center gap-2 truncate">
                <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                {filters.return_date && isValid(parseISO(filters.return_date))
                  ? format(parseISO(filters.return_date), 'dd MMM yyyy', { locale: isAr ? arSA : enUS })
                  : (isAr ? 'تاريخ الإرجاع' : 'Return Date')}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.return_date ? parseISO(filters.return_date) : undefined}
                onSelect={(date) => updateFilter('return_date', date ? format(date, 'yyyy-MM-dd') : '')}
                disabled={(date) => {
                  const minDate = filters.pickup_date ? parseISO(filters.pickup_date) : new Date()
                  return date <= minDate
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Category */}
          <Popover>
            <PopoverTrigger className={cn(
              'flex h-12 md:h-14 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold transition-colors hover:bg-slate-100',
              filters.category ? 'text-slate-700' : 'text-slate-500'
            )}>
              <span className="flex items-center gap-2 truncate">
                <Car className="h-4 w-4 text-slate-400 shrink-0" />
                {filters.category
                  ? isAr
                    ? CAR_CATEGORIES[filters.category as keyof typeof CAR_CATEGORIES]?.ar
                    : CAR_CATEGORIES[filters.category as keyof typeof CAR_CATEGORIES]?.en
                  : t('cars.filter_category')}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="grid gap-1">
                <Button variant={!filters.category ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('category', '')}>
                  {t('cars.all_categories')}
                </Button>
                {Object.entries(CAR_CATEGORIES).map(([key, val]) => (
                  <Button key={key} variant={filters.category === key ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('category', key)}>
                    {isAr ? val.ar : val.en}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
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
                  {filters.sort === 'price_asc' ? t('cars.sort_price_asc') : filters.sort === 'price_desc' ? t('cars.sort_price_desc') : t('cars.sort_newest')}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="grid gap-1">
                  <Button variant={filters.sort === 'newest' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('sort', 'newest')}>{t('cars.sort_newest')}</Button>
                  <Button variant={filters.sort === 'price_asc' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('sort', 'price_asc')}>{t('cars.sort_price_asc')}</Button>
                  <Button variant={filters.sort === 'price_desc' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('sort', 'price_desc')}>{t('cars.sort_price_desc')}</Button>
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
            {/* Transmission */}
            <div className="space-y-1.5 md:space-y-2">
              <Label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                {t('cars.filter_transmission')}
              </Label>
              <Popover>
                <PopoverTrigger className={cn(
                  'flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium transition-colors hover:bg-slate-100',
                  filters.transmission ? 'text-slate-700' : 'text-slate-500'
                )}>
                  <span className="flex items-center gap-2 truncate">
                    <Gauge className="h-4 w-4 text-slate-400" />
                    {filters.transmission ? (isAr ? TRANSMISSION_TYPES[filters.transmission as keyof typeof TRANSMISSION_TYPES]?.ar : TRANSMISSION_TYPES[filters.transmission as keyof typeof TRANSMISSION_TYPES]?.en) : (isAr ? 'الكل' : 'All')}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="grid gap-1">
                    <Button variant={!filters.transmission ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('transmission', '')}>{isAr ? 'الكل' : 'All'}</Button>
                    {Object.entries(TRANSMISSION_TYPES).map(([key, val]) => (
                      <Button key={key} variant={filters.transmission === key ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('transmission', key)}>{isAr ? val.ar : val.en}</Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Fuel Type */}
            <div className="space-y-1.5 md:space-y-2">
              <Label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                {t('cars.filter_fuel_type')}
              </Label>
              <Popover>
                <PopoverTrigger className={cn(
                  'flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium transition-colors hover:bg-slate-100',
                  filters.fuel_type ? 'text-slate-700' : 'text-slate-500'
                )}>
                  <span className="flex items-center gap-2 truncate">
                    <Fuel className="h-4 w-4 text-slate-400" />
                    {filters.fuel_type ? (isAr ? FUEL_TYPES[filters.fuel_type as keyof typeof FUEL_TYPES]?.ar : FUEL_TYPES[filters.fuel_type as keyof typeof FUEL_TYPES]?.en) : (isAr ? 'الكل' : 'All')}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="grid gap-1">
                    <Button variant={!filters.fuel_type ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('fuel_type', '')}>{isAr ? 'الكل' : 'All'}</Button>
                    {Object.entries(FUEL_TYPES).map(([key, val]) => (
                      <Button key={key} variant={filters.fuel_type === key ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('fuel_type', key)}>{isAr ? val.ar : val.en}</Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Seats min */}
            <div className="space-y-1.5 md:space-y-2">
              <Label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                {t('cars.filter_seats_min')}
              </Label>
              <Input
                type="number"
                min="1"
                value={filters.seats_min}
                onChange={(e) => updateFilter('seats_min', e.target.value)}
                placeholder="1"
                className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 shadow-none hover:bg-slate-100"
              />
            </div>

            {/* Price min */}
            <div className="space-y-1.5 md:space-y-2">
              <Label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                {t('cars.filter_price')} ({t('common.from')})
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
                {t('cars.filter_price')} ({t('common.to')})
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
              {cars.length > 0
                ? (isAr ? `${cars.length} نتيجة معروضة` : `${cars.length} result${cars.length === 1 ? '' : 's'} shown`)
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
      ) : cars.length === 0 ? (
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <EmptyState
            icon={Car}
            message={t('cars.no_cars')}
            actionLabel={hasActiveFilters ? t('common.cancel') : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {cars.map((car, idx) => (
              <div key={car.id} className="animate-fade-in-up" style={{ animationDelay: `${(idx % 6) * 100}ms` }}>
                <CarCard car={car} />
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

export default function CarsPage() {
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
      <CarsContent />
    </Suspense>
  )
}
