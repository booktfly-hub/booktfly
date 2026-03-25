import { Building2, TrendingUp, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface BecomeProviderCTAProps {
  locale: string
}

export function BecomeProviderCTA({ locale }: BecomeProviderCTAProps) {
  const t = useTranslations('homepage')
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight

  return (
    <section className="relative py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Provider card */}
          <div className="relative overflow-hidden rounded-[3rem] border border-[#0c4a6e]/10 bg-[linear-gradient(135deg,#082f49_0%,#0c4a6e_42%,#0f766e_100%)] p-10 text-white shadow-2xl shadow-sky-900/20 transition-transform duration-500 hover:scale-[1.01] lg:p-14">
            <div className="pointer-events-none absolute right-0 top-0 -mr-[10%] -mt-[10%] h-[400px] w-[400px] rounded-full bg-[#f97316] opacity-15 blur-[100px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 -mb-[10%] -ml-[10%] h-[300px] w-[300px] rounded-full bg-white opacity-5 blur-[100px]" />

            <div className="relative z-10 flex flex-col items-start">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-inner">
                <Building2 className="h-8 w-8 stroke-[2.5] text-[#fbbf24]" />
              </div>

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-white/70">
                {locale === 'ar' ? 'لشركات السفر' : 'For travel businesses'}
              </p>
              <h2 className="mb-4 text-3xl font-black leading-tight tracking-tight lg:text-4xl">
                {t('for_providers_title')}
              </h2>
              <p className="mb-8 text-base font-medium leading-relaxed text-white/80 lg:text-lg">
                {t('for_providers_desc')}
              </p>

              <Link
                href={`/${locale}/become-provider`}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-bold text-slate-900 shadow-xl transition-all hover:-translate-y-1 hover:bg-orange-50"
              >
                {t('for_providers_cta')}
                <Arrow className="h-4 w-4 text-orange-500 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Marketeer card */}
          <div className="relative overflow-hidden rounded-[3rem] border border-violet-200/30 bg-[linear-gradient(135deg,#2e1065_0%,#4c1d95_42%,#6d28d9_100%)] p-10 text-white shadow-2xl shadow-violet-900/20 transition-transform duration-500 hover:scale-[1.01] lg:p-14">
            <div className="pointer-events-none absolute right-0 top-0 -mr-[10%] -mt-[10%] h-[400px] w-[400px] rounded-full bg-[#a78bfa] opacity-20 blur-[100px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 -mb-[10%] -ml-[10%] h-[300px] w-[300px] rounded-full bg-white opacity-5 blur-[100px]" />

            <div className="relative z-10 flex flex-col items-start">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-inner">
                <TrendingUp className="h-8 w-8 stroke-[2.5] text-[#c4b5fd]" />
              </div>

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-white/70">
                {t('for_marketeers_label')}
              </p>
              <h2 className="mb-4 text-3xl font-black leading-tight tracking-tight lg:text-4xl">
                {t('for_marketeers_title')}
              </h2>
              <p className="mb-8 text-base font-medium leading-relaxed text-white/80 lg:text-lg">
                {t('for_marketeers_desc')}
              </p>

              <Link
                href={`/${locale}/become-marketeer`}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-bold text-violet-900 shadow-xl transition-all hover:-translate-y-1 hover:bg-violet-50"
              >
                {t('for_marketeers_cta')}
                <Arrow className="h-4 w-4 text-violet-500 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
