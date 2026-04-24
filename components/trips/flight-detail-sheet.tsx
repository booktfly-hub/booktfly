'use client'

import { pick } from '@/lib/i18n-helpers'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Plane, Clock, Calendar, Briefcase, ArrowRight, ArrowLeft, BadgeCheck } from 'lucide-react'
import { BottomSheet } from '@/components/shared/bottom-sheet'
import { getCountryCode } from '@/lib/countries'
import { formatPrice, formatPriceEN, capitalizeFirst, cn } from '@/lib/utils'
import { BnplBadge } from '@/components/ui/bnpl-badge'
import { CABIN_CLASSES } from '@/lib/constants'
import type { Trip } from '@/types'

interface FlightDetailSheetProps {
  trip: Trip
  open: boolean
  onClose: () => void
  primaryLabel: string
  onPrimary: () => void
  className?: string
}

/**
 * Mobile-first bottom-sheet showing full flight detail with a sticky CTA.
 * On desktop this is hidden by the base <BottomSheet> component (md:hidden scope).
 */
export function FlightDetailSheet({
  trip,
  open,
  onClose,
  primaryLabel,
  onPrimary,
  className,
}: FlightDetailSheetProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const originCity = isAr ? trip.origin_city_ar : capitalizeFirst(trip.origin_city_en || trip.origin_city_ar)
  const destCity = isAr ? trip.destination_city_ar : capitalizeFirst(trip.destination_city_en || trip.destination_city_ar)
  const cabinClass = CABIN_CLASSES[trip.cabin_class]
  const formattedPrice = isAr ? formatPrice(trip.price_per_seat, trip.currency) : formatPriceEN(trip.price_per_seat, trip.currency)

  const originCountry = getCountryCode(trip.origin_code, trip.origin_city_en || trip.origin_city_ar)
  const destCountry = getCountryCode(trip.destination_code, trip.destination_city_en || trip.destination_city_ar)

  const dep = new Date(trip.departure_at)
  const depDate = dep.toLocaleDateString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'), {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  })
  const depTime = dep.toLocaleTimeString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'), { hour: '2-digit', minute: '2-digit' })

  return (
    <BottomSheet open={open} onClose={onClose} title={t('trips.flight_details', { default: pick(locale, 'تفاصيل الرحلة', 'Flight details', 'Uçuş ayrıntıları') })} className={className}>
      <div className="space-y-4">
        {/* Header — airline */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
            <Plane className="h-5 w-5 -rotate-45 text-slate-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm">{trip.airline}</p>
              {trip.provider?.is_verified && <BadgeCheck className="h-4 w-4 fill-blue-600 text-white" />}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isAr ? cabinClass.ar : cabinClass.en}
              {trip.flight_number && ` · ${trip.flight_number}`}
            </p>
          </div>
        </div>

        {/* Route */}
        <div className="rounded-xl border border-border p-3 bg-card">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
            <Calendar className="h-3 w-3" />
            <span>{depDate} · {depTime}</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('common.from', { default: 'From' })}</p>
              <p className="font-black text-lg truncate">{originCity}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {originCountry && (
                  <Image src={`https://flagcdn.com/w20/${originCountry}.png`} alt={originCountry} width={16} height={12} className="h-3 w-4 rounded-sm" />
                )}
                <span className="text-[11px] font-bold text-muted-foreground">{trip.origin_code?.toUpperCase()}</span>
              </div>
            </div>

            <div className="flex flex-col items-center text-muted-foreground">
              <Arrow className="h-4 w-4" />
              <span className="text-[10px] mt-1 font-semibold">{t('trips.direct', { default: pick(locale, 'مباشرة', 'Direct', 'Doğrudan') })}</span>
            </div>

            <div className="min-w-0 text-end">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('common.to', { default: 'To' })}</p>
              <p className="font-black text-lg truncate">{destCity}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {destCountry && (
                  <Image src={`https://flagcdn.com/w20/${destCountry}.png`} alt={destCountry} width={16} height={12} className="h-3 w-4 rounded-sm" />
                )}
                <span className="text-[11px] font-bold text-muted-foreground">{trip.destination_code?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Baggage / includes */}
        <div className="rounded-xl border border-border p-3 bg-card space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">{pick(locale, 'ما يشمله السعر', 'What’s included', 'Neler dahil')}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {trip.cabin_baggage_kg != null && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-emerald-600" />
                <span>{pick(locale, `${trip.cabin_baggage_kg} كجم حقيبة يد`, `${trip.cabin_baggage_kg} kg cabin`)}</span>
              </div>
            )}
            {trip.checked_baggage_kg != null && trip.checked_baggage_kg > 0 && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-emerald-600" />
                <span>{pick(locale, `${trip.checked_baggage_kg} كجم حقيبة سفر`, `${trip.checked_baggage_kg} kg checked`)}</span>
              </div>
            )}
            {trip.meal_included && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                <span>{pick(locale, 'وجبة', 'Meal', 'Yemek')}</span>
              </div>
            )}
            {trip.seat_selection_included && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                <span>{pick(locale, 'اختيار مقعد', 'Seat choice', 'Koltuk seçimi')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {(trip.description_ar || trip.description_en) && (
          <div className="rounded-xl border border-border p-3 bg-card">
            <p className="text-[11px] text-muted-foreground whitespace-pre-line">
              {isAr ? trip.description_ar : (trip.description_en || trip.description_ar)}
            </p>
          </div>
        )}

        {/* Price + CTA */}
        <div className="sticky bottom-0 -mx-4 -mb-4 px-4 py-3 border-t bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-bold">{t('common.per_seat', { default: pick(locale, 'للشخص', 'Per seat', 'Koltuk başına') })}</p>
              <p className={cn('text-xl font-black leading-none')}>{formattedPrice}</p>
              <BnplBadge price={trip.price_per_seat} currency={trip.currency} className="mt-1" />
            </div>
            <button
              type="button"
              onClick={onPrimary}
              className="flex-1 max-w-[55%] rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow hover:opacity-90"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
