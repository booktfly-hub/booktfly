'use client'

import { useState, use } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Sparkles,
  MapPin,
  Users,
  Minus,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Building2,
  Plane,
  BedDouble,
  CarFront,
  Calendar,
  Clock,
  Star,
  CalendarDays,
} from 'lucide-react'
import { cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { LastMinuteBadge } from '@/components/ui/last-minute-badge'
import { RoomDetailPageSkeleton } from '@/components/shared/loading-skeleton'
import { buttonVariants } from '@/components/ui/button'
import { format, parseISO, isValid } from 'date-fns'
import type { Package as PackageType } from '@/types/database'

export default function PackageDetailClient({ params, initialPkg }: { params: Promise<{ id: string; locale: string }>; initialPkg?: PackageType | null }) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  use(params)

  const [pkg] = useState<PackageType | null>(initialPkg ?? null)
  const [loading] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)
  const [people, setPeople] = useState(1)
  const startDate = initialPkg?.start_date || ''
  const endDate = initialPkg?.end_date || ''

  const Back = isAr ? ChevronRight : ChevronLeft

  if (loading) return <RoomDetailPageSkeleton />

  if (!pkg) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 mb-6">
          <AlertTriangle className="h-10 w-10 text-warning" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">{t('errors.not_found')}</h2>
        <button
          onClick={() => router.push(`/${locale}/packages`)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
        >
          <Back className="h-4 w-4" />
          {t('common.back')}
        </button>
      </div>
    )
  }

  const name = isAr ? pkg.name_ar : (pkg.name_en || pkg.name_ar)
  const destination = isAr ? pkg.destination_city_ar : (pkg.destination_city_en || pkg.destination_city_ar)
  const description = isAr ? pkg.description_ar : (pkg.description_en || pkg.description_ar)
  const fmt = (amount: number) => isAr ? formatPrice(amount, pkg.currency) : formatPriceEN(amount, pkg.currency)
  const totalPrice = pkg.total_price * people
  const availableSpots = pkg.max_bookings - pkg.current_bookings

  const hasDiscount = pkg.original_price != null && pkg.original_price > pkg.total_price
  const originalFormatted = hasDiscount ? fmt(pkg.original_price!) : null

  const isBookable = pkg.status === 'active' && availableSpots > 0
  const isNotAvailable = pkg.status === 'removed'
  const isDeactivated = pkg.status === 'deactivated'
  const isSoldOut = availableSpots <= 0 && pkg.status === 'active'

  const providerName = pkg.provider
    ? isAr
      ? pkg.provider.company_name_ar
      : (pkg.provider.company_name_en || pkg.provider.company_name_ar)
    : null

  const images = pkg.images || []
  const prevImage = () => setCurrentImage((c) => (c === 0 ? images.length - 1 : c - 1))
  const nextImage = () => setCurrentImage((c) => (c === images.length - 1 ? 0 : c + 1))

  // Flight details (from linked trip or inline fields)
  const flightAirline = pkg.trip?.airline || pkg.flight_airline
  const flightNumber = pkg.trip?.flight_number || pkg.flight_number
  const flightOrigin = pkg.trip
    ? (isAr ? pkg.trip.origin_city_ar : (pkg.trip.origin_city_en || pkg.trip.origin_city_ar))
    : (isAr ? pkg.flight_origin_ar : (pkg.flight_origin_en || pkg.flight_origin_ar))
  const flightOriginCode = pkg.trip?.origin_code || pkg.flight_origin_code
  const flightDestination = pkg.trip
    ? (isAr ? pkg.trip.destination_city_ar : (pkg.trip.destination_city_en || pkg.trip.destination_city_ar))
    : (isAr ? pkg.flight_destination_ar : (pkg.flight_destination_en || pkg.flight_destination_ar))
  const flightDestinationCode = pkg.trip?.destination_code || pkg.flight_destination_code
  const flightDeparture = pkg.trip?.departure_at || pkg.flight_departure_at
  const flightReturn = pkg.trip?.return_at || pkg.flight_return_at
  const flightCabin = pkg.trip?.cabin_class || pkg.flight_cabin_class

  // Hotel details (from linked room or inline fields)
  const hotelName = pkg.room
    ? (isAr ? pkg.room.name_ar : (pkg.room.name_en || pkg.room.name_ar))
    : (isAr ? pkg.hotel_name_ar : (pkg.hotel_name_en || pkg.hotel_name_ar))
  const hotelCategory = pkg.room?.category || pkg.hotel_category
  const hotelNights = pkg.hotel_nights
  const durationDays = pkg.duration_days
  const roomBasisLabel = pkg.room_basis
    ? ({
        single: isAr ? 'فردية' : 'Single Room',
        double: isAr ? 'مزدوجة' : 'Double Room',
        triple: isAr ? 'ثلاثية' : 'Triple Room',
        quad: isAr ? 'رباعية' : 'Quad Room',
      }[pkg.room_basis] || pkg.room_basis)
    : null
  const hotelCity = pkg.room
    ? (isAr ? pkg.room.city_ar : (pkg.room.city_en || pkg.room.city_ar))
    : (isAr ? pkg.hotel_city_ar : (pkg.hotel_city_en || pkg.hotel_city_ar))
  const includedServices = [
    pkg.breakfast_included ? (isAr ? 'وجبة الإفطار' : 'Breakfast') : null,
    pkg.airport_transfer_included ? (isAr ? 'استقبال وتوديع المطار' : 'Airport Transfer') : null,
    pkg.tour_guide_included ? (isAr ? 'مرشد سياحي' : 'Tour Guide') : null,
    pkg.sightseeing_tours_included ? (isAr ? 'جولات سياحية' : 'Sightseeing Tours') : null,
  ].filter(Boolean) as string[]

  // Car details (from linked car or inline fields)
  const carBrand = pkg.car
    ? (isAr ? pkg.car.brand_ar : (pkg.car.brand_en || pkg.car.brand_ar))
    : (isAr ? pkg.car_brand_ar : (pkg.car_brand_en || pkg.car_brand_ar))
  const carModel = pkg.car
    ? (isAr ? pkg.car.model_ar : (pkg.car.model_en || pkg.car.model_ar))
    : (isAr ? pkg.car_model_ar : (pkg.car_model_en || pkg.car_model_ar))
  const carCategory = pkg.car?.category || pkg.car_category
  const carRentalDays = pkg.car_rental_days

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateOnly = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5',
    deactivated: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/5',
    removed: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/5',
  }

  const handleBooking = () => {
    const nextSearch = new URLSearchParams()
    nextSearch.set('people', String(people))
    if (startDate) nextSearch.set('start', startDate)
    if (endDate) nextSearch.set('end', endDate)
    router.push(`/${locale}/packages/${pkg.id}/book?${nextSearch.toString()}`)
  }

  const BookingForm = () => (
    <div className="space-y-6">
      {isBookable && (
        <>
          {/* People counter */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <label className="mb-4 block text-sm font-bold text-slate-900">
              {t('packages.number_of_people')}
            </label>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <button
                type="button"
                onClick={() => setPeople(Math.max(1, people - 1))}
                disabled={people <= 1}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className="text-3xl font-black tracking-tight text-slate-950">{people}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{isAr ? 'أشخاص' : 'People'}</p>
              </div>
              <button
                type="button"
                onClick={() => setPeople(Math.min(availableSpots, people + 1))}
                disabled={people >= availableSpots}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Dates (fixed by provider) */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {isAr ? 'تواريخ سفر الباقة' : 'Package Travel Dates'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'المغادرة' : 'Departure'}</label>
                <div className={cn(
                  'flex h-11 w-full items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold',
                  startDate ? 'text-slate-900' : 'text-slate-400'
                )}>
                  <span className="truncate">
                    {startDate && isValid(parseISO(startDate)) ? format(parseISO(startDate), 'd MMM yyyy') : '—'}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'العودة' : 'Return'}</label>
                <div className={cn(
                  'flex h-11 w-full items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold',
                  endDate ? 'text-slate-900' : 'text-slate-400'
                )}>
                  <span className="truncate">
                    {endDate && isValid(parseISO(endDate)) ? format(parseISO(endDate), 'd MMM yyyy') : '—'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              {isAr ? 'تواريخ ثابتة محددة من قِبل مزود الباقة.' : 'Fixed dates set by the package provider.'}
            </p>
          </div>

          {/* Price breakdown */}
          <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-sm font-medium text-slate-500">
              <span>{fmt(pkg.total_price)} x {people} {isAr ? 'أشخاص' : 'People'}</span>
              <span className="font-semibold text-slate-900">{fmt(totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-base font-bold text-slate-900">{t('common.total')}</span>
              <span className="text-2xl font-black tracking-tight text-primary">{fmt(totalPrice)}</span>
            </div>
          </div>

          <button
            onClick={handleBooking}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-14 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/15 disabled:opacity-50'
            )}
          >
            <span className="inline-flex items-center gap-2">
              {t('packages.book_now')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </span>
          </button>
        </>
      )}

      {isSoldOut && (
        <button
          disabled
          className="w-full rounded-2xl border border-warning/20 bg-warning/10 py-4 text-base font-bold text-warning"
        >
          {isAr ? 'نفذت الأماكن' : 'Sold Out'}
        </button>
      )}

      {isDeactivated && (
        <button
          disabled
          className="w-full rounded-2xl border border-warning/20 bg-warning/10 py-4 text-base font-bold text-warning"
        >
          {isAr ? 'غير متاح حالياً' : 'Not Available'}
        </button>
      )}

      {isNotAvailable && (
        <button
          disabled
          className="w-full rounded-2xl border border-destructive/20 bg-destructive/10 py-4 text-base font-bold text-destructive"
        >
          {isAr ? 'غير متاح' : 'Not Available'}
        </button>
      )}

      <p className="text-center text-xs font-medium leading-relaxed text-slate-500">
        {t('booking.terms_agreement')}
      </p>
    </div>
  )

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 md:pt-32 lg:pt-36 lg:pb-12 animate-fade-in-up">
        {/* Back button */}
        <button
          onClick={() => router.push(`/${locale}/packages`)}
          className="group inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 md:mb-8 transition-colors"
        >
          <div className="p-1.5 md:p-2 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
            <Back className="h-3 w-3 md:h-4 md:w-4 rtl:rotate-180" />
          </div>
          {t('common.back')}
        </button>

        {/* Not available banner */}
        {(isNotAvailable || isDeactivated) && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 md:p-5 mb-6 md:mb-8 flex items-center gap-3 md:gap-4 shadow-sm animate-fade-in-up">
            <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-destructive shrink-0" />
            <p className="text-sm md:text-base font-bold text-destructive">
              {isAr ? 'هذه الباقة غير متاحة حالياً' : 'This package is not available'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Main content */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6 md:space-y-8">
            <div className="overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
              {/* Image Gallery */}
              <div className="relative w-full aspect-[16/10] overflow-hidden group">
                {images.length > 0 ? (
                  <Image
                    src={images[currentImage]}
                    alt={`${name} - ${currentImage + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Sparkles className="h-16 w-16 text-primary/30" />
                  </div>
                )}

                {pkg.is_last_minute && (
                  <div className="absolute top-3 start-3">
                    <LastMinuteBadge discount={pkg.discount_percentage} size="md" />
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImage(i)}
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            i === currentImage ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 md:p-10">
                {/* Status badges */}
                <div className="mb-4 flex flex-wrap items-center gap-2.5">
                  <span
                    className={cn(
                      'inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all hover:scale-105',
                      statusStyles[pkg.status] || 'bg-muted text-muted-foreground border-border'
                    )}
                  >
                    <span className="relative flex h-2 w-2 me-2">
                      <span className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        pkg.status === 'active' ? "bg-emerald-400" : "bg-muted-foreground"
                      )}></span>
                      <span className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        pkg.status === 'active' ? "bg-emerald-500" : "bg-muted-foreground"
                      )}></span>
                    </span>
                    {t(`status.${pkg.status}`)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 backdrop-blur">
                    <Users className="h-3.5 w-3.5 text-accent" />
                    {availableSpots} {t('packages.available_spots')}
                  </span>
                </div>

                {/* Name */}
                <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-4xl mb-3">
                  {name}
                </h1>

                {/* Destination */}
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-sm md:text-base font-semibold text-slate-600">{destination}</span>
                </div>

                {/* Date range */}
                {pkg.start_date && (
                  <div className="flex items-center gap-2 mb-6">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-500">
                      {formatDateOnly(pkg.start_date)}
                      {pkg.end_date && ` — ${formatDateOnly(pkg.end_date)}`}
                    </span>
                  </div>
                )}

                {(durationDays || roomBasisLabel) && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {durationDays && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {durationDays} {isAr ? 'أيام' : 'Days'}
                      </span>
                    )}
                    {roomBasisLabel && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                        <BedDouble className="h-4 w-4 text-slate-400" />
                        {roomBasisLabel}
                      </span>
                    )}
                  </div>
                )}

                {/* Description */}
                {description && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 mb-6">
                    <p className="text-sm md:text-base font-medium text-slate-600 leading-relaxed whitespace-pre-line">
                      {description}
                    </p>
                  </div>
                )}

                {/* Price card */}
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/15">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{t('packages.total_price')} / {t('packages.per_person')}</p>
                  {hasDiscount && (
                    <p className="text-lg font-bold text-slate-400 line-through mb-1">{originalFormatted}</p>
                  )}
                  <p className={cn('text-3xl font-black tracking-tight md:text-4xl', hasDiscount && 'text-orange-400')}>
                    {fmt(pkg.total_price)}
                  </p>
                </div>
              </div>
            </div>

            {/* What's Included Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 md:text-2xl">{t('packages.includes')}</h2>

              {/* Flight Card */}
              {pkg.includes_flight && (
                <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                      <Plane className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-black text-slate-950 md:text-xl">{t('packages.flight_details')}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {flightAirline && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.airline')}</p>
                        <p className="text-base font-bold text-slate-900">{flightAirline}</p>
                      </div>
                    )}
                    {flightNumber && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.flight_number')}</p>
                        <p className="text-base font-bold text-slate-900">{flightNumber}</p>
                      </div>
                    )}
                    {flightOrigin && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.origin')}</p>
                        <p className="text-base font-bold text-slate-900">{flightOrigin} {flightOriginCode && <span className="text-slate-500">({flightOriginCode})</span>}</p>
                      </div>
                    )}
                    {flightDestination && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.destination')}</p>
                        <p className="text-base font-bold text-slate-900">{flightDestination} {flightDestinationCode && <span className="text-slate-500">({flightDestinationCode})</span>}</p>
                      </div>
                    )}
                    {flightDeparture && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.departure_date')}</p>
                        <p className="text-base font-bold text-slate-900">{formatDateTime(flightDeparture)}</p>
                      </div>
                    )}
                    {flightReturn && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.return_date')}</p>
                        <p className="text-base font-bold text-slate-900">{formatDateTime(flightReturn)}</p>
                      </div>
                    )}
                    {flightCabin && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.cabin_class')}</p>
                        <p className="text-base font-bold text-slate-900 capitalize">{flightCabin}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hotel Card */}
              {pkg.includes_hotel && (
                <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                      <BedDouble className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-black text-slate-950 md:text-xl">{t('packages.hotel_details')}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hotelName && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.hotel_name')}</p>
                        <p className="text-base font-bold text-slate-900">{hotelName}</p>
                      </div>
                    )}
                    {hotelCategory && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.hotel_category')}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: parseInt(hotelCategory) || 0 }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                          {!parseInt(hotelCategory) && <p className="text-base font-bold text-slate-900 capitalize">{hotelCategory}</p>}
                        </div>
                      </div>
                    )}
                    {hotelNights && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.nights')}</p>
                        <p className="text-base font-bold text-slate-900">{hotelNights} {isAr ? 'ليالي' : 'Nights'}</p>
                      </div>
                    )}
                    {durationDays && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{isAr ? 'المدة' : 'Duration'}</p>
                        <p className="text-base font-bold text-slate-900">{durationDays} {isAr ? 'أيام' : 'Days'}</p>
                      </div>
                    )}
                    {roomBasisLabel && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{isAr ? 'نوع الإقامة' : 'Room Basis'}</p>
                        <p className="text-base font-bold text-slate-900">{roomBasisLabel}</p>
                      </div>
                    )}
                    {hotelCity && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{isAr ? 'المدينة' : 'City'}</p>
                        <p className="text-base font-bold text-slate-900">{hotelCity}</p>
                      </div>
                    )}
                  </div>
                  {includedServices.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{isAr ? 'الخدمات المشمولة' : 'Included Services'}</p>
                      <div className="flex flex-wrap gap-2">
                        {includedServices.map((service) => (
                          <span key={service} className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Car Card */}
              {pkg.includes_car && (
                <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                      <CarFront className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-black text-slate-950 md:text-xl">{t('packages.car_details')}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {carBrand && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.car_brand')}</p>
                        <p className="text-base font-bold text-slate-900">{carBrand}</p>
                      </div>
                    )}
                    {carModel && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.car_model')}</p>
                        <p className="text-base font-bold text-slate-900">{carModel}</p>
                      </div>
                    )}
                    {carCategory && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{isAr ? 'الفئة' : 'Category'}</p>
                        <p className="text-base font-bold text-slate-900 capitalize">{carCategory}</p>
                      </div>
                    )}
                    {carRentalDays && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-1">{t('packages.rental_days')}</p>
                        <p className="text-base font-bold text-slate-900">{carRentalDays} {isAr ? 'أيام' : 'Days'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Provider info */}
            {providerName && (
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{isAr ? 'مقدم الخدمة' : 'Provider'}</p>
                    <p className="text-base font-black text-slate-900">{providerName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Booking section (Desktop) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="sticky top-32 overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)]">
              <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-8 text-white">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{t('packages.total_price')} / {t('packages.per_person')}</p>
                {hasDiscount && (
                  <p className="text-lg font-bold text-slate-400 line-through mb-1">{originalFormatted}</p>
                )}
                <p className={cn('text-4xl font-black tracking-tight', hasDiscount && 'text-orange-400')}>
                  {fmt(pkg.total_price)}
                </p>
                {pkg.is_last_minute && (
                  <div className="mt-3">
                    <LastMinuteBadge discount={pkg.discount_percentage} size="md" />
                  </div>
                )}
              </div>

              <div className="p-8">
                <BookingForm />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 pb-safe z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('packages.per_person')}</span>
            {hasDiscount && (
              <span className="text-sm font-bold text-slate-500 line-through">{originalFormatted}</span>
            )}
            <span className={cn('text-2xl font-black', hasDiscount ? 'text-orange-400' : 'text-white')}>
              {fmt(pkg.total_price)}
            </span>
          </div>

          {isBookable ? (
            <button
              onClick={handleBooking}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-bold text-base active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {t('packages.book_now')}
            </button>
          ) : (
            <button disabled className="flex-1 py-3.5 rounded-xl bg-destructive/20 text-destructive font-bold text-base border border-destructive/20">
              {isSoldOut ? (isAr ? 'نفذت الأماكن' : 'Sold Out') : (isAr ? 'غير متاح' : 'Not Available')}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Booking Form (shown below content on mobile) */}
      <div className="lg:hidden max-w-6xl mx-auto px-4 sm:px-6 pb-32">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
          <h3 className="text-lg font-black text-slate-900 mb-6">{t('packages.book_now')}</h3>
          <BookingForm />
        </div>
      </div>
    </>
  )
}
