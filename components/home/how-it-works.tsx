import { pick } from '@/lib/i18n-helpers'
import { Search, CreditCard, Plane } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

export function HowItWorks() {
  const t = useTranslations('homepage')
  const locale = useLocale()
  const isAr = locale === 'ar'

  const steps = [
    { icon: Search, title: t('step1_title'), desc: t('step1_desc') },
    { icon: CreditCard, title: t('step2_title'), desc: t('step2_desc') },
    { icon: Plane, title: t('step3_title'), desc: t('step3_desc') },
  ]

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f3f9ff_0%,#ffffff_45%,#fff5ea_100%)]" />
      <div className="absolute -top-40 -right-20 h-96 w-96 rounded-full bg-sky-200/30 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] h-72 w-72 rounded-full bg-orange-200/30 blur-[100px] pointer-events-none" />
      <div className="absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16 text-center animate-fade-in-up md:mb-24">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
            {pick(locale, 'كيف تبدأ', 'How it flows', 'Nasıl akar')}
          </p>
          <h2 className="mb-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            {t('how_it_works')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            {pick(locale, 'ثلاث خطوات واضحة لتنتقل من البحث إلى الحجز بدون تعقيد أو تشتيت.', 'Three focused steps take travelers from search to payment without unnecessary friction.', 'Üç odaklı adım, yolcuları gereksiz sürtüşme olmadan aramadan ödemeye taşır.')}
          </p>
        </div>
        
        <div className="relative mx-auto max-w-6xl">
          <div className="absolute left-[16%] right-[16%] top-14 z-0 hidden h-0.5 bg-gradient-to-r from-sky-200 via-orange-300 to-sky-200 md:block" />
          
          <div className="absolute bottom-0 top-0 left-[3rem] z-0 w-0.5 bg-gradient-to-b from-sky-200 via-orange-300 to-sky-200 md:hidden rtl:left-auto rtl:right-[3rem]" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-12 relative z-10">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className="group relative flex flex-row gap-6 rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.75))] p-6 shadow-lg shadow-slate-100/70 backdrop-blur-sm animate-fade-in-up md:flex-col md:items-center md:gap-0 md:p-8 md:text-center"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className={idx === 0 ? "absolute inset-x-6 top-0 h-1 rounded-b-full bg-sky-400/70" : idx === 1 ? "absolute inset-x-6 top-0 h-1 rounded-b-full bg-orange-400/70" : "absolute inset-x-6 top-0 h-1 rounded-b-full bg-emerald-400/70"} />
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-sky-100 bg-white shadow-lg shadow-sky-100/50 transition-transform duration-500 group-hover:-translate-y-2 group-hover:border-orange-200 group-hover:shadow-orange-100/50 md:mb-8 md:h-24 md:w-24">
                  <div className="absolute inset-2 flex items-center justify-center rounded-full bg-sky-50 transition-colors duration-500 group-hover:bg-orange-50">
                    <step.icon className="h-8 w-8 text-sky-700 transition-colors duration-500 group-hover:text-orange-500" />
                  </div>
                  <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-md ring-4 ring-white md:-right-2 md:-top-2">
                    {idx + 1}
                  </div>
                </div>
                
                <div className="flex flex-1 flex-col pt-1 md:pt-0">
                  <h3 className="mb-3 text-xl font-bold text-slate-900 transition-colors group-hover:text-sky-800 md:text-2xl">{step.title}</h3>
                  <p className="text-base font-medium leading-relaxed text-slate-600 md:mx-auto md:max-w-[280px]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
