'use client'

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
} from 'lucide-react'
import { cn, formatPrice, formatPriceEN, shortId } from '@/lib/utils'
import { TRIP_TYPES, CABIN_CLASSES, PROVIDER_TYPES } from '@/lib/constants'
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge'
import { DetailPageSkeleton } from '@/components/shared/loading-skeleton'
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

  const Arrow = isAr ? ArrowLeft : ArrowRight
  const Back = isAr ? ChevronRight : ChevronLeft
  const fmt = isAr ? formatPrice : formatPriceEN

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

  if (loading) return <DetailPageSkeleton />

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('errors.not_found')}</h2>
        <button
          onClick={() => router.back()}
          className="text-accent hover:underline text-sm mt-2"
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  const trip = booking.trip
  const provider = booking.provider || trip?.provider

  const originCity = trip
    ? isAr
      ? trip.origin_city_ar
      : (trip.origin_city_en || trip.origin_city_ar)
    : ''
  const destCity = trip
    ? isAr
      ? trip.destination_city_ar
      : (trip.destination_city_en || trip.destination_city_ar)
    : ''

  const departureDate = trip
    ? new Date(trip.departure_at).toLocaleDateString(
        isAr ? 'ar-SA' : 'en-US',
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      )
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
      : (provider.company_name_en || provider.company_name_ar)
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
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
                  <span className="text-xs text-muted-foreground">{trip.origin_code}</span>
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
                  <span className="text-xs text-muted-foreground">{trip.destination_code}</span>
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
            {t('booking.passenger_details')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">{t('booking.passenger_name')}</span>
                <p className="text-sm font-medium">{booking.passenger_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">{t('booking.passenger_phone')}</span>
                <p className="text-sm font-medium" dir="ltr">{booking.passenger_phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">{t('booking.passenger_email')}</span>
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

        {/* Provider info */}
        {provider && providerName && (
          <Link
            href={`/${locale}/providers/${provider.id}`}
            className="block rounded-xl border bg-card p-6 hover:border-accent/30 transition-colors"
          >
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" />
              {t('trips.posted_by')}
            </h3>
            <div className="flex items-center gap-3">
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
          </Link>
        )}
      </div>
    </div>
  )
}
