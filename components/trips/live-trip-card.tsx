'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Plane, Calendar, Clock, ArrowRight, ArrowLeft, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCountryCode } from '@/lib/countries'
import { pick } from '@/lib/i18n-helpers'
import type { LiveOffer } from '@/lib/duffel-server'

function fmtDuration(d: string) {
  const m = d?.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return d
  return `${m[1] ? m[1] + 'h ' : ''}${m[2] ? m[2] + 'm' : ''}`.trim()
}

export function LiveTripCard({ offer, className }: { offer: LiveOffer; className?: string }) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const departureDate = new Date(offer.departing_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const departureTime = new Date(offer.departing_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const originCountry = getCountryCode(offer.origin_iata, offer.origin_city)
  const destCountry = getCountryCode(offer.destination_iata, offer.destination_city)
  const formattedPrice = `${offer.total_currency} ${parseFloat(offer.total_amount).toFixed(0)}`

  return (
    <div className="relative h-full">
      <div className="absolute top-4 end-4 z-10 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          <Zap className="h-3 w-3" />
          {pick(locale, 'مباشر', 'Live', 'Canlı')}
        </span>
      </div>
      <Link
        href={`/${locale}/flights/${offer.id}`}
        className="block group h-full focus:outline-none"
      >
        <div
          className={cn(
            'relative h-full flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-[border-color,box-shadow,transform] duration-200',
            'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
            className
          )}
        >
          <div className="flex flex-col h-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors duration-200 group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary overflow-hidden">
                  {offer.airline.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={offer.airline.logo} alt={offer.airline.name} className="h-7 w-7 object-contain" />
                  ) : (
                    <Plane className="h-5 w-5 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 leading-none">
                      {offer.airline.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] md:text-xs font-medium text-slate-500">
                      {offer.airline.iata_code}
                      {offer.segments_count > 1
                        ? ` • ${offer.segments_count - 1} ${pick(locale, 'توقف', 'stop', 'durak')}`
                        : ` • ${pick(locale, 'مباشر', 'Direct', 'Direkt')}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Section */}
            <div className="grid grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_84px_minmax(0,1fr)] items-center gap-3 mb-6">
              <div className="min-w-0">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  {t('common.from')}
                </p>
                <p className="font-black text-slate-900 sm:text-2xl truncate">{offer.origin_city}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {originCountry && (
                    <Image
                      src={`https://flagcdn.com/w20/${originCountry}.png`}
                      alt={originCountry}
                      width={20}
                      height={15}
                      className="h-3 w-4 rounded-sm object-cover shadow-sm"
                    />
                  )}
                  <span className="text-xs font-bold text-slate-400">{offer.origin_iata}</span>
                </div>
              </div>

              <div className="flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center w-full gap-1.5">
                  <div className="h-[2px] flex-1 rounded-full bg-border" />
                  <Arrow className="h-4 w-4 shrink-0 text-primary" />
                  <div className="h-[2px] flex-1 rounded-full bg-border" />
                </div>
              </div>

              <div className="min-w-0 text-end">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  {t('common.to')}
                </p>
                <p className="font-black text-slate-900 sm:text-2xl truncate">
                  {offer.destination_city}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  {destCountry && (
                    <Image
                      src={`https://flagcdn.com/w20/${destCountry}.png`}
                      alt={destCountry}
                      width={20}
                      height={15}
                      className="h-3 w-4 rounded-sm object-cover shadow-sm"
                    />
                  )}
                  <span className="text-xs font-bold text-slate-400">{offer.destination_iata}</span>
                </div>
              </div>
            </div>

            {/* Meta Information Pills */}
            <div className="grid grid-cols-3 items-center gap-2 mb-6">
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">{departureDate}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">{departureTime}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-muted-foreground">
                <span className="text-xs font-semibold">{fmtDuration(offer.duration)}</span>
              </div>
            </div>

            <div className="mt-auto">
              {/* Footer Price & CTA */}
              <div className="flex items-end justify-between border-t border-border pt-5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {t('common.per_seat')}
                  </span>
                  <span className="text-2xl font-black leading-none text-foreground">
                    {formattedPrice}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 mt-1.5">
                    {pick(locale, 'مدعوم من Duffel', 'Powered by Duffel', 'Duffel ile')}
                  </span>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground shadow-sm transition-[background-color,color,transform] duration-200 group-hover:bg-primary group-hover:text-primary-foreground ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
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
