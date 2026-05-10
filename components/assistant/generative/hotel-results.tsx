'use client'

import { useTranslations } from 'next-intl'
import { Star, ExternalLink, MapPin } from 'lucide-react'

export interface HotelOffer {
  id: string
  name: string
  city: string
  country: string
  stars: number
  tier: 'luxury' | 'comfort' | 'budget'
  price_from: number
  currency: string
  image_url: string
  booking_url: string
  property_count: string
  checkin: string
  checkout: string
  source: string
}

export function HotelResults({
  data,
  locale,
}: {
  data: {
    query: { city?: string; checkin?: string; checkout?: string }
    count: number
    hotels: HotelOffer[]
  }
  locale: string
}) {
  const t = useTranslations('assistant.hotel')

  if (!data?.hotels?.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
        {t('no_results')}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold text-muted-foreground">
        {t('found', { count: data.hotels.length })}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.hotels.slice(0, 6).map((h) => (
          <HotelCard key={h.id} hotel={h} locale={locale} />
        ))}
      </div>
    </div>
  )
}

function HotelCard({ hotel, locale }: { hotel: HotelOffer; locale: string }) {
  const t = useTranslations('assistant.hotel')

  return (
    <a
      href={hotel.booking_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative h-28 w-28 shrink-0 bg-muted">
        {hotel.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hotel.image_url}
            alt={hotel.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.max(1, Math.round(hotel.stars)) }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-warning text-warning" />
            ))}
          </div>
          <div className="mt-1 line-clamp-1 text-sm font-bold text-foreground">
            {hotel.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{hotel.city}, {hotel.country}</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-muted-foreground">
              {t('from')}
            </div>
            <div className="text-base font-black text-primary">
              {formatPrice(hotel.price_from, hotel.currency, locale)}
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground group-hover:text-primary">
            {t('view')}
            <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </a>
  )
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
