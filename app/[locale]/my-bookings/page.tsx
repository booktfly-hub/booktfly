'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Plane,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Ticket,
  Users,
} from 'lucide-react'
import { cn, formatPrice, formatPriceEN, shortId } from '@/lib/utils'
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import type { Booking } from '@/types'

export default function MyBookingsPage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const Arrow = isAr ? ArrowLeft : ArrowRight

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch('/api/bookings/mine')
        const data = await res.json()
        setBookings(data.bookings || [])
      } catch {
        // Error handled
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const fmt = isAr ? formatPrice : formatPriceEN

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">
        {t('booking.my_bookings_title')}
      </h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          message={t('booking.no_bookings')}
          actionLabel={t('nav.browse_trips')}
          actionHref={`/${locale}/trips`}
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const trip = booking.trip
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
                  { year: 'numeric', month: 'short', day: 'numeric' }
                )
              : ''
            const createdDate = new Date(booking.created_at).toLocaleDateString(
              isAr ? 'ar-SA' : 'en-US',
              { year: 'numeric', month: 'short', day: 'numeric' }
            )

            return (
              <Link
                key={booking.id}
                href={`/${locale}/my-bookings/${booking.id}`}
                className="block"
              >
                <div className="rounded-xl border bg-card p-5 hover:shadow-md hover:border-accent/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-mono font-medium text-foreground">
                        #{shortId(booking.id)}
                      </span>
                      <span>{createdDate}</span>
                    </div>
                    <BookingStatusBadge status={booking.status} />
                  </div>

                  {trip && (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <Plane className="h-4 w-4 text-accent shrink-0" />
                        <span className="font-semibold">{originCity}</span>
                        <Arrow className="h-4 w-4 text-accent shrink-0" />
                        <span className="font-semibold">{destCity}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {departureDate}
                        </span>
                        <span>{trip.airline}</span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {booking.seats_count} {t('common.seats')}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-accent">
                      {fmt(booking.total_amount)}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
