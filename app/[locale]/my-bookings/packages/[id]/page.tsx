'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  PackageIcon,
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
  XCircle,
  Loader2,
  AlertTriangle,
  Building2,
  Plane,
  BedDouble,
  CarFront,
  Users,
} from 'lucide-react'
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge'
import { BookingDetailPageSkeleton } from '@/components/shared/loading-skeleton'
import { capitalizeFirst, formatPrice, formatPriceEN, shortId } from '@/lib/utils'
import type { PackageBooking } from '@/types'

export default function PackageBookingDetailPage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<PackageBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  const Back = isAr ? ChevronRight : ChevronLeft

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/package-bookings/${bookingId}`)
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

  const pkg = booking.package
  const provider = booking.provider || pkg?.provider
  const fmt = (amount: number) =>
    isAr
      ? formatPrice(amount, pkg?.currency || 'SAR')
      : formatPriceEN(amount, pkg?.currency || 'SAR')

  const packageName = pkg
    ? isAr
      ? pkg.name_ar
      : pkg.name_en || pkg.name_ar
    : ''

  const destCity = pkg
    ? isAr
      ? pkg.destination_city_ar
      : capitalizeFirst(pkg.destination_city_en || pkg.destination_city_ar)
    : ''

  const createdDate = new Date(booking.created_at).toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  )

  const paidDate = booking.paid_at
    ? new Date(booking.paid_at).toLocaleDateString(
        isAr ? 'ar-SA' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
      )
    : null

  const providerName = provider
    ? isAr
      ? provider.company_name_ar
      : provider.company_name_en || provider.company_name_ar
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
          <h1 className="text-2xl font-bold text-foreground">
            {isAr ? 'تفاصيل حجز الباقة' : 'Package Booking Details'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('booking.booking_reference')}:{' '}
            <span className="font-mono font-bold text-foreground">{shortId(booking.id)}</span>
          </p>
        </div>
        <BookingStatusBadge status={booking.status} className="text-sm px-3 py-1" />
      </div>

      <div className="space-y-6">
        {/* Package Summary */}
        {pkg && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <PackageIcon className="h-4 w-4 text-accent" />
              {isAr ? 'تفاصيل الباقة' : 'Package Details'}
            </h3>

            {pkg.images?.[0] && (
              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                <Image
                  src={pkg.images[0]}
                  alt={packageName}
                  fill
                  sizes="(max-width: 768px) 100vw, 700px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-lg font-bold">{packageName}</p>
                {destCity && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{destCity}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {pkg.includes_flight && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    <Plane className="h-3 w-3" />
                    {isAr ? 'طيران' : 'Flight'}
                  </span>
                )}
                {pkg.includes_hotel && (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <BedDouble className="h-3 w-3" />
                    {isAr ? 'فندق' : 'Hotel'}
                  </span>
                )}
                {pkg.includes_car && (
                  <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                    <CarFront className="h-3 w-3" />
                    {isAr ? 'سيارة' : 'Car'}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
              <div>
                <span className="text-xs text-muted-foreground">{isAr ? 'تاريخ البدء' : 'Start date'}</span>
                <p className="text-sm font-medium mt-0.5" dir="ltr">{booking.start_date}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{isAr ? 'تاريخ الانتهاء' : 'End date'}</span>
                <p className="text-sm font-medium mt-0.5" dir="ltr">{booking.end_date}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{isAr ? 'عدد الأشخاص' : 'People'}</span>
                <p className="text-sm font-medium mt-0.5">{booking.number_of_people}</p>
              </div>
            </div>

            {/* Flight details */}
            {pkg.includes_flight && (pkg.flight_airline || pkg.flight_origin_ar) && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  {isAr ? 'تفاصيل الطيران' : 'Flight Details'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {pkg.flight_airline && (
                    <div>
                      <span className="text-xs text-muted-foreground">{isAr ? 'الخطوط' : 'Airline'}</span>
                      <p className="text-sm font-medium mt-0.5">{pkg.flight_airline}</p>
                    </div>
                  )}
                  {(pkg.flight_origin_ar || pkg.flight_origin_en) && (
                    <div>
                      <span className="text-xs text-muted-foreground">{isAr ? 'من' : 'From'}</span>
                      <p className="text-sm font-medium mt-0.5">
                        {isAr ? pkg.flight_origin_ar : capitalizeFirst(pkg.flight_origin_en || pkg.flight_origin_ar || '')}
                      </p>
                    </div>
                  )}
                  {(pkg.flight_destination_ar || pkg.flight_destination_en) && (
                    <div>
                      <span className="text-xs text-muted-foreground">{isAr ? 'إلى' : 'To'}</span>
                      <p className="text-sm font-medium mt-0.5">
                        {isAr ? pkg.flight_destination_ar : capitalizeFirst(pkg.flight_destination_en || pkg.flight_destination_ar || '')}
                      </p>
                    </div>
                  )}
                  {pkg.flight_cabin_class && (
                    <div>
                      <span className="text-xs text-muted-foreground">{isAr ? 'الدرجة' : 'Class'}</span>
                      <p className="text-sm font-medium mt-0.5">{pkg.flight_cabin_class}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hotel details */}
            {pkg.includes_hotel && (pkg.hotel_name_ar || pkg.hotel_name_en) && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  {isAr ? 'تفاصيل الفندق' : 'Hotel Details'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">{isAr ? 'الفندق' : 'Hotel'}</span>
                    <p className="text-sm font-medium mt-0.5">
                      {isAr ? pkg.hotel_name_ar : (pkg.hotel_name_en || pkg.hotel_name_ar)}
                    </p>
                  </div>
                  {pkg.hotel_nights && (
                    <div>
                      <span className="text-xs text-muted-foreground">{isAr ? 'عدد الليالي' : 'Nights'}</span>
                      <p className="text-sm font-medium mt-0.5">{pkg.hotel_nights}</p>
                    </div>
                  )}
                  {(pkg.hotel_city_ar || pkg.hotel_city_en) && (
                    <div>
                      <span className="text-xs text-muted-foreground">{isAr ? 'المدينة' : 'City'}</span>
                      <p className="text-sm font-medium mt-0.5">
                        {isAr ? pkg.hotel_city_ar : capitalizeFirst(pkg.hotel_city_en || pkg.hotel_city_ar || '')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Car details */}
            {pkg.includes_car && (pkg.car_brand_ar || pkg.car_brand_en) && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  {isAr ? 'تفاصيل السيارة' : 'Car Details'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">{isAr ? 'السيارة' : 'Car'}</span>
                    <p className="text-sm font-medium mt-0.5">
                      {isAr
                        ? `${pkg.car_brand_ar || ''} ${pkg.car_model_ar || ''}`
                        : `${pkg.car_brand_en || pkg.car_brand_ar || ''} ${pkg.car_model_en || pkg.car_model_ar || ''}`}
                    </p>
                  </div>
                  {pkg.car_rental_days && (
                    <div>
                      <span className="text-xs text-muted-foreground">{isAr ? 'عدد الأيام' : 'Days'}</span>
                      <p className="text-sm font-medium mt-0.5">{pkg.car_rental_days}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <Link href={`/${locale}/packages/${pkg.id}`} className="text-sm text-accent hover:underline">
                {isAr ? 'عرض صفحة الباقة' : 'View package page'} &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Guest Info */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-accent" />
            {isAr ? 'بيانات الضيف' : 'Guest Information'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">{isAr ? 'الاسم' : 'Name'}</span>
                <p className="text-sm font-medium">{booking.guest_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">{isAr ? 'عدد الأشخاص' : 'People'}</span>
                <p className="text-sm font-medium">{booking.number_of_people}</p>
              </div>
            </div>
            {booking.guest_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground">{isAr ? 'رقم الجوال' : 'Phone'}</span>
                  <p className="text-sm font-medium" dir="ltr">{booking.guest_phone}</p>
                </div>
              </div>
            )}
            {booking.guest_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground">{isAr ? 'البريد الإلكتروني' : 'Email'}</span>
                  <p className="text-sm font-medium" dir="ltr">{booking.guest_email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            {t('booking.payment_details')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {isAr ? 'السعر للشخص' : 'Price per person'}
              </span>
              <span>{fmt(booking.total_amount / booking.number_of_people)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isAr ? 'عدد الأشخاص' : 'People'}</span>
              <span>{booking.number_of_people}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3 font-semibold text-lg">
              <span>{t('booking.total_amount')}</span>
              <span className="text-accent">{fmt(booking.total_amount)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{isAr ? 'تاريخ الحجز' : 'Booked on'}: {createdDate}</span>
            </div>
            {paidDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                <span>{isAr ? 'تاريخ الدفع' : 'Paid on'}: {paidDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Awaiting bank transfer */}
        {booking.status === 'payment_processing' && !booking.transfer_confirmed_at && (
          <div className="rounded-xl border bg-warning/5 border-warning/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Landmark className="h-5 w-5 text-warning shrink-0" />
              <h3 className="font-semibold text-warning">
                {isAr ? 'بانتظار التحويل البنكي' : 'Awaiting Bank Transfer'}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {isAr
                ? 'يرجى إتمام التحويل البنكي لتأكيد حجز الباقة'
                : 'Please complete the bank transfer to confirm your package booking'}
            </p>
            <Link
              href={`/${locale}/checkout/${booking.id}?type=package`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              {isAr ? 'إتمام الدفع' : 'Complete Payment'}
            </Link>
          </div>
        )}

        {booking.status === 'payment_processing' && booking.transfer_confirmed_at && (
          <div className="rounded-xl border bg-warning/5 border-warning/20 p-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm font-medium text-warning">
              {isAr
                ? 'تم تأكيد التحويل وبانتظار مراجعة الإدارة'
                : 'Transfer confirmed, pending admin review'}
            </p>
          </div>
        )}

        {booking.status === 'payment_failed' && (
          <div className="rounded-xl border bg-destructive/5 border-destructive/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <h3 className="font-semibold text-destructive">
                {isAr ? 'تم رفض التحويل' : 'Transfer Rejected'}
              </h3>
            </div>
            {booking.payment_rejection_reason && (
              <p className="text-sm text-muted-foreground mb-3">{booking.payment_rejection_reason}</p>
            )}
            <Link
              href={`/${locale}/checkout/${booking.id}?type=package`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {isAr ? 'إعادة المحاولة' : 'Try Again'}
            </Link>
          </div>
        )}

        {/* Receipt */}
        {booking.transfer_receipt_url && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-3">
              {isAr ? 'إيصال التحويل' : 'Transfer Receipt'}
            </h3>
            <div className="relative w-full h-64">
              <Image
                src={booking.transfer_receipt_url}
                alt="Receipt"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain rounded-lg border"
              />
            </div>
          </div>
        )}

        {/* Cancel */}
        {booking.status === 'confirmed' && (
          <div className="rounded-xl border bg-card p-6">
            <button
              onClick={async () => {
                setCancelling(true)
                try {
                  const res = await fetch(`/api/package-bookings/${booking.id}/cancel`, {
                    method: 'POST',
                  })
                  if (res.ok) {
                    setBooking((prev) =>
                      prev ? { ...prev, status: 'cancellation_pending' } : prev
                    )
                  }
                } finally {
                  setCancelling(false)
                }
              }}
              disabled={cancelling}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {isAr ? 'طلب إلغاء الحجز' : 'Request Cancellation'}
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              {isAr
                ? 'سيتم إرسال طلب الإلغاء للإدارة للمراجعة'
                : 'Your cancellation request will be sent to admin for review'}
            </p>
          </div>
        )}

        {booking.status === 'cancellation_pending' && (
          <div className="rounded-xl border bg-warning/5 border-warning/20 p-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm font-medium text-warning">
              {isAr
                ? 'طلب الإلغاء قيد المراجعة من الإدارة'
                : 'Your cancellation request is pending admin review'}
            </p>
          </div>
        )}

        {/* Provider */}
        {provider && providerName && (
          <Link
            href={`/${locale}/providers/${provider.id}`}
            className="block rounded-xl border bg-card p-6 hover:border-accent/30 transition-colors"
          >
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" />
              {isAr ? 'مقدم الخدمة' : 'Provider'}
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
      </div>
    </div>
  )
}
