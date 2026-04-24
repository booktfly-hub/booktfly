'use client'

import { pick } from '@/lib/i18n-helpers'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const LocationMap = dynamic(() => import('@/components/shared/location-map').then(m => m.LocationMap), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-lg border bg-muted/30 animate-pulse" />,
})
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BedDouble,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Landmark,
  MapPin,
  Phone,
  Mail,
  User,
  Users,
  XCircle,
  Loader2,
  AlertTriangle,
  Building2,
  Star,
  CheckCircle2,
  Coffee,
  Ban,
  CircleCheck,
  TriangleAlert,
  ExternalLink,
  Bed,
  Bath,
  Mountain,
  Home,
  ChefHat,
} from 'lucide-react'
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge'
import { BookingDetailPageSkeleton } from '@/components/shared/loading-skeleton'
import { capitalizeFirst, cn, formatPrice, formatPriceEN, shortId } from '@/lib/utils'
import type { RoomBooking } from '@/types'
import { ChangeNameModal } from '@/components/bookings/change-name-modal'
import { SignatureDisplay } from '@/components/admin/signature-display'
import { UserCog } from 'lucide-react'

export default function RoomBookingDetailPage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<RoomBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewHover, setReviewHover] = useState(0)

  const Back = isAr ? ChevronRight : ChevronLeft

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/room-bookings/${bookingId}`)
        const data = await res.json()
        if (data.booking) {
          setBooking(data.booking)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [bookingId])

  if (loading) return <BookingDetailPageSkeleton />

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('errors.not_found')}</h2>
        <button
          onClick={() => router.push(`/${locale}/my-bookings`)}
          className="text-accent hover:underline text-sm mt-2"
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  const room = booking.room
  const provider = booking.provider || room?.provider
  const roomName = room ? (isAr ? room.name_ar : (room.name_en || room.name_ar)) : ''
  const city = room ? (isAr ? room.city_ar : capitalizeFirst(room.city_en || room.city_ar)) : ''
  const fmt = (amount: number) => isAr ? formatPrice(amount, room?.currency || 'SAR') : formatPriceEN(amount, room?.currency || 'SAR')
  const createdDate = new Date(booking.created_at).toLocaleDateString(
    pick(locale, 'ar-SA', 'en-US', 'tr-TR'),
    { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  )
  const paidDate = booking.paid_at
    ? new Date(booking.paid_at).toLocaleDateString(
        pick(locale, 'ar-SA', 'en-US', 'tr-TR'),
        { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      )
    : null
  const providerName = provider
    ? isAr
      ? provider.company_name_ar
      : (provider.company_name_en || provider.company_name_ar)
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.push(`/${locale}/my-bookings`)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <Back className="h-4 w-4" />
        {t('common.back')}
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{pick(locale, 'تفاصيل حجز الغرفة', 'Room Booking Details', 'Oda Rezervasyon Ayrıntıları')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('booking.booking_reference')}: <span className="font-mono font-bold text-foreground">{shortId(booking.id)}</span>
          </p>
        </div>
        <BookingStatusBadge status={booking.status} className="text-sm px-3 py-1" />
      </div>

      <div className="space-y-6">
        {room && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-accent" />
              {pick(locale, 'تفاصيل الغرفة', 'Room Details', 'Oda Ayrıntıları')}
            </h3>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-lg font-bold">{roomName}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{city}</span>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-600">
                {booking.rooms_count} {pick(locale, 'غرف', 'Rooms', 'Odalar')}
              </span>
            </div>

            {/* Images gallery */}
            {room.images && room.images.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {room.images.slice(0, 4).map((src, i) => (
                  <a
                    key={i}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn('relative aspect-square overflow-hidden rounded-lg border bg-muted', i === 0 && 'col-span-2 row-span-2 aspect-[4/3]')}
                  >
                    <Image src={src} alt={roomName} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover hover:scale-105 transition-transform" />
                  </a>
                ))}
              </div>
            )}

            {/* Room structure badges */}
            {(room.bedroom_count || room.bathroom_count || room.has_view || room.has_balcony || room.has_kitchen) && (
              <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                {room.bedroom_count > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3 py-1 text-xs font-semibold">
                    <Bed className="h-3.5 w-3.5" />
                    {room.bedroom_count} {isAr ? (room.bedroom_count === 1 ? 'غرفة نوم' : 'غرف نوم') : (room.bedroom_count === 1 ? 'bedroom' : 'bedrooms')}
                  </span>
                )}
                {room.bathroom_count > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3 py-1 text-xs font-semibold">
                    <Bath className="h-3.5 w-3.5" />
                    {room.bathroom_count} {isAr ? (room.bathroom_count === 1 ? 'حمام' : 'حمامات') : (room.bathroom_count === 1 ? 'bathroom' : 'bathrooms')}
                  </span>
                )}
                {room.has_view && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                    <Mountain className="h-3.5 w-3.5" />
                    {pick(locale, 'إطلالة', 'View', 'Görüntüle')}
                  </span>
                )}
                {room.has_balcony && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                    <Home className="h-3.5 w-3.5" />
                    {pick(locale, 'بلكونة', 'Balcony', 'Balkon')}
                  </span>
                )}
                {room.has_kitchen && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                    <ChefHat className="h-3.5 w-3.5" />
                    {pick(locale, 'مطبخ', 'Kitchen', 'Mutfak')}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-4 border-t">
              <div>
                <span className="text-xs text-muted-foreground">{pick(locale, 'تاريخ الدخول', 'Check-in date', 'Giriş tarihi')}</span>
                <p className="text-sm font-medium mt-0.5" dir="ltr">{booking.check_in_date}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{pick(locale, 'عدد الليالي', 'Nights', 'Gece')}</span>
                <p className="text-sm font-medium mt-0.5">{booking.number_of_days}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{pick(locale, 'عدد الضيوف', 'Guests', 'Misafirler')}</span>
                <p className="text-sm font-medium mt-0.5">{booking.number_of_people}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{pick(locale, 'السعر لكل ليلة', 'Price per night', 'Gecelik fiyat')}</span>
                <p className="text-sm font-medium mt-0.5">{fmt(booking.price_per_night)}</p>
              </div>
            </div>

            {/* Cancellation policy */}
            {room.cancellation_policy && (
              <div className="mt-4 pt-4 border-t flex items-start gap-3">
                {room.cancellation_policy === 'free' && <CircleCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />}
                {room.cancellation_policy === 'partial' && <TriangleAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />}
                {room.cancellation_policy === 'non_refundable' && <Ban className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {pick(locale, 'سياسة الإلغاء', 'Cancellation Policy', 'İptal Politikası')}
                  </p>
                  <p className="text-sm font-medium">
                    {room.cancellation_policy === 'free' && (pick(locale, 'إلغاء مجاني', 'Free cancellation', 'Ücretsiz iptal'))}
                    {room.cancellation_policy === 'partial' && (
                      pick(locale, `إلغاء برسوم (${room.cancellation_penalty_nights} ${room.cancellation_penalty_nights === 1 ? 'ليلة' : 'ليالٍ'})`, `Partial refund — ${room.cancellation_penalty_nights} night${room.cancellation_penalty_nights !== 1 ? 's' : ''} charged`)
                    )}
                    {room.cancellation_policy === 'non_refundable' && (pick(locale, 'غير قابل للاسترداد', 'Non-refundable', 'İade edilemez'))}
                  </p>
                </div>
              </div>
            )}

            {/* Breakfast + contact */}
            <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4">
              {room.breakfast_included && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <Coffee className="h-4 w-4" />
                  <span>{pick(locale, 'يشمل الإفطار', 'Breakfast included', 'Kahvaltı dahil')}</span>
                </div>
              )}
              {room.contact_phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${room.contact_phone}`} className="hover:text-accent transition-colors" dir="ltr">
                    {room.contact_phone}
                  </a>
                </div>
              )}
            </div>

            {/* Embedded map */}
            {room.latitude != null && room.longitude != null && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {pick(locale, 'الموقع على الخريطة', 'Location on map', 'Haritadaki konum')}
                </div>
                <LocationMap latitude={room.latitude} longitude={room.longitude} label={roomName} />
                <a
                  href={`https://www.google.com/maps?q=${room.latitude},${room.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  {pick(locale, 'فتح في خرائط جوجل', 'Open in Google Maps', 'Google Haritalar\'da Aç')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <Link href={`/${locale}/rooms/${room.id}`} className="text-sm text-accent hover:underline">
                {pick(locale, 'عرض صفحة الغرفة', 'View room page', 'Oda sayfasını görüntüle')} &rarr;
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-accent" />
            {pick(locale, 'بيانات الضيف', 'Guest Information', 'Misafir Bilgileri')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-3 sm:col-span-2">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground">{pick(locale, 'اسم الضيف', 'Guest name', 'Misafir adı')}</span>
                  <p className="text-sm font-medium">{booking.guest_name}</p>
                </div>
              </div>
              {booking.room?.name_change_allowed && booking.status !== 'cancelled' && booking.status !== 'refunded' && (
                <button
                  type="button"
                  onClick={() => setNameModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  <UserCog className="h-3.5 w-3.5" />
                  {t('name_change.request')}
                </button>
              )}
            </div>
            {booking.guest_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground">{pick(locale, 'رقم الجوال', 'Phone number', 'Telefon numarası')}</span>
                  <p className="text-sm font-medium" dir="ltr">{booking.guest_phone}</p>
                </div>
              </div>
            )}
            {booking.guest_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground">{pick(locale, 'البريد الإلكتروني', 'Email', 'E-posta')}</span>
                  <p className="text-sm font-medium" dir="ltr">{booking.guest_email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">{pick(locale, 'السعة المحجوزة', 'Booked occupancy', 'Rezerve edilen doluluk')}</span>
                <p className="text-sm font-medium">
                  {booking.number_of_people} {pick(locale, 'ضيف', 'guest(s)', 'misafir')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            {t('booking.payment_details')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{pick(locale, 'سعر الليلة', 'Nightly price', 'Gecelik fiyat')}</span>
              <span>{fmt(booking.price_per_night)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{pick(locale, 'عدد الليالي', 'Nights', 'Gece')}</span>
              <span>{booking.number_of_days}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{pick(locale, 'عدد الغرف', 'Rooms', 'Odalar')}</span>
              <span>{booking.rooms_count}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3 font-semibold text-lg">
              <span>{t('booking.total_amount')}</span>
              <span className="text-accent">{fmt(booking.total_amount)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{pick(locale, 'تاريخ الحجز', 'Booked on', 'Rezervasyon tarihi')}: {createdDate}</span>
            </div>
            {paidDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                <span>{pick(locale, 'تاريخ الدفع', 'Paid on', 'Ödeme tarihi')}: {paidDate}</span>
              </div>
            )}
          </div>
        </div>

        {booking.status === 'payment_processing' && !booking.transfer_confirmed_at && (
          <div className="rounded-xl border bg-warning/5 border-warning/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Landmark className="h-5 w-5 text-warning shrink-0" />
              <h3 className="font-semibold text-warning">{pick(locale, 'بانتظار التحويل البنكي', 'Awaiting Bank Transfer', 'Banka Transferi Bekleniyor')}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {pick(locale, 'يرجى إتمام التحويل البنكي لتأكيد حجز الغرفة', 'Please complete the bank transfer to confirm your room booking', 'Oda rezervasyonunuzu onaylamak için lütfen banka transferini tamamlayın')}
            </p>
            <Link
              href={`/${locale}/checkout/${booking.id}?type=room`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              {pick(locale, 'إتمام الدفع', 'Complete Payment', 'Ödemeyi Tamamla')}
            </Link>
          </div>
        )}

        {booking.status === 'payment_processing' && booking.transfer_confirmed_at && (
          <div className="rounded-xl border bg-warning/5 border-warning/20 p-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm font-medium text-warning">
              {pick(locale, 'تم تأكيد التحويل وبانتظار مراجعة الإدارة', 'Transfer confirmed, pending admin review', 'Transfer onaylandı, yönetici incelemesi bekleniyor')}
            </p>
          </div>
        )}

        {booking.status === 'payment_failed' && (
          <div className="rounded-xl border bg-destructive/5 border-destructive/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <h3 className="font-semibold text-destructive">{pick(locale, 'تم رفض التحويل', 'Transfer Rejected', 'Transfer Reddedildi')}</h3>
            </div>
            {booking.payment_rejection_reason && (
              <p className="text-sm text-muted-foreground mb-3">{booking.payment_rejection_reason}</p>
            )}
            <Link
              href={`/${locale}/checkout/${booking.id}?type=room`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {pick(locale, 'إعادة المحاولة', 'Try Again', 'Tekrar Dene')}
            </Link>
          </div>
        )}

        {booking.transfer_receipt_url && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-3">{pick(locale, 'إيصال التحويل', 'Transfer Receipt', 'Transfer Makbuzu')}</h3>
            <div className="relative w-full h-64">
              <Image src={booking.transfer_receipt_url} alt="Receipt" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain rounded-lg border" />
            </div>
          </div>
        )}

        {booking.status === 'confirmed' && (
          <div className="rounded-xl border bg-card p-6">
            <button
              onClick={async () => {
                setCancelling(true)
                try {
                  const res = await fetch(`/api/room-bookings/${booking.id}/cancel`, { method: 'PATCH' })
                  if (res.ok) {
                    setBooking((prev) => prev ? { ...prev, status: 'cancellation_pending' } : prev)
                  }
                } finally {
                  setCancelling(false)
                }
              }}
              disabled={cancelling}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              {pick(locale, 'طلب إلغاء الحجز', 'Request Cancellation', 'İptal Talebi')}
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              {pick(locale, 'سيتم إرسال طلب الإلغاء للإدارة للمراجعة', 'Your cancellation request will be sent to admin for review', 'İptal talebiniz inceleme için yöneticiye gönderilecek')}
            </p>
          </div>
        )}

        {booking.status === 'cancellation_pending' && (
          <div className="rounded-xl border bg-warning/5 border-warning/20 p-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm font-medium text-warning">
              {pick(locale, 'طلب الإلغاء قيد المراجعة من الإدارة', 'Your cancellation request is pending admin review', 'İptal talebiniz yönetici incelemesi bekliyor')}
            </p>
          </div>
        )}

        {provider && providerName && (
          <Link
            href={`/${locale}/providers/${provider.id}`}
            className="block rounded-xl border bg-card p-6 hover:border-accent/30 transition-colors"
          >
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" />
              {pick(locale, 'مقدم الخدمة', 'Provider', 'Tedarikçi')}
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">{providerName}</p>
              </div>
            </div>
          </Link>
        )}

        {/* Signed Contract */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-3">{t('contract.step_title_client')}</h3>
          <SignatureDisplay
            signatureUrl={booking.buyer_signature_url}
            signedAt={booking.contract_signed_at}
            version={booking.contract_version}
            role="client"
            printTargetType="room_booking"
            printTargetId={booking.id}
            archiveUrl={booking.contract_archive_url}
          />
        </div>

        {booking.status === 'confirmed' && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              {pick(locale, 'قيّم تجربتك', 'Rate Your Experience', 'Deneyiminizi Değerlendirin')}
            </h3>

            {reviewSubmitted ? (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-semibold">{pick(locale, 'شكراً على تقييمك!', 'Thank you for your review!', 'Yorumunuz için teşekkürler!')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'h-8 w-8 transition-colors',
                          (reviewHover || reviewRating) >= star
                            ? 'fill-warning text-warning'
                            : 'text-muted-foreground'
                        )}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={pick(locale, 'أضف تعليقاً (اختياري)...', 'Add a comment (optional)...', 'Yorum ekleyin (isteğe bağlı)...')}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-surface px-4 py-3 text-sm outline-none focus:border-ring focus:ring-4 focus:ring-ring/15 resize-none"
                />

                <button
                  type="button"
                  disabled={reviewRating === 0 || reviewSubmitting}
                  onClick={async () => {
                    if (!reviewRating || !booking.provider_id) return
                    setReviewSubmitting(true)
                    try {
                      const res = await fetch('/api/reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          booking_id: booking.id,
                          provider_id: booking.provider_id,
                          room_id: booking.room_id,
                          item_type: 'room',
                          rating: reviewRating,
                          comment: reviewComment || undefined,
                        }),
                      })
                      if (res.ok) setReviewSubmitted(true)
                    } finally {
                      setReviewSubmitting(false)
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-primary/90"
                >
                  {reviewSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pick(locale, 'إرسال التقييم', 'Submit Review', 'Yorumu Gönder')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {nameModalOpen && booking.guest_name && (
        <ChangeNameModal
          open={true}
          onClose={() => setNameModalOpen(false)}
          bookingId={booking.id}
          passengerIndex={0}
          targetType="room_booking"
          currentFirstName={booking.guest_name.split(' ')[0] || ''}
          currentLastName={booking.guest_name.split(' ').slice(1).join(' ') || ''}
          fee={Number(booking.room?.name_change_fee ?? 0)}
          refundable={Boolean(booking.room?.name_change_is_refundable)}
          currency={booking.room?.currency || 'SAR'}
          onSuccess={() => {
            fetch(`/api/room-bookings/${booking.id}`).then(r => r.json()).then(d => { if (d.booking) setBooking(d.booking) })
          }}
        />
      )}
    </div>
  )
}
