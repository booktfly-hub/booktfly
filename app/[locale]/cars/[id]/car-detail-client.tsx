'use client'

import { useEffect, useState, use } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Car as CarIcon,
  MapPin,
  Users,
  CreditCard,
  Minus,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Building2,
  Gauge,
  Fuel,
  Check,
  Calendar,
  Plane,
  Clock,
} from 'lucide-react'
import { cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { CAR_CATEGORIES, TRANSMISSION_TYPES, FUEL_TYPES, CAR_FEATURES, MAX_DAYS_PER_CAR_BOOKING } from '@/lib/constants'
import { LastMinuteBadge } from '@/components/ui/last-minute-badge'
import { RoomDetailPageSkeleton } from '@/components/shared/loading-skeleton'
import { buttonVariants } from '@/components/ui/button'
import type { Car } from '@/types'

export default function CarDetailClient({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const { id: carId } = use(params)

  const [car, setCar] = useState<Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(1)
  const [currentImage, setCurrentImage] = useState(0)

  const Back = isAr ? ChevronRight : ChevronLeft

  useEffect(() => {
    async function fetchCar() {
      try {
        const res = await fetch(`/api/cars/${carId}`)
        const data = await res.json()
        if (data.car) {
          setCar(data.car)
        }
      } catch {
        // Error handled
      } finally {
        setLoading(false)
      }
    }
    fetchCar()
  }, [carId])

  if (loading) return <RoomDetailPageSkeleton />

  if (!car) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 mb-6">
          <AlertTriangle className="h-10 w-10 text-warning" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">{t('errors.not_found')}</h2>
        <button
          onClick={() => router.push(`/${locale}/cars`)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
        >
          <Back className="h-4 w-4" />
          {t('common.back')}
        </button>
      </div>
    )
  }

  const brand = isAr ? car.brand_ar : (car.brand_en || car.brand_ar)
  const model = isAr ? car.model_ar : (car.model_en || car.model_ar)
  const city = isAr ? car.city_ar : (car.city_en || car.city_ar)
  const pickupLocation = isAr ? car.pickup_location_ar : (car.pickup_location_en || car.pickup_location_ar)
  const pickupBranch = isAr ? car.pickup_branch_name_ar : (car.pickup_branch_name_en || car.pickup_branch_name_ar)
  const returnBranch = isAr ? car.return_branch_name_ar : (car.return_branch_name_en || car.return_branch_name_ar)
  const categoryLabel = CAR_CATEGORIES[car.category as keyof typeof CAR_CATEGORIES]
  const categoryText = categoryLabel ? (isAr ? categoryLabel.ar : categoryLabel.en) : car.category
  const transmissionLabel = TRANSMISSION_TYPES[car.transmission as keyof typeof TRANSMISSION_TYPES]
  const transmissionText = transmissionLabel ? (isAr ? transmissionLabel.ar : transmissionLabel.en) : car.transmission
  const fuelLabel = FUEL_TYPES[car.fuel_type as keyof typeof FUEL_TYPES]
  const fuelText = fuelLabel ? (isAr ? fuelLabel.ar : fuelLabel.en) : car.fuel_type
  const fmt = (amount: number) => isAr ? formatPrice(amount, car.currency) : formatPriceEN(amount, car.currency)
  const totalPrice = car.price_per_day * days

  const hasDiscount = car.discount_percentage > 0 && car.original_price
  const originalFormatted = hasDiscount
    ? (isAr ? formatPrice(car.original_price!, car.currency) : formatPriceEN(car.original_price!, car.currency))
    : null

  const isBookable = car.status === 'active'
  const isNotAvailable = car.status === 'removed'
  const isDeactivated = car.status === 'deactivated'

  const providerName = car.provider
    ? isAr
      ? car.provider.company_name_ar
      : (car.provider.company_name_en || car.provider.company_name_ar)
    : null

  const images = car.images || []
  const prevImage = () => setCurrentImage((c) => (c === 0 ? images.length - 1 : c - 1))
  const nextImage = () => setCurrentImage((c) => (c === images.length - 1 ? 0 : c + 1))

  // Status badge styles (inline, same pattern as RoomStatusBadge)
  const statusStyles: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5',
    deactivated: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/5',
    removed: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/5',
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 md:pt-32 lg:pt-36 lg:pb-12 animate-fade-in-up">
        {/* Back button */}
        <button
          onClick={() => router.push(`/${locale}/cars`)}
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
              {t('cars.not_available')}
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
                  <img
                    src={images[currentImage]}
                    alt={`${brand} ${model} - ${currentImage + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <CarIcon className="h-16 w-16 text-slate-300" />
                  </div>
                )}

                {/* Last minute badge */}
                {car.is_last_minute && (
                  <div className="absolute top-3 start-3">
                    <LastMinuteBadge discount={car.discount_percentage} size="md" />
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
                {/* Status & Category badges */}
                <div className="mb-4 flex flex-wrap items-center gap-2.5">
                  <span
                    className={cn(
                      'inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all hover:scale-105',
                      statusStyles[car.status] || 'bg-muted text-muted-foreground border-border'
                    )}
                  >
                    <span className="relative flex h-2 w-2 me-2">
                      <span className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        car.status === 'active' ? "bg-emerald-400" : "bg-muted-foreground"
                      )}></span>
                      <span className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        car.status === 'active' ? "bg-emerald-500" : "bg-muted-foreground"
                      )}></span>
                    </span>
                    {t(`status.${car.status}`)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 backdrop-blur">
                    <CarIcon className="h-3.5 w-3.5 text-accent" />
                    {categoryText}
                  </span>
                </div>

                {/* Name */}
                <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-4xl mb-3">
                  {brand} {model}
                </h1>

                {/* City & Year */}
                <div className="flex flex-col gap-1.5 mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-sm md:text-base font-semibold text-slate-600">{city}</span>
                  </div>
                  {pickupLocation && (
                    <div className="flex items-start gap-2 ps-6">
                      <span className="text-xs md:text-sm font-medium text-slate-500">{pickupLocation}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 ps-6">
                    <span className="text-xs md:text-sm font-medium text-slate-400">
                      <Calendar className="inline h-3.5 w-3.5 me-1" />
                      {car.year}
                    </span>
                  </div>
                </div>

                {/* Pickup & Return Info */}
                {(car.pickup_type || car.pickup_hour_from || car.return_type) && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 mb-6 space-y-3">
                    {car.pickup_type && (
                      <div className="flex items-center gap-2.5">
                        {car.pickup_type === 'airport' ? <Plane className="h-4 w-4 text-primary" /> : <Building2 className="h-4 w-4 text-primary" />}
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isAr ? 'الاستلام' : 'Pickup'}</span>
                          <p className="text-sm font-semibold text-slate-700">
                            {car.pickup_type === 'airport' ? (isAr ? 'توصيل للمطار' : 'Airport Delivery') : (isAr ? 'فرع الشركة' : 'Company Branch')}
                            {pickupBranch && <span className="text-slate-500"> — {pickupBranch}</span>}
                          </p>
                        </div>
                      </div>
                    )}
                    {car.return_type && car.return_type !== 'same_location' && (
                      <div className="flex items-center gap-2.5">
                        {car.return_type === 'airport' ? <Plane className="h-4 w-4 text-accent" /> : <Building2 className="h-4 w-4 text-accent" />}
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isAr ? 'الإرجاع' : 'Return'}</span>
                          <p className="text-sm font-semibold text-slate-700">
                            {car.return_type === 'airport' ? (isAr ? 'المطار' : 'Airport') : (isAr ? 'فرع مختلف' : 'Different Branch')}
                            {returnBranch && <span className="text-slate-500"> — {returnBranch}</span>}
                          </p>
                        </div>
                      </div>
                    )}
                    {car.return_type === 'same_location' && (
                      <div className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-semibold text-slate-600">{isAr ? 'الإرجاع في نفس موقع الاستلام' : 'Return at same pickup location'}</span>
                      </div>
                    )}
                    {(car.pickup_hour_from || car.pickup_hour_to) && (
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isAr ? 'ساعات الاستلام' : 'Pickup Hours'}</span>
                          <p className="text-sm font-semibold text-slate-700">{car.pickup_hour_from || '—'} → {car.pickup_hour_to || '—'}</p>
                        </div>
                      </div>
                    )}
                    {(car.return_hour_from || car.return_hour_to) && (
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isAr ? 'ساعات الإرجاع' : 'Return Hours'}</span>
                          <p className="text-sm font-semibold text-slate-700">{car.return_hour_from || '—'} → {car.return_hour_to || '—'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Info cards */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 mb-6">
                  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm min-w-0">
                    <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                      <Users className="h-3.5 w-3.5" />
                      {isAr ? 'المقاعد' : 'Seats'}
                    </p>
                    <p className="text-2xl font-black text-slate-950">{car.seats_count} {t('cars.seats')}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm min-w-0">
                    <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                      <Gauge className="h-3.5 w-3.5" />
                      {isAr ? 'ناقل الحركة' : 'Transmission'}
                    </p>
                    <p className="text-lg font-black text-slate-950">{transmissionText}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm min-w-0">
                    <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                      <Fuel className="h-3.5 w-3.5" />
                      {isAr ? 'نوع الوقود' : 'Fuel Type'}
                    </p>
                    <p className="text-lg font-black text-slate-950">{fuelText}</p>
                  </div>
                </div>

                {/* Price card */}
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/15">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{t('cars.price_per_day')}</p>
                  {hasDiscount && (
                    <p className="text-lg font-bold text-slate-400 line-through mb-1">{originalFormatted}</p>
                  )}
                  <p className={cn('text-3xl font-black tracking-tight md:text-4xl', hasDiscount && 'text-orange-400')}>
                    {fmt(car.price_per_day)}
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <CarIcon className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-black text-slate-950 md:text-xl">{isAr ? 'المميزات' : 'Features'}</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {car.features.map((feature) => {
                    const featureLabel = CAR_FEATURES[feature as keyof typeof CAR_FEATURES]
                    const featureText = featureLabel ? (isAr ? featureLabel.ar : featureLabel.en) : feature
                    return (
                      <div
                        key={feature}
                        className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{featureText}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{t('cars.price_per_day')}</p>
                {hasDiscount && (
                  <p className="text-lg font-bold text-slate-400 line-through mb-1">{originalFormatted}</p>
                )}
                <p className={cn('text-4xl font-black tracking-tight', hasDiscount && 'text-orange-400')}>
                  {fmt(car.price_per_day)}
                </p>
                {car.is_last_minute && (
                  <div className="mt-3">
                    <LastMinuteBadge discount={car.discount_percentage} size="md" />
                  </div>
                )}
              </div>

              <div className="space-y-6 p-8">
                {isBookable && (
                  <>
                    {/* Days counter */}
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <label className="mb-4 block text-sm font-bold text-slate-900">
                        {isAr ? 'عدد الأيام' : 'Number of Days'}
                      </label>
                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setDays(Math.max(1, days - 1))}
                          disabled={days <= 1}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="text-center">
                          <p className="text-3xl font-black tracking-tight text-slate-950">{days}</p>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{isAr ? 'أيام' : 'Days'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDays(Math.min(MAX_DAYS_PER_CAR_BOOKING, days + 1))}
                          disabled={days >= MAX_DAYS_PER_CAR_BOOKING}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between text-sm font-medium text-slate-500">
                        <span>{fmt(car.price_per_day)} x {days} {isAr ? 'أيام' : 'Days'}</span>
                        <span className="font-semibold text-slate-900">{fmt(totalPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-base font-bold text-slate-900">{t('common.total')}</span>
                        <span className="text-2xl font-black tracking-tight text-primary">{fmt(totalPrice)}</span>
                      </div>
                    </div>

                    <Link
                      href={`/${locale}/cars/${car.id}/book?days=${days}`}
                      className={cn(
                        buttonVariants({ size: 'lg' }),
                        'h-14 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/15'
                      )}
                    >
                      <CreditCard className="h-5 w-5" />
                      {t('cars.book_now')}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  </>
                )}

                {isDeactivated && (
                  <button
                    disabled
                    className="w-full rounded-2xl border border-warning/20 bg-warning/10 py-4 text-base font-bold text-warning"
                  >
                    {t('cars.not_available')}
                  </button>
                )}

                {isNotAvailable && (
                  <button
                    disabled
                    className="w-full rounded-2xl border border-destructive/20 bg-destructive/10 py-4 text-base font-bold text-destructive"
                  >
                    {t('cars.not_available')}
                  </button>
                )}

                <p className="text-center text-xs font-medium leading-relaxed text-slate-500">
                  {t('booking.terms_agreement')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 pb-safe z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('cars.price_per_day')}</span>
            {hasDiscount && (
              <span className="text-sm font-bold text-slate-500 line-through">{originalFormatted}</span>
            )}
            <span className={cn('text-2xl font-black', hasDiscount ? 'text-orange-400' : 'text-white')}>
              {fmt(car.price_per_day)}
            </span>
          </div>

          {isBookable ? (
            <Link
              href={`/${locale}/cars/${car.id}/book?days=${days}`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-bold text-base active:scale-[0.98] transition-all"
            >
              <CreditCard className="h-5 w-5" />
              {t('cars.book_now')}
            </Link>
          ) : (
            <button disabled className="flex-1 py-3.5 rounded-xl bg-destructive/20 text-destructive font-bold text-base border border-destructive/20">
              {t('cars.not_available')}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
