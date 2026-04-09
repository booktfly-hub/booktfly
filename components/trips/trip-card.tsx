import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Plane, Calendar, Clock, ArrowRight, ArrowLeft, Star, BadgeCheck, TrendingUp } from 'lucide-react'
import { capitalizeFirst, cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { CABIN_CLASSES } from '@/lib/constants'
import { TripStatusBadge } from './trip-status-badge'
import { SeatsIndicator } from './seats-indicator'
import { getCountryCode } from '@/lib/countries'
import { isLastMinute } from '@/lib/last-minute'
import { LastMinuteBadge } from '@/components/ui/last-minute-badge'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { FavoriteButton } from '@/components/shared/favorite-button'
import type { Trip } from '@/types'

type TripCardProps = {
  trip: Trip
  className?: string
}

export function TripCard({ trip, className }: TripCardProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  const originCity = isAr ? trip.origin_city_ar : capitalizeFirst(trip.origin_city_en || trip.origin_city_ar)
  const destCity = isAr ? trip.destination_city_ar : capitalizeFirst(trip.destination_city_en || trip.destination_city_ar)
  const cabinClass = CABIN_CLASSES[trip.cabin_class]
  const formattedPrice = isAr ? formatPrice(trip.price_per_seat, trip.currency) : formatPriceEN(trip.price_per_seat, trip.currency)
  const lastMinute = isLastMinute(trip.departure_at)
  const remaining = trip.total_seats - trip.booked_seats
  const hasDiscount = trip.discount_percentage > 0 && trip.original_price
  const originalFormatted = hasDiscount
    ? (isAr ? formatPrice(trip.original_price!, trip.currency) : formatPriceEN(trip.original_price!, trip.currency))
    : null
  const Arrow = isAr ? ArrowLeft : ArrowRight

  // Inline social proof logic (avoids client module boundary issue)
  const isTopRated = trip.provider?.avg_rating && trip.provider.avg_rating >= 4.5 && (trip.provider.review_count || 0) >= 3
  const isMostBooked = !isTopRated && trip.total_seats && trip.booked_seats && trip.booked_seats / trip.total_seats >= 0.7

  const departureDate = new Date(trip.departure_at).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  )

  const departureTime = new Date(trip.departure_at).toLocaleTimeString(
    'en-US',
    { hour: '2-digit', minute: '2-digit' }
  )

  const originCountry = getCountryCode(trip.origin_code, trip.origin_city_en || trip.origin_city_ar)
  const destCountry = getCountryCode(trip.destination_code, trip.destination_city_en || trip.destination_city_ar)

  return (
    <div className="relative h-full">
      <FavoriteButton itemType="trip" itemId={trip.id} className="absolute top-4 end-4 z-10" />
    <Link href={`/${locale}/trips/${trip.id}`} className="block group h-full focus:outline-none">
      <div
        className={cn(
          'relative h-full flex flex-col rounded-[2rem] border border-slate-200 bg-white overflow-hidden transition-all duration-300',
          'hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1',
          className
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Social Proof Badge (inline) */}
          {(isTopRated || isMostBooked) && (
            <div className="mb-3">
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                isTopRated ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
              )}>
                {isTopRated ? <Star className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {isTopRated
                  ? (isAr ? 'الأعلى تقييماً' : 'Top Rated')
                  : (isAr ? 'الأكثر حجزاً' : 'Most Booked')}
              </span>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors duration-300">
                <Plane className="h-5 w-5 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 leading-none">{trip.airline}</span>
                  {trip.provider?.is_verified && (
                    <BadgeCheck className="h-4 w-4 fill-blue-600 text-white" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] md:text-xs font-medium text-slate-500">
                    {isAr ? cabinClass.ar : cabinClass.en} {trip.flight_number && `• ${trip.flight_number}`}
                  </span>
                  {(trip.provider?.avg_rating ?? 0) > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {trip.provider!.avg_rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastMinute && <LastMinuteBadge discount={trip.discount_percentage} />}
              <TripStatusBadge status={trip.status} />
            </div>
          </div>

          {/* Route Section */}
          <div className="grid grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_84px_minmax(0,1fr)] items-center gap-3 mb-6">
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                {t('common.from')}
              </p>
              <p className="font-black text-slate-900 sm:text-2xl">
                {originCity}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {originCountry && (
                  <Image src={`https://flagcdn.com/w20/${originCountry}.png`} alt={originCountry} width={20} height={15} className="h-3 w-4 rounded-sm object-cover shadow-sm" />
                )}
                <span className="text-xs font-bold text-slate-400">{trip.origin_code?.toUpperCase()}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center w-full gap-1.5">
                <div className="h-[2px] flex-1 bg-slate-200 rounded-full" />
                <Arrow className="h-4 w-4 shrink-0 text-primary" />
                <div className="h-[2px] flex-1 bg-slate-200 rounded-full" />
              </div>
            </div>

            <div className="min-w-0 text-end">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                {t('common.to')}
              </p>
              <p className="font-black text-slate-900 sm:text-2xl">
                {destCity}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                {destCountry && (
                  <Image src={`https://flagcdn.com/w20/${destCountry}.png`} alt={destCountry} width={20} height={15} className="h-3 w-4 rounded-sm object-cover shadow-sm" />
                )}
                <span className="text-xs font-bold text-slate-400">{trip.destination_code?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Meta Information Pills */}
          <div className={cn('grid items-center gap-2 mb-6', lastMinute ? 'grid-cols-3' : 'grid-cols-2')}>
             <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold">{departureDate}</span>
             </div>
             <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-slate-600">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold">{departureTime}</span>
             </div>
             {lastMinute && (
               <CountdownTimer targetDate={trip.departure_at} compact />
             )}
          </div>

          <div className="mt-auto">
             {/* Seats indicator */}
             <div className="mb-5">
               <SeatsIndicator
                  totalSeats={trip.total_seats}
                  bookedSeats={trip.booked_seats}
                  compact
                  className="h-1.5"
                />
             </div>

             {/* Urgency indicator */}
             {lastMinute && remaining <= 3 && remaining > 0 && (
               <p className="text-xs font-bold text-destructive mb-3 animate-pulse">
                 {isAr ? `متبقي ${remaining} فقط!` : `Only ${remaining} left!`}
               </p>
             )}

             {/* Footer Price & CTA */}
             <div className="flex items-end justify-between pt-5 border-t border-slate-100">
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('common.per_seat')}</span>
                 {hasDiscount && (
                   <span className="text-sm font-bold text-slate-400 line-through leading-none mb-0.5">{originalFormatted}</span>
                 )}
                 <span className={cn('text-2xl font-black leading-none', hasDiscount ? 'text-orange-600' : 'text-slate-900')}>{formattedPrice}</span>
               </div>
               
               <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center transition-all duration-300 shadow-sm group-hover:bg-[var(--color-primary)] group-hover:text-white group-hover:shadow-md group-hover:shadow-[color:var(--color-primary)]/20 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1 shrink-0">
                 <Arrow className="h-4 w-4 rtl:rotate-180 text-current" />
               </div>
             </div>
          </div>
        </div>
      </div>
    </Link>
    </div>
  )
}
