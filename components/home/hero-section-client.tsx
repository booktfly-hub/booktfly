'use client'

import { pick } from '@/lib/i18n-helpers'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, ArrowLeftRight, ChevronDown, CalendarIcon, Plane, Building, CarFront, ShieldCheck, CreditCard, Clock, MapPin, Car as CarIcon, CalendarDays, Moon, Users, DoorOpen, ArrowUpDown, SlidersHorizontal, X, Package, ArrowRight, Route } from 'lucide-react'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CityAutocomplete } from '@/components/shared/city-autocomplete'
import { PassengerPicker, type PassengerCounts, type CabinClassValue } from '@/components/shared/passenger-picker'
import { MultiCityLegs, type FlightLeg } from '@/components/home/multi-city-legs'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ROOM_CATEGORIES } from '@/lib/constants'

interface HeroSectionClientProps {
  locale: string
  heroTitle: string
  heroSubtitle: string
  searchButton: string
  providerCta: string
  markeeteerCta: string
  departureFromLabel: string
  arrivalToLabel: string
  roundTripLabel: string
  oneWayLabel: string
  departureDateLabel: string
  returnDateLabel: string
}

export function HeroSectionClient({
  locale,
  heroTitle,
  heroSubtitle,
  searchButton,
  departureFromLabel,
  arrivalToLabel,
  roundTripLabel,
  oneWayLabel,
  departureDateLabel,
  returnDateLabel,
}: HeroSectionClientProps) {
  const isAr = locale === 'ar'
  const router = useRouter()
  const t = useTranslations()
  const [searchMode, setSearchMode] = useState<'flights'|'hotels'|'cars'|'packages'>('flights')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [tripType, setTripType] = useState('round_trip')
  const [cabinClass, setCabinClass] = useState<CabinClassValue>('economy')
  const [passengerCounts, setPassengerCounts] = useState<PassengerCounts>({ adults: 1, children: 0, infants: 0, childAges: [] })
  const passengers = passengerCounts.adults + passengerCounts.children + passengerCounts.infants
  const [departureDate, setDepartureDate] = useState<Date>()
  const [returnDate, setReturnDate] = useState<Date>()
  const [legs, setLegs] = useState<FlightLeg[]>([
    { origin: '', destination: '', date: undefined },
    { origin: '', destination: '', date: undefined },
  ])
  const [hotelCity, setHotelCity] = useState('')
  const [hotelCategory, setHotelCategory] = useState('')
  const [hotelCheckIn, setHotelCheckIn] = useState<Date>()
  const [hotelDays, setHotelDays] = useState('')
  const [hotelRoomsCount, setHotelRoomsCount] = useState('')
  const [hotelPassengers, setHotelPassengers] = useState('')

  const PREFS_KEY = 'bkf_prefs'

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (raw) {
        const prefs = JSON.parse(raw)
        if (prefs.tripType) setTripType(prefs.tripType)
        if (prefs.cabinClass) setCabinClass(prefs.cabinClass)
        if (prefs.passengerCounts) setPassengerCounts(prefs.passengerCounts)
        if (prefs.hotelPassengers) setHotelPassengers(String(prefs.hotelPassengers))
      }
    } catch {}
  }, [])

  function savePrefs(patch: Record<string, unknown>) {
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      const current = raw ? JSON.parse(raw) : {}
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...patch }))
    } catch {}
  }
  const [hotelPriceMin, setHotelPriceMin] = useState('')
  const [hotelPriceMax, setHotelPriceMax] = useState('')
  const [hotelCapacityMin, setHotelCapacityMin] = useState('')
  const [hotelSort, setHotelSort] = useState('newest')
  const [showHotelFilters, setShowHotelFilters] = useState(false)
  const [carPickupType, setCarPickupType] = useState('')
  const [carReturnSame, setCarReturnSame] = useState(true)
  const [carReturnCity, setCarReturnCity] = useState('')
  const [pkgDestination, setPkgDestination] = useState('')
  const [pkgStartDate, setPkgStartDate] = useState<Date>()
  const [pkgEndDate, setPkgEndDate] = useState<Date>()
  const [pkgTravelers, setPkgTravelers] = useState('1')
  const heroBackgrounds: Record<typeof searchMode, string> = {
    flights: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2400&q=85',
    hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2400&q=85',
    cars: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2400&q=85',
    packages: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2400&q=85',
  }

  const heroDestinations = [
    {
      city: pick(locale, 'القاهرة', 'Cairo', 'Kahire'),
      detail: pick(locale, 'رحلات وفنادق وسيارات', 'Flights, hotels, and cars', 'Uçuş, otel ve araç'),
      image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=420&q=80',
    },
    {
      city: pick(locale, 'دبي', 'Dubai', 'Dubai'),
      detail: pick(locale, 'خيارات مرنة للحجز', 'Flexible booking options', 'Esnek rezervasyon seçenekleri'),
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=420&q=80',
    },
    {
      city: pick(locale, 'إسطنبول', 'Istanbul', 'İstanbul'),
      detail: pick(locale, 'عروض قريبة ومباشرة', 'Nearby and direct deals', 'Yakın ve direkt fırsatlar'),
      image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=420&q=80',
    },
  ]

  const getActionUrl = () => {
    if (searchMode === 'hotels') {
      const params = new URLSearchParams()
      if (hotelCity) params.set('city', hotelCity)
      if (hotelCategory) params.set('category', hotelCategory)
      if (hotelCheckIn) params.set('check_in', format(hotelCheckIn, 'yyyy-MM-dd'))
      if (hotelDays) params.set('days', hotelDays)
      if (hotelRoomsCount) params.set('rooms_count', hotelRoomsCount)
      if (hotelPassengers) params.set('passengers', hotelPassengers)
      if (hotelPriceMin) params.set('price_min', hotelPriceMin)
      if (hotelPriceMax) params.set('price_max', hotelPriceMax)
      if (hotelCapacityMin) params.set('capacity_min', hotelCapacityMin)
      if (hotelSort) params.set('sort', hotelSort)
      const qs = params.toString()
      return `/${locale}/rooms${qs ? `?${qs}` : ''}`
    }
    if (searchMode === 'cars') {
      const params = new URLSearchParams()
      if (origin) params.set('city', origin)
      if (carPickupType) params.set('pickup_type', carPickupType)
      if (departureDate) params.set('pickup_date', format(departureDate, 'yyyy-MM-dd'))
      if (returnDate) params.set('return_date', format(returnDate, 'yyyy-MM-dd'))
      const qs = params.toString()
      return `/${locale}/cars${qs ? `?${qs}` : ''}`
    }
    if (searchMode === 'packages') {
      const params = new URLSearchParams()
      if (pkgDestination) params.set('destination', pkgDestination)
      if (pkgStartDate) params.set('start_date', format(pkgStartDate, 'yyyy-MM-dd'))
      if (pkgEndDate) params.set('end_date', format(pkgEndDate, 'yyyy-MM-dd'))
      if (pkgTravelers) params.set('travelers', pkgTravelers)
      const qs = params.toString()
      return `/${locale}/packages${qs ? `?${qs}` : ''}`
    }
    // flights
    {
      const params = new URLSearchParams()
      if (tripType === 'multi_city') {
        params.set('trip_type', 'multi_city')
        const encoded = legs
          .filter((l) => l.origin && l.destination)
          .map((l) => `${l.origin}-${l.destination}${l.date ? `-${format(l.date, 'yyyy-MM-dd')}` : ''}`)
          .join('|')
        if (encoded) params.set('legs', encoded)
        const first = legs[0]
        if (first?.origin) params.set('origin', first.origin)
        if (first?.destination) params.set('destination', first.destination)
        if (first?.date) params.set('date_from', format(first.date, 'yyyy-MM-dd'))
        if (cabinClass) params.set('cabin_class', cabinClass)
        if (passengers > 1) params.set('passengers', String(passengers))
        if (passengerCounts.adults > 1) params.set('adults', String(passengerCounts.adults))
        if (passengerCounts.children > 0) params.set('children', String(passengerCounts.children))
        if (passengerCounts.infants > 0) params.set('infants', String(passengerCounts.infants))
        if (passengerCounts.childAges.length > 0) params.set('child_ages', passengerCounts.childAges.join(','))
        const qs = params.toString()
        return `/${locale}/trips${qs ? `?${qs}` : ''}`
      }
      if (origin) params.set('origin', origin)
      if (destination) params.set('destination', destination)
      if (tripType) params.set('trip_type', tripType)
      if (departureDate) params.set('date_from', format(departureDate, 'yyyy-MM-dd'))
      if (returnDate && tripType === 'round_trip') params.set('date_to', format(returnDate, 'yyyy-MM-dd'))
      if (cabinClass) params.set('cabin_class', cabinClass)
      if (passengers > 1) params.set('passengers', String(passengers))
      if (passengerCounts.adults > 1) params.set('adults', String(passengerCounts.adults))
      if (passengerCounts.children > 0) params.set('children', String(passengerCounts.children))
      if (passengerCounts.infants > 0) params.set('infants', String(passengerCounts.infants))
      if (passengerCounts.childAges.length > 0) params.set('child_ages', passengerCounts.childAges.join(','))
      const qs = params.toString()
      return `/${locale}/trips${qs ? `?${qs}` : ''}`
    }
  }

  const inputClass = "w-full h-14 px-5 rounded-lg bg-surface border border-input text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:ring-4 focus:ring-ring/15 focus:border-ring outline-none hover:bg-white transition-colors shadow-sm"

  const resetHotelFilters = () => {
    setHotelCity('')
    setHotelCategory('')
    setHotelCheckIn(undefined)
    setHotelDays('')
    setHotelRoomsCount('')
    setHotelPassengers('')
    setHotelPriceMin('')
    setHotelPriceMax('')
    setHotelCapacityMin('')
    setHotelSort('newest')
  }

  const renderHotelSearchForm = () => (
    <>
      {/* Row 1: City | Category */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CityAutocomplete
          locale={locale}
          value={hotelCity}
          onChange={setHotelCity}
          placeholder={t('rooms.filter_city')}
          className="h-12 w-full rounded-lg border-input bg-surface text-sm shadow-none transition-colors hover:bg-muted focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15 md:h-14"
          showLocateButton
          myLocationLabel={pick(locale, 'موقعي الحالي', 'My location', 'Konumum')}
        />

        <Popover>
          <PopoverTrigger
            className={cn(
              'flex h-12 w-full items-center justify-between rounded-lg border border-input bg-surface px-4 text-sm font-semibold shadow-none transition-colors hover:bg-muted md:h-14',
              hotelCategory ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <span className="truncate">
              {hotelCategory
                ? isAr
                  ? ROOM_CATEGORIES[hotelCategory as keyof typeof ROOM_CATEGORIES]?.ar
                  : ROOM_CATEGORIES[hotelCategory as keyof typeof ROOM_CATEGORIES]?.en
                : t('rooms.filter_category')}
            </span>
            <ChevronDown className="h-4 w-4 text-primary" />
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="grid gap-1">
              <Button
                variant={!hotelCategory ? 'secondary' : 'ghost'}
                className="h-10 justify-start rounded-lg"
                onClick={() => setHotelCategory('')}
              >
                {t('rooms.filter_category')}
              </Button>
              {Object.entries(ROOM_CATEGORIES).map(([key, val]) => (
                <Button
                  key={key}
                  variant={hotelCategory === key ? 'secondary' : 'ghost'}
                  className="h-10 justify-start rounded-lg"
                  onClick={() => setHotelCategory(key)}
                >
                  {isAr ? val.ar : val.en}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Row 2: Check-in | Nights */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Popover>
          <PopoverTrigger
            className={cn(
              'flex h-12 w-full items-center justify-between rounded-lg border border-input bg-surface px-4 text-sm font-semibold shadow-none transition-colors hover:bg-muted md:h-14',
              hotelCheckIn ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
              {hotelCheckIn
                ? format(hotelCheckIn, 'd MMM yyyy', { locale: enUS })
                : t('rooms.filter_date')}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={hotelCheckIn}
              onSelect={setHotelCheckIn}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="relative">
          <Moon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            type="number"
            min="1"
            value={hotelDays}
            onChange={(e) => setHotelDays(e.target.value)}
            placeholder={t('rooms.filter_days')}
            className="h-12 rounded-lg border-input bg-surface pe-3 ps-9 text-sm font-semibold text-foreground shadow-none hover:bg-muted md:h-14"
          />
        </div>
      </div>

      {/* Row 3: Rooms | Guests */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="relative">
          <DoorOpen className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            type="number"
            min="1"
            value={hotelRoomsCount}
            onChange={(e) => setHotelRoomsCount(e.target.value)}
            placeholder={t('rooms.filter_rooms_count')}
            className="h-12 rounded-lg border-input bg-surface pe-3 ps-9 text-sm font-semibold text-foreground shadow-none hover:bg-muted md:h-14"
          />
        </div>

        <div className="relative">
          <Users className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            type="number"
            min="1"
            value={hotelPassengers}
            onChange={(e) => { setHotelPassengers(e.target.value); savePrefs({ hotelPassengers: Number(e.target.value) }) }}
            placeholder={t('rooms.filter_passengers')}
            className="h-12 rounded-lg border-input bg-surface pe-3 ps-9 text-sm font-semibold text-foreground shadow-none hover:bg-muted md:h-14"
          />
        </div>
      </div>

      {/* Row 4: Sort | Filter */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Popover>
          <PopoverTrigger className="flex h-12 w-full items-center justify-between rounded-lg border border-input bg-surface px-4 text-sm font-semibold text-foreground shadow-none transition-colors hover:bg-muted md:h-14">
            <span className="flex items-center gap-2 truncate">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              {hotelSort === 'price_asc'
                ? t('rooms.sort_price_asc')
                : hotelSort === 'price_desc'
                  ? t('rooms.sort_price_desc')
                  : t('rooms.sort_newest')}
            </span>
            <ChevronDown className="h-4 w-4 text-primary" />
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="grid gap-1">
              <Button
                variant={hotelSort === 'newest' ? 'secondary' : 'ghost'}
                className="h-10 justify-start rounded-lg"
                onClick={() => setHotelSort('newest')}
              >
                {t('rooms.sort_newest')}
              </Button>
              <Button
                variant={hotelSort === 'price_asc' ? 'secondary' : 'ghost'}
                className="h-10 justify-start rounded-lg"
                onClick={() => setHotelSort('price_asc')}
              >
                {t('rooms.sort_price_asc')}
              </Button>
              <Button
                variant={hotelSort === 'price_desc' ? 'secondary' : 'ghost'}
                className="h-10 justify-start rounded-lg"
                onClick={() => setHotelSort('price_desc')}
              >
                {t('rooms.sort_price_desc')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant={showHotelFilters ? 'secondary' : 'outline'}
          onClick={() => setShowHotelFilters(!showHotelFilters)}
          className={cn(
            'h-12 w-full rounded-lg text-sm font-bold md:h-14',
            showHotelFilters && 'bg-accent text-accent-foreground hover:bg-accent/90'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t('common.filter')}
        </Button>
      </div>

      {/* Row 5 (filters): Price Min | Price Max */}
      {showHotelFilters && (
        <div className="mb-3 grid grid-cols-1 gap-3 animate-fade-in-up sm:grid-cols-2">
          <div className="relative">
            <Input
              type="number"
              min="0"
              value={hotelPriceMin}
              onChange={(e) => setHotelPriceMin(e.target.value)}
              placeholder={`${t('rooms.filter_price')} (${t('common.from')})`}
              className="h-12 rounded-lg border-input bg-surface px-4 text-sm font-semibold text-foreground shadow-none hover:bg-muted md:h-14"
            />
          </div>
          <div className="relative">
            <Input
              type="number"
              min="0"
              value={hotelPriceMax}
              onChange={(e) => setHotelPriceMax(e.target.value)}
              placeholder={`${t('rooms.filter_price')} (${t('common.to')})`}
              className="h-12 rounded-lg border-input bg-surface px-4 text-sm font-semibold text-foreground shadow-none hover:bg-muted md:h-14"
            />
          </div>
        </div>
      )}

      {/* Row 6 (filters): Capacity | Reset */}
      {showHotelFilters && (
        <div className="mb-3 grid grid-cols-1 gap-3 animate-fade-in-up sm:grid-cols-2">
          <div className="relative">
            <Input
              type="number"
              min="1"
              value={hotelCapacityMin}
              onChange={(e) => setHotelCapacityMin(e.target.value)}
              placeholder={t('rooms.filter_capacity')}
              className="h-12 rounded-lg border-input bg-surface px-4 text-sm font-semibold text-foreground shadow-none hover:bg-muted md:h-14"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={resetHotelFilters}
            className="h-12 w-full rounded-lg text-sm font-semibold md:h-14"
          >
            <X className="h-4 w-4" />
            {t('common.cancel')}
          </Button>
        </div>
      )}

      {/* Search button */}
      <div className="pt-1">
        <Button
          type="submit"
          className="h-12 w-full rounded-lg px-6 font-bold shadow-sm shadow-primary/20 md:h-14"
        >
          <Search className="h-5 w-5" />
          <span>{t('common.search')}</span>
        </Button>
      </div>
    </>
  )

  const renderCarSearchForm = () => (
    <>
      {/* Row 1: Pickup Location */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{pick(locale, 'موقع الاستلام', 'Pickup Location', 'Alım Konumu')}</span>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {/* Pickup Type + City */}
          <div className="flex gap-2 flex-1">
            <Popover>
              <PopoverTrigger className={cn(
                'flex h-14 shrink-0 items-center gap-2 rounded-lg border border-input bg-surface px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-muted',
                carPickupType ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {carPickupType === 'airport' ? <Plane className="h-4 w-4 text-primary" /> : carPickupType === 'branch' ? <Building className="h-4 w-4 text-primary" /> : <CarIcon className="h-4 w-4 text-primary" />}
                <span className="hidden sm:inline">{carPickupType === 'airport' ? (pick(locale, 'مطار', 'Airport', 'Havalimanı')) : carPickupType === 'branch' ? (pick(locale, 'فرع', 'Branch', 'Şube')) : (pick(locale, 'الكل', 'All', 'Tümü'))}</span>
                <ChevronDown className="h-3.5 w-3.5 text-primary" />
              </PopoverTrigger>
              <PopoverContent className="w-48 rounded-lg p-2" align="start">
                <div className="grid gap-1">
                  {[
                    { val: '', icon: <CarIcon className="h-4 w-4" />, label: pick(locale, 'الكل', 'All', 'Tümü') },
                    { val: 'airport', icon: <Plane className="h-4 w-4" />, label: pick(locale, 'مطار', 'Airport', 'Havalimanı') },
                    { val: 'branch', icon: <Building className="h-4 w-4" />, label: pick(locale, 'فرع', 'Branch', 'Şube') },
                  ].map((opt) => (
                    <button key={opt.val} type="button" onClick={() => setCarPickupType(opt.val)} className={cn('flex h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm font-semibold transition-colors', carPickupType === opt.val ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <CityAutocomplete
              locale={locale}
              value={origin}
              onChange={setOrigin}
              placeholder={pick(locale, 'مدينة الاستلام', 'Pickup City', 'Alım Şehri')}
              className="h-14 w-full rounded-lg border-input bg-surface text-base shadow-sm transition-colors hover:bg-muted focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15"
              showLocateButton
              myLocationLabel={pick(locale, 'موقعي الحالي', 'My location', 'Konumum')}
            />
          </div>

          {/* Swap / Toggle */}
          <button
            type="button"
            onClick={() => {
              setCarReturnSame(!carReturnSame)
              setCarReturnCity('')
            }}
            className={cn(
              'z-10 hidden h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border shadow-sm transition-colors active:scale-95 sm:flex',
              carReturnSame
                ? 'border-border bg-muted text-muted-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground'
                : 'bg-primary/10 text-primary border-primary'
            )}
            title={pick(locale, 'التسليم في مكان مختلف', 'Return to different location', 'Farklı konuma iade')}
          >
            <ArrowLeftRight className="h-5 w-5" />
          </button>

          <div className="sm:hidden flex items-center justify-center -my-3 z-10">
            <button
              type="button"
              onClick={() => {
                setCarReturnSame(!carReturnSame)
                setCarReturnCity('')
              }}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg border shadow-md transition-colors active:scale-95',
                carReturnSame
                  ? 'border-border bg-surface text-muted-foreground hover:text-primary'
                  : 'bg-primary/10 border-primary text-primary'
              )}
              aria-label={pick(locale, 'التسليم في مكان مختلف', 'Return to different location', 'Farklı konuma iade')}
            >
              <ArrowLeftRight className="h-4 w-4 rotate-90" />
            </button>
          </div>

          {/* Return City */}
          <div className="flex-1">
            {carReturnSame ? (
              <div className={cn(inputClass, 'flex cursor-not-allowed items-center text-muted-foreground opacity-70')}>
                {pick(locale, 'نفس موقع الاستلام', 'Same as pickup', 'Alım ile aynı')}
              </div>
            ) : (
              <CityAutocomplete
                locale={locale}
                value={carReturnCity}
                onChange={setCarReturnCity}
                placeholder={pick(locale, 'مدينة التسليم', 'Drop-off City', 'Bırakma Şehri')}
                className="h-14 w-full rounded-lg border-input bg-surface text-base shadow-sm transition-colors hover:bg-muted focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15"
                myLocationLabel={pick(locale, 'موقعي الحالي', 'My location', 'Konumum')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Dates */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <Popover>
          <PopoverTrigger className={cn(inputClass, 'flex items-center justify-between', !departureDate ? 'text-muted-foreground' : 'text-foreground')}>
            {departureDate ? format(departureDate, 'd MMM yyyy', { locale: enUS }) : <span>{pick(locale, 'تاريخ الاستلام', 'Pickup Date', 'Alım Tarihi')}</span>}
            <CalendarIcon className="h-4 w-4 text-primary" />
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden rounded-lg border-border p-0 shadow-xl" align="start">
            <Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} disabled={(date) => date < new Date()} initialFocus />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger className={cn(inputClass, 'flex items-center justify-between', !returnDate ? 'text-muted-foreground' : 'text-foreground')}>
            {returnDate ? format(returnDate, 'd MMM yyyy', { locale: enUS }) : <span>{pick(locale, 'تاريخ الإرجاع', 'Return Date', 'Dönüş Tarihi')}</span>}
            <CalendarIcon className="h-4 w-4 text-primary" />
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden rounded-lg border-border p-0 shadow-xl" align="start">
            <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} disabled={(date) => { const min = departureDate || new Date(); return date <= min }} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {/* Search button */}
      <div className="pt-2">
        <button type="submit" className="flex h-16 w-full items-center justify-center gap-3 rounded-lg bg-primary text-lg font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px">
          <Search className="h-5 w-5" />
          <span>{searchButton}</span>
        </button>
      </div>
    </>
  )

  const renderPackageSearchForm = () => (
    <>
      {/* Destination */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{pick(locale, 'الوجهة', 'Destination', 'Varış')}</span>
        </div>
        <CityAutocomplete
          locale={locale}
          value={pkgDestination}
          onChange={setPkgDestination}
          placeholder={pick(locale, 'مدينة الوجهة', 'Destination City', 'Varış Şehri')}
          className="h-14 w-full rounded-lg border-input bg-surface text-sm shadow-sm transition-colors hover:bg-muted focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15"
          showLocateButton
          myLocationLabel={pick(locale, 'موقعي الحالي', 'My location', 'Konumum')}
        />
      </div>

      {/* Date range */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Popover>
          <PopoverTrigger className={cn(inputClass, 'flex items-center justify-between', !pkgStartDate ? 'text-muted-foreground' : 'text-foreground')}>
            {pkgStartDate ? format(pkgStartDate, 'd MMM yyyy', { locale: enUS }) : <span>{pick(locale, 'تاريخ البداية', 'Start Date', 'Başlangıç Tarihi')}</span>}
            <CalendarIcon className="h-4 w-4 text-primary" />
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden rounded-lg border-border p-0 shadow-xl" align="start">
            <Calendar mode="single" selected={pkgStartDate} onSelect={setPkgStartDate} disabled={(date) => date < new Date()} initialFocus />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger className={cn(inputClass, 'flex items-center justify-between', !pkgEndDate ? 'text-muted-foreground' : 'text-foreground')}>
            {pkgEndDate ? format(pkgEndDate, 'd MMM yyyy', { locale: enUS }) : <span>{pick(locale, 'تاريخ النهاية', 'End Date', 'Bitiş Tarihi')}</span>}
            <CalendarIcon className="h-4 w-4 text-primary" />
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden rounded-lg border-border p-0 shadow-xl" align="start">
            <Calendar mode="single" selected={pkgEndDate} onSelect={setPkgEndDate} disabled={(date) => { const min = pkgStartDate || new Date(); return date <= min }} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {/* Travelers */}
      <div className="relative">
        <Users className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input
          type="number"
          min="1"
          value={pkgTravelers}
          onChange={(e) => setPkgTravelers(e.target.value)}
          placeholder={pick(locale, 'عدد المسافرين', 'Number of Travelers', 'Yolcu Sayısı')}
          className="h-14 rounded-lg border-input bg-surface pe-3 ps-9 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
        />
      </div>

      {/* Search button */}
      <div className="pt-2">
        <button type="submit" className="flex h-16 w-full items-center justify-center gap-3 rounded-lg bg-primary text-lg font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px">
          <Search className="h-5 w-5" />
          <span>{searchButton}</span>
        </button>
      </div>
    </>
  )

  const renderSearchForm = () => {
    if (searchMode === 'packages') return renderPackageSearchForm()
    if (searchMode === 'hotels') return renderHotelSearchForm()
    if (searchMode === 'cars') return renderCarSearchForm()

    const tripTypePills: { value: 'round_trip'|'one_way'|'multi_city'; label: string; icon: React.ReactNode }[] = [
      { value: 'round_trip', label: roundTripLabel, icon: <ArrowLeftRight className="h-4 w-4" /> },
      { value: 'one_way', label: oneWayLabel, icon: <ArrowRight className={cn('h-4 w-4', isAr && 'rotate-180')} /> },
      { value: 'multi_city', label: t('trips.multi_city'), icon: <Route className="h-4 w-4" /> },
    ]

    return (
      <>
        <input type="hidden" name="origin" value={origin} />
        <input type="hidden" name="destination" value={destination} />
        <input type="hidden" name="trip_type" value={tripType} />
        <input type="hidden" name="date_from" value={departureDate ? format(departureDate, 'yyyy-MM-dd') : ''} />
        <input type="hidden" name="date_to" value={returnDate ? format(returnDate, 'yyyy-MM-dd') : ''} />

        {/* Trip type pills */}
        <div className="flex flex-wrap gap-2">
          {tripTypePills.map((opt) => {
            const active = tripType === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTripType(opt.value)
                  savePrefs({ tripType: opt.value })
                  if (opt.value === 'one_way') setReturnDate(undefined)
                }}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>

        {tripType === 'multi_city' ? (
          <MultiCityLegs
            legs={legs}
            onChange={setLegs}
            locale={locale}
            departureFromLabel={departureFromLabel}
            arrivalToLabel={arrivalToLabel}
            departureDateLabel={departureDateLabel}
          />
        ) : (
        <>
        {/* Row 1: Origin & Destination */}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <CityAutocomplete
            locale={locale}
            value={origin}
            onChange={setOrigin}
            placeholder={departureFromLabel}
            className="h-16 w-full rounded-lg border-input bg-surface text-lg shadow-sm transition-colors hover:bg-muted focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15"
            showLocateButton
            myLocationLabel={pick(locale, 'موقعي الحالي', 'My location', 'Konumum')}
          />

          <button
            type="button"
            onClick={() => {
              setOrigin(destination)
              setDestination(origin)
            }}
            className="z-10 hidden h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95 sm:flex"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </button>

          <div className="sm:hidden flex items-center justify-center -my-3 z-10">
            <button
              type="button"
              onClick={() => {
                setOrigin(destination)
                setDestination(origin)
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground shadow-md transition-colors hover:text-primary active:scale-95"
              aria-label={pick(locale, 'تبديل الوجهتين', 'Swap origin and destination', 'Çıkış ve varışı değiştir')}
            >
              <ArrowLeftRight className="h-4 w-4 rotate-90" />
            </button>
          </div>

          <CityAutocomplete
            locale={locale}
            value={destination}
            onChange={setDestination}
            placeholder={arrivalToLabel}
            className="h-16 w-full rounded-lg border-input bg-surface text-lg shadow-sm transition-colors hover:bg-muted focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15"
            myLocationLabel={pick(locale, 'موقعي الحالي', 'My location', 'Konumum')}
          />
        </div>

        {/* Row 2: Dates */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {/* Departure Date */}
          <Popover>
            <PopoverTrigger
              className={cn(
                "flex h-14 w-full items-center justify-between rounded-lg border border-input bg-surface px-5 text-sm font-semibold shadow-sm outline-none transition-colors hover:bg-muted focus:border-ring focus:ring-4 focus:ring-ring/15",
                !departureDate ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {departureDate ? format(departureDate, 'd MMM yyyy', { locale: enUS }) : <span>{departureDateLabel}</span>}
              <CalendarIcon className="h-4 w-4 text-primary" />
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden rounded-lg border-border p-0 shadow-xl" align="start">
              <Calendar
                mode="single"
                selected={departureDate}
                onSelect={setDepartureDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Return Date */}
          <Popover>
            <PopoverTrigger
              disabled={searchMode === 'flights' && tripType === 'one_way'}
              className={cn(
                "flex h-14 w-full items-center justify-between rounded-lg border border-input bg-surface px-5 text-sm font-semibold shadow-sm outline-none transition-colors hover:bg-muted focus:border-ring focus:ring-4 focus:ring-ring/15 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
                !returnDate ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {returnDate ? format(returnDate, 'd MMM yyyy', { locale: enUS }) : <span>{returnDateLabel}</span>}
              <CalendarIcon className="h-4 w-4 text-primary" />
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden rounded-lg border-border p-0 shadow-xl" align="start">
              <Calendar
                mode="single"
                selected={returnDate}
                onSelect={setReturnDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        </>
        )}

        {/* Row 3: Passengers + Cabin (Wego-style) */}
        <PassengerPicker
          value={passengerCounts}
          onChange={(v) => {
            setPassengerCounts(v)
            savePrefs({ passengerCounts: v })
          }}
          locale={locale}
          cabinClass={cabinClass}
          onCabinChange={(c) => {
            setCabinClass(c)
            savePrefs({ cabinClass: c })
          }}
        />

        {/* Search button */}
        <div className="pt-2">
          <button
            type="submit"
            className="flex h-16 w-full items-center justify-center gap-3 rounded-lg bg-primary text-lg font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px"
          >
            <Search className="h-5 w-5" />
            <span>{searchButton}</span>
          </button>
        </div>
      </>
    )
  }

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center overflow-hidden bg-background pb-20 pt-20 sm:pt-28">
      {/* Image-led hero backdrop inspired by travel marketplaces; the search form below is unchanged. */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-[64svh] min-h-[520px] overflow-hidden sm:h-[68svh] sm:min-h-[620px]">
          {Object.entries(heroBackgrounds).map(([mode, src]) => (
            <Image
              key={mode}
              src={src}
              alt=""
              fill
              priority={mode === 'flights'}
              sizes="100vw"
              className={cn(
                'object-cover transition-opacity duration-500',
                searchMode === mode ? 'opacity-100' : 'opacity-0'
              )}
            />
          ))}
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-background/25 to-background" />
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-6 flex w-full max-w-7xl flex-col items-center px-3 sm:mt-0 sm:px-6 lg:px-8">
        
        <div className="mx-auto mb-6 max-w-4xl px-1 text-center text-white sm:mb-10">
          <p className="animate-fade-in-up text-xs font-black uppercase tracking-[0.28em] text-white/80" style={{ animationDelay: '180ms', animationFillMode: 'both' }}>
            {heroTitle}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl animate-fade-in-up text-2xl font-black leading-[1.15] tracking-tight text-white drop-shadow-sm sm:mt-5 sm:text-4xl md:text-6xl lg:text-7xl" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            {heroSubtitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl animate-fade-in-up text-sm font-semibold leading-6 text-white/85 sm:mt-5 sm:text-base" style={{ animationDelay: '360ms', animationFillMode: 'both' }}>
            {pick(locale, 'قارن الخيارات، اختر وقتك، واحجز رحلتك التالية في مكان واحد.', 'Compare options, choose your timing, and book the next part of your trip in one place.', 'Seçenekleri karşılaştır, zamanını seç ve bir sonraki yolculuğunu tek bir yerden rezerve et.')}
          </p>
          <div className="mx-auto mt-5 flex max-w-full items-center gap-2 overflow-x-auto rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-bold text-white shadow-lg backdrop-blur-md animate-fade-in-up [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-6 sm:inline-flex sm:w-auto sm:px-4 sm:text-sm [&::-webkit-scrollbar]:hidden" style={{ animationDelay: '420ms', animationFillMode: 'both' }}>
            <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.15)]" />
            <span className="whitespace-nowrap">{pick(locale, 'مقترحات السفر', 'Travel picks', 'Seyahat önerileri')}</span>
            <span className="whitespace-nowrap text-white/70">{pick(locale, 'اكتشف أحدث الوجهات', 'Discover latest destinations', 'En yeni destinasyonları keşfet')}</span>
          </div>
        </div>

        {/* Search Component Container */}
        <div className="relative z-20 w-full max-w-4xl animate-fade-in-up group" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          
          {/* Tabs */}
          <div className="mb-5 flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:mb-6 sm:justify-center [&::-webkit-scrollbar]:hidden">
            <div className="inline-flex shrink-0 rounded-lg border border-border bg-surface p-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => setSearchMode('flights')}
                className={cn("flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:gap-2 sm:px-8 sm:py-2.5 sm:text-base", searchMode === 'flights' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                <Plane className={cn("h-4 w-4 sm:h-5 sm:w-5", searchMode === 'flights' ? 'text-primary-foreground' : 'text-primary')} /> {pick(locale, 'طيران', 'Flights', 'Uçuşlar')}
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('hotels')}
                className={cn("flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:gap-2 sm:px-8 sm:py-2.5 sm:text-base", searchMode === 'hotels' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                <Building className={cn("h-4 w-4 sm:h-5 sm:w-5", searchMode === 'hotels' ? 'text-primary-foreground' : 'text-primary')} /> {pick(locale, 'فنادق', 'Hotels', 'Oteller')}
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('cars')}
                className={cn("flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:gap-2 sm:px-8 sm:py-2.5 sm:text-base", searchMode === 'cars' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                <CarFront className={cn("h-4 w-4 sm:h-5 sm:w-5", searchMode === 'cars' ? 'text-primary-foreground' : 'text-primary')} /> {pick(locale, 'سيارات', 'Cars', 'Araçlar')}
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('packages')}
                className={cn("flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:gap-2 sm:px-8 sm:py-2.5 sm:text-base", searchMode === 'packages' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                <Package className={cn("h-4 w-4 sm:h-5 sm:w-5", searchMode === 'packages' ? 'text-primary-foreground' : 'text-primary')} /> {pick(locale, 'باقات', 'Packages', 'Paketler')}
              </button>
            </div>
          </div>

          <div className="mt-6 grid w-full max-w-4xl grid-cols-1 gap-3 animate-fade-in-up md:mt-10 md:grid-cols-3" style={{ animationDelay: '460ms', animationFillMode: 'both' }}>
            {heroDestinations.map((item) => (
              <div key={item.city} className="relative min-h-28 overflow-hidden rounded-lg border border-white/20 bg-slate-950 shadow-lg">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 280px"
                  className="object-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/35" />
                <div className="relative flex h-full min-h-28 flex-col justify-end p-4 text-white">
                  <span className="text-lg font-black leading-none">{item.city}</span>
                  <span className="mt-1 text-xs font-semibold text-white/80">{item.detail}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search Box Card */}
          <div className="relative rounded-[1.75rem] border border-white/70 bg-white/92 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-4 lg:p-5">
            <form
              action={getActionUrl()}
              className="space-y-4"
              onSubmit={(e) => {
                if (searchMode === 'cars' || searchMode === 'hotels' || searchMode === 'packages') {
                  e.preventDefault()
                  router.push(getActionUrl())
                }
              }}
            >
              {renderSearchForm()}
            </form>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm font-semibold text-muted-foreground animate-fade-in-up sm:gap-12" style={{ animationDelay: '520ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-success/20 bg-success/10 text-success shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground">{pick(locale, 'حجز آمن 100%', '100% Secure', '%100 Güvenli')}</span>
              <span className="text-xs font-normal text-muted-foreground">{pick(locale, 'موثوق ومعتمد', 'Trusted & Verified', 'Güvenilir ve Doğrulanmış')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-sm">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground">{pick(locale, 'دفع مرن', 'Flexible Payments', 'Esnek Ödemeler')}</span>
              <span className="text-xs font-normal text-muted-foreground">{pick(locale, 'خيارات دفع متعددة', 'Multiple options', 'Birden fazla seçenek')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-warning/20 bg-warning/10 text-warning shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground">{pick(locale, 'دعم متواصل', '24/7 Support', '7/24 Destek')}</span>
              <span className="text-xs font-normal text-muted-foreground">{pick(locale, 'نحن هنا لخدمتك', 'Always here to help', 'Her zaman yardıma hazır')}</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
