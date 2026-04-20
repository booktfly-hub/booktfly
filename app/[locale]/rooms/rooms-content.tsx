'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { format, isValid, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale'
import {
  Search,
  SlidersHorizontal,
  X,
  BedDouble,
  ChevronDown,
  Loader2,
  CalendarDays,
  Moon,
  Users,
  DoorOpen,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoomCard } from '@/components/rooms/room-card'
import { computeRibbons } from '@/components/ui/ribbon-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { ROOM_CATEGORIES } from '@/lib/constants'
import type { Room } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CategoryHero } from '@/components/shared/category-hero'

type Filters = {
  city: string
  category: string
  price_min: string
  price_max: string
  capacity_min: string
  check_in: string
  days: string
  rooms_count: string
  passengers: string
  sort: string
}

const emptyFilters: Filters = {
  city: '',
  category: '',
  price_min: '',
  price_max: '',
  capacity_min: '',
  check_in: '',
  days: '',
  rooms_count: '',
  passengers: '',
  sort: 'newest',
}

interface RoomsContentProps {
  initialRooms: Room[]
  initialTotalPages: number
  initialFilters: Filters
}

export function RoomsContent({ initialRooms, initialTotalPages, initialFilters }: RoomsContentProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const roomRibbons = useMemo(
    () => computeRibbons(rooms.map((r) => ({ id: r.id, price: r.price_per_night, duration_minutes: null }))),
    [rooms],
  )
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)

  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, ...initialFilters })
  const [showFilters, setShowFilters] = useState(false)
  const [searchCity, setSearchCity] = useState(initialFilters.city)
  const checkInDate = filters.check_in ? parseISO(filters.check_in) : undefined
  const validCheckInDate = checkInDate && isValid(checkInDate) ? checkInDate : undefined

  const fetchRooms = useCallback(
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
        if (filters.price_min) params.set('price_min', filters.price_min)
        if (filters.price_max) params.set('price_max', filters.price_max)
        const capacityMin = filters.passengers || filters.capacity_min
        if (capacityMin) params.set('capacity_min', capacityMin)
        if (filters.check_in) params.set('check_in', filters.check_in)
        if (filters.days) params.set('days', filters.days)
        if (filters.sort) params.set('sort', filters.sort)

        const res = await fetch(`/api/rooms?${params.toString()}`)
        const data = await res.json()

        if (append) {
          setRooms((prev) => [...prev, ...(data.rooms || [])])
        } else {
          setRooms(data.rooms || [])
        }
        setTotalPages(data.totalPages || 1)
      } catch {
        // Error handled silently
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [searchCity, filters.category, filters.price_min, filters.price_max, filters.capacity_min, filters.check_in, filters.days, filters.passengers, filters.sort]
  )

  const handleSearch = useCallback(() => {
    setSearchCity(filters.city)
    setPage(1)
    fetchRooms(1, false, filters.city)
  }, [filters.city, fetchRooms])

  const filterDepsRef = useRef({
    category: initialFilters.category,
    price_min: initialFilters.price_min,
    price_max: initialFilters.price_max,
    capacity_min: initialFilters.capacity_min,
    check_in: initialFilters.check_in,
    days: initialFilters.days,
    passengers: initialFilters.passengers,
    sort: initialFilters.sort,
  })

  useEffect(() => {
    const prev = filterDepsRef.current
    const changed =
      prev.category !== filters.category ||
      prev.price_min !== filters.price_min ||
      prev.price_max !== filters.price_max ||
      prev.capacity_min !== filters.capacity_min ||
      prev.check_in !== filters.check_in ||
      prev.days !== filters.days ||
      prev.passengers !== filters.passengers ||
      prev.sort !== filters.sort
    if (changed) {
      filterDepsRef.current = {
        category: filters.category,
        price_min: filters.price_min,
        price_max: filters.price_max,
        capacity_min: filters.capacity_min,
        check_in: filters.check_in,
        days: filters.days,
        passengers: filters.passengers,
        sort: filters.sort,
      }
      setPage(1)
      fetchRooms(1)
    }
  }, [filters.category, filters.price_min, filters.price_max, filters.capacity_min, filters.check_in, filters.days, filters.passengers, filters.sort, fetchRooms])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchRooms(nextPage, true)
  }

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(emptyFilters)
    setSearchCity('')
  }

  const hasActiveFilters = Object.entries(filters).some(([key, val]) => key !== 'sort' && val !== '')
  const activeFilterLabels = [
    searchCity && `${isAr ? 'المدينة' : 'City'}: ${searchCity}`,
    filters.category &&
      `${isAr ? 'الفئة' : 'Category'}: ${
        isAr
          ? ROOM_CATEGORIES[filters.category as keyof typeof ROOM_CATEGORIES]?.ar
          : ROOM_CATEGORIES[filters.category as keyof typeof ROOM_CATEGORIES]?.en
      }`,
    filters.check_in && `${isAr ? 'الوصول' : 'Check-in'}: ${filters.check_in}`,
    filters.days && `${filters.days} ${isAr ? 'ليالي' : 'nights'}`,
    filters.rooms_count && `${filters.rooms_count} ${isAr ? 'غرف' : 'rooms'}`,
    filters.passengers && `${filters.passengers} ${isAr ? 'ضيوف' : 'guests'}`,
    filters.capacity_min && `${isAr ? 'ابتداءً من' : 'Min'} ${filters.capacity_min} ${t('rooms.guests')}`,
    filters.price_min && `${isAr ? 'السعر من' : 'Price from'} ${filters.price_min}`,
    filters.price_max && `${isAr ? 'السعر إلى' : 'Price to'} ${filters.price_max}`,
  ].filter(Boolean) as string[]

  return (
    <>
      <CategoryHero
        eyebrow={t('category_heroes.rooms.eyebrow')}
        title={t('category_heroes.rooms.title')}
        description={t('category_heroes.rooms.description')}
        image="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2400&q=85"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pt-0 pb-8 md:pb-16 lg:pb-20 animate-fade-in-up">
        {/* Main Search Bar */}
        <div className="bg-white rounded-3xl md:rounded-[2rem] p-4 md:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 relative z-20">
        {/* Row 1: City Search & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="sm:col-span-1">
            <Input
              type="text"
              value={filters.city}
              onChange={(e) => updateFilter('city', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('rooms.filter_city')}
              className="h-12 md:h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-none hover:bg-slate-100"
            />
          </div>

          <Popover>
            <PopoverTrigger
              className={cn(
                'sm:col-span-1 flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold shadow-none transition-colors hover:bg-slate-100 md:h-14',
                filters.category ? 'text-slate-700' : 'text-slate-500'
              )}
            >
              <span className="truncate">
                {filters.category
                  ? isAr
                    ? ROOM_CATEGORIES[filters.category as keyof typeof ROOM_CATEGORIES]?.ar
                    : ROOM_CATEGORIES[filters.category as keyof typeof ROOM_CATEGORIES]?.en
                  : t('rooms.filter_category')}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="grid gap-1">
                <Button
                  variant={!filters.category ? 'secondary' : 'ghost'}
                  className="h-10 justify-start rounded-xl"
                  onClick={() => updateFilter('category', '')}
                >
                  {t('rooms.filter_category')}
                </Button>
                {Object.entries(ROOM_CATEGORIES).map(([key, val]) => (
                  <Button
                    key={key}
                    variant={filters.category === key ? 'secondary' : 'ghost'}
                    className="h-10 justify-start rounded-xl"
                    onClick={() => updateFilter('category', key)}
                  >
                    {isAr ? val.ar : val.en}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Row 2: Date, Days, Rooms, Passengers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Popover>
            <PopoverTrigger
              className={cn(
                'flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold shadow-none transition-colors hover:bg-slate-100 md:h-14',
                validCheckInDate ? 'text-slate-700' : 'text-slate-500'
              )}
            >
              <span className="flex min-w-0 items-center gap-2 truncate">
                <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                {validCheckInDate
                  ? format(validCheckInDate, 'PPP', { locale: enUS })
                  : t('rooms.filter_date')}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={validCheckInDate}
                onSelect={(date) => updateFilter('check_in', date ? format(date, 'yyyy-MM-dd') : '')}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="relative">
            <Moon className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="number"
              min="1"
              value={filters.days}
              onChange={(e) => updateFilter('days', e.target.value)}
              placeholder={t('rooms.filter_days')}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50 pe-3 ps-9 text-sm font-semibold text-slate-700 shadow-none hover:bg-slate-100 md:h-14"
            />
          </div>

          <div className="relative">
            <DoorOpen className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="number"
              min="1"
              value={filters.rooms_count}
              onChange={(e) => updateFilter('rooms_count', e.target.value)}
              placeholder={t('rooms.filter_rooms_count')}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50 pe-3 ps-9 text-sm font-semibold text-slate-700 shadow-none hover:bg-slate-100 md:h-14"
            />
          </div>

          <div className="relative">
            <Users className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="number"
              min="1"
              value={filters.passengers}
              onChange={(e) => updateFilter('passengers', e.target.value)}
              placeholder={t('rooms.filter_passengers')}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50 pe-3 ps-9 text-sm font-semibold text-slate-700 shadow-none hover:bg-slate-100 md:h-14"
            />
          </div>
        </div>

        {/* Row 3: Sort & More Filters */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger className="flex h-10 w-40 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700 shadow-none transition-colors hover:bg-slate-100 md:w-48 md:text-sm">
                <span className="flex items-center gap-2 truncate">
                  <ArrowUpDown className="h-4 w-4 text-slate-400" />
                  {filters.sort === 'price_asc'
                    ? t('rooms.sort_price_asc')
                    : filters.sort === 'price_desc'
                      ? t('rooms.sort_price_desc')
                      : t('rooms.sort_newest')}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="grid gap-1">
                  <Button variant={filters.sort === 'newest' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('sort', 'newest')}>{t('rooms.sort_newest')}</Button>
                  <Button variant={filters.sort === 'price_asc' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('sort', 'price_asc')}>{t('rooms.sort_price_asc')}</Button>
                  <Button variant={filters.sort === 'price_desc' ? 'secondary' : 'ghost'} className="h-10 justify-start rounded-xl" onClick={() => updateFilter('sort', 'price_desc')}>{t('rooms.sort_price_desc')}</Button>
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

        <div className="pt-4">
          <Button onClick={handleSearch} className="h-12 w-full rounded-2xl px-6 font-bold shadow-sm shadow-primary/20 md:h-14">
            <Search className="h-5 w-5" />
            <span>{t('common.search')}</span>
          </Button>
        </div>
      </div>

      {/* Extra Filter panel */}
      {showFilters && (
        <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 bg-white p-5 md:p-8 mb-8 md:mb-12 shadow-xl shadow-slate-200/40 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-5 md:mb-6">{t('common.filter')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-1.5 md:space-y-2">
              <Label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                {t('rooms.filter_price')} ({t('common.from')})
              </Label>
              <Input type="number" min="0" value={filters.price_min} onChange={(e) => updateFilter('price_min', e.target.value)} placeholder="0" className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 shadow-none hover:bg-slate-100" />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                {t('rooms.filter_price')} ({t('common.to')})
              </Label>
              <Input type="number" min="0" value={filters.price_max} onChange={(e) => updateFilter('price_max', e.target.value)} placeholder="10000" className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 shadow-none hover:bg-slate-100" />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">
                {t('rooms.filter_capacity')}
              </Label>
              <Input type="number" min="1" value={filters.capacity_min} onChange={(e) => updateFilter('capacity_min', e.target.value)} placeholder="1" className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 shadow-none hover:bg-slate-100" />
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">
              {rooms.length > 0
                ? isAr ? `${rooms.length} نتيجة معروضة` : `${rooms.length} result${rooms.length === 1 ? '' : 's'} shown`
                : isAr ? 'لا توجد نتائج حالياً' : 'No results right now'}
            </p>
            <p className="text-xs font-medium text-slate-500">
              {isAr ? 'حدّث الفلاتر أو وسّع البحث للعثور على خيارات أكثر' : 'Adjust filters or widen the search to find more options'}
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
      ) : rooms.length === 0 ? (
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <EmptyState icon={BedDouble} message={t('rooms.no_rooms')} actionLabel={hasActiveFilters ? t('common.cancel') : undefined} onAction={hasActiveFilters ? clearFilters : undefined} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {rooms.map((room, idx) => (
              <div key={room.id} className="animate-fade-in-up" style={{ animationDelay: `${(idx % 6) * 100}ms` }}>
                <RoomCard room={room} ribbon={roomRibbons.get(room.id)} />
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
