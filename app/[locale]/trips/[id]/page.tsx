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
  Clock,
  Users,
  CreditCard,
  Shield,
  Building2,
  Minus,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn, formatPrice, formatPriceEN, shortId } from '@/lib/utils'
import { TRIP_TYPES, CABIN_CLASSES, PROVIDER_TYPES, MAX_SEATS_PER_BOOKING } from '@/lib/constants'
import { TripStatusBadge } from '@/components/trips/trip-status-badge'
import { SeatsIndicator } from '@/components/trips/seats-indicator'
import { DetailPageSkeleton } from '@/components/shared/loading-skeleton'
import type { Trip } from '@/types'

export default function TripDetailPage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [seatsCount, setSeatsCount] = useState(1)

  const Arrow = isAr ? ArrowLeft : ArrowRight
  const Back = isAr ? ChevronRight : ChevronLeft

  useEffect(() => {
    async function fetchTrip() {
      try {
        const res = await fetch(`/api/trips/${tripId}`)
        const data = await res.json()
        if (data.trip) {
          setTrip(data.trip)
        }
      } catch {
        // Error handled
      } finally {
        setLoading(false)
      }
    }
    fetchTrip()
  }, [tripId])

  if (loading) return <DetailPageSkeleton />

  if (!trip) {
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

  const originCity = isAr ? trip.origin_city_ar : (trip.origin_city_en || trip.origin_city_ar)
  const destCity = isAr ? trip.destination_city_ar : (trip.destination_city_en || trip.destination_city_ar)
  const remaining = trip.total_seats - trip.booked_seats
  const maxBookable = Math.min(remaining, MAX_SEATS_PER_BOOKING)
  const totalPrice = trip.price_per_seat * seatsCount
  const fmt = isAr ? formatPrice : formatPriceEN

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

  const providerName = trip.provider
    ? isAr
      ? trip.provider.company_name_ar
      : (trip.provider.company_name_en || trip.provider.company_name_ar)
    : null

  const providerDesc = trip.provider
    ? isAr
      ? trip.provider.company_description_ar
      : (trip.provider.company_description_en || trip.provider.company_description_ar)
    : null

  const tripDesc = isAr
    ? trip.description_ar
    : (trip.description_en || trip.description_ar)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <Back className="h-4 w-4" />
        {t('common.back')}
      </button>

      {/* Not available banner */}
      {isNotAvailable && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">
            {t('trips.not_available')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Plane className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{trip.airline}</h2>
                  {trip.flight_number && (
                    <p className="text-xs text-muted-foreground">
                      {t('trips.flight_number')}: {trip.flight_number}
                    </p>
                  )}
                </div>
              </div>
              <TripStatusBadge status={trip.status} />
            </div>

            {/* Route */}
            <div className="flex items-center gap-4 py-6 border-t border-b">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="text-sm text-muted-foreground">{t('common.from')}</span>
                </div>
                <p className="text-xl font-bold text-foreground">{originCity}</p>
                {trip.origin_code && (
                  <span className="text-sm text-muted-foreground">{trip.origin_code}</span>
                )}
              </div>
              <Arrow className="h-6 w-6 text-accent shrink-0" />
              <div className="flex-1 text-end">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">{t('common.to')}</span>
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <p className="text-xl font-bold text-foreground">{destCity}</p>
                {trip.destination_code && (
                  <span className="text-sm text-muted-foreground">{trip.destination_code}</span>
                )}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t('trips.departure')}</span>
                </div>
                <p className="text-sm font-medium">{departureDate}</p>
                <p className="text-xs text-muted-foreground">{departureTime}</p>
              </div>
              {returnDate && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t('trips.return_date')}</span>
                  </div>
                  <p className="text-sm font-medium">{returnDate}</p>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t('trips.trip_type')}</span>
                </div>
                <p className="text-sm font-medium">
                  {isAr ? TRIP_TYPES[trip.trip_type].ar : TRIP_TYPES[trip.trip_type].en}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t('trips.cabin_class')}</span>
                </div>
                <p className="text-sm font-medium">
                  {isAr ? CABIN_CLASSES[trip.cabin_class].ar : CABIN_CLASSES[trip.cabin_class].en}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {tripDesc && (
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-3">{t('common.description')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{tripDesc}</p>
            </div>
          )}

          {/* Seats */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">{t('trips.total_seats')}</h3>
            <SeatsIndicator
              totalSeats={trip.total_seats}
              bookedSeats={trip.booked_seats}
            />
          </div>

          {/* Provider card */}
          {trip.provider && (
            <Link
              href={`/${locale}/providers/${trip.provider.id}`}
              className="block rounded-xl border bg-card p-6 hover:border-accent/30 transition-colors"
            >
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-accent" />
                {t('trips.posted_by')}
              </h3>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  {trip.provider.logo_url ? (
                    <img
                      src={trip.provider.logo_url}
                      alt={providerName || ''}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-accent" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{providerName}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium mt-1">
                    {isAr
                      ? PROVIDER_TYPES[trip.provider.provider_type].ar
                      : PROVIDER_TYPES[trip.provider.provider_type].en}
                  </span>
                  {providerDesc && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {providerDesc}
                    </p>
                  )}
                  {/* Document badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {trip.provider.has_commercial_reg && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">
                        <Shield className="h-3 w-3" />
                        {isAr ? 'سجل تجاري' : 'CR Verified'}
                      </span>
                    )}
                    {trip.provider.has_iata_permit && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">
                        <Shield className="h-3 w-3" />
                        IATA
                      </span>
                    )}
                    {trip.provider.has_hajj_permit && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">
                        <Shield className="h-3 w-3" />
                        {isAr ? 'تصريح حج' : 'Hajj Permit'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Sidebar: Booking section */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border bg-card p-6 space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">{t('trips.price_per_seat')}</p>
              <p className="text-3xl font-bold text-accent">{fmt(trip.price_per_seat)}</p>
            </div>

            {isBookable && (
              <>
                {/* Seats selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('booking.seats_count')}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSeatsCount(Math.max(1, seatsCount - 1))}
                      disabled={seatsCount <= 1}
                      className="h-10 w-10 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-xl font-bold w-12 text-center">{seatsCount}</span>
                    <button
                      onClick={() => setSeatsCount(Math.min(maxBookable, seatsCount + 1))}
                      disabled={seatsCount >= maxBookable}
                      className="h-10 w-10 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {remaining} {t('trips.seats_remaining')}
                  </p>
                </div>

                {/* Price summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {fmt(trip.price_per_seat)} x {seatsCount} {t('common.seats')}
                    </span>
                    <span className="font-medium">{fmt(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-lg pt-2 border-t">
                    <span>{t('common.total')}</span>
                    <span className="text-accent">{fmt(totalPrice)}</span>
                  </div>
                </div>

                {/* Book button */}
                <Link
                  href={`/${locale}/trips/${trip.id}/book?seats=${seatsCount}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  {t('trips.book_now')}
                </Link>
              </>
            )}

            {isSoldOut && (
              <button
                disabled
                className="w-full py-3 rounded-lg bg-muted text-muted-foreground font-semibold text-sm cursor-not-allowed"
              >
                {t('trips.sold_out')}
              </button>
            )}

            {isNotAvailable && (
              <button
                disabled
                className="w-full py-3 rounded-lg bg-destructive/10 text-destructive font-semibold text-sm cursor-not-allowed"
              >
                {t('trips.not_available')}
              </button>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {t('booking.terms_agreement')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
