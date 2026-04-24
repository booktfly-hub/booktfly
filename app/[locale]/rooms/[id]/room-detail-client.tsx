'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState, use } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const LocationMap = dynamic(() => import('@/components/shared/location-map').then(m => m.LocationMap), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-lg border bg-muted/30 animate-pulse" />,
})
import {
  BedDouble,
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
  CalendarDays,
  Bed,
  Bath,
  Mountain,
  Home,
  ChefHat,
  Coffee,
  CircleCheck,
  TriangleAlert,
  Ban,
} from 'lucide-react'
import { cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { ROOM_CATEGORIES } from '@/lib/constants'
import { RoomStatusBadge } from '@/components/rooms/room-status-badge'
import { RoomImageGallery } from '@/components/rooms/room-image-gallery'
import { RoomAmenities } from '@/components/rooms/room-amenities'
import { RoomAvailabilityBadge } from '@/components/rooms/room-availability-badge'
import { RoomDetailPageSkeleton } from '@/components/shared/loading-skeleton'
import { buttonVariants } from '@/components/ui/button'
import { ReviewList } from '@/components/reviews/review-list'
import type { Room } from '@/types'

export default function RoomDetailClient({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const { id: roomId } = use(params)

  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [roomsCount, setRoomsCount] = useState(1)
  const [days, setDays] = useState(1)

  const Back = isAr ? ChevronRight : ChevronLeft

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`/api/rooms/${roomId}`)
        const data = await res.json()
        if (data.room) {
          setRoom(data.room)
        }
      } catch {
        // Error handled
      } finally {
        setLoading(false)
      }
    }
    fetchRoom()
  }, [roomId])

  if (loading) return <RoomDetailPageSkeleton />

  if (!room) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 mb-6">
          <AlertTriangle className="h-10 w-10 text-warning" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">{t('errors.not_found')}</h2>
        <button
          onClick={() => router.push(`/${locale}/rooms`)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
        >
          <Back className="h-4 w-4" />
          {t('common.back')}
        </button>
      </div>
    )
  }

  const name = isAr ? room.name_ar : (room.name_en || room.name_ar)
  const city = isAr ? room.city_ar : (room.city_en || room.city_ar)
  const address = isAr ? room.address_ar : (room.address_en || room.address_ar)
  const description = isAr ? room.description_ar : (room.description_en || room.description_ar)
  const categoryLabel = ROOM_CATEGORIES[room.category as keyof typeof ROOM_CATEGORIES]
  const categoryText = categoryLabel ? (isAr ? categoryLabel.ar : categoryLabel.en) : room.category
  const fmt = (amount: number) => isAr ? formatPrice(amount, room.currency) : formatPriceEN(amount, room.currency)
  const totalPrice = room.price_per_night * days * roomsCount

  const isBookable = room.status === 'active'
  const isNotAvailable = room.status === 'removed'
  const isDeactivated = room.status === 'deactivated'

  const providerName = room.provider
    ? isAr
      ? room.provider.company_name_ar
      : (room.provider.company_name_en || room.provider.company_name_ar)
    : null

  return (
    <>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-40 md:pt-8 lg:pt-12 lg:pb-12 animate-fade-in-up">
        {/* Back button */}
        <button
          onClick={() => router.push(`/${locale}/rooms`)}
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
              {t('rooms.not_available')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Main content */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6 md:space-y-8">
            <div className="overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
              {/* Image Gallery */}
              <RoomImageGallery images={room.images || []} name={name} className="rounded-none" />

              <div className="p-4 md:p-10">
                {/* Status & Category badges */}
                <div className="mb-3 flex flex-wrap items-center gap-1.5 md:gap-2.5">
                  <RoomStatusBadge status={room.status} className="hover:scale-100" />
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-[10px] md:text-[11px] font-bold uppercase tracking-wider md:tracking-[0.22em] text-slate-500 backdrop-blur">
                    <BedDouble className="h-3 w-3 md:h-3.5 md:w-3.5 text-accent" />
                    {categoryText}
                  </span>
                </div>

                {/* Name */}
                <h1 className="text-lg font-black tracking-tight text-slate-950 md:text-4xl mb-2 md:mb-3 truncate">{name}</h1>

                {/* City & Address */}
                <div className="flex flex-col gap-1 md:gap-1.5 mb-4 md:mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-400" />
                    <span className="text-xs md:text-base font-semibold text-slate-600">{city}</span>
                  </div>
                  {address && (
                    <div className="flex items-center gap-2 ps-5 md:ps-6">
                      <span className="text-[11px] md:text-sm font-medium text-slate-400">{address}</span>
                    </div>
                  )}
                </div>

                {/* Info cards */}
                <div className="grid gap-2 md:gap-3 grid-cols-2 mb-4 md:mb-6">
                  <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white/90 p-3 md:p-4 shadow-sm min-w-0">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider md:tracking-[0.22em] text-slate-400">
                      <Users className="h-3 w-3 md:h-3.5 md:w-3.5" />
                      {t('rooms.max_capacity')}
                    </p>
                    <p className="text-sm md:text-2xl font-black text-slate-950 leading-tight">{room.max_capacity} {t('rooms.guests')}</p>
                  </div>

                  <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white/90 p-3 md:p-4 shadow-sm min-w-0">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider md:tracking-[0.22em] text-slate-400">
                      <CalendarDays className="h-3 w-3 md:h-3.5 md:w-3.5" />
                      {t('rooms.available_dates')}
                    </p>
                    <RoomAvailabilityBadge
                      instantBook={room.instant_book}
                      availableFrom={room.available_from}
                      availableTo={room.available_to}
                    />
                    {!room.instant_book && !room.available_from && !room.available_to && (
                      <p className="text-xs md:text-sm font-bold text-slate-900">{t('rooms.always_available')}</p>
                    )}
                  </div>
                </div>

                {/* Room structure & amenities */}
                <div className="mb-4 md:mb-6 flex flex-wrap gap-2">
                  {room.bedroom_count > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs md:text-sm font-bold text-slate-800 shadow-sm">
                      <Bed className="h-3.5 w-3.5 text-accent" />
                      {room.bedroom_count} {isAr ? (room.bedroom_count === 1 ? 'غرفة نوم' : 'غرف نوم') : (room.bedroom_count === 1 ? 'bedroom' : 'bedrooms')}
                    </span>
                  )}
                  {room.bathroom_count > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs md:text-sm font-bold text-slate-800 shadow-sm">
                      <Bath className="h-3.5 w-3.5 text-accent" />
                      {room.bathroom_count} {isAr ? (room.bathroom_count === 1 ? 'حمام' : 'حمامات') : (room.bathroom_count === 1 ? 'bathroom' : 'bathrooms')}
                    </span>
                  )}
                  {room.has_view && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs md:text-sm font-bold text-slate-800 shadow-sm">
                      <Mountain className="h-3.5 w-3.5 text-accent" />
                      {pick(locale, 'إطلالة', 'View', 'Görüntüle')}
                    </span>
                  )}
                  {room.has_balcony && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs md:text-sm font-bold text-slate-800 shadow-sm">
                      <Home className="h-3.5 w-3.5 text-accent" />
                      {pick(locale, 'بلكونة', 'Balcony', 'Balkon')}
                    </span>
                  )}
                  {room.has_kitchen && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs md:text-sm font-bold text-slate-800 shadow-sm">
                      <ChefHat className="h-3.5 w-3.5 text-accent" />
                      {pick(locale, 'مطبخ', 'Kitchen', 'Mutfak')}
                    </span>
                  )}
                  {room.breakfast_included && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/5 px-3 py-1.5 text-xs md:text-sm font-bold text-success shadow-sm">
                      <Coffee className="h-3.5 w-3.5" />
                      {pick(locale, 'يشمل الإفطار', 'Breakfast included', 'Kahvaltı dahil')}
                    </span>
                  )}
                  {room.cancellation_policy === 'free' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/5 px-3 py-1.5 text-xs md:text-sm font-bold text-success shadow-sm">
                      <CircleCheck className="h-3.5 w-3.5" />
                      {pick(locale, 'إلغاء مجاني', 'Free cancellation', 'Ücretsiz iptal')}
                    </span>
                  )}
                  {room.cancellation_policy === 'partial' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/5 px-3 py-1.5 text-xs md:text-sm font-bold text-warning shadow-sm">
                      <TriangleAlert className="h-3.5 w-3.5" />
                      {pick(locale, `إلغاء برسوم (${room.cancellation_penalty_nights} ليلة)`, `Partial refund (${room.cancellation_penalty_nights} night${room.cancellation_penalty_nights !== 1 ? 's' : ''})`)}
                    </span>
                  )}
                  {room.cancellation_policy === 'non_refundable' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs md:text-sm font-bold text-destructive shadow-sm">
                      <Ban className="h-3.5 w-3.5" />
                      {pick(locale, 'غير قابل للاسترداد', 'Non-refundable', 'İade edilemez')}
                    </span>
                  )}
                </div>

                {/* Price card */}
                <div className="hidden md:block rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/15">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{t('rooms.price_per_night')}</p>
                  <p className="text-3xl font-black tracking-tight md:text-4xl">{fmt(room.price_per_night)}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-950 md:text-xl">{t('common.description')}</h3>
                    <p className="text-sm font-medium text-slate-500">{pick(locale, 'معلومات إضافية عن هذه الغرفة', 'Additional room details', 'Ek oda ayrıntıları')}</p>
                  </div>
                </div>
                <p className="text-sm font-medium leading-7 text-slate-600 md:text-base">{description}</p>
              </div>
            )}

            {/* Location map */}
            {room.latitude != null && room.longitude != null && (
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-950 md:text-xl">{pick(locale, 'الموقع', 'Location', 'Konum')}</h3>
                    {address && <p className="text-sm font-medium text-slate-500">{address}</p>}
                  </div>
                </div>
                <LocationMap latitude={room.latitude} longitude={room.longitude} label={name} height={320} />
              </div>
            )}

            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BedDouble className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-black text-slate-950 md:text-xl">{t('rooms.amenities')}</h3>
                </div>
                <RoomAmenities amenities={room.amenities} />
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
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{pick(locale, 'مقدم الخدمة', 'Provider', 'Tedarikçi')}</p>
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
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{t('rooms.price_per_night')}</p>
                <p className="text-4xl font-black tracking-tight">{fmt(room.price_per_night)}</p>
              </div>

              <div className="space-y-6 p-8">
                {isBookable && (
                  <>
                    {/* Rooms counter */}
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <label className="mb-4 block text-sm font-bold text-slate-900">
                        {t('rooms.rooms_count')}
                      </label>
                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setRoomsCount(Math.max(1, roomsCount - 1))}
                          disabled={roomsCount <= 1}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="text-center">
                          <p className="text-3xl font-black tracking-tight text-slate-950">{roomsCount}</p>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('rooms.rooms_count')}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRoomsCount(Math.min(10, roomsCount + 1))}
                          disabled={roomsCount >= 10}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Days input */}
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <label className="mb-4 block text-sm font-bold text-slate-900">
                        {t('room_booking.number_of_days')}
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
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('rooms.nights')}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDays(days + 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between text-sm font-medium text-slate-500">
                        <span>{fmt(room.price_per_night)} x {days} {t('rooms.nights')} x {roomsCount}</span>
                        <span className="font-semibold text-slate-900">{fmt(totalPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-base font-bold text-slate-900">{t('common.total')}</span>
                        <span className="text-2xl font-black tracking-tight text-primary">{fmt(totalPrice)}</span>
                      </div>
                    </div>

                    <Link
                      href={`/${locale}/rooms/${room.id}/book?rooms=${roomsCount}&days=${days}`}
                      className={cn(
                        buttonVariants({ size: 'lg' }),
                        'h-14 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/15'
                      )}
                    >
                      <CreditCard className="h-5 w-5" />
                      {t('rooms.book_now')}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  </>
                )}

                {isDeactivated && (
                  <button
                    disabled
                    className="w-full rounded-2xl border border-warning/20 bg-warning/10 py-4 text-base font-bold text-warning"
                  >
                    {t('rooms.not_available')}
                  </button>
                )}

                {isNotAvailable && (
                  <button
                    disabled
                    className="w-full rounded-2xl border border-destructive/20 bg-destructive/10 py-4 text-base font-bold text-destructive"
                  >
                    {t('rooms.not_available')}
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

      {room.provider_id && (
        <div className="max-w-7xl mx-auto px-4 mt-12">
          <h3 className="text-lg font-bold mb-4">
            {pick(locale, 'التقييمات', 'Reviews', 'Yorumlar')}
          </h3>
          <ReviewList providerId={room.provider_id} roomId={room.id} />
        </div>
      )}

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-3 py-2.5 pb-safe z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('rooms.price_per_night')}</span>
            <span className="text-lg font-black text-white leading-tight">{fmt(room.price_per_night)}</span>
          </div>

          {isBookable ? (
            <Link
              href={`/${locale}/rooms/${room.id}/book?rooms=${roomsCount}&days=${days}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-white font-bold text-sm active:scale-[0.98] transition-all"
            >
              <CreditCard className="h-4 w-4" />
              {t('rooms.book_now')}
            </Link>
          ) : (
            <button disabled className="flex-1 py-3 rounded-xl bg-destructive/20 text-destructive font-bold text-sm border border-destructive/20">
              {t('rooms.not_available')}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
