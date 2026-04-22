'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { Copy, CheckCheck, Download, Loader2, Share2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Marketeer = {
  referral_code: string
  full_name: string | null
}

type TripLite = {
  id: string
  origin_city_ar: string | null
  origin_city_en: string | null
  destination_city_ar: string | null
  destination_city_en: string | null
  departure_at: string
  price_per_seat: number
  airline: string | null
}

const TEMPLATES: { key: string; ar: string; en: string }[] = [
  {
    key: 'general',
    ar: 'خصومات حقيقية على الطيران والعروض عبر منصة BookitFly ✈️\nاحجز من هنا واحصل على أفضل الأسعار:\n{{link}}',
    en: 'Real flight deals and exclusive offers on BookitFly ✈️\nBook now for the best prices:\n{{link}}',
  },
  {
    key: 'flash',
    ar: '🔥 عرض محدود!\nمقاعد محدودة بأفضل سعر — احجز قبل ما تنتهي:\n{{link}}',
    en: '🔥 Limited-time deal!\nOnly a few seats left at this price — grab yours now:\n{{link}}',
  },
  {
    key: 'family',
    ar: 'رحلة عائلية مريحة وبسعر يناسب الجميع 👨‍👩‍👧‍👦\nاختر رحلتك المثالية على BookitFly:\n{{link}}',
    en: 'Family-friendly flights at prices everyone loves 👨‍👩‍👧‍👦\nFind your perfect trip on BookitFly:\n{{link}}',
  },
  {
    key: 'umrah',
    ar: 'عروض العمرة والحج بأسعار منافسة 🕋\nاحجز مع BookitFly بخطوات بسيطة:\n{{link}}',
    en: 'Best prices on Umrah & Hajj trips 🕋\nBook on BookitFly in a few simple steps:\n{{link}}',
  },
]

const BANNERS: { key: string; titleAr: string; titleEn: string; subtitleAr: string; subtitleEn: string; from: string; to: string }[] = [
  {
    key: 'classic',
    titleAr: 'سافر بأفضل سعر',
    titleEn: 'Travel for less',
    subtitleAr: 'احجز الآن على BookitFly',
    subtitleEn: 'Book now on BookitFly',
    from: '#0ea5e9',
    to: '#1e293b',
  },
  {
    key: 'flash',
    titleAr: 'عرض محدود 🔥',
    titleEn: 'Flash Deal 🔥',
    subtitleAr: 'مقاعد محدودة — سارع الحجز',
    subtitleEn: 'Limited seats — book fast',
    from: '#f97316',
    to: '#b91c1c',
  },
  {
    key: 'family',
    titleAr: 'رحلة عائلية مريحة',
    titleEn: 'Family-friendly trips',
    subtitleAr: 'بأسعار تناسب الجميع',
    subtitleEn: 'At prices everyone loves',
    from: '#22c55e',
    to: '#065f46',
  },
]

