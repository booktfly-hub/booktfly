'use client'

import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Plane, Calendar, Clock, ArrowRight, ArrowLeft, Zap, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCountryCode } from '@/lib/countries'
import { pick } from '@/lib/i18n-helpers'
import { localizeCity, localizeAirline } from '@/lib/airports-i18n'
import type { LiveOffer } from '@/lib/travelpayouts-server'

function fmtDuration(min: number | null) {
  if (!min) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h ? h + 'h ' : ''}${m ? m + 'm' : ''}`.trim()
}

export function LiveTripCard({ offer, className, onViewDetails }: { offer: LiveOffer; className?: string; onViewDetails?: () => void }) {
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
  const formattedPrice = `${offer.price_currency} ${offer.price_amount.toFixed(0)}`
  const originCityLabel = localizeCity(offer.origin_iata, offer.origin_city, locale)
  const destCityLabel = localizeCity(offer.destination_iata, offer.destination_city, locale)
  const airlineLabel = localizeAirline(offer.airline_iata, offer.airline_name, locale)
  const airlineLogoUrl = `https://pics.avs.io/100/40/${offer.airline_iata}.png`

  return (
    <div className="relative h-full">
      <div className="absolute top-4 end-4 z-10 flex items-center gap-2">
        {offer.source === 'duffel' ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
            <Zap className="h-3 w-3" />
            Duffel
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            <Zap className="h-3 w-3" />
            Travelpayouts
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onViewDetails}
        className={cn('block w-full text-start group h-full focus:outline-none', !onViewDetails && 'cursor-default')}
      >
        <div
          className={cn(
            'relative h-full flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-[border-color,box-shadow,transform] duration-200',
            onViewDetails && 'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
            className
          )}
        >
          <div className="flex flex-col h-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors duration-200 group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={airlineLogoUrl}
                    alt={airlineLabel}
                    className="h-7 w-auto object-contain"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 leading-none">
                      {airlineLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] md:text-xs font-medium text-slate-500">
                      {offer.flight_number}
                      {offer.transfers > 0
                        ? ` • ${offer.transfers} ${pick(locale, 'توقف', 'stop', 'durak')}`
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
                <p className="font-black text-slate-900 sm:text-2xl truncate">{originCityLabel}</p>
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
                <p className="font-black text-slate-900 sm:text-2xl truncate">{destCityLabel}</p>
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
                <span className="text-xs font-semibold">
                  {offer.duration_minutes ? fmtDuration(offer.duration_minutes) : '—'}
                </span>
              </div>
            </div>

            <div className="mt-auto">
              <div className="flex items-end justify-between border-t border-border pt-5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {pick(locale, 'يبدأ من', 'From', 'Başlangıç')}
                  </span>
                  <span className="text-2xl font-black leading-none text-foreground">
                    {formattedPrice}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 mt-1.5">
                    {pick(locale, 'عرض خارجي', 'External offer', 'Harici teklif')}
                  </span>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground shadow-sm transition-[background-color,color,transform] duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}
