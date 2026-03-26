'use client'

import { useState } from 'react'
import { Search, ArrowRight, ArrowLeftRight, ChevronDown, CalendarIcon } from 'lucide-react'
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
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [tripType, setTripType] = useState('one_way')
  const [departureDate, setDepartureDate] = useState<Date>()
  const [returnDate, setReturnDate] = useState<Date>()
  const trustBadges = isAr
    ? ['رحلات مرنة', 'دفع آمن', 'دعم سريع']
    : ['Flexible trips', 'Secure checkout', 'Fast support']
  const quickStats = isAr
    ? [
        { value: '250+', label: 'رحلة نشطة' },
        { value: '40+', label: 'مزود موثق' },
        { value: '4.9/5', label: 'رضا المسافرين' },
      ]
    : [
        { value: '250+', label: 'Active trips' },
        { value: '40+', label: 'Verified providers' },
        { value: '4.9/5', label: 'Traveler rating' },
      ]

  return (
    <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fff7ef_0%,#fffdf8_24%,#eef7ff_68%,#f7fbff_100%)] pt-22 pb-20">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/80 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.35)_35%,transparent_70%)]" />
        <div className="absolute left-[-8%] top-[12%] h-80 w-80 rounded-full bg-[#f97316]/20 blur-3xl opacity-75" />
        <div className="absolute right-[-8%] top-[20%] h-[28rem] w-[28rem] rounded-full bg-[#0ea5e9]/15 blur-3xl opacity-90" />
        <div className="absolute bottom-[-10%] left-[24%] h-72 w-72 rounded-full bg-[#facc15]/18 blur-3xl opacity-80" />
        <div className="absolute bottom-[16%] right-[12%] h-52 w-52 rounded-full bg-[#14b8a6]/12 blur-3xl opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_40%)]" />
        <div className="absolute inset-x-8 inset-y-10 rounded-[3rem] border border-white/40 opacity-40" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 sm:px-6 lg:px-8">
        <div
          className="mb-8 flex items-center justify-center gap-3 animate-fade-in-up sm:flex-row"
          style={{ animationDelay: '100ms', animationFillMode: 'both' }}
        >
          <Link href={`/${locale}/become-provider`} className="group flex items-center justify-center gap-3 rounded-full border border-[#f2dfcc] bg-white/90 px-5 py-2.5 shadow-lg shadow-orange-100/40 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#f97316]/30 hover:bg-white">
            <span className="relative flex h-2 w-2 rounded-full bg-accent">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
            </span>
            <span className="text-sm font-semibold tracking-wide text-slate-700 transition-colors group-hover:text-slate-900">
              {providerCta}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-slate-700 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>

          <Link href={`/${locale}/become-marketeer`} className="group flex items-center justify-center gap-3 rounded-full border border-[#ede9fe] bg-white/90 px-5 py-2.5 shadow-lg shadow-violet-100/50 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-violet-300/50 hover:bg-white">
            <span className="relative flex h-2 w-2 rounded-full bg-violet-500">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75"></span>
            </span>
            <span className="text-sm font-semibold tracking-wide text-slate-700 transition-colors group-hover:text-slate-900">
              {markeeteerCta}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-violet-600 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
        </div>

        <div className="mx-auto mb-12 max-w-5xl text-center">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-700 shadow-sm backdrop-blur-md"
              >
                {badge}
              </span>
            ))}
          </div>
          <h1 className="animate-fade-in-up text-[3.2rem] font-black leading-[1.02] tracking-[-0.05em] text-slate-900 sm:text-[4.8rem] lg:text-[6.4rem]" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            {heroTitle.split(' ').map((word, i, arr) => {
              const isHighlight = i >= arr.length - 2
              return (
                <span
                  key={i}
                  className={isHighlight ? 'inline-block bg-gradient-to-r from-[#0c4a6e] via-[#0ea5e9] to-[#f97316] bg-clip-text text-transparent' : 'inline-block'}
                >
                  {word}&nbsp;
                </span>
              )
            })}
          </h1>

          <p className="mx-auto mt-8 max-w-3xl animate-fade-in-up text-lg font-medium leading-relaxed text-slate-600 lg:text-xl" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            {heroSubtitle}
          </p>
        </div>

        <div className="relative z-20 w-full max-w-5xl animate-fade-in-up group" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-xl opacity-0 transition duration-500 group-hover:opacity-100"></div>

          <div className="relative rounded-[2rem] border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50 md:p-6">
            <form
              action={`/${locale}/trips`}
              className="space-y-4"
            >
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
                  className="h-16 w-full text-lg rounded-[1.5rem]"
                  showLocateButton
                  myLocationLabel={isAr ? 'موقعي الحالي' : 'My location'}
                />

                <button
                  type="button"
                  onClick={() => {
                    setOrigin(destination)
                    setDestination(origin)
                  }}
                  className="hidden sm:flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <ArrowLeftRight className="h-4 w-4 text-slate-400" />
                </button>
                <div className="sm:hidden flex items-center justify-center py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin(destination)
                      setDestination(origin)
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 shadow-sm transition-all active:scale-95"
                    aria-label={isAr ? 'تبديل الوجهتين' : 'Swap origin and destination'}
                  >
                    <ArrowLeftRight className="h-4 w-4 text-slate-500" />
                  </button>
                </div>

                <CityAutocomplete
                  locale={locale}
                  value={destination}
                  onChange={setDestination}
                  placeholder={arrivalToLabel}
                  className="h-16 w-full text-lg rounded-[1.5rem]"
                  myLocationLabel={isAr ? 'موقعي الحالي' : 'My location'}
                />
              </div>

              {/* Row 2: Trip type and dates */}
              <div className="grid grid-cols-3 gap-3">
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
                    className="appearance-none w-full h-14 px-5 pe-10 rounded-2xl bg-slate-50 border-none text-slate-700 text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <option value="round_trip">{roundTripLabel}</option>
                    <option value="one_way">{oneWayLabel}</option>
                  </select>
                  <ChevronDown className="absolute end-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Departure Date */}
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "w-full h-14 px-5 rounded-2xl bg-slate-50 border-none text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none hover:bg-slate-100 transition-colors flex items-center justify-between",
                      !departureDate ? "text-slate-400" : "text-slate-700"
                    )}
                  >
                    {departureDate ? format(departureDate, 'PPP', { locale: isAr ? arSA : enUS }) : <span>{departureDateLabel}</span>}
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                    disabled={tripType === 'one_way'}
                    className={cn(
                      "w-full h-14 px-5 rounded-2xl bg-slate-50 border-none text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none hover:bg-slate-100 transition-colors flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed",
                      !returnDate ? "text-slate-400" : "text-slate-700"
                    )}
                  >
                    {returnDate ? format(returnDate, 'PPP', { locale: isAr ? arSA : enUS }) : <span>{returnDateLabel}</span>}
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                  className="w-full flex items-center justify-center gap-3 h-16 rounded-2xl bg-primary text-white font-bold text-lg hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-primary/20"
                >
                  <Search className="h-5 w-5" />
                  <span>{searchButton}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-10 grid w-full max-w-5xl gap-4 animate-fade-in-up md:grid-cols-[1.2fr_0.8fr] md:gap-6" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          <div className="rounded-[1.75rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(255,247,237,0.88))] p-5 shadow-lg shadow-orange-100/40 backdrop-blur-sm md:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">
              {isAr ? 'موثوق من قبل آلاف المسافرين' : 'Trusted by thousands of travelers'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
              {['Saudia', 'Flynas', 'Flyadeal', 'Emirates'].map((brand) => (
                <span key={brand} className="text-lg font-black tracking-tight text-slate-800 md:text-xl">
                  {brand}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {quickStats.map((item, idx) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-[1.5rem] border p-4 text-center shadow-lg backdrop-blur-sm",
                  idx === 0 && "border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] shadow-sky-100/40",
                  idx === 1 && "border-orange-100 bg-[linear-gradient(180deg,#ffffff_0%,#fff7ed_100%)] shadow-orange-100/40",
                  idx === 2 && "border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#ecfeff_100%)] shadow-emerald-100/40"
                )}
              >
                <p className="text-2xl font-black tracking-tight text-slate-900">{item.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
