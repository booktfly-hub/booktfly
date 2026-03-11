'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Plane, Calendar, Users, ArrowRight, ArrowLeft } from 'lucide-react'
import { cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { TRIP_TYPES, CABIN_CLASSES, PROVIDER_TYPES } from '@/lib/constants'
import { TripStatusBadge } from './trip-status-badge'
import { SeatsIndicator } from './seats-indicator'
import type { Trip } from '@/types'

type TripCardProps = {
  trip: Trip
  className?: string
}

export function TripCard({ trip, className }: TripCardProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  const originCity = isAr ? trip.origin_city_ar : (trip.origin_city_en || trip.origin_city_ar)
  const destCity = isAr ? trip.destination_city_ar : (trip.destination_city_en || trip.destination_city_ar)
  const remaining = trip.total_seats - trip.booked_seats
  const tripType = TRIP_TYPES[trip.trip_type]
  const cabinClass = CABIN_CLASSES[trip.cabin_class]
  const formattedPrice = isAr ? formatPrice(trip.price_per_seat) : formatPriceEN(trip.price_per_seat)

  const Arrow = isAr ? ArrowLeft : ArrowRight

  const providerName = trip.provider
    ? isAr
      ? trip.provider.company_name_ar
      : (trip.provider.company_name_en || trip.provider.company_name_ar)
    : null

  const providerType = trip.provider
    ? PROVIDER_TYPES[trip.provider.provider_type]
    : null

  const departureDate = new Date(trip.departure_at).toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
  )

  return (
    <Link href={`/${locale}/trips/${trip.id}`} className="block group">
      <div
        className={cn(
          'rounded-xl border bg-card p-5 transition-all duration-200',
          'hover:shadow-lg hover:border-accent/30 hover:-translate-y-0.5',
          'group-focus-visible:ring-2 group-focus-visible:ring-ring',
          className
        )}
      >
        {/* Header: Airline + Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">
              {trip.airline}
            </span>
          </div>
          <TripStatusBadge status={trip.status} />
        </div>

        {/* Route */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <p className="font-semibold text-foreground text-lg">
              {originCity}
            </p>
            {trip.origin_code && (
              <span className="text-xs text-muted-foreground">{trip.origin_code}</span>
            )}
          </div>
          <Arrow className="h-5 w-5 text-accent shrink-0" />
          <div className="flex-1 text-end">
            <p className="font-semibold text-foreground text-lg">
              {destCity}
            </p>
            {trip.destination_code && (
              <span className="text-xs text-muted-foreground">{trip.destination_code}</span>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{departureDate}</span>
        </div>

        {/* Badges: Trip Type + Cabin Class */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
            {isAr ? tripType.ar : tripType.en}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
            {isAr ? cabinClass.ar : cabinClass.en}
          </span>
        </div>

        {/* Seats indicator */}
        <SeatsIndicator
          totalSeats={trip.total_seats}
          bookedSeats={trip.booked_seats}
          compact
          className="mb-4"
        />

        {/* Footer: Price + Provider */}
        <div className="flex items-end justify-between pt-3 border-t">
          <div>
            <p className="text-xl font-bold text-accent">{formattedPrice}</p>
            <p className="text-xs text-muted-foreground">{t('common.per_seat')}</p>
          </div>
          {providerName && (
            <div className="text-end">
              <p className="text-sm font-medium text-foreground">{providerName}</p>
              {providerType && (
                <p className="text-xs text-muted-foreground">
                  {isAr ? providerType.ar : providerType.en}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
