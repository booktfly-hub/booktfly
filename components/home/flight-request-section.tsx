'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { PlaneTakeoff, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'

export function FlightRequestSection() {
  const locale = useLocale()
  const t = useTranslations('homepage')
  const isAr = locale === 'ar'

  const Arrow = isAr ? ArrowLeft : ArrowRight

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#f0f9ff_0%,#e0f2fe_40%,#fef3c7_100%)]" />
      <div className="pointer-events-none absolute -top-32 -start-32 h-[500px] w-[500px] rounded-full bg-sky-300/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -end-32 h-[400px] w-[400px] rounded-full bg-amber-300/20 blur-[100px]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-bold text-sky-700 uppercase tracking-widest shadow-sm mb-6">
            <PlaneTakeoff className="h-3.5 w-3.5" />
            {t('flight_request_label')}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
            {t('flight_request_cta_title')}
          </h2>
          <p className="text-base text-slate-500 max-w-xl mx-auto font-medium">
            {t('flight_request_cta_desc')}
          </p>
        </div>

        {/* CTA card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-[2rem] border border-slate-200/80 shadow-2xl shadow-slate-200/50 overflow-hidden p-8 md:p-12 max-w-2xl mx-auto">
          <div className="space-y-4 mb-8">
            {[
              t('flight_request_cta_point1'),
              t('flight_request_cta_point2'),
              t('flight_request_cta_point3'),
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-slate-700 font-medium">{point}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              href={`/${locale}/trip-requests`}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-95 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {t('flight_request_cta_button')}
              <Arrow className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
