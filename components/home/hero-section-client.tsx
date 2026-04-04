'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowLeftRight, ChevronDown, CalendarIcon, Plane, Building, CarFront, ShieldCheck, CreditCard, Clock, Sparkles, MapPin, Car as CarIcon } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { arSA, enUS } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CityAutocomplete } from '@/components/shared/city-autocomplete'
import { cn } from '@/lib/utils'

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
  providerCta,
  markeeteerCta,
  departureFromLabel,
  arrivalToLabel,
  roundTripLabel,
  oneWayLabel,
  departureDateLabel,
  returnDateLabel,
}: HeroSectionClientProps) {
  const isAr = locale === 'ar'
  const router = useRouter()
  const [searchMode, setSearchMode] = useState<'flights'|'hotels'|'cars'>('flights')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [tripType, setTripType] = useState('round_trip')
  const [departureDate, setDepartureDate] = useState<Date>()
  const [returnDate, setReturnDate] = useState<Date>()
  const [carPickupType, setCarPickupType] = useState('')
  const [carReturnSame, setCarReturnSame] = useState(true)
  const [carReturnCity, setCarReturnCity] = useState('')

  const getActionUrl = () => {
    if (searchMode === 'hotels') return `/${locale}/rooms`
    if (searchMode === 'cars') {
      const params = new URLSearchParams()
      if (origin) params.set('city', origin)
      if (carPickupType) params.set('pickup_type', carPickupType)
      if (departureDate) params.set('pickup_date', format(departureDate, 'yyyy-MM-dd'))
      if (returnDate) params.set('return_date', format(returnDate, 'yyyy-MM-dd'))
      const qs = params.toString()
      return `/${locale}/cars${qs ? `?${qs}` : ''}`
    }
    return `/${locale}/trips`
  }

  const inputClass = "w-full h-14 px-5 rounded-[1.25rem] bg-slate-50 border border-slate-200 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none hover:bg-white transition-all shadow-sm"

  const renderCarSearchForm = () => (
    <>
      {/* Row 1: Pickup Location */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{isAr ? 'موقع الاستلام' : 'Pickup Location'}</span>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {/* Pickup Type + City */}
          <div className="flex gap-2 flex-1">
            <Popover>
              <PopoverTrigger className={cn(
                'flex h-14 shrink-0 items-center gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold transition-all hover:bg-white shadow-sm',
                carPickupType ? 'text-slate-700' : 'text-slate-500'
              )}>
                {carPickupType === 'airport' ? <Plane className="h-4 w-4 text-primary" /> : carPickupType === 'branch' ? <Building className="h-4 w-4 text-primary" /> : <CarIcon className="h-4 w-4 text-slate-400" />}
                <span className="hidden sm:inline">{carPickupType === 'airport' ? (isAr ? 'مطار' : 'Airport') : carPickupType === 'branch' ? (isAr ? 'فرع' : 'Branch') : (isAr ? 'الكل' : 'All')}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2 rounded-2xl" align="start">
                <div className="grid gap-1">
                  {[
                    { val: '', icon: <CarIcon className="h-4 w-4" />, label: isAr ? 'الكل' : 'All' },
                    { val: 'airport', icon: <Plane className="h-4 w-4" />, label: isAr ? 'مطار' : 'Airport' },
                    { val: 'branch', icon: <Building className="h-4 w-4" />, label: isAr ? 'فرع' : 'Branch' },
                  ].map((opt) => (
                    <button key={opt.val} type="button" onClick={() => setCarPickupType(opt.val)} className={cn('flex items-center gap-2 h-10 px-3 rounded-xl text-sm font-semibold transition-colors w-full text-start', carPickupType === opt.val ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50')}>
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
              placeholder={isAr ? 'مدينة الاستلام' : 'Pickup City'}
              className="h-14 w-full text-base rounded-[1.25rem] bg-slate-50 hover:bg-white border-slate-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm"
              showLocateButton
              myLocationLabel={isAr ? 'موقعي الحالي' : 'My location'}
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
              'hidden sm:flex items-center justify-center h-12 w-12 rounded-full active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm z-10 border',
              carReturnSame
                ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-primary hover:text-white hover:border-primary'
                : 'bg-primary/10 text-primary border-primary'
            )}
            title={isAr ? 'التسليم في مكان مختلف' : 'Return to different location'}
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
                'flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all active:scale-95 border',
                carReturnSame
                  ? 'bg-white border-slate-200 text-slate-500 hover:text-primary'
                  : 'bg-primary/10 border-primary text-primary'
              )}
              aria-label={isAr ? 'التسليم في مكان مختلف' : 'Return to different location'}
            >
              <ArrowLeftRight className="h-4 w-4 rotate-90" />
            </button>
          </div>

          {/* Return City */}
          <div className="flex-1">
            {carReturnSame ? (
              <div className={cn(inputClass, 'flex items-center text-slate-400 opacity-60 cursor-not-allowed')}>
                {isAr ? 'نفس موقع الاستلام' : 'Same as pickup'}
              </div>
            ) : (
              <CityAutocomplete
                locale={locale}
                value={carReturnCity}
                onChange={setCarReturnCity}
                placeholder={isAr ? 'مدينة التسليم' : 'Drop-off City'}
                className="h-14 w-full text-base rounded-[1.25rem] bg-slate-50 hover:bg-white border-slate-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm"
                myLocationLabel={isAr ? 'موقعي الحالي' : 'My location'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Dates */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <Popover>
          <PopoverTrigger className={cn(inputClass, 'flex items-center justify-between', !departureDate ? 'text-slate-400' : 'text-slate-700')}>
            {departureDate ? format(departureDate, 'PPP', { locale: isAr ? arSA : enUS }) : <span>{isAr ? 'تاريخ الاستلام' : 'Pickup Date'}</span>}
            <CalendarIcon className="h-4 w-4 text-slate-400" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-xl border-slate-100" align="start">
            <Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} disabled={(date) => date < new Date()} initialFocus />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger className={cn(inputClass, 'flex items-center justify-between', !returnDate ? 'text-slate-400' : 'text-slate-700')}>
            {returnDate ? format(returnDate, 'PPP', { locale: isAr ? arSA : enUS }) : <span>{isAr ? 'تاريخ الإرجاع' : 'Return Date'}</span>}
            <CalendarIcon className="h-4 w-4 text-slate-400" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-xl border-slate-100" align="start">
            <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} disabled={(date) => { const min = departureDate || new Date(); return date <= min }} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {/* Search button */}
      <div className="pt-2">
        <button type="submit" className="w-full flex items-center justify-center gap-3 h-16 rounded-[1.25rem] bg-gradient-to-r from-primary to-blue-800 text-white font-bold text-lg hover:brightness-110 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-primary/25">
          <Search className="h-5 w-5" />
          <span>{searchButton}</span>
        </button>
      </div>
    </>
  )

  const renderSearchForm = () => {
    if (searchMode === 'cars') return renderCarSearchForm()

    return (
      <>
        <input type="hidden" name="origin" value={origin} />
        <input type="hidden" name="destination" value={destination} />
        <input type="hidden" name="trip_type" value={tripType} />
        <input type="hidden" name="date_from" value={departureDate ? format(departureDate, 'yyyy-MM-dd') : ''} />
        <input type="hidden" name="date_to" value={returnDate ? format(returnDate, 'yyyy-MM-dd') : ''} />

        {/* Row 1: Origin & Destination */}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <CityAutocomplete
            locale={locale}
            value={origin}
            onChange={setOrigin}
            placeholder={departureFromLabel}
            className="h-16 w-full text-lg rounded-[1.25rem] bg-slate-50 hover:bg-white border-slate-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm inset-y-0"
            showLocateButton
            myLocationLabel={isAr ? 'موقعي الحالي' : 'My location'}
          />

          <button
            type="button"
            onClick={() => {
              setOrigin(destination)
              setDestination(origin)
            }}
            className="hidden sm:flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 hover:bg-primary hover:text-white text-slate-500 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm z-10 border border-slate-200 hover:border-primary"
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
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 shadow-md transition-all active:scale-95 hover:text-primary"
              aria-label={isAr ? 'تبديل الوجهتين' : 'Swap origin and destination'}
            >
              <ArrowLeftRight className="h-4 w-4 rotate-90" />
            </button>
          </div>

          <CityAutocomplete
            locale={locale}
            value={destination}
            onChange={setDestination}
            placeholder={arrivalToLabel}
            className="h-16 w-full text-lg rounded-[1.25rem] bg-slate-50 hover:bg-white border-slate-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm"
            myLocationLabel={isAr ? 'موقعي الحالي' : 'My location'}
          />
        </div>

        {/* Row 2: Trip type and dates */}
        <div className={cn("grid gap-3", searchMode === 'flights' ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
          {searchMode === 'flights' && (
            <div className="relative">
              <select
                value={tripType}
                onChange={(e) => {
                  const value = e.target.value
                  setTripType(value)
                  if (value === 'one_way') {
                    setReturnDate(undefined)
                  }
                }}
                className="appearance-none w-full h-14 px-5 pe-10 rounded-[1.25rem] bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none hover:bg-white transition-all cursor-pointer shadow-sm"
              >
                <option value="round_trip">{roundTripLabel}</option>
                <option value="one_way">{oneWayLabel}</option>
              </select>
              <ChevronDown className="absolute end-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Departure Date */}
          <Popover>
            <PopoverTrigger
              className={cn(
                "w-full h-14 px-5 rounded-[1.25rem] bg-slate-50 border border-slate-200 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none hover:bg-white transition-all flex items-center justify-between shadow-sm",
                !departureDate ? "text-slate-400" : "text-slate-700"
              )}
            >
              {departureDate ? format(departureDate, 'PPP', { locale: isAr ? arSA : enUS }) : <span>{searchMode === 'hotels' ? (isAr ? 'تاريخ الوصول' : 'Check-in') : departureDateLabel}</span>}
              <CalendarIcon className="h-4 w-4 text-slate-400" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-xl border-slate-100" align="start">
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
                "w-full h-14 px-5 rounded-[1.25rem] bg-slate-50 border border-slate-200 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none hover:bg-white transition-all flex items-center justify-between shadow-sm disabled:opacity-50 disabled:bg-slate-100/50 disabled:cursor-not-allowed",
                !returnDate ? "text-slate-400" : "text-slate-700"
              )}
            >
              {returnDate ? format(returnDate, 'PPP', { locale: isAr ? arSA : enUS }) : <span>{searchMode === 'hotels' ? (isAr ? 'تاريخ المغادرة' : 'Check-out') : returnDateLabel}</span>}
              <CalendarIcon className="h-4 w-4 text-slate-400" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-xl border-slate-100" align="start">
              <Calendar
                mode="single"
                selected={returnDate}
                onSelect={setReturnDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Search button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 h-16 rounded-[1.25rem] bg-gradient-to-r from-primary to-blue-800 text-white font-bold text-lg hover:brightness-110 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-primary/25"
          >
            <Search className="h-5 w-5" />
            <span>{searchButton}</span>
          </button>
        </div>
      </>
    )
  }

  return (
    <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden bg-slate-50 pt-28 pb-20">
      {/* Enhanced Professional Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-100/60 to-sky-50/60 blur-[100px]" />
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] rounded-full bg-gradient-to-bl from-orange-50/60 to-amber-50/60 blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-slate-200/50 to-transparent blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 sm:px-6 lg:px-8 mt-10 sm:mt-0">
        
        <div className="mx-auto mb-10 max-w-4xl text-center">
          <h1 className="mx-auto mt-6 max-w-2xl animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] font-black leading-[1.15] tracking-tight text-slate-900" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            {heroSubtitle}
          </h1>
        </div>

        {/* Search Component Container */}
        <div className="relative z-20 w-full max-w-4xl animate-fade-in-up group" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          
          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/80 backdrop-blur-xl">
              <button 
                type="button" 
                onClick={() => setSearchMode('flights')} 
                className={cn("flex items-center gap-2 px-5 sm:px-8 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all", searchMode === 'flights' ? "bg-primary text-white shadow-md" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50")}
              >
                <Plane className="w-4 h-4 sm:w-5 sm:h-5" /> {isAr ? 'طيران' : 'Flights'}
              </button>
              <button 
                type="button" 
                onClick={() => setSearchMode('hotels')} 
                className={cn("flex items-center gap-2 px-5 sm:px-8 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all", searchMode === 'hotels' ? "bg-primary text-white shadow-md" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50")}
              >
                <Building className="w-4 h-4 sm:w-5 sm:h-5" /> {isAr ? 'فنادق' : 'Hotels'}
              </button>
              <button 
                type="button" 
                onClick={() => setSearchMode('cars')} 
                className={cn("flex items-center gap-2 px-5 sm:px-8 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all", searchMode === 'cars' ? "bg-primary text-white shadow-md" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50")}
              >
                <CarFront className="w-4 h-4 sm:w-5 sm:h-5" /> {isAr ? 'سيارات' : 'Cars'}
              </button>
            </div>
          </div>

          {/* Search Box Card */}
          <div className="absolute -inset-4 rounded-[2.5rem] bg-slate-200/40 blur-2xl opacity-50 -z-10"></div>
          <div className="relative rounded-[2rem] border border-slate-200 bg-white/80 backdrop-blur-2xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-slate-200/50">
            <form
              action={getActionUrl()}
              className="space-y-4"
              onSubmit={(e) => {
                if (searchMode === 'cars') {
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
        <div className="mt-14 flex flex-wrap justify-center gap-6 sm:gap-12 text-sm font-semibold text-slate-600 animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-800">{isAr ? 'حجز آمن 100%' : '100% Secure'}</span>
              <span className="text-xs font-normal text-slate-500">{isAr ? 'موثوق ومعتمد' : 'Trusted & Verified'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-800">{isAr ? 'دفع مرن' : 'Flexible Payments'}</span>
              <span className="text-xs font-normal text-slate-500">{isAr ? 'خيارات دفع متعددة' : 'Multiple options'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 shadow-sm border border-amber-100">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-800">{isAr ? 'دعم متواصل' : '24/7 Support'}</span>
              <span className="text-xs font-normal text-slate-500">{isAr ? 'نحن هنا لخدمتك' : 'Always here to help'}</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
