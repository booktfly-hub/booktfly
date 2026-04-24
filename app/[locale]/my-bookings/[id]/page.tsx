'use client'

import { pick } from '@/lib/i18n-helpers'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plane,
  Calendar,
  ArrowRight,
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
  IdCard,
  CreditCard,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  XCircle,
  Loader2,
  Landmark,
  Star,
  CheckCircle2,
  Luggage,
  UtensilsCrossed,
  Hash,
  Ticket,
} from 'lucide-react'
import { capitalizeFirst, cn, formatPrice, formatPriceEN, shortId } from '@/lib/utils'
import { TRIP_TYPES, CABIN_CLASSES, PROVIDER_TYPES } from '@/lib/constants'
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge'
import { BookingDetailPageSkeleton } from '@/components/shared/loading-skeleton'
import { ChangeNameModal } from '@/components/bookings/change-name-modal'
import { SignatureDisplay } from '@/components/admin/signature-display'
import { UserCog } from 'lucide-react'
import type { Booking } from '@/types'

export default function BookingDetailPage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [changeNameIndex, setChangeNameIndex] = useState<number | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewHover, setReviewHover] = useState(0)

  const Arrow = isAr ? ArrowLeft : ArrowRight
  const Back = isAr ? ChevronRight : ChevronLeft

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`)
        const data = await res.json()
        if (data.booking) {
          setBooking(data.booking)
        }
      } catch {
        // Error handled
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

  const trip = booking.trip
  const provider = booking.provider || trip?.provider
  const fmt = (amount: number) => isAr ? formatPrice(amount, trip?.currency) : formatPriceEN(amount, trip?.currency)

  const originCity = trip
    ? isAr
      ? trip.origin_city_ar
      : capitalizeFirst(trip.origin_city_en || trip.origin_city_ar)
    : ''
  const destCity = trip
    ? isAr
      ? trip.destination_city_ar
      : capitalizeFirst(trip.destination_city_en || trip.destination_city_ar)
    : ''

  const departureDate = trip
    ? new Date(trip.departure_at).toLocaleDateString(
        pick(locale, 'ar-SA', 'en-US', 'tr-TR'),
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      )
    : ''

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
      {/* Back button */}
      <button
        onClick={() => router.push(`/${locale}/my-bookings`)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <Back className="h-4 w-4" />
        {t('common.back')}
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('booking.booking_detail')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('booking.booking_reference')}: <span className="font-mono font-bold text-foreground">{shortId(booking.id)}</span>
          </p>
        </div>
        <BookingStatusBadge status={booking.status} className="text-sm px-3 py-1" />
      </div>

      <div className="space-y-6">
        {/* Trip details */}
        {trip && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Plane className="h-4 w-4 text-accent" />
              {t('booking.trip_details')}
            </h3>

            {/* Route */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs text-muted-foreground">{t('common.from')}</span>
                </div>
                <p className="text-lg font-bold">{originCity}</p>
                {trip.origin_code && (
                  <span className="text-xs text-muted-foreground">{trip.origin_code?.toUpperCase()}</span>
                )}
              </div>
              <Arrow className="h-5 w-5 text-accent shrink-0" />
              <div className="flex-1 text-end">
                <div className="flex items-center justify-end gap-1.5 mb-1">
                  <span className="text-xs text-muted-foreground">{t('common.to')}</span>
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                </div>
                <p className="text-lg font-bold">{destCity}</p>
                {trip.destination_code && (
                  <span className="text-xs text-muted-foreground">{trip.destination_code?.toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Plane className="h-3 w-3" />
                  {t('trips.airline')}
                </span>
                <p className="text-sm font-medium mt-0.5">{trip.airline}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {t('trips.departure')}
                </span>
                <p className="text-sm font-medium mt-0.5">{departureDate}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t('trips.trip_type')}</span>
                <p className="text-sm font-medium mt-0.5">
                  {isAr ? TRIP_TYPES[trip.trip_type].ar : TRIP_TYPES[trip.trip_type].en}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t('trips.cabin_class')}</span>
                <p className="text-sm font-medium mt-0.5">
                  {isAr ? CABIN_CLASSES[trip.cabin_class].ar : CABIN_CLASSES[trip.cabin_class].en}
                </p>
              </div>
            </div>

            {/* Baggage & meal */}
            {(trip.checked_baggage_kg || trip.cabin_baggage_kg || trip.meal_included !== undefined) && (
              <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
                {trip.checked_baggage_kg != null && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Luggage className="h-4 w-4" />
                    <span>{pick(locale, `أمتعة مسجلة: ${trip.checked_baggage_kg} كغ`, `Checked: ${trip.checked_baggage_kg} kg`)}</span>
                  </div>
                )}
                {trip.cabin_baggage_kg != null && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Luggage className="h-4 w-4 opacity-60" />
                    <span>{pick(locale, `أمتعة مقصورة: ${trip.cabin_baggage_kg} كغ`, `Cabin: ${trip.cabin_baggage_kg} kg`)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UtensilsCrossed className="h-4 w-4" />
                  <span>{trip.meal_included ? (pick(locale, 'وجبة مشمولة', 'Meal included', 'Yemek dahil')) : (pick(locale, 'بدون وجبة', 'No meal', 'Yemek yok'))}</span>
                </div>
              </div>
            )}

            {/* PNR & ticket number */}
            {(booking.pnr_code || booking.ticket_number) && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
                {booking.pnr_code && (
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-accent shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground">{pick(locale, 'رقم الحجز (PNR)', 'Booking Code (PNR)', 'Rezervasyon Kodu (PNR)')}</span>
                      <p className="text-sm font-bold font-mono tracking-widest">{booking.pnr_code}</p>
                    </div>
                  </div>
                )}
                {booking.ticket_number && (
                  <div className="flex items-center gap-3">
                    <Ticket className="h-4 w-4 text-accent shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground">{pick(locale, 'رقم التذكرة', 'Ticket Number', 'Bilet Numarası')}</span>
                      <p className="text-sm font-bold font-mono tracking-widest">{booking.ticket_number}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Link to trip */}
            <div className="mt-4 pt-4 border-t">
              <Link
                href={`/${locale}/trips/${trip.id}`}
                className="text-sm text-accent hover:underline"
              >
                {t('trips.detail_title')} &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Passenger details */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-accent" />
            {pick(locale, 'بيانات التواصل الأساسية', 'Primary Contact', 'Birincil İletişim')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">{pick(locale, 'اسم جهة التواصل', 'Contact name', 'İletişim adı')}</span>
                <p className="text-sm font-medium">{booking.passenger_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">{pick(locale, 'رقم الجوال', 'Phone number', 'Telefon numarası')}</span>
                <p className="text-sm font-medium" dir="ltr">{booking.passenger_phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">{pick(locale, 'البريد الإلكتروني', 'Email', 'E-posta')}</span>
                <p className="text-sm font-medium" dir="ltr">{booking.passenger_email}</p>
              </div>
            </div>
            {booking.passenger_id_number && (
              <div className="flex items-center gap-3">
                <IdCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground">{t('booking.passenger_id')}</span>
                  <p className="text-sm font-medium" dir="ltr">{booking.passenger_id_number}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Passengers info */}
        {booking.passengers && booking.passengers.length > 0 && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              {t('booking.passenger_info')}
            </h3>
            <div className="space-y-4">
              {booking.passengers.map((p, i) => (
                <div key={i} className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3", i > 0 && "pt-4 border-t")}>
                  <div className="sm:col-span-2 md:col-span-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">
                      {t('booking.passenger_number', { number: i + 1 })}
                    </span>
                    {booking.trip?.name_change_allowed && booking.status !== 'cancelled' && booking.status !== 'refunded' && (
                      <button
                        type="button"
                        onClick={() => setChangeNameIndex(i)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <UserCog className="h-3.5 w-3.5" />
                        {t('name_change.request')}
                      </button>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{pick(locale, 'الاسم الأول', 'First Name', 'Ad')}</span>
                    <p className="text-sm font-medium">{p.first_name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{pick(locale, 'الاسم الأخير', 'Last Name', 'Soyad')}</span>
                    <p className="text-sm font-medium">{p.last_name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{pick(locale, 'تاريخ الميلاد', 'Date of Birth', 'Doğum Tarihi')}</span>
                    <p className="text-sm font-medium" dir="ltr">{p.date_of_birth}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{pick(locale, 'رقم الجواز أو البطاقة', 'Passport / ID Number', 'Pasaport / Kimlik Numarası')}</span>
                    <p className="text-sm font-medium" dir="ltr">{p.id_number}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{pick(locale, 'تاريخ انتهاء الإثبات', 'ID Expiry Date', 'Kimlik Son Geçerlilik Tarihi')}</span>
                    <p className="text-sm font-medium" dir="ltr">{p.id_expiry_date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signed Contract */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-3">{t('contract.step_title_client')}</h3>
          <SignatureDisplay
            signatureUrl={booking.buyer_signature_url}
            signedAt={booking.contract_signed_at}
            version={booking.contract_version}
            role="client"
            printTargetType="booking"
            printTargetId={booking.id}
            archiveUrl={booking.contract_archive_url}
          />
        </div>

        {/* Payment details */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            {t('booking.payment_details')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('trips.price_per_seat')}</span>
              <span>{fmt(booking.price_per_seat)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('booking.seats_count')}</span>
              <span>{booking.seats_count}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3 font-semibold text-lg">
              <span>{t('booking.total_amount')}</span>
              <span className="text-accent">{fmt(booking.total_amount)}</span>
            </div>
          </div>

          {/* Dates */}
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

        {/* Payment Processing - Link to checkout */}
        {booking.status === 'payment_processing' && !booking.transfer_confirmed_at && (
          <div className="rounded-xl border bg-warning/5 border-warning/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Landmark className="h-5 w-5 text-warning shrink-0" />
              <h3 className="font-semibold text-warning">{pick(locale, 'بانتظار التحويل البنكي', 'Awaiting Bank Transfer', 'Banka Transferi Bekleniyor')}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {pick(locale, 'يرجى إتمام التحويل البنكي لتأكيد حجزك', 'Please complete the bank transfer to confirm your booking', 'Rezervasyonunuzu onaylamak için lütfen banka transferini tamamlayın')}
            </p>
            <Link
              href={`/${locale}/checkout/${booking.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              {pick(locale, 'إتمام الدفع', 'Complete Payment', 'Ödemeyi Tamamla')}
            </Link>
          </div>
        )}

        {/* Transfer pending review */}
        {booking.status === 'payment_processing' && booking.transfer_confirmed_at && (
          <div className="rounded-xl border bg-warning/5 border-warning/20 p-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm font-medium text-warning">
              {pick(locale, 'تم تأكيد التحويل وبانتظار مراجعة الإدارة', 'Transfer confirmed, pending admin review', 'Transfer onaylandı, yönetici incelemesi bekleniyor')}
            </p>
          </div>
        )}

        {/* Payment failed / rejected */}
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
              href={`/${locale}/checkout/${booking.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {pick(locale, 'إعادة المحاولة', 'Try Again', 'Tekrar Dene')}
            </Link>
          </div>
        )}

        {/* Transfer receipt */}
        {booking.transfer_receipt_url && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-3">{pick(locale, 'إيصال التحويل', 'Transfer Receipt', 'Transfer Makbuzu')}</h3>
            <div className="relative w-full h-64">
              <Image src={booking.transfer_receipt_url} alt="Receipt" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain rounded-lg border" />
            </div>
          </div>
        )}

        {/* Cancel Booking */}
        {booking.status === 'confirmed' && (
          <div className="rounded-xl border bg-card p-6">
            <button
              onClick={async () => {
                setCancelling(true)
                try {
                  const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: 'PATCH' })
                  if (res.ok) {
                    setBooking((prev) => prev ? { ...prev, status: 'cancellation_pending' } : prev)
                    const { toast } = await import('@/components/ui/toaster')
                    toast({ title: t('common.success'), variant: 'success' })
                  } else {
                    const { toast } = await import('@/components/ui/toaster')
                    toast({ title: t('errors.generic'), variant: 'destructive' })
                  }
                } catch {
                  const { toast } = await import('@/components/ui/toaster')
                  toast({ title: t('errors.generic'), variant: 'destructive' })
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

        {/* Provider info */}
        {provider && providerName && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" />
              {t('trips.posted_by')}
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">{providerName}</p>
                <span className="text-xs text-muted-foreground">
                  {isAr
                    ? PROVIDER_TYPES[provider.provider_type].ar
                    : PROVIDER_TYPES[provider.provider_type].en}
                </span>
              </div>
            </div>
            {provider.contact_phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href={`tel:${provider.contact_phone}`} className="hover:text-accent transition-colors" dir="ltr">
                  {provider.contact_phone}
                </a>
              </div>
            )}
          </div>
        )}

        {booking.status === 'confirmed' && trip && new Date(trip.departure_at) < new Date() && (
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
                          trip_id: booking.trip_id,
                          item_type: 'trip',
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

      {changeNameIndex !== null && booking?.passengers?.[changeNameIndex] && (
        <ChangeNameModal
          open={true}
          onClose={() => setChangeNameIndex(null)}
          bookingId={booking.id}
          passengerIndex={changeNameIndex}
          currentFirstName={booking.passengers[changeNameIndex].first_name}
          currentLastName={booking.passengers[changeNameIndex].last_name}
          fee={Number(booking.trip?.name_change_fee ?? 0)}
          refundable={Boolean(booking.trip?.name_change_is_refundable)}
          currency={booking.trip?.currency || 'SAR'}
          onSuccess={() => {
            // Refetch booking to get the updated passengers + count
            fetch(`/api/bookings/${booking.id}`).then(r => r.json()).then(d => { if (d.booking) setBooking(d.booking) })
          }}
        />
      )}
    </div>
  )
}
