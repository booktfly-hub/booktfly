'use client'

import { useEffect, useState, use } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plane,
  Calendar,
  ArrowRight,
  MapPin,
  Clock,
  Users,
  CreditCard,
  Minus,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { capitalizeFirst, cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { TRIP_TYPES, CABIN_CLASSES, MAX_SEATS_PER_BOOKING, BOOKING_TYPES } from '@/lib/constants'
import { TripStatusBadge } from '@/components/trips/trip-status-badge'
import { TripDetailPageSkeleton } from '@/components/shared/loading-skeleton'
import { getCountryCode } from '@/lib/countries'
import { buttonVariants } from '@/components/ui/button'
import { PriceBreakdown } from '@/components/bookings/price-breakdown'
import { ReviewList } from '@/components/reviews/review-list'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { PriceAlertButton } from '@/components/trips/price-alert-button'
import { TripDirectionIndicator } from '@/components/trips/trip-direction-indicator'
import { NameChangeBadge } from '@/components/trips/trip-pricing-policy-card'
import { FlightDetailSheet } from '@/components/trips/flight-detail-sheet'
import { FareTierSelector } from '@/components/trips/fare-tier-selector'
import type { Trip, FareTier } from '@/types'

export default function TripDetailClient({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  // React 19 expects params to be awaited
  const { id: tripId } = use(params)

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [seatsCount, setSeatsCount] = useState(1)
  const [bookingType, setBookingType] = useState<'round_trip' | 'one_way'>('round_trip')
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [previewFareTier, setPreviewFareTier] = useState<string | null>(null)

  const Back = isAr ? ChevronRight : ChevronLeft

  useEffect(() => {
    async function fetchTrip() {
      try {
        const res = await fetch(`/api/trips/${tripId}`)
        const data = await res.json()
        if (data.trip) {
          setTrip(data.trip)
          setBookingType(data.trip.trip_type === 'one_way' ? 'one_way' : 'round_trip')
        }
      } catch {
        // Error handled
      } finally {
        setLoading(false)
      }
    }
    fetchTrip()
  }, [tripId])

  if (loading) return <TripDetailPageSkeleton />

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 mb-6">
            <AlertTriangle className="h-10 w-10 text-warning" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">{t('errors.not_found')}</h2>
        <button
          onClick={() => router.push(`/${locale}/trips`)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
        >
          <Back className="h-4 w-4" />
          {t('common.back')}
        </button>
      </div>
    )
  }

  const originCity = isAr ? trip.origin_city_ar : capitalizeFirst(trip.origin_city_en || trip.origin_city_ar)
  const destCity = isAr ? trip.destination_city_ar : capitalizeFirst(trip.destination_city_en || trip.destination_city_ar)
  const remaining = trip.total_seats - trip.booked_seats
  const maxBookable = Math.min(remaining, MAX_SEATS_PER_BOOKING)
  const oneWayPrice = trip.price_per_seat_one_way ?? trip.price_per_seat
  const selectedPrice = bookingType === 'one_way'
    ? oneWayPrice
    : trip.price_per_seat
  const totalPrice = selectedPrice * seatsCount
  const fmt = (amount: number) => isAr ? formatPrice(amount, trip.currency) : formatPriceEN(amount, trip.currency)

  const isBookable = trip.status === 'active' && remaining > 0
  const isNotAvailable = trip.status === 'expired' || trip.status === 'removed'
  const isSoldOut = trip.status === 'sold_out' || remaining <= 0

  const departureDate = new Date(trip.departure_at).toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  )
  const departureTime = new Date(trip.departure_at).toLocaleTimeString(
    isAr ? 'ar-SA' : 'en-US',
    { hour: '2-digit', minute: '2-digit' }
  )

  const returnDate = trip.return_at
    ? new Date(trip.return_at).toLocaleDateString(
        isAr ? 'ar-SA' : 'en-US',
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      )
    : null
  const tripTypeLabel = isAr ? TRIP_TYPES[trip.trip_type].ar : TRIP_TYPES[trip.trip_type].en
  const bookingTypeLabel = isAr ? BOOKING_TYPES[bookingType].ar : BOOKING_TYPES[bookingType].en
  const cabinLabel = isAr ? CABIN_CLASSES[trip.cabin_class].ar : CABIN_CLASSES[trip.cabin_class].en

  const tripDesc = isAr
    ? trip.description_ar
    : (trip.description_en || trip.description_ar)
  const tripBenefits = [
    trip.checked_baggage_kg ? (isAr ? `أمتعة مشحونة ${trip.checked_baggage_kg} كجم` : `Checked baggage ${trip.checked_baggage_kg} kg`) : null,
    trip.cabin_baggage_kg ? (isAr ? `أمتعة يدوية ${trip.cabin_baggage_kg} كجم` : `Cabin baggage ${trip.cabin_baggage_kg} kg`) : null,
    trip.meal_included ? (isAr ? 'تشمل وجبة' : 'Meal included') : null,
    trip.seat_selection_included ? (isAr ? 'يشمل اختيار المقعد' : 'Seat selection included') : null,
  ].filter(Boolean) as string[]

  const originCountry = getCountryCode(trip.origin_code, trip.origin_city_en || trip.origin_city_ar)
  const destCountry = getCountryCode(trip.destination_code, trip.destination_city_en || trip.destination_city_ar)

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 md:pt-32 lg:pt-36 lg:pb-12 animate-fade-in-up">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('common.trips'), href: `/${locale}/trips` },
          { label: `${originCity} → ${destCity}` },
        ]}
        className="mb-4"
      />

      {/* Back button + Price Alert */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <button
          onClick={() => router.push(`/${locale}/trips`)}
          className="group inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <div className="p-1.5 md:p-2 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
              <Back className="h-3 w-3 md:h-4 md:w-4 rtl:rotate-180" />
          </div>
          {t('common.back')}
        </button>
        <PriceAlertButton
          originCode={trip.origin_code || ''}
          destinationCode={trip.destination_code || ''}
          originNameAr={trip.origin_city_ar}
          originNameEn={trip.origin_city_en || undefined}
          destinationNameAr={trip.destination_city_ar}
          destinationNameEn={trip.destination_city_en || undefined}
          currentPrice={trip.price_per_seat}
        />
      </div>

      {/* Not available banner */}
      {isNotAvailable && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 md:p-5 mb-6 md:mb-8 flex items-center gap-3 md:gap-4 shadow-sm animate-fade-in-up">
          <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-destructive shrink-0" />
          <p className="text-sm md:text-base font-bold text-destructive">
            {t('trips.not_available')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* Main content */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 md:space-y-8">
          <div className="overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
            <div className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fbfd_100%)] p-6 md:p-10">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />

              <div className="relative flex flex-col gap-8">
                <div className="space-y-6">
                  <div className="min-w-0">
                    <div className="mb-4 flex flex-wrap items-center gap-2.5">
                      <TripStatusBadge status={trip.status} className="hover:scale-100" />
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 backdrop-blur">
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        {cabinLabel}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        <TripDirectionIndicator
                          tripType={trip.trip_type}
                          isAr={isAr}
                          className="h-3.5 w-3.5"
                        />
                        {tripTypeLabel}
                      </span>
                    </div>

                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/15">
                        <Plane className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{t('trips.airline')}</p>
                        <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-4xl">{trip.airline}</h1>
                      </div>
                    </div>

                    {trip.flight_number && (
                      <p className="mb-6 inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-600">
                        {t('trips.flight_number')}: <span className="ms-2 font-black text-slate-900">{trip.flight_number}</span>
                      </p>
                    )}

                    <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm md:p-6">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
                        <div className="min-w-0">
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">{t('common.from')}</p>
                          <p className="text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl [overflow-wrap:anywhere]">{originCity}</p>
                          <div className="mt-3 flex items-center gap-2">
                            {originCountry && (
                              <Image src={`https://flagcdn.com/w40/${originCountry}.png`} alt={originCountry} width={40} height={27} className="h-4 w-6 rounded-sm object-cover shadow-sm" />
                            )}
                            {trip.origin_code && (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black uppercase tracking-[0.22em] text-slate-500">{trip.origin_code?.toUpperCase()}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-px w-10 bg-slate-200 md:w-12" />
                            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-primary shadow-sm">
                              <TripDirectionIndicator
                                tripType={trip.trip_type}
                                isAr={isAr}
                                orientation="vertical"
                                className="h-4 w-4 md:hidden"
                              />
                              <TripDirectionIndicator
                                tripType={trip.trip_type}
                                isAr={isAr}
                                className="hidden h-4 w-4 md:block"
                              />
                            </div>
                            <div className="h-px w-10 bg-slate-200 md:w-12" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-400">{tripTypeLabel}</span>
                        </div>

                        <div className="min-w-0 text-start md:text-end">
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">{t('common.to')}</p>
                          <p className="text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl [overflow-wrap:anywhere]">{destCity}</p>
                          <div className="mt-3 flex items-center gap-2 md:justify-end">
                            {trip.destination_code && (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black uppercase tracking-[0.22em] text-slate-500">{trip.destination_code?.toUpperCase()}</span>
                            )}
                            {destCountry && (
                              <Image src={`https://flagcdn.com/w40/${destCountry}.png`} alt={destCountry} width={40} height={27} className="h-4 w-6 rounded-sm object-cover shadow-sm" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm min-w-0">
                      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {t('trips.departure')}
                      </p>
                      <p className="text-sm font-bold leading-tight text-slate-900">{departureDate}</p>
                      <p className="mt-1 text-sm font-semibold text-primary">{departureTime}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm min-w-0">
                      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {returnDate ? t('trips.return_date') : t('trips.trip_type')}
                      </p>
                      <p className="text-sm font-bold leading-tight text-slate-900">{returnDate || tripTypeLabel}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm min-w-0">
                      <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                        <Users className="h-3.5 w-3.5" />
                        {t('trips.cabin_class')}
                      </p>
                      <p className="text-sm font-bold leading-tight text-slate-900">{cabinLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/15">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{t('trips.price_per_seat')}</p>
                    <p className="text-3xl font-black tracking-tight md:text-4xl">{fmt(selectedPrice)}</p>
                    <p className="mt-2 text-sm font-semibold text-accent">
                      {isAr ? 'نوع الحجز المحدد: ' : 'Selected fare: '}{bookingTypeLabel}
                    </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {tripDesc && (
            <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950 md:text-xl">{t('common.description')}</h3>
                  <p className="text-sm font-medium text-slate-500">{isAr ? 'معلومات إضافية عن هذه الرحلة' : 'Additional trip details'}</p>
                </div>
              </div>
              <p className="text-sm font-medium leading-7 text-slate-600 md:text-base">{tripDesc}</p>
            </div>
          )}

          {tripBenefits.length > 0 && (
            <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950 md:text-xl">{isAr ? 'مزايا الرحلة' : 'Trip Benefits'}</h3>
                  <p className="text-sm font-medium text-slate-500">{isAr ? 'تفاصيل إضافية عن الخدمة' : 'Extra service details'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {tripBenefits.map((benefit) => (
                  <span key={benefit} className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fare tier preview (P0-6) — read-only preview; selection happens on booking page */}
          {trip.fare_tiers && trip.fare_tiers.length > 0 && (
            <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <FareTierSelector
                tiers={trip.fare_tiers as FareTier[]}
                value={previewFareTier}
                onChange={setPreviewFareTier}
                currency={trip.currency}
              />
              <p className="mt-3 text-xs font-medium text-slate-500">
                {isAr
                  ? 'سيتم تأكيد فئة التذكرة عند الحجز.'
                  : 'Your fare will be confirmed on the booking page.'}
              </p>
            </div>
          )}

        </div>

        {/* Sidebar: Booking section (Desktop) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
          <div className="sticky top-32 overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)]">
            <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-8 text-white">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{t('trips.price_per_seat')}</p>
              <p className="text-4xl font-black tracking-tight">{fmt(selectedPrice)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <NameChangeBadge
                  allowed={trip.name_change_allowed}
                  fee={Number(trip.name_change_fee)}
                  refundable={trip.name_change_is_refundable}
                  currency={trip.currency}
                />
                {trip.special_discount_percentage > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-100">
                    <Sparkles className="h-3 w-3" />
                    {(isAr ? trip.special_discount_label_ar : trip.special_discount_label_en) || t('discount.special_discount')} −{trip.special_discount_percentage}%
                  </div>
                )}
                {(trip.child_discount_percentage > 0 || trip.infant_discount_percentage > 0) && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 border border-sky-100">
                    {trip.child_discount_percentage > 0 && <span>{t('discount.child')} −{trip.child_discount_percentage}%</span>}
                    {trip.child_discount_percentage > 0 && trip.infant_discount_percentage > 0 && <span>·</span>}
                    {trip.infant_discount_percentage > 0 && <span>{t('discount.infant')} −{trip.infant_discount_percentage}%</span>}
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{isAr ? 'نوع الحجز' : 'Booking Type'}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingType('round_trip')}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-sm font-bold transition-colors',
                      bookingType === 'round_trip'
                        ? 'border-white/30 bg-white text-slate-950'
                        : 'border-white/10 bg-transparent text-white hover:bg-white/10'
                    )}
                  >
                    <span className="block">{isAr ? BOOKING_TYPES.round_trip.ar : BOOKING_TYPES.round_trip.en}</span>
                    <span className="mt-1 block text-xs font-semibold opacity-70">{fmt(trip.price_per_seat)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingType('one_way')}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-sm font-bold transition-colors',
                      bookingType === 'one_way'
                        ? 'border-white/30 bg-white text-slate-950'
                        : 'border-white/10 bg-transparent text-white hover:bg-white/10'
                    )}
                  >
                    <span className="block">{isAr ? BOOKING_TYPES.one_way.ar : BOOKING_TYPES.one_way.en}</span>
                    <span className="mt-1 block text-xs font-semibold opacity-70">{fmt(oneWayPrice)}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-8">
              {isBookable && (
                <>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <label className="mb-4 block text-sm font-bold text-slate-900">
                      {t('booking.seats_count')}
                    </label>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setSeatsCount(Math.max(1, seatsCount - 1))}
                        disabled={seatsCount <= 1}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="text-center">
                        <p className="text-3xl font-black tracking-tight text-slate-950">{seatsCount}</p>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('common.seats')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSeatsCount(Math.min(maxBookable, seatsCount + 1))}
                        disabled={seatsCount >= maxBookable}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-500">
                      <span>{fmt(selectedPrice)} × {seatsCount}</span>
                      <span className="font-semibold text-slate-900">{fmt(totalPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-base font-bold text-slate-900">{t('common.total')}</span>
                      <span className="text-2xl font-black tracking-tight text-primary">{fmt(totalPrice)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/${locale}/trips/${trip.id}/book?seats=${seatsCount}&bookingType=${bookingType}`}
                    className={cn(
                      buttonVariants({ size: 'lg' }),
                      'h-14 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/15'
                    )}
                  >
                    <CreditCard className="h-5 w-5" />
                    {t('trips.book_now')}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </>
              )}

              {isSoldOut && (
                <button
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 py-4 text-base font-bold text-slate-500"
                >
                  {t('trips.sold_out')}
                </button>
              )}

              {isNotAvailable && (
                <button
                  disabled
                  className="w-full rounded-2xl border border-destructive/20 bg-destructive/10 py-4 text-base font-bold text-destructive"
                >
                  {t('trips.not_available')}
                </button>
              )}

              <p className="text-center text-xs font-medium leading-relaxed text-slate-500">
                {t('booking.terms_agreement')}
              </p>

              {/* Price Breakdown */}
              <PriceBreakdown
                pricePerSeat={selectedPrice}
                seatsCount={seatsCount}
                currency={trip.currency}
                className="mt-4"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {trip.provider_id && (
        <div className="mt-12 max-w-4xl">
          <h3 className="text-lg font-bold mb-4">
            {isAr ? 'التقييمات' : 'Reviews'}
          </h3>
          <ReviewList providerId={trip.provider_id} tripId={trip.id} />
        </div>
      )}
    </div>

    {/* Mobile Sticky Bottom Bar (Moved outside animating wrapper) */}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
        <div className="grid grid-cols-2 gap-1 p-2 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setBookingType('round_trip')}
            className={cn(
              'rounded-xl px-3 py-2 text-xs font-bold transition-colors text-center',
              bookingType === 'round_trip'
                ? 'bg-white text-slate-950'
                : 'bg-white/10 text-slate-300 hover:bg-white/15'
            )}
          >
            <span className="block">{isAr ? BOOKING_TYPES.round_trip.ar : BOOKING_TYPES.round_trip.en}</span>
            <span className="block opacity-70 font-semibold">{fmt(trip.price_per_seat)}</span>
          </button>
          <button
            type="button"
            onClick={() => setBookingType('one_way')}
            className={cn(
              'rounded-xl px-3 py-2 text-xs font-bold transition-colors text-center',
              bookingType === 'one_way'
                ? 'bg-white text-slate-950'
                : 'bg-white/10 text-slate-300 hover:bg-white/15'
            )}
          >
            <span className="block">{isAr ? BOOKING_TYPES.one_way.ar : BOOKING_TYPES.one_way.en}</span>
            <span className="block opacity-70 font-semibold">{fmt(oneWayPrice)}</span>
          </button>
        </div>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 p-4 pb-safe">
            <button
              type="button"
              onClick={() => setShowDetailSheet(true)}
              className="flex flex-col items-start text-start"
            >
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest underline decoration-dotted">
                  {isAr ? 'تفاصيل الرحلة' : 'Flight details'}
                </span>
                <span className="text-2xl font-black text-white">{fmt(selectedPrice)}</span>
            </button>

            {isBookable ? (
                <Link
                href={`/${locale}/trips/${trip.id}/book?seats=${seatsCount}&bookingType=${bookingType}`}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-bold text-base active:scale-[0.98] transition-all"
                >
                <CreditCard className="h-5 w-5" />
                {t('trips.book_now')}
                </Link>
            ) : isSoldOut ? (
                <button disabled className="flex-1 py-3.5 rounded-xl bg-white/5 text-slate-500 font-bold text-base border border-white/5">
                {t('trips.sold_out')}
                </button>
            ) : (
                <button disabled className="flex-1 py-3.5 rounded-xl bg-destructive/20 text-destructive font-bold text-base border border-destructive/20">
                {t('trips.not_available')}
                </button>
            )}
        </div>
    </div>

    {/* Mobile flight detail bottom sheet (P1-16) */}
    <FlightDetailSheet
      trip={trip}
      open={showDetailSheet}
      onClose={() => setShowDetailSheet(false)}
      primaryLabel={t('trips.book_now')}
      onPrimary={() => router.push(`/${locale}/trips/${trip.id}/book?seats=${seatsCount}&bookingType=${bookingType}`)}
    />
    </>
  )
}
