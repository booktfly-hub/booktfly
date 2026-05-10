'use client'

import { useTranslations } from 'next-intl'
import { Check, X, Star, ExternalLink } from 'lucide-react'

export interface CompareItem {
  name: string
  stars: number
  tier: 'luxury' | 'comfort' | 'budget'
  price_from: number
  currency: string
  image_url?: string
  booking_url?: string
  pros: string[]
  cons: string[]
}

export function ComparisonTable({
  data,
  locale,
}: {
  data: {
    hotels: CompareItem[]
    summary: string
  }
  locale: string
}) {
  const t = useTranslations('assistant.compare')

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-3">
      {data.summary && (
        <p className="text-sm leading-6 text-foreground">{data.summary}</p>
      )}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${data.hotels.length}, minmax(0, 1fr))` }}
      >
        {data.hotels.map((h, i) => (
          <div
            key={i}
            className="flex flex-col rounded-lg border border-border/60 bg-background p-2.5"
          >
            {h.image_url && (
              <div className="relative h-20 w-full overflow-hidden rounded-md bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={h.image_url}
                  alt={h.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            )}
            <div className="mt-2 flex items-center gap-0.5">
              {Array.from({ length: Math.max(1, Math.round(h.stars)) }).map((_, j) => (
                <Star key={j} className="h-3 w-3 fill-warning text-warning" />
              ))}
            </div>
            <div className="mt-1 line-clamp-2 text-xs font-bold text-foreground">
              {h.name}
            </div>
            <div className="mt-1 text-sm font-black text-primary">
              {formatPrice(h.price_from, h.currency, locale)}
            </div>
            <ul className="mt-2 space-y-1">
              {h.pros.map((p, j) => (
                <li key={`p${j}`} className="flex items-start gap-1 text-[11px] text-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-success-foreground" />
                  <span className="line-clamp-2">{p}</span>
                </li>
              ))}
              {h.cons.map((c, j) => (
                <li key={`c${j}`} className="flex items-start gap-1 text-[11px] text-muted-foreground">
                  <X className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                  <span className="line-clamp-2">{c}</span>
                </li>
              ))}
            </ul>
            {h.booking_url && (
              <a
                href={h.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-primary/90"
              >
                {t('book')}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
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
