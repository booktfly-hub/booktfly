'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Plane, Zap } from 'lucide-react'
import type { LiveOffer } from '@/lib/duffel-server'
import { pick } from '@/lib/i18n-helpers'

function fmtTime(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function fmtDuration(d: string) {
  const m = d?.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return d
  return `${m[1] ? m[1] + 'h ' : ''}${m[2] ? m[2] + 'm' : ''}`.trim()
}

export function LiveOffersStrip({ offers }: { offers: LiveOffer[] }) {
  const locale = useLocale()
  if (!offers?.length) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-bold text-slate-900">
          {pick(locale, 'رحلات مباشرة', 'Live flights', 'Canlı uçuşlar')}
        </h3>
        <span className="text-xs text-slate-500">
          {pick(locale, 'مدعوم من Duffel', 'Powered by Duffel', 'Duffel ile')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((o) => (
          <Link
            key={o.id}
            href={`/${locale}/flights/book/${o.id}`}
            className="group rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {o.airline.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.airline.logo} alt={o.airline.name} className="w-8 h-8" />
                ) : (
                  <Plane className="w-8 h-8 text-slate-400" />
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-900">{o.airline.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                    {pick(locale, 'مباشر', 'Live', 'Canlı')} · {o.airline.iata_code}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900">
                  {o.total_currency} {parseFloat(o.total_amount).toFixed(0)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="text-right">
                <div className="font-semibold">{fmtTime(o.departing_at)}</div>
                <div className="text-xs text-slate-500">{o.origin_iata}</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-[10px] text-slate-500">{fmtDuration(o.duration)}</div>
                <div className="border-t border-dashed my-1" />
                <div className="text-[10px] text-slate-500">
                  {o.segments_count > 1
                    ? `${o.segments_count - 1} ${pick(locale, 'توقف', 'stop', 'durak')}`
                    : pick(locale, 'مباشر', 'Direct', 'Direkt')}
                </div>
              </div>
              <div>
                <div className="font-semibold">{fmtTime(o.arriving_at)}</div>
                <div className="text-xs text-slate-500">{o.destination_iata}</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">{fmtDate(o.departing_at)}</span>
              <span className="text-xs font-semibold text-primary group-hover:underline">
                {pick(locale, 'احجز الآن →', 'Book now →', 'Şimdi rezerve et →')}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
