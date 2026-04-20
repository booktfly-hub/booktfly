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
  BedDouble,
  Clock,
  CarFront,
  PackageIcon,
} from 'lucide-react'
import { capitalizeFirst, formatPrice, formatPriceEN, shortId } from '@/lib/utils'
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge'
import { ContractPill } from '@/components/bookings/contract-pill'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { GuestBookingLookup } from '@/components/auth/guest-booking-lookup'
import type { Booking, RoomBooking, CarBooking, PackageBooking } from '@/types'

type BuyerBookingItem =
  | { kind: 'flight'; item: Booking }
  | { kind: 'room'; item: RoomBooking }
  | { kind: 'car'; item: CarBooking }
  | { kind: 'package'; item: PackageBooking }

export default function MyBookingsPage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [bookings, setBookings] = useState<BuyerBookingItem[]>([])
  const [loading, setLoading] = useState(true)

  const Arrow = isAr ? ArrowLeft : ArrowRight

  useEffect(() => {
    async function fetchBookings() {
      try {
        const [flightRes, roomRes, carRes, packageRes] = await Promise.all([
          fetch('/api/bookings/mine'),
          fetch('/api/room-bookings/mine'),
          fetch('/api/car-bookings/mine'),
          fetch('/api/package-bookings/mine'),
        ])
        const [flightData, roomData, carData, packageData] = await Promise.all([flightRes.json(), roomRes.json(), carRes.json(), packageRes.json()])
        const merged: BuyerBookingItem[] = [
          ...((flightData.bookings || []).map((item: Booking) => ({ kind: 'flight' as const, item }))),
          ...((roomData.bookings || []).map((item: RoomBooking) => ({ kind: 'room' as const, item }))),
          ...((carData.bookings || []).map((item: CarBooking) => ({ kind: 'car' as const, item }))),
          ...((packageData.bookings || []).map((item: PackageBooking) => ({ kind: 'package' as const, item }))),
        ].sort((a, b) => new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime())
        setBookings(merged)
      } catch {
        // Error handled
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const fmt = (amount: number, currency?: string) => isAr ? formatPrice(amount, currency || 'SAR') : formatPriceEN(amount, currency || 'SAR')

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
        <div className="space-y-6">
          <EmptyState
            icon={Ticket}
            message={t('booking.no_bookings')}
            actionLabel={t('nav.browse_trips')}
            actionHref={`/${locale}/trips`}
          />
          {/* Guest lookup fallback — P1-18 */}
          <GuestBookingLookup />
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(({ kind, item }) => {
            const isRoom = kind === 'room'
            const isCar = kind === 'car'
            const isPackage = kind === 'package'
            const booking = !isRoom && !isCar && !isPackage ? item as Booking : null
            const roomBooking = isRoom ? item as RoomBooking : null
            const carBooking = isCar ? item as CarBooking : null
            const packageBooking = isPackage ? item as PackageBooking : null
            const trip = booking?.trip
            const room = roomBooking?.room
            const car = carBooking?.car
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
                  isAr ? 'ar-SA' : 'en-US',
                  { year: 'numeric', month: 'short', day: 'numeric' }
                )
              : ''
            const roomName = room ? (isAr ? room.name_ar : (room.name_en || room.name_ar)) : ''
            const roomCity = room ? (isAr ? room.city_ar : capitalizeFirst(room.city_en || room.city_ar)) : ''
            const carName = car ? (isAr ? `${car.brand_ar} ${car.model_ar}` : `${car.brand_en || car.brand_ar} ${car.model_en || car.model_ar}`) : ''
            const carCity = car ? (isAr ? car.city_ar : capitalizeFirst(car.city_en || car.city_ar)) : ''
            const createdDate = new Date(item.created_at).toLocaleDateString(
              isAr ? 'ar-SA' : 'en-US',
              { year: 'numeric', month: 'short', day: 'numeric' }
            )

            return (
              <Link
                key={item.id}
                href={isPackage ? `/${locale}/my-bookings/packages/${item.id}` : isCar ? `/${locale}/my-bookings/cars/${item.id}` : isRoom ? `/${locale}/my-bookings/rooms/${item.id}` : `/${locale}/my-bookings/${item.id}`}
                className="block"
              >
                <div className="rounded-xl border bg-card p-5 hover:shadow-md hover:border-accent/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-mono font-medium text-foreground">
                        #{shortId(item.id)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        {isPackage ? (isAr ? 'باقة' : 'Package') : isCar ? (isAr ? 'سيارة' : 'Car') : isRoom ? (isAr ? 'غرفة' : 'Room') : (isAr ? 'رحلة' : 'Flight')}
                      </span>
                      <span>{createdDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ContractPill
                        signedAt={(item as Booking | RoomBooking | CarBooking | PackageBooking).contract_signed_at}
                        targetType={isPackage ? 'package_booking' : isCar ? 'car_booking' : isRoom ? 'room_booking' : 'booking'}
                        bookingId={item.id}
                      />
                      <BookingStatusBadge status={item.status} />
                    </div>
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

                  {roomBooking && room && (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <BedDouble className="h-4 w-4 text-accent shrink-0" />
                        <span className="font-semibold">{roomName}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {roomBooking.check_in_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {roomBooking.number_of_days} {isAr ? 'ليالٍ' : 'nights'}
                        </span>
                        <span>{roomCity}</span>
                      </div>
                    </>
                  )}

                  {carBooking && car && (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <CarFront className="h-4 w-4 text-accent shrink-0" />
                        <span className="font-semibold">{carName}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {carBooking.pickup_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {carBooking.number_of_days} {isAr ? 'يوم' : 'days'}
                        </span>
                        <span>{carCity}</span>
                      </div>
                    </>
                  )}

                  {packageBooking && (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <PackageIcon className="h-4 w-4 text-accent shrink-0" />
                        <span className="font-semibold">
                          {isAr
                            ? (packageBooking.package as PackageBooking['package'])?.name_ar
                            : ((packageBooking.package as PackageBooking['package'])?.name_en || (packageBooking.package as PackageBooking['package'])?.name_ar)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {packageBooking.start_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {packageBooking.number_of_people} {isAr ? 'أشخاص' : 'people'}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      {booking && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {booking.seats_count} {t('common.seats')}
                        </span>
                      )}
                      {roomBooking && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {roomBooking.number_of_people} {isAr ? 'ضيف' : 'guest(s)'}
                        </span>
                      )}
                      {carBooking && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {carBooking.number_of_days} {isAr ? 'يوم' : 'day(s)'}
                        </span>
                      )}
                      {packageBooking && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {packageBooking.number_of_people} {isAr ? 'أشخاص' : 'people'}
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-accent">
                      {fmt(item.total_amount, booking?.trip?.currency || room?.currency || car?.currency || packageBooking?.package?.currency)}
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
