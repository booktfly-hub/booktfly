'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import {
  X,
  Plane,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Zap,
  ExternalLink,
  PlaneTakeoff,
  PlaneLanding,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/i18n-helpers'
import { getCountryCode } from '@/lib/countries'
import { localizeCity, localizeAirline } from '@/lib/airports-i18n'
import { SubscribeInline } from '@/components/shared/subscribe-inline'
import type { LiveOffer } from '@/lib/travelpayouts-server'

function fmtDuration(min: number | null) {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h ? h + 'h ' : ''}${m ? m + 'm' : ''}`.trim()
}

function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function LiveOfferModal({ offer, onClose }: { offer: LiveOffer; onClose: () => void }) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const originCountry = getCountryCode(offer.origin_iata, offer.origin_city)
  const destCountry = getCountryCode(offer.destination_iata, offer.destination_city)
  const originCity = localizeCity(offer.origin_iata, offer.origin_city, locale)
  const destCity = localizeCity(offer.destination_iata, offer.destination_city, locale)
  const airlineLabel = localizeAirline(offer.airline_iata, offer.airline_name, locale)
  const formattedPrice = `${offer.price_currency.toUpperCase()} ${offer.price_amount.toFixed(0)}`

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
          className="absolute top-4 end-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Airline header */}
        <div className="p-6 pb-0 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://pics.avs.io/100/40/${offer.airline_iata}.png`}
              alt={airlineLabel}
              className="h-10 w-auto object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">{airlineLabel}</h2>
            <p className="text-sm text-slate-500 font-semibold mt-0.5">{offer.flight_number}</p>
          </div>
          <div className="ms-auto">
            {offer.source === 'duffel' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sky-700">
                <Zap className="h-3 w-3" /> Duffel
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                <Zap className="h-3 w-3" /> Travelpayouts
              </span>
            )}
          </div>
        </div>

        {/* Route */}
        <div className="mx-6 my-6 rounded-2xl bg-slate-50 border border-slate-200 p-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                {pick(locale, 'المغادرة', 'Departure', 'Kalkış')}
              </p>
              <div className="text-2xl font-black text-slate-900 leading-none mb-1">{offer.origin_iata}</div>
              <p className="text-sm font-semibold text-slate-700 truncate">{originCity}</p>
              {originCountry && (
                <div className="flex items-center gap-1 mt-1">
                  <Image
                    src={`https://flagcdn.com/w20/${originCountry}.png`}
                    alt={originCountry}
                    width={20} height={15}
                    className="h-3 w-4 rounded-sm object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-1">
              <PlaneTakeoff className={cn('h-4 w-4 text-primary', isAr && 'scale-x-[-1]')} />
              <div className="flex items-center gap-1">
                <div className="h-px w-6 bg-slate-300" />
                <Arrow className="h-3.5 w-3.5 text-primary" />
                <div className="h-px w-6 bg-slate-300" />
              </div>
              <PlaneLanding className={cn('h-4 w-4 text-primary', isAr && 'scale-x-[-1]')} />
              <p className="text-[10px] font-semibold text-slate-400 mt-1">
                {fmtDuration(offer.duration_minutes)}
              </p>
            </div>

            <div className="text-end">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                {pick(locale, 'الوصول', 'Arrival', 'Varış')}
              </p>
              <div className="text-2xl font-black text-slate-900 leading-none mb-1">{offer.destination_iata}</div>
              <p className="text-sm font-semibold text-slate-700 truncate">{destCity}</p>
              {destCountry && (
                <div className="flex items-center justify-end gap-1 mt-1">
                  <Image
                    src={`https://flagcdn.com/w20/${destCountry}.png`}
                    alt={destCountry}
                    width={20} height={15}
                    className="h-3 w-4 rounded-sm object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {pick(locale, 'تاريخ الرحلة', 'Departure date', 'Uçuş tarihi')}
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {fmtDate(offer.departing_at, locale)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {pick(locale, 'وقت الإقلاع', 'Departure time', 'Kalkış saati')}
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {fmtTime(offer.departing_at)}
                {offer.arriving_at && (
                  <span className="text-slate-400 font-normal"> → {fmtTime(offer.arriving_at)}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <Plane className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {pick(locale, 'التوقفات', 'Stops', 'Aktarmalar')}
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {offer.transfers === 0
                  ? pick(locale, 'رحلة مباشرة', 'Non-stop', 'Direkt')
                  : `${offer.transfers} ${pick(locale, 'توقف', offer.transfers === 1 ? 'stop' : 'stops', 'aktarma')}`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {pick(locale, 'المدة', 'Duration', 'Süre')}
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {fmtDuration(offer.duration_minutes)}
              </p>
            </div>
          </div>
        </div>

        {/* Subscribe */}
        <div className="mx-6 mb-4">
          <SubscribeInline source="live-offer-modal" />
        </div>

        {/* Price + CTA */}
        <div className="mx-6 mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                {pick(locale, 'السعر يبدأ من', 'Price from', 'Başlangıç fiyatı')}
              </p>
              <div className="text-[2.5rem] font-black leading-none tracking-tight text-slate-900">
                {formattedPrice}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1.5">
                {pick(locale, 'للشخص الواحد', 'per person', 'kişi başı')}
              </p>
            </div>
            <a
              href={offer.affiliate_url}
              target="_blank"
              rel="noopener sponsored"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-black text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
              {pick(locale, 'احجز الآن', 'Book Now', 'Şimdi Rezervasyon')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