export default function CreativeKitPage() {
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'

  const [marketeer, setMarketeer] = useState<Marketeer | null>(null)
  const [trips, setTrips] = useState<TripLite[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [dash, t] = await Promise.all([
          fetch('/api/marketeers/dashboard', { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/trips?limit=12&sort=newest', { cache: 'no-store' }).then((r) => r.json()),
        ])
        if (cancelled) return
        if (dash?.marketeer) setMarketeer(dash.marketeer)
        if (Array.isArray(t?.trips)) setTrips(t.trips)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const refCode = marketeer?.referral_code

  const mainLink = refCode ? `${origin}/ref/${refCode}` : ''
  const tripLink = (tripId: string) =>
    refCode ? `${origin}/ref/${refCode}?utm_campaign=${refCode}&utm_source=marketeer&to=${encodeURIComponent('/' + locale + '/trips/' + tripId)}` : ''

  const ogUrl = (tripId: string) => `${origin}/${locale}/trips/${tripId}/opengraph-image`

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600)
    } catch { /* noop */ }
  }

  const whatsappHref = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`

  const downloadBanner = async (banner: typeof BANNERS[number]) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 630
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const grd = ctx.createLinearGradient(0, 0, 1200, 630)
    grd.addColorStop(0, banner.from)
    grd.addColorStop(1, banner.to)
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, 1200, 630)
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.font = 'bold 84px -apple-system, system-ui, Segoe UI, Arial'
    ctx.fillText(isAr ? banner.titleAr : banner.titleEn, 600, 300)
    ctx.font = '500 36px -apple-system, system-ui, Segoe UI, Arial'
    ctx.fillText(isAr ? banner.subtitleAr : banner.subtitleEn, 600, 370)
    ctx.font = 'bold 28px -apple-system, system-ui, Segoe UI, Arial'
    ctx.fillText('BookitFly', 600, 560)
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `bookitfly-banner-${banner.key}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!refCode) {
    return (
      <div className="px-6 py-10">
        <p className="text-slate-500">{isAr ? 'هذه الصفحة متاحة فقط للمسوّقين المفعّلين.' : 'This page is only available for active marketeers.'}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-10 space-y-8">
      <header className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-slate-900 text-white flex items-center justify-center shrink-0">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            {isAr ? 'عدّة إبداعية للتسويق' : 'Creative Kit'}
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium mt-1">
            {isAr
              ? 'قوالب جاهزة، بنرات، وصور مشاركة لكل رحلة — جاهزة للنسخ والنشر مع رابط إحالتك.'
              : 'Ready-made copy, banners, and per-trip share images — pre-filled with your referral link.'}
          </p>
        </div>
      </header>

      {/* Main referral link */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
          {isAr ? 'رابط الإحالة الرئيسي' : 'Main referral link'}
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 font-mono text-sm text-slate-900 break-all" dir="ltr">
            {mainLink}
          </div>
          <button
            onClick={() => copy(mainLink, 'main')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-5 py-3 font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            {copied === 'main' ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === 'main' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'انسخ الرابط' : 'Copy link')}
          </button>
        </div>
      </section>

      {/* Copy templates */}
      <section>
        <h2 className="text-lg md:text-xl font-black text-slate-900 mb-4">
          {isAr ? 'قوالب النص' : 'Copy templates'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {TEMPLATES.map((tpl) => {
            const text = (isAr ? tpl.ar : tpl.en).replace('{{link}}', mainLink)
            return (
              <div key={tpl.key} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm flex flex-col">
                <pre className="flex-1 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">{text}</pre>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => copy(text, `tpl-${tpl.key}`)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-900 px-4 py-2.5 font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    {copied === `tpl-${tpl.key}` ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied === `tpl-${tpl.key}` ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}
                  </button>
                  <a
                    href={whatsappHref(text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 font-bold text-sm hover:bg-emerald-700 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    WhatsApp
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Banners */}
      <section>
        <h2 className="text-lg md:text-xl font-black text-slate-900 mb-4">
          {isAr ? 'بنرات جاهزة' : 'Ready-made banners'}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BANNERS.map((b) => (
            <div key={b.key} className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div
                className="aspect-[1200/630] w-full relative flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${b.from}, ${b.to})` }}
              >
                <div className="text-center text-white px-6">
                  <div className="text-2xl md:text-3xl font-black">{isAr ? b.titleAr : b.titleEn}</div>
                  <div className="text-sm md:text-base mt-1 opacity-90">{isAr ? b.subtitleAr : b.subtitleEn}</div>
                  <div className="mt-4 text-sm font-bold">BookitFly</div>
                </div>
              </div>
              <div className="p-3">
                <button
                  onClick={() => downloadBanner(b)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 font-bold text-sm hover:bg-slate-800 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  {isAr ? 'تحميل PNG' : 'Download PNG'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Per-trip share */}
      <section>
        <h2 className="text-lg md:text-xl font-black text-slate-900 mb-4">
          {isAr ? 'صور مشاركة لكل رحلة' : 'Per-trip share images'}
        </h2>
        {trips.length === 0 ? (
          <p className="text-sm text-slate-500">{isAr ? 'لا توجد رحلات نشطة حالياً.' : 'No active trips available right now.'}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((tp) => {
              const origCity = (isAr ? tp.origin_city_ar : tp.origin_city_en) || ''
              const destCity = (isAr ? tp.destination_city_ar : tp.destination_city_en) || ''
              const selected = selectedTripId === tp.id
              const link = tripLink(tp.id)
              const msg = isAr
                ? `رحلة ${origCity} ← ${destCity} بسعر يبدأ من ${tp.price_per_seat} ر.س ✈️\n${link}`
                : `${origCity} → ${destCity} from ${tp.price_per_seat} SAR ✈️\n${link}`
              return (
                <div
                  key={tp.id}
                  className={cn(
                    'rounded-2xl border bg-white shadow-sm overflow-hidden transition-all',
                    selected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'
                  )}
                >
                  <button
                    onClick={() => setSelectedTripId(selected ? null : tp.id)}
                    className="w-full text-start"
                  >
                    <div className="relative aspect-[1200/630] bg-slate-100">
                      <Image src={ogUrl(tp.id)} alt="" fill sizes="400px" className="object-cover" unoptimized />
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-bold text-slate-900 truncate">{origCity} → {destCity}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(tp.departure_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {tp.airline || ''}
                      </div>
                    </div>
                  </button>
                  {selected && (
                    <div className="border-t border-slate-100 p-3 space-y-2">
                      <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs font-mono text-slate-700 break-all" dir="ltr">{link}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copy(msg, `trip-${tp.id}`)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 text-slate-900 px-3 py-2 font-bold text-xs hover:bg-slate-200"
                        >
                          {copied === `trip-${tp.id}` ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied === `trip-${tp.id}` ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ النص' : 'Copy')}
                        </button>
                        <a
                          href={whatsappHref(msg)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 font-bold text-xs hover:bg-emerald-700"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                        <a
                          href={ogUrl(tp.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={`bookitfly-trip-${tp.id}.png`}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-2 font-bold text-xs hover:bg-slate-800"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {isAr ? 'صورة' : 'Image'}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
