'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import {
  X,
  MapPin,
  Star,
  Building2,
  CalendarDays,
  Moon,
  ExternalLink,
  Users,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { pick } from '@/lib/i18n-helpers'
import { SubscribeInline } from '@/components/shared/subscribe-inline'
import type { HotelOffer } from '@/lib/booking-hotels'

function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

const TIER_COLORS = {
  luxury: {
    badge: 'bg-amber-50 border-amber-400/40 text-amber-700',
    dot: 'bg-amber-400',
    price: 'text-amber-600',
    btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
  },
  comfort: {
    badge: 'bg-sky-50 border-sky-400/40 text-sky-700',
    dot: 'bg-sky-400',
    price: 'text-sky-600',
    btn: 'bg-sky-500 hover:bg-sky-600 shadow-sky-200',
  },
  budget: {
    badge: 'bg-emerald-50 border-emerald-400/40 text-emerald-700',
    dot: 'bg-emerald-400',
    price: 'text-emerald-600',
    btn: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200',
  },
}

export function HotelOfferModal({ offer, onClose }: { offer: HotelOffer; onClose: () => void }) {
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
  const headline = offer.hotel_name || propertyType
  const partnerLabel = 'Booking.com'
  const ctaLabel = offer.hotel_name
    ? pick(locale, 'احجز هذا الفندق', 'Book this hotel', 'Bu oteli rezerve et')
    : pick(
        locale,
        `تصفّح فنادق ${tierLabel} في ${city}`,
        `Browse ${tierLabel.toLowerCase()} hotels in ${city}`,
        `${city} ${tierLabel.toLowerCase()} otellerine göz at`,
      )

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', handler)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto overscroll-contain bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-700 hover:bg-white backdrop-blur-sm transition-colors shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image */}
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-t-[2rem] sm:rounded-t-[2rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={offer.image_url}
            alt={headline}
            className="h-full w-full object-cover"
            onError={(e) => {
              const fallback = offer.fallback_image_url
              const img = e.currentTarget
              if (fallback && img.src !== fallback) img.src = fallback
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Tier badge */}
          <div className="absolute top-4 start-4">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] shadow-sm backdrop-blur-sm', colors.badge)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
              {tierLabel}
            </span>
          </div>

          {/* Partner badge */}
          <div className="absolute top-4 end-12">
            <span className="inline-flex items-center rounded-full border border-white/80 bg-white/92 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-700 shadow-sm backdrop-blur-sm">
              {partnerLabel}
            </span>
          </div>

          {/* City / hotel-name overlay */}
          <div className="absolute bottom-4 start-5 end-5">
            <p className="text-2xl font-black text-white drop-shadow leading-tight line-clamp-2">{headline}</p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 text-white/80" />
              <span className="text-xs font-semibold text-white/90">
                {city}
                {(isAr ? offer.country_ar : offer.country)
                  ? `, ${isAr ? offer.country_ar : offer.country}`
                  : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stars + property type */}
          <div className="mb-5">
            <div className="flex items-center gap-1 mb-1.5">
              {Array.from({ length: offer.star_rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">{propertyType}</h2>
            {!offer.hotel_name && (
              <div className="flex items-center gap-1.5 mt-2 text-slate-500">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="text-sm font-semibold">
                  {offer.property_count} {pick(locale, 'خيار إقامة متاح', 'properties available', 'tesis mevcut')}
                </span>
              </div>
            )}
          </div>

          {/* Dates + nights */}
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              {pick(locale, 'تفاصيل الإقامة', 'Stay details', 'Konaklama detayları')}
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {pick(locale, 'الوصول', 'Check-in', 'Giriş')}
                  </p>
                </div>
                <p className="text-sm font-black text-slate-900">{fmtDate(offer.checkin, locale)}</p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <Arrow className="h-4 w-4 text-slate-300" />
                <div className="flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5">
                  <Moon className="h-3 w-3 text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-600">
                    {nights}
                  </span>
                </div>
              </div>

              <div className="text-end">
                <div className="flex items-center justify-end gap-1.5 mb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {pick(locale, 'المغادرة', 'Check-out', 'Çıkış')}
                  </p>
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-sm font-black text-slate-900">{fmtDate(offer.checkout, locale)}</p>
              </div>
            </div>
          </div>

          {/* Adults */}
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Users className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-700">
              {offer.adults} {pick(locale, offer.adults === 1 ? 'بالغ' : 'بالغين', offer.adults === 1 ? 'adult' : 'adults', offer.adults === 1 ? 'yetişkin' : 'yetişkin')}
            </span>
          </div>

          {/* Subscribe */}
          <div className="mb-4">
            <SubscribeInline source="hotel-offer-modal" />
          </div>

          {/* Price + CTA */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  {pick(locale, 'تبدأ من', 'Starting from', 'Başlangıç')}
                </p>
                <div className={cn('text-[2.5rem] font-black leading-none tracking-tight', colors.price)}>
                  {(isAr ? formatPrice : formatPriceEN)(offer.price_from, offer.price_currency)}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1.5">
                  {pick(
                    locale,
                    `في الليلة • عبر ${partnerLabel}`,
                    `per night • via ${partnerLabel}`,
                    `gecelik • ${partnerLabel}`,
                  )}
                </p>
              </div>
              <a
                href={offer.affiliate_url}
                target="_blank"
                rel="noopener sponsored"
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black text-white shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0',
                  colors.btn
                )}
              >
                <ExternalLink className="h-4 w-4" />
                {ctaLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
