import { pick } from '@/lib/i18n-helpers'
import { ShieldCheck, Clock, CheckCircle2, HeadphonesIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ValuePropositionProps {
  locale: string
}

export function ValueProposition({ locale }: ValuePropositionProps) {
  const isAr = locale === 'ar'

  const features = [
    {
      icon: ShieldCheck,
      titleEn: 'Protected booking flow',
      titleAr: 'رحلة حجز محمية',
      descEn: 'Every checkout step is secured so travelers can confirm with confidence.',
      descAr: 'كل خطوة في الدفع محمية لتأكيد الحجز بثقة ووضوح.',
      colSpan: 'md:col-span-2',
      bg: 'bg-[linear-gradient(135deg,#0c4a6e_0%,#0f766e_100%)] text-white',
      iconColor: 'text-[#0c4a6e]',
      iconBg: 'bg-white',
      border: 'border border-white/10',
      shadow: 'shadow-2xl shadow-sky-900/20'
    },
    {
      icon: CheckCircle2,
      titleEn: 'Curated travel partners',
      titleAr: 'شركاء سفر مختارون',
      descEn: 'Only trusted providers make it onto the marketplace.',
      descAr: 'نختار فقط المزودين الموثوقين لعرضهم في المنصة.',
      colSpan: 'md:col-span-1',
      bg: 'bg-[#fff8ef]',
      text: 'text-slate-900',
      descText: 'text-slate-600',
      iconColor: 'text-[#f97316]',
      iconBg: 'bg-white',
      border: 'border border-orange-100/80',
      shadow: 'shadow-lg shadow-orange-100/40'
    },
    {
      icon: Clock,
      titleEn: 'Faster decision making',
      titleAr: 'اتخاذ قرار أسرع',
      descEn: 'Compare schedules quickly and move from search to checkout without friction.',
      descAr: 'قارن المواعيد بسرعة وانتقل من البحث إلى الدفع بسلاسة.',
      colSpan: 'md:col-span-1',
      bg: 'bg-[#f5f9ff]',
      text: 'text-slate-900',
      descText: 'text-slate-600',
      iconColor: 'text-[#0c4a6e]',
      iconBg: 'bg-white',
      border: 'border border-sky-100',
      shadow: 'shadow-lg shadow-sky-100/50'
    },
    {
      icon: HeadphonesIcon,
      titleEn: 'Human support when plans shift',
      titleAr: 'دعم بشري عند تغير الخطط',
      descEn: 'A responsive team helps when timing, passengers, or routes change.',
      descAr: 'فريق سريع الاستجابة يساعدك عند تغير المواعيد أو المسافرين أو المسار.',
      colSpan: 'md:col-span-2',
      bg: 'bg-white',
      text: 'text-slate-900',
      descText: 'text-slate-600',
      iconColor: 'text-[#0f766e]',
      iconBg: 'bg-[#f0fdfa]',
      border: 'border border-slate-200/70',
      shadow: 'shadow-lg shadow-slate-100'
    }
  ]

  return (
    <section className="relative overflow-hidden py-24 bg-[linear-gradient(180deg,transparent_0%,#fff7ed_60%,#ffffff_100%)]">
      <div className="pointer-events-none absolute left-[-6%] top-10 h-80 w-80 rounded-full bg-orange-100/60 blur-[110px]" />
      <div className="pointer-events-none absolute right-[-8%] bottom-0 h-96 w-96 rounded-full bg-sky-100/60 blur-[120px]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f97316]">
            {pick(locale, 'لماذا BooktFly', 'Why BooktFly', 'Neden BooktFly')}
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            {pick(locale, 'تجربة أوضح وأسهل للحجز من البحث حتى التأكيد', 'A clearer booking experience from first search to final confirmation', 'İlk aramadan son onaya kadar daha net bir rezervasyon deneyimi')}
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            {pick(locale, 'صممنا الصفحة لتركز على الثقة والسرعة وسهولة الاختيار بدون ازدحام بصري.', 'The landing experience now emphasizes trust, speed, and decision clarity without visual clutter.', 'İniş deneyimi artık görsel karmaşa olmadan güveni, hızı ve karar netliğini vurguluyor.')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={cn(
                "relative overflow-hidden rounded-[2rem] p-10 transition-all duration-300 hover:-translate-y-1 hover:rotate-[-0.4deg]",
                feature.colSpan,
                feature.bg,
                feature.border,
                feature.shadow
              )}
            >
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <div className="relative z-10 h-full flex min-h-[160px] flex-col justify-between">
                <div className={cn("mb-8 flex h-16 w-16 items-center justify-center rounded-2xl", feature.iconBg, feature.bg === 'bg-white' || feature.bg === 'bg-[#f5f9ff]' || feature.bg === 'bg-[#fff8ef]' ? 'border border-slate-100' : '')}>
                  <feature.icon className={cn("h-7 w-7 stroke-[2]", feature.iconColor)} />
                </div>
                <div>
                  <h3 className={cn("mb-3 text-2xl font-serif font-bold tracking-wide", feature.text)}>
                    {isAr ? feature.titleAr : feature.titleEn}
                  </h3>
                  <p className={cn("text-[15px] font-sans leading-relaxed", feature.descText)}>
                    {isAr ? feature.descAr : feature.descEn}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
