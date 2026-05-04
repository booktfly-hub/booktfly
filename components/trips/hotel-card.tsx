'use client'

import { useLocale } from 'next-intl'
import { ExternalLink, MapPin, Star, Building2, ArrowRight, ArrowLeft } from 'lucide-react'
import { pick } from '@/lib/i18n-helpers'
import { cn } from '@/lib/utils'
import type { HotelOffer } from '@/lib/booking-hotels'

function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'short', day: 'numeric',
  })
}

const TIER_COLORS = {
  luxury: {
    badge: 'bg-amber-50 border-amber-400/40 text-amber-700',
    dot: 'bg-amber-400',
    price: 'text-amber-600',
    btn: 'bg-amber-500 group-hover:bg-amber-600',
  },
  comfort: {
    badge: 'bg-sky-50 border-sky-400/40 text-sky-700',
    dot: 'bg-sky-400',
    price: 'text-sky-600',
    btn: 'bg-sky-500 group-hover:bg-sky-600',
  },
  budget: {
    badge: 'bg-emerald-50 border-emerald-400/40 text-emerald-700',
    dot: 'bg-emerald-400',
    price: 'text-emerald-600',
    btn: 'bg-emerald-500 group-hover:bg-emerald-600',
  },
}

export function HotelCard({ offer, className }: { offer: HotelOffer; className?: string }) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight
  const colors = TIER_COLORS[offer.tier]

  const nights = Math.max(1, Math.round(
    (new Date(offer.checkout).getTime() - new Date(offer.checkin).getTime()) / 86_400_000
  ))

  const city = isAr ? offer.city_ar : offer.city
  const tierLabel = isAr ? offer.tier_label_ar : offer.tier_label_en
  const propertyType = isAr ? offer.property_type_ar : offer.property_type_en

  return (
    <a
      href={offer.affiliate_url}
      target="_blank"
      rel="noopener sponsored"
      className="block group h-full focus:outline-none"
    >
      <div className={cn(
        'relative h-full flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white transition-[border-color,box-shadow,transform] duration-200',
        'hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/70',
        className
      )}>
        {/* Image */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={offer.image_url}
            alt={city}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-transparent" />

          {/* Tier badge */}
          <div className="absolute top-3 start-3">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] shadow-sm backdrop-blur-sm', colors.badge)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
              {tierLabel}
            </span>
          </div>

          {/* Booking.com badge */}
          <div className="absolute top-3 end-3">
            <span className="inline-flex items-center rounded-full border border-white/80 bg-white/92 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-700 shadow-sm backdrop-blur-sm">
              Booking.com
            </span>
          </div>

          {/* City + country overlay */}
          <div className="absolute bottom-3 start-4">
            <p className="text-xl font-black leading-none text-white drop-shadow">{city}</p>
            {offer.country && (
              <div className="flex items-center gap-1 mt-1 opacity-90">
                <MapPin className="h-3 w-3 text-white" />
                <span className="text-xs font-semibold text-white">
                  {isAr ? offer.country_ar : offer.country}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5 md:p-6">
          {/* Property type + stars */}
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: offer.star_rating }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h3 className="text-[1.2rem] font-black leading-tight tracking-[-0.02em] text-slate-900 line-clamp-2">
              {propertyType}
            </h3>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="text-sm font-semibold">
                {offer.property_count}{' '}
                {pick(locale, 'خيار إقامة', 'properties', 'tesis')}
              </span>
            </div>
          </div>

          {/* Dates pill */}
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
            <div className="flex flex-col min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {pick(locale, 'تواريخ الإقامة', 'Stay dates', 'Konaklama tarihleri')}
              </p>
              <p className="text-sm font-semibold text-slate-700">
                {fmtDate(offer.checkin, locale)}
                <span className="mx-1.5 text-slate-400">→</span>
                {fmtDate(offer.checkout, locale)}
                <span className="ms-2 text-slate-400">·</span>
                <span className="ms-2 text-slate-500">
                  {nights}{' '}
                  {pick(locale, nights === 1 ? 'ليلة' : 'ليالٍ', nights === 1 ? 'night' : 'nights', nights === 1 ? 'gece' : 'gece')}
                </span>
              </p>
            </div>
          </div>

          {/* Price + CTA */}
          <div className="mt-auto border-t border-slate-200 pt-5">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 block mb-1">
                  {pick(locale, 'تبدأ من', 'Starting from', 'Başlangıç fiyatı')}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className={cn('text-[2rem] font-black leading-none tracking-[-0.03em]', colors.price)}>
                    ${offer.price_from}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">
                    / {pick(locale, 'ليلة', 'night', 'gece')}
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-400 mt-1.5">
                  {pick(locale, 'عبر Booking.com', 'via Booking.com', 'Booking.com üzerinden')}
                </p>
              </div>

              <div className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm transition-[transform] duration-200 group-hover:scale-105',
                colors.btn
              )}>
                <Arrow className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}
