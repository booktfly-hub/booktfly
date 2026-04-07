'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { Plane, BedDouble, CarFront, MapPin, Calendar, Users, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LastMinuteBadge } from '@/components/ui/last-minute-badge'
import type { Package } from '@/types/database'

type PackageCardProps = {
  pkg: Package
  locale?: string
}

export function PackageCard({ pkg, locale: localeProp }: PackageCardProps) {
  const localeHook = useLocale()
  const locale = localeProp || localeHook
  const isAr = locale === 'ar'

  const name = isAr ? pkg.name_ar : (pkg.name_en || pkg.name_ar)
  const destination = isAr ? pkg.destination_city_ar : (pkg.destination_city_en || pkg.destination_city_ar)
  const availableSpots = pkg.max_bookings - pkg.current_bookings
  const hasDiscount = pkg.original_price != null && pkg.original_price > pkg.total_price
  const savings = hasDiscount ? pkg.original_price! - pkg.total_price : 0
  const roomBasisLabel = pkg.room_basis
    ? ({
        single: isAr ? 'فردية' : 'Single',
        double: isAr ? 'مزدوجة' : 'Double',
        triple: isAr ? 'ثلاثية' : 'Triple',
        quad: isAr ? 'رباعية' : 'Quad',
      }[pkg.room_basis] || pkg.room_basis)
    : null

  const formatPrice = (amount: number) => {
    const formatted = amount.toLocaleString(isAr ? 'ar-SA' : 'en-SA')
    return `${formatted} ${isAr ? 'ر.س' : 'SAR'}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const Arrow = isAr ? ArrowLeft : ArrowRight
  const firstImage = pkg.images?.[0]

  return (
    <Link href={`/${locale}/packages/${pkg.id}`} className="block group h-full focus:outline-none">
      <div
        className={cn(
          'relative h-full flex flex-col rounded-[2rem] border border-slate-200 bg-white overflow-hidden transition-all duration-300',
          'hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1'
        )}
      >
        {/* Image */}
        <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden">
          {firstImage ? (
            <Image
              src={firstImage}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Sparkles className="h-12 w-12 text-primary/30" />
            </div>
          )}
          <div className="absolute top-3 start-3 flex items-center gap-2">
            {pkg.is_last_minute && <LastMinuteBadge discount={pkg.discount_percentage} />}
          </div>
          <div className="absolute top-3 end-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/90 backdrop-blur-sm text-slate-700 border border-white/50 shadow-sm">
              <Users className="h-3 w-3 me-1" />
              {availableSpots} {isAr ? 'متاح' : 'left'}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          {/* Package Name */}
          <h3 className="text-lg font-black text-slate-900 leading-tight truncate">
            {name}
          </h3>

          {/* Destination */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-sm font-semibold text-slate-500">{destination}</span>
          </div>

          {/* Includes Pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {pkg.includes_flight && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <Plane className="h-3.5 w-3.5" />
                {isAr ? 'رحلة' : 'Flight'}
              </span>
            )}
            {pkg.includes_hotel && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <BedDouble className="h-3.5 w-3.5" />
                {isAr ? 'فندق' : 'Hotel'}
              </span>
            )}
            {pkg.includes_car && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <CarFront className="h-3.5 w-3.5" />
                {isAr ? 'سيارة' : 'Car'}
              </span>
            )}
          </div>

          {/* Date Range */}
          {pkg.start_date && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold">
                {formatDate(pkg.start_date)}
                {pkg.end_date && ` — ${formatDate(pkg.end_date)}`}
              </span>
            </div>
          )}

          {(pkg.duration_days || roomBasisLabel) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {pkg.duration_days && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <Calendar className="h-3.5 w-3.5" />
                  {pkg.duration_days} {isAr ? 'أيام' : 'Days'}
                </span>
              )}
              {roomBasisLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <BedDouble className="h-3.5 w-3.5" />
                  {roomBasisLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price Footer */}
        <div className="mt-auto border-t border-slate-100 px-5 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-sm font-bold text-slate-400 line-through leading-none mb-0.5">
                {formatPrice(pkg.original_price!)}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className={cn('text-2xl font-black leading-none', hasDiscount ? 'text-orange-600' : 'text-slate-900')}>
                {formatPrice(pkg.total_price)}
              </span>
              <span className="text-xs text-muted-foreground">/ {isAr ? 'للشخص' : 'person'}</span>
            </div>
            {savings > 0 && (
              <span className="mt-1 text-xs font-bold text-emerald-600">
                {isAr
                  ? `وفر ${savings.toLocaleString('ar-SA')} ر.س مع الباقة`
                  : `Save ${savings.toLocaleString('en-SA')} SAR with the package`}
              </span>
            )}
          </div>

          <div className="h-10 w-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:shadow-primary/20 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1 shrink-0">
            <Arrow className="h-4 w-4 rtl:rotate-180" />
          </div>
        </div>
      </div>
    </Link>
  )
}
