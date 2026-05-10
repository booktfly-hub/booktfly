'use client'

import { useTranslations } from 'next-intl'
import { Plane, Clock, ArrowRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FlightOffer {
  id: string
  origin: string
  destination: string
  origin_city?: string
  destination_city?: string
  departing_at: string
  arriving_at: string | null
  price: number
  currency: string
  airline: string
  airline_iata: string
  flight_number: string
  transfers: number
  duration_minutes: number | null
  booking_url: string
  source: string
}

export function FlightResults({
  data,
  locale,
}: {
  data: {
    query: { origin?: string; destination?: string; departure_date?: string }
    count: number
    offers: FlightOffer[]
  }
  locale: string
}) {
  const t = useTranslations('assistant.flight')
  const isRTL = locale === 'ar'

  if (!data?.offers?.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
        {t('no_results')}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold text-muted-foreground">
        {t('found', { count: data.offers.length })}
      </div>
      <div className="grid gap-2">
        {data.offers.slice(0, 5).map((o) => (
          <FlightCard key={o.id} offer={o} locale={locale} isRTL={isRTL} />
        ))}
      </div>
    </div>
  )
}

function FlightCard({
  offer,
  locale,
  isRTL,
}: {
  offer: FlightOffer
  locale: string
  isRTL: boolean
}) {
  const t = useTranslations('assistant.flight')
  const dep = formatTime(offer.departing_at, locale)
  const arr = offer.arriving_at ? formatTime(offer.arriving_at, locale) : null
  const date = formatDate(offer.departing_at, locale)
  const dur = offer.duration_minutes ? formatDuration(offer.duration_minutes, locale) : null

  return (
    <a
      href={offer.booking_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-border bg-surface p-3 transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Plane className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">
              {offer.airline} · {offer.airline_iata}
              {offer.flight_number ? ` ${offer.flight_number}` : ''}
            </span>
            <span>·</span>
            <span>{date}</span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm font-bold text-foreground">
            <span>{dep}</span>
            <span className="text-xs font-medium text-muted-foreground">
              {offer.origin}
            </span>
            <ArrowRight
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground',
                isRTL && 'rotate-180'
              )}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {offer.destination}
            </span>
            {arr && <span>{arr}</span>}
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            {dur && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {dur}
              </span>
            )}
            <span>
              {offer.transfers === 0
                ? t('direct')
                : t('stops', { n: offer.transfers })}
            </span>
          </div>
        </div>

        <div className="text-end">
          <div className="text-lg font-black text-primary">
            {formatPrice(offer.price, offer.currency, locale)}
          </div>
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground group-hover:text-primary">
            {t('book')}
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </div>
    </a>
  )
}

function formatTime(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return iso
  }
}

function formatDuration(min: number, locale: string) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (locale === 'ar') return `${h} س ${m} د`
  if (locale === 'tr') return `${h}s ${m}d`
  return `${h}h ${m}m`
}

function formatPrice(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}
