'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Car as CarIcon, MapPin, Users, Fuel, ArrowRight, ArrowLeft, Gauge, Plane, Building } from 'lucide-react'
import { cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { CAR_CATEGORIES, TRANSMISSION_TYPES, FUEL_TYPES } from '@/lib/constants'
import { LastMinuteBadge } from '@/components/ui/last-minute-badge'
import { FavoriteButton } from '@/components/shared/favorite-button'
import { BnplBadge } from '@/components/ui/bnpl-badge'
import { RibbonBadge, type RibbonKind } from '@/components/ui/ribbon-badge'
import type { Car } from '@/types'

type CarCardProps = {
  car: Car
  className?: string
  ribbon?: RibbonKind
}

export function CarCard({ car, className, ribbon }: CarCardProps) {
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
          'relative h-full flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-[border-color,box-shadow,transform] duration-200',
          'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
          className
        )}
      >
        {/* Image */}
        <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden">
          {firstImage ? (
            <Image src={firstImage} alt={`${brand} ${model}`} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CarIcon className="h-12 w-12 text-slate-300" />
            </div>
          )}
          <div className="absolute top-3 start-3 flex items-center gap-2">
            {ribbon && <RibbonBadge kind={ribbon} />}
            {car.is_last_minute && <LastMinuteBadge discount={car.discount_percentage} />}
          </div>
          <div className="absolute top-3 end-3">
            <span className="inline-flex items-center rounded-md border border-border bg-surface/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-foreground shadow-sm backdrop-blur-sm">
              {categoryText}
            </span>
          </div>
          <div className="absolute bottom-3 end-3 z-10">
            <FavoriteButton itemType="car" itemId={car.id} />
          </div>
        </div>

        <div className="flex flex-col h-full p-6">
          {/* Brand & Model */}
          <div className="mb-4">
            <h3 className="truncate text-lg font-black leading-tight text-foreground">
              {brand} {model}
            </h3>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">{city}</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground">{car.year}</span>
            </div>
            {pickupLocation && (
              <p className="mt-0.5 truncate ps-5 text-xs text-muted-foreground">{pickupLocation}</p>
            )}
          </div>

          {/* Meta Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold">{car.seats_count} {t('cars.seats')}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-muted-foreground">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold">{transmissionText}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-muted-foreground">
              <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold">{fuelText}</span>
            </div>
            {car.pickup_type && (
              <div className="flex items-center gap-1.5 bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/10 text-primary">
                {car.pickup_type === 'airport' ? <Plane className="h-3.5 w-3.5" /> : <Building className="h-3.5 w-3.5" />}
                <span className="text-xs font-semibold">{car.pickup_type === 'airport' ? (isAr ? 'مطار' : 'Airport') : (isAr ? 'فرع' : 'Branch')}</span>
              </div>
            )}
          </div>

          <div className="mt-auto">
            {/* Footer Price & CTA */}
            <div className="flex items-end justify-between border-t border-border pt-5">
              <div className="flex flex-col">
                <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('cars.price_per_day')}</span>
                {hasDiscount && (
                  <span className="mb-0.5 text-sm font-bold leading-none text-muted-foreground line-through">{originalFormatted}</span>
                )}
                <span className={cn('text-2xl font-black leading-none', hasDiscount ? 'text-accent' : 'text-foreground')}>{formattedPrice}</span>
                <BnplBadge price={car.price_per_day} currency={car.currency} className="mt-1.5" />
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground shadow-sm transition-[background-color,color,transform] duration-200 group-hover:bg-primary group-hover:text-primary-foreground ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                <Arrow className="h-4 w-4 rtl:rotate-180" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
