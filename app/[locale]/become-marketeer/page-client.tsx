'use client'

import { pick } from '@/lib/i18n-helpers'
import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  BadgePercent,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Gift,
  Rocket,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  UserPlus,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type BecomeMarketeerPageClientProps = {
  locale: string
  title: string
  subtitle: string
  applyNow: string
  howItWorks: string
  steps: string[]
}

const sarPerPoint = 0.05

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
    },
  },
}

export function BecomeMarketeerPageClient({
  locale,
  title,
  subtitle,
  applyNow,
  howItWorks,
  steps,
}: BecomeMarketeerPageClientProps) {
  const isAr = locale === 'ar'
  const shouldReduceMotion = useReducedMotion()
  const [targetSar, setTargetSar] = useState('1000')
  const numberFormatter = new Intl.NumberFormat(pick(locale, 'ar-SA', 'en-US', 'tr-TR'))

  const earningEvents = isAr
    ? [
        { icon: Gift, event: 'تسجيل', description: 'مكافأة التسجيل الأولى', points: '+500' },
        { icon: Rocket, event: 'بيع حجز رحلة', description: 'عند إتمام بيع رحلة عبر رابطك', points: '+500' },
        { icon: Wallet, event: 'بيع حجز فندق', description: 'لكل حجز غرفة ناجح', points: '+300' },
        { icon: UserPlus, event: 'إحالة عميل سجّل', description: 'عند تسجيل عميل جديد', points: '+100' },
        { icon: Share2, event: 'إحالة عميل حجز', description: 'عندما يُكمل العميل المُحال الحجز', points: '+200' },
        { icon: TrendingUp, event: 'إحالة مسوّق جديد', description: 'لتوسيع شبكة المسوّقين', points: '+300' },
        { icon: Star, event: 'مكافأة أسبوعية — 5 مبيعات', description: 'إنجاز أسبوعي ثابت', points: '+500' },
        { icon: Sparkles, event: 'مكافأة أسبوعية — 10 مبيعات', description: 'قيمة أعلى للأداء القوي', points: '+1200' },
        { icon: BadgePercent, event: 'مكافأة السرعة', description: 'أول عملية بيع على رحلة جديدة', points: '+700' },
      ]
    : [
        { icon: Gift, event: 'Registration bonus', description: 'Awarded when you join the program', points: '+500' },
        { icon: Rocket, event: 'Trip booking sale', description: 'For every confirmed trip sale', points: '+500' },
        { icon: Wallet, event: 'Room booking sale', description: 'For each successful hotel booking', points: '+300' },
        { icon: UserPlus, event: 'Referred client signup', description: 'When a referred client signs up', points: '+100' },
        { icon: Share2, event: 'Referred client booking', description: 'When a referred client completes a booking', points: '+200' },
        { icon: TrendingUp, event: 'Referred new marketeer', description: 'For expanding the marketeer network', points: '+300' },
        { icon: Star, event: 'Weekly bonus — 5 sales', description: 'Weekly target reward', points: '+500' },
        { icon: Sparkles, event: 'Weekly bonus — 10 sales', description: 'Higher reward for stronger volume', points: '+1200' },
        { icon: BadgePercent, event: 'Speed bonus', description: 'First sale on a newly launched trip', points: '+700' },
      ]

  const deductions = isAr
    ? [
        { icon: XCircle, event: 'إلغاء حجز', description: 'خصم عند إلغاء الحجز', points: '−200' },
        { icon: Banknote, event: 'تقييم سيئ', description: 'خصم للحفاظ على جودة الخدمة', points: '−100' },
      ]
    : [
        { icon: XCircle, event: 'Cancellation', description: 'Applied when a booking is cancelled', points: '−200' },
        { icon: Banknote, event: 'Bad rating', description: 'Applied to protect service quality', points: '−100' },
      ]

  const stepIcons = [CheckCircle2, Share2, TrendingUp, CircleDollarSign]
  const parsedTarget = Number(targetSar)
  const pointsNeeded = Number.isFinite(parsedTarget) && parsedTarget > 0 ? Math.ceil(parsedTarget / sarPerPoint) : 0
  const heroHighlights = isAr
    ? [
        { label: 'مكافأة التسجيل مباشرة بعد التفعيل', value: '+500', tone: 'violet' },
        { label: 'أول بيع على رحلة جديدة خلال أول فترة عرض', value: '+700', tone: 'fuchsia' },
        { label: 'الوصول إلى 10 مبيعات في أسبوع واحد', value: '+1200', tone: 'indigo' },
      ]
    : [
        { label: 'Registration reward right after activation', value: '+500', tone: 'violet' },
        { label: 'First sale on a newly listed trip', value: '+700', tone: 'fuchsia' },
        { label: 'Reach 10 sales within one week', value: '+1200', tone: 'indigo' },
      ]
  const previewRows = isAr
    ? [
        { label: '3 حجوزات رحلات عائلية عبر رابطك', value: '+1500' },
        { label: '2 عملاء جدد أكملوا الحجز بعد التسجيل', value: '+400' },
        { label: 'تحقيق هدف 5 مبيعات هذا الأسبوع', value: '+500' },
      ]
    : [
        { label: '3 family trip bookings from your link', value: '+1500' },
        { label: '2 new users who signed up and booked', value: '+400' },
        { label: 'Hit the 5-sales weekly target', value: '+500' },
      ]
  const heroStats = isAr
    ? [
        { value: '500+', label: 'لكل بيع رحلة مؤكّد' },
        { value: '0.05', label: 'ر.س قيمة كل نقطة' },
        { value: '1200', label: 'نقطة مكافأة أسبوعية كبرى' },
      ]
    : [
        { value: '500+', label: 'for each confirmed trip sale' },
        { value: '0.05', label: 'SAR value per point' },
        { value: '1200', label: 'top weekly bonus points' },
      ]
  const heroProof = isAr
    ? [
        'شارك روابط الرحلات والغرف عبر واتساب، سناب، تيليجرام أو حساباتك الاجتماعية.',
        'اكسب من الإحالات المباشرة ومن العملاء الذين يسجلون ثم يعودون لإتمام الحجز.',
        'تابع الرصيد، العمليات، وقيمة السحب المتوقعة من لوحة واحدة واضحة.',
      ]
    : [
        'Share trip and room links on WhatsApp, Snapchat, Telegram, or your social channels.',
        'Earn from direct conversions and from users who sign up first then come back to book.',
        'Track balance, transactions, and expected withdrawal value in one clear dashboard.',
      ]
  const economyIntro = pick(locale, 'هذه ليست نقاطاً تجميلية. كل حدث مهم في رحلة العميل له وزن واضح داخل البرنامج, من أول تسجيل إلى البيع المتكرر والمكافآت الأسبوعية.', 'These are not vanity points. Every meaningful customer action carries a defined reward, from the first signup to repeat sales and weekly performance bonuses.', 'Bunlar boş puanlar değildir. İlk kayıttan tekrar satışlara ve haftalık performans bonuslarına kadar her anlamlı müşteri eyleminin tanımlı bir ödülü vardır.')
  const deductionsIntro = pick(locale, 'الخصومات موجودة لحماية جودة التجربة وحفظ ثقة العملاء. الأداء الجيد والاستجابة السريعة يبقيان رصيدك في اتجاه صاعد.', 'Deductions exist to protect customer trust and booking quality. Strong service and fast follow-up keep your balance moving upward.', 'Kesintiler müşteri güvenini ve rezervasyon kalitesini korumak için vardır. Güçlü hizmet ve hızlı takip bakiyenizi yukarı taşır.')
  const calculatorNotes = isAr
    ? [
        '1,000 ر.س تحتاج إلى 20,000 نقطة.',
        'كل 20 نقطة تعادل ريالاً سعودياً واحداً.',
      ]
    : [
        '1,000 SAR requires 20,000 points.',
        'Every 20 points equal 1 Saudi Riyal.',
      ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fcfcfe]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-[linear-gradient(180deg,rgba(76,29,149,0.08)_0%,rgba(255,255,255,0)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(109,40,217,0.16),transparent)]" />

      <motion.section
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="relative overflow-hidden px-4 pb-24 pt-26 sm:px-6 lg:px-8"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={shouldReduceMotion ? undefined : { x: [0, 18, 0], y: [0, -14, 0] }}
            transition={shouldReduceMotion ? undefined : { duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-[-8%] top-[8%] h-72 w-72 rounded-full bg-[#4c1d95]/8 blur-[110px]"
          />
          <motion.div
            animate={shouldReduceMotion ? undefined : { x: [0, -18, 0], y: [0, 20, 0] }}
            transition={shouldReduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute right-[-6%] top-[14%] h-[22rem] w-[22rem] rounded-full bg-[#a78bfa]/14 blur-[120px]"
          />
          <motion.div
            animate={shouldReduceMotion ? undefined : { x: [0, 12, 0], y: [0, 18, 0] }}
            transition={shouldReduceMotion ? undefined : { duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-[-8%] left-[30%] h-64 w-64 rounded-full bg-[#6d28d9]/8 blur-[110px]"
          />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-14">
            <div className={cn('mx-auto max-w-4xl text-center lg:mx-0 lg:text-start', isAr && 'lg:text-right')}>
              <motion.div variants={itemVariants}>
                <Badge className="mb-8 gap-3 border border-violet-200 bg-white px-5 py-2 text-sm font-semibold text-violet-900 shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500" />
                  </span>
                  <span>{pick(locale, 'برنامج FlyPoints', 'FlyPoints Program', 'FlyPoints Programı')}</span>
                </Badge>
              </motion.div>

              <motion.div variants={itemVariants}>
                <h1 className="text-balance text-4xl font-black leading-[1.02] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[5rem]">
                  {title}
                </h1>
                <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl lg:max-w-2xl">
                  {subtitle}
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {(isAr
                  ? ['مناسب لصنّاع المحتوى والمسوقين بالعمولة', 'روابط مخصصة لكل حملة', 'تحويل النقاط إلى رصيد قابل للسحب']
                  : ['Built for creators & affiliate marketers', 'Campaign-ready referral links', 'Convert points into withdrawable value']).map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold tracking-[0.02em] text-slate-700"
                  >
                    {chip}
                  </span>
                ))}
              </motion.div>

              <motion.div variants={itemVariants} className="mt-10 flex w-full max-w-xl flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <Link
                  href={`/${locale}/become-marketeer/apply`}
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'w-full rounded-xl border border-violet-800 bg-violet-900 px-7 py-7 text-base font-bold text-white shadow-lg shadow-violet-950/10 transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-violet-800 sm:w-auto'
                  )}
                >
                  {applyNow}
                  <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
                </Link>
                <a
                  href="#how-it-works"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                    'w-full rounded-xl border-slate-200 bg-white px-7 py-7 text-base font-semibold text-slate-900 shadow-sm transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/40 sm:w-auto'
                  )}
                >
                  {howItWorks}
                </a>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="mt-14 grid w-full max-w-5xl gap-4 md:grid-cols-3"
              >
                {heroStats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={cn(
                      'rounded-2xl border p-6 text-center',
                      index === 0 && 'border-slate-200 bg-white',
                      index === 1 && 'border-slate-200 bg-white',
                      index === 2 && 'border-violet-200 bg-violet-50'
                    )}
                  >
                    <p className={cn('text-3xl font-black tracking-tight', index === 2 ? 'text-violet-950' : 'text-slate-950')}>
                      {stat.value}
                    </p>
                    <p className={cn('mt-2 text-xs font-semibold uppercase tracking-[0.14em]', index === 2 ? 'text-violet-700' : 'text-slate-500')}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={itemVariants} className="mt-8 grid gap-3 lg:max-w-2xl">
                {heroProof.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{item}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="relative">
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/40 sm:p-6">
                <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(109,40,217,0.06),transparent)]" />
                <div className="relative">
                  <div className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-700">
                        {pick(locale, 'نموذج الدخل', 'Income preview', 'Gelir önizlemesi')}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {pick(locale, 'مثال حقيقي لمسوق يروّج لعروض عمرة وسكن', 'A realistic example for a marketer promoting Umrah trips and stays', 'Umre gezileri ve konaklamalarını tanıtan bir pazarlamacı için gerçekçi bir örnek')}
                      </p>
                    </div>
                    <div className="rounded-full bg-violet-950 px-4 py-2 text-sm font-black text-white">
                      {pick(locale, '2400 نقطة', '2400 pts', '2400 puan')}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {heroHighlights.map((item) => (
                      <div
                        key={item.label}
                        className={cn(
                          'rounded-[1.25rem] border p-4',
                          item.tone === 'violet' && 'border-slate-200 bg-white',
                          item.tone === 'fuchsia' && 'border-slate-200 bg-white',
                          item.tone === 'indigo' && 'border-violet-200 bg-violet-50'
                        )}
                      >
                        <p className="text-sm font-semibold text-slate-600">{item.label}</p>
                        <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-slate-200 bg-slate-950 text-white">
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-xl font-black">
                            {pick(locale, 'لوحة الأداء السريعة', 'Quick performance view', 'Hızlı performans görünümü')}
                          </CardTitle>
                          <CardDescription className="mt-1 text-violet-100">
                            {pick(locale, 'رصيد أسبوع واحد من مزيج مبيعات وإحالات ومكافآت', 'One-week balance from a mix of sales, referrals, and bonuses', 'Satış, referans ve bonus karışımından bir haftalık bakiye')}
                          </CardDescription>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                          <Zap className="h-5 w-5 text-violet-100" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="space-y-3">
                        {previewRows.map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                          >
                            <span className="text-sm font-medium text-violet-100">{row.label}</span>
                            <span className="font-black tracking-tight text-white">{row.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-2xl bg-white px-5 py-4 text-slate-950">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-500">
                            {pick(locale, 'القيمة التقريبية', 'Estimated value', 'Tahmini değer')}
                          </span>
                          <span className="text-3xl font-black tracking-tight text-violet-950">
                            {pick(locale, '120 ر.س', '120 SAR', '120 SAR')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <div className="mb-12 text-center">
            <Badge className="border-violet-200 bg-violet-50 px-4 py-1.5 text-violet-800">
              {pick(locale, 'اقتصاد النقاط', 'Points Economy', 'Puan Ekonomisi')}
            </Badge>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {pick(locale, 'كل عملية لها قيمة واضحة وقابلة للتحويل', 'Every action maps to clear, cashable value', 'Her eylem net, nakde çevrilebilir bir değere karşılık gelir')}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {economyIntro}
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {earningEvents.map((item) => (
              <motion.div key={item.event} variants={itemVariants}>
                <Card className="group h-full overflow-hidden rounded-[1.5rem] border-slate-200 bg-white transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-slate-200/60">
                  <CardHeader className="space-y-4 p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div className="rounded-full bg-slate-950 px-4 py-2 text-base font-black tracking-tight text-white">
                        {item.points}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-bold text-slate-950">{item.event}</CardTitle>
                      <CardDescription className="text-sm leading-6 text-slate-600">
                        {item.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 rounded-[1.75rem] border border-red-200 bg-red-50/50 p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950">
                  {pick(locale, 'الخصومات', 'Deductions', 'Kesintiler')}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {deductionsIntro}
                </p>
              </div>
              <Badge variant="destructive" className="w-fit px-4 py-1.5 text-sm">
                {pick(locale, 'قواعد حماية الجودة', 'Quality safeguards', 'Kalite güvenceleri')}
              </Badge>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {deductions.map((item) => (
                <Card key={item.event} className="rounded-[1.25rem] border-red-200 bg-white">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-950">{item.event}</p>
                      <p className="text-sm text-slate-600">{item.description}</p>
                    </div>
                    <div className="rounded-full bg-red-600/10 px-3 py-1.5 text-sm font-black text-red-700">
                      {item.points}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative scroll-mt-28 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10 lg:p-14">
          <div className="mb-12 text-center">
            <Badge className="border-violet-200 bg-violet-50 px-4 py-1.5 text-violet-800">
              {howItWorks}
            </Badge>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {pick(locale, 'مسار واضح من التسجيل إلى السحب', 'A clear path from onboarding to payout', 'Kayıttan ödemeye net bir yol')}
            </h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
            className="relative space-y-8 before:absolute before:inset-0 before:ms-6 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-violet-200 before:to-transparent before:content-[''] md:before:start-1/2 md:before:ms-0 md:before:h-full md:before:w-0.5"
          >
            {steps.map((step, index) => {
              const StepIcon = stepIcons[index] ?? Rocket

              return (
                <motion.div
                  key={step}
                  variants={itemVariants}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse"
                >
                  <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white bg-violet-50 text-violet-700 shadow-sm md:order-1 md:odd:-translate-x-1/2 md:even:translate-x-1/2">
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <Card className="w-[calc(100%-4rem)] rounded-[1.5rem] border-slate-200 bg-white transition-[border-color,box-shadow] hover:border-violet-200 hover:shadow-md hover:shadow-slate-200/50">
                    <CardContent className="p-6">
                      <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-violet-700">
                        {pick(locale, `الخطوة ${index + 1}`, `Step ${index + 1}`)}
                      </p>
                      <p className="text-sm leading-7 text-slate-600 sm:text-base">{step}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-xl shadow-slate-300/20 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute right-[-8%] top-[-12%] h-72 w-72 rounded-full bg-[#c4b5fd]/8 blur-[100px]" />
            <div className="absolute bottom-[-14%] left-[-6%] h-80 w-80 rounded-full bg-white/5 blur-[110px]" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <Badge className="border-white/10 bg-white/5 px-4 py-1.5 text-white">
                {pick(locale, 'قيمة FlyPoints', 'FlyPoints Value', 'FlyPoints Değeri')}
              </Badge>
              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                {pick(locale, '1 نقطة = 0.05 ر.س', '1 point = 0.05 SAR', '1 puan = 0.05 SAR')}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-violet-100 sm:text-lg">
                {pick(locale, 'كل نقطة لها قيمة مالية واضحة داخل البرنامج. خطط لحملتك التالية وفق هدف مالي حقيقي, ثم اعرف كم نقطة تحتاج للوصول إليه.', 'Each point has a real monetary value inside the program. Plan your next campaign around an actual earnings target, then calculate how many points you need to reach it.', 'Her puanın program içinde gerçek bir parasal değeri vardır. Bir sonraki kampanyanızı gerçek bir kazanç hedefine göre planlayın, ardından ulaşmak için kaç puana ihtiyacınız olduğunu hesaplayın.')}
              </p>
              <Separator className="my-6 bg-white/15" />
              <div className="flex flex-wrap gap-3 text-sm text-violet-100">
                {calculatorNotes.map((note) => (
                  <span key={note} className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    {note}
                  </span>
                ))}
              </div>
            </div>

            <Card className="rounded-[1.5rem] border-white/10 bg-white text-slate-950 shadow-xl shadow-black/10">
              <CardHeader className="p-7 pb-4">
                <CardTitle className="text-2xl font-black">
                  {pick(locale, 'حاسبة الريال السعودي', 'SAR calculator', 'SAR hesaplayıcı')}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-600">
                  {pick(locale, 'أدخل المبلغ المستهدف بالريال لنحسب عدد النقاط المطلوبة.', 'Enter your target amount in SAR to calculate the points required.', 'Gereken puanı hesaplamak için hedef tutarınızı SAR olarak girin.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 p-7 pt-0">
                <div>
                  <label htmlFor="target-sar" className="mb-2 block text-sm font-semibold text-slate-700">
                    {pick(locale, 'المبلغ المستهدف (ر.س)', 'Target amount (SAR)', 'Hedef tutar (SAR)')}
                  </label>
                  <Input
                    id="target-sar"
                    name="targetSar"
                    type="number"
                    min="0"
                    step="50"
                    inputMode="numeric"
                    autoComplete="off"
                    value={targetSar}
                    onChange={(event) => setTargetSar(event.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 text-base shadow-none focus-visible:border-violet-400 focus-visible:ring-violet-300/30"
                  />
                </div>

                <div className="rounded-[1.25rem] bg-violet-50 p-5 ring-1 ring-violet-100">
                  <p className="text-sm font-semibold text-violet-700">
                    {pick(locale, 'النقاط المطلوبة', 'Points needed', 'Gerekli puan')}
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-tight text-violet-950">
                    {numberFormatter.format(pointsNeeded)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {pick(locale, `للوصول إلى ${numberFormatter.format(Math.max(parsedTarget || 0, 0))} ر.س`, `To reach ${numberFormatter.format(Math.max(parsedTarget || 0, 0))} SAR`)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-14">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(109,40,217,0.08),transparent)]" />

            <div className="relative z-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50">
                <TrendingUp className="h-8 w-8 text-violet-700" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {pick(locale, 'حوّل جمهورك إلى قناة مبيعات مستمرة لرحلات BookitFly', 'Turn your audience into a recurring sales channel for BookitFly', 'Kitlenizi BookitFly için sürekli bir satış kanalına dönüştürün')}
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                {pick(locale, 'سواء كنت تدير مجتمعاً على واتساب, حساب محتوى على سناب أو تيليجرام, أو شبكة عملاء متكررين, يمنحك البرنامج طريقة منظمة لبيع الرحلات والغرف ومتابعة العائد من كل رابط.', 'Whether you run a WhatsApp community, a Snapchat or Telegram audience, or a repeat-customer network, the program gives you a structured way to sell trips and rooms and track the return from every referral link.', 'Bir WhatsApp topluluğunu, Snapchat veya Telegram kitlesini ya da sürekli müşteri ağını yönetiyor olmanız fark etmeksizin, program size gezi ve oda satmanın ve her referans bağlantısından gelen getiriyi takip etmenin yapılandırılmış bir yolunu sunar.')}
              </p>
              <Link
                href={`/${locale}/become-marketeer/apply`}
                className="mt-8 inline-flex items-center justify-center gap-3 rounded-xl bg-violet-900 px-8 py-4 text-base font-bold text-white shadow-lg transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-violet-800"
              >
                {applyNow}
                <ArrowRight className="h-5 w-5 text-white rtl:-scale-x-100" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
