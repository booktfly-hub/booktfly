import { pick } from '@/lib/i18n-helpers'
import Link from 'next/link'
import { Flame, ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TripCard } from '@/components/trips/trip-card'
import { RoomCard } from '@/components/rooms/room-card'
import { CarCard } from '@/components/cars/car-card'
import type { Trip } from '@/types'
import type { Room } from '@/types'
import type { Car } from '@/types'

interface LastMinuteDealsProps {
  trips: Trip[]
  rooms: Room[]
  cars: Car[]
  locale: string
}

type DealItem =
  | { type: 'trip'; data: Trip; sortKey: number }
  | { type: 'room'; data: Room; sortKey: number }
  | { type: 'car'; data: Car; sortKey: number }

export function LastMinuteDeals({ trips, rooms, cars, locale }: LastMinuteDealsProps) {
  const t = useTranslations('common')
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const hasItems = trips.length > 0 || rooms.length > 0 || cars.length > 0
  if (!hasItems) return null

  // Build a unified list sorted by urgency (soonest first)
  const items: DealItem[] = [
    ...trips.map((trip) => ({
      type: 'trip' as const,
      data: trip,
      sortKey: new Date(trip.departure_at).getTime(),
    })),
    ...rooms.map((room) => ({
      type: 'room' as const,
      data: room,
      sortKey: new Date(room.created_at).getTime(),
    })),
    ...cars.map((car) => ({
      type: 'car' as const,
      data: car,
      sortKey: new Date(car.created_at).getTime(),
    })),
  ].sort((a, b) => a.sortKey - b.sortKey)

  return (
    <section className="relative py-16 md:py-20 border-t-4 border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 overflow-hidden">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-orange-200/30 blur-[100px]" />
        <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-amber-200/30 blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 rounded-full mb-4 shadow-md shadow-orange-500/20">
              <Flame className="h-4 w-4 text-white animate-pulse" />
              <span className="text-sm font-black text-white uppercase tracking-widest">
                {pick(locale, 'عروض اللحظة الأخيرة', 'Last Minute Deals', 'Son Dakika Fırsatları')}
              </span>
              <Flame className="h-4 w-4 text-white animate-pulse" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
              {pick(locale, 'عروض اللحظة الأخيرة', 'Last Minute Deals', 'Son Dakika Fırsatları')}
            </h2>
            <p className="mt-2 text-base text-slate-600 font-medium">
              {pick(locale, 'أسرع! هذه العروض تنتهي قريباً', 'Hurry! These deals are expiring soon', 'Acele edin! Bu fırsatların süresi yakında doluyor')}
            </p>
          </div>

          <div>
            <Link
              href={`/${locale}/trips?last_minute=true`}
              className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-white border border-orange-200 text-slate-900 font-bold hover:bg-orange-50 hover:border-orange-300 transition-all shadow-sm"
            >
              {pick(locale, 'عرض جميع العروض', 'View All Deals', 'Tüm Fırsatları Görüntüle')}
              <Arrow className="h-4 w-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Horizontal scrollable row of mixed results */}
        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 -mx-4 px-4 scrollbar-hide">
          {items.map((item) => {
            if (item.type === 'trip') {
              return (
                <div
                  key={`trip-${item.data.id}`}
                  className="shrink-0 w-[340px] sm:w-[380px] snap-start transition-transform duration-300 hover:-translate-y-1"
                >
                  <TripCard
                    trip={item.data}
                    className="h-full border-orange-200/60 shadow-sm bg-white p-6"
                  />
                </div>
              )
            }
            if (item.type === 'room') {
              return (
                <div
                  key={`room-${item.data.id}`}
                  className="shrink-0 w-[340px] sm:w-[380px] snap-start transition-transform duration-300 hover:-translate-y-1"
                >
                  <RoomCard
                    room={item.data}
                    className="h-full border-orange-200/60 shadow-sm bg-white"
                  />
                </div>
              )
            }
            if (item.type === 'car') {
              return (
                <div
                  key={`car-${item.data.id}`}
                  className="shrink-0 w-[340px] sm:w-[380px] snap-start transition-transform duration-300 hover:-translate-y-1"
                >
                  <CarCard
                    car={item.data}
                    className="h-full border-orange-200/60 shadow-sm bg-white"
                  />
                </div>
              )
            }
            return null
          })}

          {/* View All Deals card at the end */}
          <div className="shrink-0 w-[280px] snap-start flex items-center justify-center">
            <Link
              href={`/${locale}/trips?last_minute=true`}
              className="group flex flex-col items-center justify-center gap-4 w-full h-full min-h-[280px] rounded-[2rem] border-2 border-dashed border-orange-300 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-orange-400 transition-all duration-300"
            >
              <div className="h-14 w-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                <Arrow className="h-6 w-6 text-white rtl:rotate-180" />
              </div>
              <span className="text-base font-black text-slate-900">
                {pick(locale, 'عرض جميع العروض', 'View All Deals', 'Tüm Fırsatları Görüntüle')}
              </span>
              <span className="text-sm text-slate-500 font-medium">
                {pick(locale, `${items.length}+ عرض متاح`, `${items.length}+ deals available`)}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
