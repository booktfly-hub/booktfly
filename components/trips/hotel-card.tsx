'use client'

import { useLocale } from 'next-intl'
import { Hotel, ExternalLink, MapPin, Calendar } from 'lucide-react'
import { pick } from '@/lib/i18n-helpers'
import { cn } from '@/lib/utils'
import type { HotelOffer } from '@/lib/booking-hotels'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function HotelCard({ offer, className }: { offer: HotelOffer; className?: string }) {
  const locale = useLocale()

  const nights = Math.round(
    (new Date(offer.checkout).getTime() - new Date(offer.checkin).getTime()) / 86_400_000
  )

  return (
    <div className="relative h-full">
      <div className="absolute top-4 end-4 z-10">
        <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
          <Hotel className="h-3 w-3" />
          Booking.com
        </span>
      </div>

      <a
        href={offer.affiliate_url}
        target="_blank"
        rel="noopener sponsored"
        className="block group h-full focus:outline-none"
      >
        <div
          className={cn(
            'relative h-full flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-[border-color,box-shadow,transform] duration-200',
            'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
            className
          )}
        >
          {/* City image */}
          <div className="relative h-44 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={offer.image_url}
              alt={offer.city}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-3 start-4 text-white">
              <p className="text-xl font-black leading-none drop-shadow">{offer.city}</p>
              <div className="flex items-center gap-1 mt-1 opacity-90">
                <MapPin className="h-3 w-3" />
                <span className="text-xs font-semibold">{offer.country}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col flex-1 p-5">
            {/* Dates */}
            <div className="flex items-center gap-2 mb-4 rounded-xl border border-border bg-muted px-3 py-2.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-semibold text-slate-600">
                {fmtDate(offer.checkin)}
                <span className="mx-1.5 text-slate-400">→</span>
                {fmtDate(offer.checkout)}
              </span>
              <span className="ms-auto text-[11px] font-bold text-slate-500">
                {nights}{' '}
                {pick(locale, nights === 1 ? 'ليلة' : 'ليالٍ', nights === 1 ? 'night' : 'nights', nights === 1 ? 'gece' : 'gece')}
              </span>
            </div>

            <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  {pick(locale, 'ابحث عن فنادق', 'Search hotels', 'Otel ara')}
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {pick(locale, `في ${offer.city}`, `in ${offer.city}`, `${offer.city}'de`)}
                </p>
                <p className="text-[10px] font-medium text-slate-400 mt-1">
                  {pick(locale, 'عرض خارجي · Booking.com', 'External offer · Booking.com', 'Harici teklif · Booking.com')}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-[background-color,transform] duration-200 group-hover:bg-blue-700 group-hover:scale-105">
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  )
}
