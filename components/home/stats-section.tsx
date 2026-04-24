import { pick } from '@/lib/i18n-helpers'
import { Plane, Building2, Users } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface StatsSectionProps {
  tripsCount: number
  providersCount: number
  bookingsCount: number
}

export function StatsSection({ tripsCount, providersCount, bookingsCount }: StatsSectionProps) {
  const t = useTranslations('homepage')
  const locale = useLocale()
  const isAr = locale === 'ar'

  const stats = [
    { 
      icon: Plane, 
      value: tripsCount, 
      label: t('stats_trips'),
      desc: pick(locale, 'رحلات جاهزة للحجز الآن مع عرض أوضح للخيارات.', 'Fresh flight listings travelers can book right now.', 'Yolcuların şu anda rezerve edebileceği yeni uçuş listeleri.')
    },
    { 
      icon: Building2, 
      value: providersCount, 
      label: t('stats_providers'),
      desc: pick(locale, 'شركات موثقة تدير العروض عبر مواسم ومسارات متعددة.', 'Verified companies powering the marketplace across routes and seasons.', 'Rotalar ve sezonlar boyunca pazar yerine güç veren doğrulanmış şirketler.')
    },
    { 
      icon: Users, 
      value: bookingsCount, 
      label: t('stats_travelers'),
      desc: pick(locale, 'مسافرون أكدوا حجوزاتهم ويستخدمون المنصة بثقة.', 'Confirmed passengers who already trust the platform with their plans.', 'Planları için platforma güvenen onaylı yolcular.')
    },
  ]

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.08),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.1),transparent_30%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-700">
              {pick(locale, 'أرقام المنصة', 'Platform snapshot', 'Platform anlık görünümü')}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {pick(locale, 'نمو واضح في الرحلات والمزودين وحجوزات المسافرين', 'A stronger marketplace across routes, providers, and confirmed travelers', 'Rotalar, tedarikçiler ve onaylı yolcular genelinde daha güçlü bir pazar yeri')}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600 md:text-lg">
              {pick(locale, 'الواجهة الجديدة تبرز الثقة والحجم الفعلي للمنصة بسرعة.', 'The updated landing flow now surfaces trust and marketplace scale at a glance.', 'Güncellenen iniş akışı artık güveni ve pazar yeri ölçeğini bir bakışta ortaya koyuyor.')}
            </p>
          </div>
          <div className="rounded-full border border-sky-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_100%)] px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
            {bookingsCount.toLocaleString()}+ {t('stats_travelers')}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {stats.map((stat, idx) => (
            <div 
              key={stat.label}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border p-10 transition-all duration-300 hover:-translate-y-1",
                idx === 1
                  ? "border-sky-200 bg-[linear-gradient(145deg,#ffffff_0%,#eff6ff_70%,#dbeafe_100%)] shadow-xl shadow-sky-100/70"
                  : idx === 0
                    ? "border-orange-100/80 bg-[linear-gradient(145deg,#ffffff_0%,#fff7ed_70%,#ffedd5_100%)] shadow-lg shadow-orange-100/40"
                    : "border-emerald-100/80 bg-[linear-gradient(145deg,#ffffff_0%,#ecfeff_70%,#d1fae5_100%)] shadow-lg shadow-emerald-100/40"
              )}
            >
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/60 blur-2xl" />
              <div className={cn(
                "mb-10 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-500 md:h-20 md:w-20",
                idx === 1 ? "border border-sky-200 bg-white" : idx === 0 ? "border border-orange-100 bg-white/90" : "border border-emerald-100 bg-white/90"
              )}>
                <stat.icon className={cn(
                  "h-7 w-7 md:h-8 md:w-8 stroke-[1.5]", 
                  idx === 1 ? "text-sky-700" : idx === 0 ? "text-orange-500" : "text-emerald-600"
                )} />
              </div>
              
              <div className="relative z-10">
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-slate-500">
                  {stat.label}
                </p>
                <div className="mb-4 flex items-baseline gap-1">
                  <h3 className="font-serif text-6xl font-bold leading-none tracking-tight text-slate-900 md:text-[5.5rem]">
                    {stat.value}
                  </h3>
                  <span className="text-3xl font-medium text-slate-400 md:text-5xl">
                    +
                  </span>
                </div>
                <p className="max-w-[18rem] text-sm leading-relaxed text-slate-600 md:text-base">
                  {stat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
