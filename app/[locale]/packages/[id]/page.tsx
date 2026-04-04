'use client'

import { useEffect, useState, use } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plane,
  BedDouble,
  CarFront,
  MapPin,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Building2,
  CreditCard,
  ArrowRight,
} from 'lucide-react'
import { cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { LastMinuteBadge } from '@/components/ui/last-minute-badge'
import { RoomDetailPageSkeleton } from '@/components/shared/loading-skeleton'
import { buttonVariants } from '@/components/ui/button'
import { CABIN_CLASSES, ROOM_CATEGORIES, CAR_CATEGORIES } from '@/lib/constants'
import type { Package } from '@/types/database'

export default function PackageDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const { id } = use(params)

  const [pkg, setPkg] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImage, setCurrentImage] = useState(0)

  const Back = isAr ? ChevronRight : ChevronLeft

  useEffect(() => {
    async function fetchPackage() {
      try {
        const res = await fetch(`/api/packages/${id}`)
        const data = await res.json()
        if (data.package) {
          setPkg(data.package)
        }
      } catch {
        // Error handled
      } finally {
        setLoading(false)
      }
    }
    fetchPackage()
  }, [id])

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

  const hasDiscount = pkg.original_price != null && pkg.original_price > pkg.total_price
  const originalFormatted = hasDiscount ? fmt(pkg.original_price!) : null

  const availableSpots = pkg.max_bookings - pkg.current_bookings
  const isBookable = pkg.status === 'active' && availableSpots > 0
  const isNotAvailable = pkg.status === 'removed'
  const isDeactivated = pkg.status === 'deactivated'

  const providerName = pkg.provider
    ? isAr
      ? pkg.provider.company_name_ar
      : (pkg.provider.company_name_en || pkg.provider.company_name_ar)
    : null

  const images = pkg.images || []
  const prevImage = () => setCurrentImage((c) => (c === 0 ? images.length - 1 : c - 1))
  const nextImage = () => setCurrentImage((c) => (c === images.length - 1 ? 0 : c + 1))

  const flightOrigin = isAr ? pkg.flight_origin_ar : (pkg.flight_origin_en || pkg.flight_origin_ar)
  const flightDestination = isAr ? pkg.flight_destination_ar : (pkg.flight_destination_en || pkg.flight_destination_ar)
  const hotelName = isAr ? pkg.hotel_name_ar : (pkg.hotel_name_en || pkg.hotel_name_ar)
  const hotelCity = isAr ? pkg.hotel_city_ar : (pkg.hotel_city_en || pkg.hotel_city_ar)
  const carBrand = isAr ? pkg.car_brand_ar : (pkg.car_brand_en || pkg.car_brand_ar)
  const carModel = isAr ? pkg.car_model_ar : (pkg.car_model_en || pkg.car_model_ar)

  const cabinLabel = pkg.flight_cabin_class ? CABIN_CLASSES[pkg.flight_cabin_class as keyof typeof CABIN_CLASSES] : null
  const cabinText = cabinLabel ? (isAr ? cabinLabel.ar : cabinLabel.en) : pkg.flight_cabin_class
  const hotelCategoryLabel = pkg.hotel_category ? ROOM_CATEGORIES[pkg.hotel_category as keyof typeof ROOM_CATEGORIES] : null
  const hotelCategoryText = hotelCategoryLabel ? (isAr ? hotelCategoryLabel.ar : hotelCategoryLabel.en) : pkg.hotel_category
  const carCategoryLabel = pkg.car_category ? CAR_CATEGORIES[pkg.car_category as keyof typeof CAR_CATEGORIES] : null
  const carCategoryText = carCategoryLabel ? (isAr ? carCategoryLabel.ar : carCategoryLabel.en) : pkg.car_category

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isAr ? 'ar-SA' : 'en-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

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
              {t('packages.no_packages')}
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
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <Sparkles className="h-16 w-16 text-slate-300" />
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
                {/* Status badge */}
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
                    {t(`packages.status_${pkg.status}`)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 backdrop-blur">
                    <Users className="h-3.5 w-3.5 text-accent" />
                    {availableSpots} {isAr ? 'متاح' : 'left'}
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
                      {formatDate(pkg.start_date)}
                      {pkg.end_date && ` — ${formatDate(pkg.end_date)}`}
                    </span>
                  </div>
                )}

                {/* Description */}
                {description && (
                  <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-6">
                    {description}
                  </p>
                )}

                {/* What's Included */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">{t('packages.includes')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {pkg.includes_flight && (
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary">
                        <Plane className="h-4 w-4" />
                        {t('packages.flight')}
                      </span>
                    )}
                    {pkg.includes_hotel && (
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary">
                        <BedDouble className="h-4 w-4" />
                        {t('packages.hotel')}
                      </span>
                    )}
                    {pkg.includes_car && (
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary">
                        <CarFront className="h-4 w-4" />
                        {t('packages.car')}
                      </span>
                    )}
                  </div>
                </div>

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

            {/* Flight Details */}
            {pkg.includes_flight && (flightOrigin || pkg.flight_airline || pkg.flight_number) && (
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Plane className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-black text-slate-950 md:text-xl">{t('packages.flight_details')}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pkg.flight_airline && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.airline')}</p>
                      <p className="text-base font-black text-slate-950">{pkg.flight_airline}</p>
                    </div>
                  )}
                  {pkg.flight_number && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.flight_number')}</p>
                      <p className="text-base font-black text-slate-950">{pkg.flight_number}</p>
                    </div>
                  )}
                  {flightOrigin && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.origin')}</p>
                      <p className="text-base font-black text-slate-950">
                        {flightOrigin} {pkg.flight_origin_code && <span className="text-slate-400">({pkg.flight_origin_code})</span>}
                      </p>
                    </div>
                  )}
                  {flightDestination && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.destination')}</p>
                      <p className="text-base font-black text-slate-950">
                        {flightDestination} {pkg.flight_destination_code && <span className="text-slate-400">({pkg.flight_destination_code})</span>}
                      </p>
                    </div>
                  )}
                  {pkg.flight_departure_at && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.departure_date')}</p>
                      <p className="text-base font-black text-slate-950">{formatDate(pkg.flight_departure_at)}</p>
                    </div>
                  )}
                  {pkg.flight_return_at && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.return_date')}</p>
                      <p className="text-base font-black text-slate-950">{formatDate(pkg.flight_return_at)}</p>
                    </div>
                  )}
                  {cabinText && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.cabin_class')}</p>
                      <p className="text-base font-black text-slate-950">{cabinText}</p>
                    </div>
                  )}
                  {pkg.flight_seats_included && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.seats_included')}</p>
                      <p className="text-base font-black text-slate-950">{pkg.flight_seats_included}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hotel Details */}
            {pkg.includes_hotel && (hotelName || pkg.hotel_nights) && (
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BedDouble className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-black text-slate-950 md:text-xl">{t('packages.hotel_details')}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hotelName && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.hotel_name')}</p>
                      <p className="text-base font-black text-slate-950">{hotelName}</p>
                    </div>
                  )}
                  {hotelCategoryText && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.hotel_category')}</p>
                      <p className="text-base font-black text-slate-950">{hotelCategoryText}</p>
                    </div>
                  )}
                  {pkg.hotel_nights && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.nights')}</p>
                      <p className="text-2xl font-black text-slate-950">{pkg.hotel_nights}</p>
                    </div>
                  )}
                  {hotelCity && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{isAr ? 'المدينة' : 'City'}</p>
                      <p className="text-base font-black text-slate-950">{hotelCity}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Car Details */}
            {pkg.includes_car && (carBrand || pkg.car_rental_days) && (
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <CarFront className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-black text-slate-950 md:text-xl">{t('packages.car_details')}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {carBrand && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.car_brand')}</p>
                      <p className="text-base font-black text-slate-950">{carBrand}</p>
                    </div>
                  )}
                  {carModel && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.car_model')}</p>
                      <p className="text-base font-black text-slate-950">{carModel}</p>
                    </div>
                  )}
                  {carCategoryText && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{isAr ? 'الفئة' : 'Category'}</p>
                      <p className="text-base font-black text-slate-950">{carCategoryText}</p>
                    </div>
                  )}
                  {pkg.car_rental_days && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('packages.rental_days')}</p>
                      <p className="text-2xl font-black text-slate-950">{pkg.car_rental_days}</p>
                    </div>
                  )}
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

              <div className="space-y-6 p-8">
                {/* Available spots */}
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{t('packages.available_spots')}</span>
                    <span className="text-2xl font-black text-primary">{availableSpots}</span>
                  </div>
                </div>

                {/* Date range */}
                {pkg.start_date && (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{formatDate(pkg.start_date)}</span>
                    </div>
                    {pkg.end_date && (
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mt-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{formatDate(pkg.end_date)}</span>
                      </div>
                    )}
                  </div>
                )}

                {isBookable && (
                  <Link
                    href={`/${locale}/packages/${pkg.id}/book`}
                    className={cn(
                      buttonVariants({ size: 'lg' }),
                      'h-14 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/15'
                    )}
                  >
                    <CreditCard className="h-5 w-5" />
                    {t('packages.book_now')}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                )}

                {isDeactivated && (
                  <button
                    disabled
                    className="w-full rounded-2xl border border-warning/20 bg-warning/10 py-4 text-base font-bold text-warning"
                  >
                    {t('packages.no_packages')}
                  </button>
                )}

                {isNotAvailable && (
                  <button
                    disabled
                    className="w-full rounded-2xl border border-destructive/20 bg-destructive/10 py-4 text-base font-bold text-destructive"
                  >
                    {t('packages.no_packages')}
                  </button>
                )}

                {!isBookable && pkg.status === 'active' && availableSpots <= 0 && (
                  <button
                    disabled
                    className="w-full rounded-2xl border border-destructive/20 bg-destructive/10 py-4 text-base font-bold text-destructive"
                  >
                    {isAr ? 'الباقة محجوزة بالكامل' : 'Fully Booked'}
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
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('packages.per_person')}</span>
            {hasDiscount && (
              <span className="text-sm font-bold text-slate-500 line-through">{originalFormatted}</span>
            )}
            <span className={cn('text-2xl font-black', hasDiscount ? 'text-orange-400' : 'text-white')}>
              {fmt(pkg.total_price)}
            </span>
          </div>

          {isBookable ? (
            <Link
              href={`/${locale}/packages/${pkg.id}/book`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-bold text-base active:scale-[0.98] transition-all"
            >
              <CreditCard className="h-5 w-5" />
              {t('packages.book_now')}
            </Link>
          ) : (
            <button disabled className="flex-1 py-3.5 rounded-xl bg-destructive/20 text-destructive font-bold text-base border border-destructive/20">
              {availableSpots <= 0 ? (isAr ? 'محجوزة بالكامل' : 'Fully Booked') : t('packages.no_packages')}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
