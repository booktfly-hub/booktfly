'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Car as CarIcon, MapPin, Users, Fuel, ArrowRight, ArrowLeft, Gauge } from 'lucide-react'
import { cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { CAR_CATEGORIES, TRANSMISSION_TYPES, FUEL_TYPES } from '@/lib/constants'
import { LastMinuteBadge } from '@/components/ui/last-minute-badge'
import type { Car } from '@/types'

type CarCardProps = {
  car: Car
  className?: string
}

export function CarCard({ car, className }: CarCardProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  const brand = isAr ? car.brand_ar : (car.brand_en || car.brand_ar)
  const model = isAr ? car.model_ar : (car.model_en || car.model_ar)
  const city = isAr ? car.city_ar : (car.city_en || car.city_ar)
  const pickupLocation = isAr ? car.pickup_location_ar : (car.pickup_location_en || car.pickup_location_ar)
  const categoryLabel = CAR_CATEGORIES[car.category as keyof typeof CAR_CATEGORIES]
  const categoryText = categoryLabel ? (isAr ? categoryLabel.ar : categoryLabel.en) : car.category
  const transmissionLabel = TRANSMISSION_TYPES[car.transmission as keyof typeof TRANSMISSION_TYPES]
  const transmissionText = transmissionLabel ? (isAr ? transmissionLabel.ar : transmissionLabel.en) : car.transmission
  const fuelLabel = FUEL_TYPES[car.fuel_type as keyof typeof FUEL_TYPES]
  const fuelText = fuelLabel ? (isAr ? fuelLabel.ar : fuelLabel.en) : car.fuel_type
  const formattedPrice = isAr ? formatPrice(car.price_per_day, car.currency) : formatPriceEN(car.price_per_day, car.currency)
  const hasDiscount = car.discount_percentage > 0 && car.original_price
  const originalFormatted = hasDiscount
    ? (isAr ? formatPrice(car.original_price!, car.currency) : formatPriceEN(car.original_price!, car.currency))
    : null

  const Arrow = isAr ? ArrowLeft : ArrowRight
  const firstImage = car.images?.[0]

  return (
    <Link href={`/${locale}/cars/${car.id}`} className="block group h-full focus:outline-none">
      <div
        className={cn(
          'relative h-full flex flex-col rounded-[2rem] border border-slate-200 bg-white overflow-hidden transition-all duration-300',
          'hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1',
          className
        )}
      >
        {/* Image */}
        <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden">
          {firstImage ? (
            <img src={firstImage} alt={`${brand} ${model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CarIcon className="h-12 w-12 text-slate-300" />
            </div>
          )}
          <div className="absolute top-3 start-3 flex items-center gap-2">
            {car.is_last_minute && <LastMinuteBadge discount={car.discount_percentage} />}
          </div>
          <div className="absolute top-3 end-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/90 backdrop-blur-sm text-slate-700 border border-white/50 shadow-sm">
              {categoryText}
            </span>
          </div>
        </div>

        <div className="flex flex-col h-full p-6">
          {/* Brand & Model */}
          <div className="mb-4">
            <h3 className="text-lg font-black text-slate-900 leading-tight truncate">
              {brand} {model}
            </h3>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-semibold text-slate-500">{city}</span>
              </div>
              <span className="text-xs font-bold text-slate-400">{car.year}</span>
            </div>
            {pickupLocation && (
              <p className="text-xs text-slate-400 truncate mt-0.5 ps-5">{pickupLocation}</p>
            )}
          </div>

          {/* Meta Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-slate-600">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold">{car.seats_count} {t('cars.seats')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-slate-600">
              <Gauge className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold">{transmissionText}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-slate-600">
              <Fuel className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold">{fuelText}</span>
            </div>
          </div>

          <div className="mt-auto">
            {/* Footer Price & CTA */}
            <div className="flex items-end justify-between pt-5 border-t border-slate-100">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('cars.price_per_day')}</span>
                {hasDiscount && (
                  <span className="text-sm font-bold text-slate-400 line-through leading-none mb-0.5">{originalFormatted}</span>
                )}
                <span className={cn('text-2xl font-black leading-none', hasDiscount ? 'text-orange-600' : 'text-slate-900')}>{formattedPrice}</span>
              </div>

              <div className="h-10 w-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:shadow-primary/20 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1 shrink-0">
                <Arrow className="h-4 w-4 rtl:rotate-180" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
