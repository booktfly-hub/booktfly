import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Plane, Calendar, Clock, ArrowRight, ArrowLeft, Zap, ShieldCheck } from 'lucide-react'
import { getCountryCode } from '@/lib/countries'
import { localizeCity, localizeAirline } from '@/lib/airports-i18n'

export const dynamic = 'force-dynamic'

async function fetchOffer(offerId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${base}/api/duffel/offers/${offerId}`, { cache: 'no-store' })
  if (!res.ok) return null
  return (await res.json()).offer
}

function fmtDuration(d: string) {
  const m = d?.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return d
  return `${m[1] ? m[1] + 'h ' : ''}${m[2] ? m[2] + 'm' : ''}`.trim()
}

export default async function FlightOfferDetailPage({
  params,
}: {
  params: Promise<{ offerId: string; locale: string }>
}) {
  const { offerId, locale } = await params
  const offer = await fetchOffer(offerId)
  if (!offer) notFound()

  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          <Zap className="h-3 w-3" />
          {isAr ? 'مباشر' : 'Live'}
        </span>
        <span className="text-xs text-slate-500">
          {isAr ? 'مدعوم من Duffel' : 'Powered by Duffel'}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted overflow-hidden">
              {offer.owner.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={offer.owner.logo} alt={offer.owner.name} className="h-9 w-9 object-contain" />
              ) : (
                <Plane className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div>
              <div className="font-bold text-lg">{localizeAirline(offer.owner.iata_code, offer.owner.name, locale)}</div>
              <div className="text-xs text-slate-500">{offer.owner.iata_code}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black">
              {offer.total_currency} {parseFloat(offer.total_amount).toFixed(2)}
            </div>
            <div className="text-xs text-slate-500">
              {isAr ? 'شامل الضرائب' : 'incl. taxes'} ({offer.total_currency}{' '}
              {parseFloat(offer.tax_amount || '0').toFixed(2)})
            </div>
          </div>
        </div>

        {offer.slices.map((s: any, i: number) => {
          const originCountry = getCountryCode(s.origin.iata_code, s.origin.city)
          const destCountry = getCountryCode(s.destination.iata_code, s.destination.city)
          const departureDate = new Date(s.departing_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
          const arrivalDate = new Date(s.arriving_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
          const departureTime = new Date(s.departing_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
          const arrivalTime = new Date(s.arriving_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <div key={i} className="border-t border-slate-100 pt-6 mt-6 first:border-0 first:pt-0 first:mt-0">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                {isAr ? `الرحلة ${i + 1}` : `Flight ${i + 1}`}
                {offer.slices.length > 1 && (
                  <span className="ml-2 text-slate-500 font-normal">
                    {i === 0
                      ? isAr ? '— ذهاب' : '— Outbound'
                      : isAr ? '— عودة' : '— Return'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6">
                <div>
                  <p className="text-3xl font-black">{departureTime}</p>
                  <p className="text-sm font-semibold mt-1">{localizeCity(s.origin.iata_code, s.origin.city, locale)}</p>
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
                    <span className="text-xs font-bold text-slate-400">{s.origin.iata_code}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{departureDate}</p>
                </div>

                <div className="flex flex-col items-center text-slate-400">
                  <span className="text-xs font-semibold">{fmtDuration(s.duration)}</span>
                  <div className="flex items-center w-24 gap-1 my-1">
                    <div className="h-[2px] flex-1 rounded-full bg-border" />
                    <Arrow className="h-4 w-4 text-primary" />
                    <div className="h-[2px] flex-1 rounded-full bg-border" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider">
                    {s.segments.length > 1
                      ? `${s.segments.length - 1} ${isAr ? 'توقف' : 'stop'}`
                      : isAr ? 'مباشر' : 'Direct'}
                  </span>
                </div>

                <div className="text-end">
                  <p className="text-3xl font-black">{arrivalTime}</p>
                  <p className="text-sm font-semibold mt-1">{localizeCity(s.destination.iata_code, s.destination.city, locale)}</p>
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
                    <span className="text-xs font-bold text-slate-400">
                      {s.destination.iata_code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{arrivalDate}</p>
                </div>
              </div>

              {s.segments.length > 0 && (
                <div className="space-y-2">
                  {s.segments.map((seg: any, j: number) => (
                    <div
                      key={j}
                      className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Plane className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono font-semibold">{seg.flight_number}</span>
                        <span className="text-slate-500">· {localizeAirline(seg.flight_number?.slice(0, 2), seg.marketing_carrier, locale)}</span>
                      </div>
                      <div className="text-slate-500">
                        {seg.origin} → {seg.destination}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold mb-1">
              {isAr ? 'حجز آمن عبر Duffel' : 'Secure booking via Duffel'}
            </p>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'الأسعار والتوفر مباشر من شركة الطيران. هذا حجز تجريبي — لا يتم خصم أي مبالغ حقيقية.'
                : 'Prices and availability are live from the airline. This is a test booking — no real charges will be made.'}
            </p>
          </div>
        </div>
      </div>

      <Link
        href={`/${locale}/flights/book/${offer.id}`}
        className="block w-full text-center bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all"
      >
        {isAr
          ? `احجز هذه الرحلة — ${offer.total_currency} ${parseFloat(offer.total_amount).toFixed(0)}`
          : `Book this flight — ${offer.total_currency} ${parseFloat(offer.total_amount).toFixed(0)}`}
      </Link>
    </div>
  )
}
