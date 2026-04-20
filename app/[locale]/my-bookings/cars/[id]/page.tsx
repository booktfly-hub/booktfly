'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CarFront,
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
  Fuel,
  Gauge,
  Users,
} from 'lucide-react'
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge'
import { BookingDetailPageSkeleton } from '@/components/shared/loading-skeleton'
import { capitalizeFirst, formatPrice, formatPriceEN, shortId } from '@/lib/utils'
import { CAR_CATEGORIES, TRANSMISSION_TYPES, FUEL_TYPES } from '@/lib/constants'
import type { CarBooking } from '@/types'
import { ChangeNameModal } from '@/components/bookings/change-name-modal'
import { SignatureDisplay } from '@/components/admin/signature-display'
import { UserCog } from 'lucide-react'

export default function CarBookingDetailPage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<CarBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [nameModalOpen, setNameModalOpen] = useState(false)

  const Back = isAr ? ChevronRight : ChevronLeft

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/car-bookings/${bookingId}`)
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

  const car = booking.car
  const provider = booking.provider || car?.provider
  const carName = car ? (isAr ? `${car.brand_ar} ${car.model_ar}` : `${car.brand_en || car.brand_ar} ${car.model_en || car.model_ar}`) : ''
  const city = car ? (isAr ? car.city_ar : capitalizeFirst(car.city_en || car.city_ar)) : ''
  const pickupLocation = car ? (isAr ? car.pickup_location_ar : (car.pickup_location_en || car.pickup_location_ar)) : null
  const fmt = (amount: number) => isAr ? formatPrice(amount, car?.currency || 'SAR') : formatPriceEN(amount, car?.currency || 'SAR')
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
      : (provider.company_name_en || provider.company_name_ar)
    : null

  const categoryLabel = car?.category ? CAR_CATEGORIES[car.category as keyof typeof CAR_CATEGORIES] : null
  const transmissionLabel = car?.transmission ? TRANSMISSION_TYPES[car.transmission as keyof typeof TRANSMISSION_TYPES] : null
  const fuelLabel = car?.fuel_type ? FUEL_TYPES[car.fuel_type as keyof typeof FUEL_TYPES] : null

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
          <h1 className="text-2xl font-bold text-foreground">{isAr ? 'تفاصيل حجز السيارة' : 'Car Booking Details'}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('booking.booking_reference')}: <span className="font-mono font-bold text-foreground">{shortId(booking.id)}</span>
          </p>
        </div>
        <BookingStatusBadge status={booking.status} className="text-sm px-3 py-1" />
      </div>

      <div className="space-y-6">
        {car && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CarFront className="h-4 w-4 text-accent" />
              {isAr ? 'تفاصيل السيارة' : 'Car Details'}
            </h3>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-lg font-bold">{carName}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{city}</span>
                </div>
                {pickupLocation && (
                  <p className="text-xs text-muted-foreground ps-5 truncate">{pickupLocation}</p>
                )}
              </div>
              {categoryLabel && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-600">
                  {isAr ? categoryLabel.ar : categoryLabel.en}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-4 border-t">
              <div>
                <span className="text-xs text-muted-foreground">{isAr ? 'تاريخ الاستلام' : 'Pickup date'}</span>
                <p className="text-sm font-medium mt-0.5" dir="ltr">{booking.pickup_date}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{isAr ? 'تاريخ الإرجاع' : 'Return date'}</span>
                <p className="text-sm font-medium mt-0.5" dir="ltr">{booking.return_date}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{isAr ? 'عدد الأيام' : 'Days'}</span>
                <p className="text-sm font-medium mt-0.5">{booking.number_of_days}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{isAr ? 'السعر لكل يوم' : 'Price per day'}</span>
                <p className="text-sm font-medium mt-0.5">{fmt(booking.price_per_day)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-4 border-t">
              {car.year && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{isAr ? 'سنة الصنع' : 'Year'}: {car.year}</span>
                </div>
              )}
              {transmissionLabel && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Gauge className="h-3.5 w-3.5" />
                  <span>{isAr ? transmissionLabel.ar : transmissionLabel.en}</span>
                </div>
              )}
              {fuelLabel && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Fuel className="h-3.5 w-3.5" />
                  <span>{isAr ? fuelLabel.ar : fuelLabel.en}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Link href={`/${locale}/cars/${car.id}`} className="text-sm text-accent hover:underline">
                {isAr ? 'عرض صفحة السيارة' : 'View car page'} &rarr;
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-accent" />
            {isAr ? 'بيانات المستأجر' : 'Renter Information'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-3 sm:col-span-2">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground">{isAr ? 'الاسم' : 'Name'}</span>
                  <p className="text-sm font-medium">{booking.guest_name}</p>
                </div>
              </div>
              {booking.car?.name_change_allowed && booking.status !== 'cancelled' && booking.status !== 'refunded' && (
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
                  <span className="text-xs text-muted-foreground">{isAr ? 'رقم الجوال' : 'Phone number'}</span>
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

        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            {t('booking.payment_details')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isAr ? 'سعر اليوم' : 'Daily price'}</span>
              <span>{fmt(booking.price_per_day)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isAr ? 'عدد الأيام' : 'Days'}</span>
              <span>{booking.number_of_days}</span>
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

        {booking.status === 'payment_processing' && !booking.transfer_confirmed_at && (
          <div className="rounded-xl border bg-warning/5 border-warning/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Landmark className="h-5 w-5 text-warning shrink-0" />
              <h3 className="font-semibold text-warning">{isAr ? 'بانتظار التحويل البنكي' : 'Awaiting Bank Transfer'}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {isAr ? 'يرجى إتمام التحويل البنكي لتأكيد حجز السيارة' : 'Please complete the bank transfer to confirm your car booking'}
            </p>
            <Link
              href={`/${locale}/checkout/${booking.id}?type=car`}
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
              {isAr ? 'تم تأكيد التحويل وبانتظار مراجعة الإدارة' : 'Transfer confirmed, pending admin review'}
            </p>
          </div>
        )}

        {booking.status === 'payment_failed' && (
          <div className="rounded-xl border bg-destructive/5 border-destructive/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <h3 className="font-semibold text-destructive">{isAr ? 'تم رفض التحويل' : 'Transfer Rejected'}</h3>
            </div>
            {booking.payment_rejection_reason && (
              <p className="text-sm text-muted-foreground mb-3">{booking.payment_rejection_reason}</p>
            )}
            <Link
              href={`/${locale}/checkout/${booking.id}?type=car`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {isAr ? 'إعادة المحاولة' : 'Try Again'}
            </Link>
          </div>
        )}

        {booking.transfer_receipt_url && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-3">{isAr ? 'إيصال التحويل' : 'Transfer Receipt'}</h3>
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
                  const res = await fetch(`/api/car-bookings/${booking.id}/cancel`, { method: 'PATCH' })
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
              {isAr ? 'طلب إلغاء الحجز' : 'Request Cancellation'}
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              {isAr ? 'سيتم إرسال طلب الإلغاء للإدارة للمراجعة' : 'Your cancellation request will be sent to admin for review'}
            </p>
          </div>
        )}

        {booking.status === 'cancellation_pending' && (
          <div className="rounded-xl border bg-warning/5 border-warning/20 p-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm font-medium text-warning">
              {isAr ? 'طلب الإلغاء قيد المراجعة من الإدارة' : 'Your cancellation request is pending admin review'}
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

        {/* Signed Contract */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-3">{t('contract.step_title_client')}</h3>
          <SignatureDisplay
            signatureUrl={booking.buyer_signature_url}
            signedAt={booking.contract_signed_at}
            version={booking.contract_version}
            role="client"
            printTargetType="car_booking"
            printTargetId={booking.id}
            archiveUrl={booking.contract_archive_url}
          />
        </div>
      </div>

      {nameModalOpen && booking.guest_name && (
        <ChangeNameModal
          open={true}
          onClose={() => setNameModalOpen(false)}
          bookingId={booking.id}
          passengerIndex={0}
          targetType="car_booking"
          currentFirstName={booking.guest_name.split(' ')[0] || ''}
          currentLastName={booking.guest_name.split(' ').slice(1).join(' ') || ''}
          fee={Number(booking.car?.name_change_fee ?? 0)}
          refundable={Boolean(booking.car?.name_change_is_refundable)}
          currency={booking.car?.currency || 'SAR'}
          onSuccess={() => {
            fetch(`/api/car-bookings/${booking.id}`).then(r => r.json()).then(d => { if (d.booking) setBooking(d.booking) })
          }}
        />
      )}
    </div>
  )
}
