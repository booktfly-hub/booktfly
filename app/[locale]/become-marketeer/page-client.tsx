'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
  const [targetSar, setTargetSar] = useState('1000')

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fbf8ff_0%,#ffffff_20%,#faf5ff_58%,#f5f3ff_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-gradient-to-b from-violet-950/10 via-violet-500/5 to-transparent" />
      <div className="pointer-events-none absolute -left-20 top-20 h-80 w-80 rounded-full bg-[#6d28d9]/18 blur-[100px]" />
      <div className="pointer-events-none absolute right-[-5%] top-8 h-[28rem] w-[28rem] rounded-full bg-[#a78bfa]/28 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[28%] left-[14%] h-72 w-72 rounded-full bg-[#4c1d95]/10 blur-[100px]" />

      <motion.section
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="relative overflow-hidden px-4 pb-24 pt-36 sm:px-6 lg:px-8"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 18, 0], y: [0, -14, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-[-8%] top-[8%] h-72 w-72 rounded-full bg-[#4c1d95]/20 blur-[90px]"
          />
          <motion.div
            animate={{ x: [0, -18, 0], y: [0, 20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute right-[-6%] top-[14%] h-[22rem] w-[22rem] rounded-full bg-[#a78bfa]/35 blur-[110px]"
          />
          <motion.div
            animate={{ x: [0, 12, 0], y: [0, 18, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-[-8%] left-[30%] h-64 w-64 rounded-full bg-[#6d28d9]/18 blur-[100px]"
          />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col items-center">
          <motion.div variants={itemVariants}>
            <Badge className="mb-8 gap-3 border border-violet-200/70 bg-white/80 px-5 py-2 text-sm font-semibold text-violet-900 shadow-lg shadow-violet-200/40 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500" />
              </span>
              <span>{isAr ? 'برنامج FlyPoints' : 'FlyPoints Program'}</span>
            </Badge>
          </motion.div>

          <motion.div variants={itemVariants} className="max-w-4xl text-center">
            <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-[5.25rem]">
              {title}
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-lg font-medium leading-relaxed text-slate-600 sm:text-xl">
              {subtitle}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-10 flex w-full max-w-xl flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/${locale}/become-marketeer/apply`}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'w-full rounded-2xl border border-violet-700 bg-[linear-gradient(135deg,#4c1d95_0%,#6d28d9_55%,#8b5cf6_100%)] px-7 py-7 text-base font-bold text-white shadow-xl shadow-violet-900/20 transition hover:scale-[1.02] hover:brightness-105 sm:w-auto'
              )}
            >
              {applyNow}
              <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
            </Link>
            <a
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'w-full rounded-2xl border-violet-200 bg-white/75 px-7 py-7 text-base font-semibold text-violet-950 shadow-lg shadow-violet-100/60 backdrop-blur-sm transition hover:border-violet-300 hover:bg-violet-50/90 sm:w-auto'
              )}
            >
              {howItWorks}
            </a>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-14 grid w-full max-w-5xl gap-4 md:grid-cols-3"
          >
            {(isAr
              ? [
                  { value: '500+', label: 'نقطة لأول إنجاز' },
                  { value: '0.05', label: 'ر.س لكل نقطة' },
                  { value: '10x', label: 'حافز أسبوعي مضاعف' },
                ]
              : [
                  { value: '500+', label: 'points for first wins' },
                  { value: '0.05', label: 'SAR per point' },
                  { value: '10x', label: 'weekly reward lift' },
                ]).map((stat, index) => (
              <div
                key={stat.label}
                className={cn(
                  'rounded-[1.75rem] border p-6 text-center shadow-lg backdrop-blur-sm',
                  index === 0 && 'border-violet-200/70 bg-white/80 shadow-violet-200/40',
                  index === 1 && 'border-fuchsia-200/70 bg-[linear-gradient(180deg,#ffffff_0%,#faf5ff_100%)] shadow-fuchsia-100/50',
                  index === 2 && 'border-violet-900/10 bg-[linear-gradient(135deg,rgba(76,29,149,0.95),rgba(109,40,217,0.92))] text-white shadow-violet-900/20'
                )}
              >
                <p className={cn('text-3xl font-black tracking-tight', index === 2 ? 'text-white' : 'text-slate-950')}>
                  {stat.value}
                </p>
                <p className={cn('mt-2 text-xs font-bold uppercase tracking-[0.18em]', index === 2 ? 'text-violet-100' : 'text-slate-500')}>
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <Badge className="border-violet-200 bg-violet-50 px-4 py-1.5 text-violet-800">
              {isAr ? 'اقتصاد النقاط' : 'Points Economy'}
            </Badge>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {isAr ? 'كل عملية لها قيمة واضحة وقابلة للتحويل' : 'Every action maps to clear, cashable value'}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {isAr
                ? 'احسب دخلك بشكل فوري من كل إحالة أو عملية بيع. هذه النقاط هي قواعد البرنامج الأساسية وتُحتسب تلقائياً داخل لوحة المسوّق.'
                : 'Estimate your earnings instantly from every referral or sale. These point values are core program rules and accrue automatically inside the marketeer dashboard.'}
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
                <Card className="group h-full overflow-hidden rounded-[2rem] border-violet-100/80 bg-white/85 shadow-lg shadow-violet-100/40 transition-all duration-300 hover:-translate-y-1 hover:border-violet-300/70 hover:shadow-xl hover:shadow-violet-200/40">
                  <CardHeader className="space-y-4 p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ede9fe_0%,#f5f3ff_100%)] text-violet-700 ring-1 ring-violet-200/70">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div className="rounded-full bg-violet-950 px-4 py-2 text-base font-black tracking-tight text-white shadow-lg shadow-violet-900/20">
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

          <div className="mt-10 rounded-[2rem] border border-red-200/80 bg-[linear-gradient(180deg,#fff5f5_0%,#fffafb_100%)] p-6 shadow-lg shadow-red-100/40 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950">
                  {isAr ? 'الخصومات' : 'Deductions'}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {isAr
                    ? 'يتم خصم النقاط في الحالات التي تؤثر على جودة التجربة أو استقرار الحجوزات.'
                    : 'Points are deducted for actions that affect booking stability or customer experience quality.'}
                </p>
              </div>
              <Badge variant="destructive" className="w-fit px-4 py-1.5 text-sm">
                {isAr ? 'قواعد حماية الجودة' : 'Quality safeguards'}
              </Badge>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {deductions.map((item) => (
                <Card key={item.event} className="rounded-[1.5rem] border-red-200/70 bg-white/80 shadow-sm">
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

      <section id="how-it-works" className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-violet-100/80 bg-white/70 p-8 shadow-xl shadow-violet-100/40 backdrop-blur-sm sm:p-10 lg:p-14">
          <div className="mb-12 text-center">
            <Badge className="border-violet-200 bg-violet-50 px-4 py-1.5 text-violet-800">
              {howItWorks}
            </Badge>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {isAr ? 'مسار واضح من التسجيل إلى السحب' : 'A clear path from onboarding to payout'}
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
                  <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white bg-violet-100 text-violet-700 shadow-md md:order-1 md:odd:-translate-x-1/2 md:even:translate-x-1/2">
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <Card className="w-[calc(100%-4rem)] rounded-[1.75rem] border-violet-100/80 bg-white/90 shadow-lg shadow-violet-100/40 transition-colors hover:border-violet-300">
                    <CardContent className="p-6">
                      <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-violet-700">
                        {isAr ? `الخطوة ${index + 1}` : `Step ${index + 1}`}
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
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-violet-200/70 bg-[linear-gradient(135deg,#2e1065_0%,#4c1d95_44%,#6d28d9_100%)] p-8 text-white shadow-2xl shadow-violet-900/20 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute right-[-8%] top-[-12%] h-72 w-72 rounded-full bg-[#c4b5fd]/20 blur-[100px]" />
            <div className="absolute bottom-[-14%] left-[-6%] h-80 w-80 rounded-full bg-white/8 blur-[110px]" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <Badge className="border-white/20 bg-white/10 px-4 py-1.5 text-white backdrop-blur-sm">
                {isAr ? 'قيمة FlyPoints' : 'FlyPoints Value'}
              </Badge>
              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                {isAr ? '1 نقطة = 0.05 ر.س' : '1 point = 0.05 SAR'}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-violet-100 sm:text-lg">
                {isAr
                  ? 'كل 20 نقطة تساوي ريالاً سعودياً واحداً. استخدم الحاسبة لمعرفة الهدف المطلوب من النقاط قبل إطلاق حملتك التالية.'
                  : 'Every 20 points equal 1 Saudi Riyal. Use the calculator to estimate the points target you need before launching your next campaign.'}
              </p>
              <Separator className="my-6 bg-white/15" />
              <div className="flex flex-wrap gap-3 text-sm text-violet-100">
                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                  {isAr ? 'السحب بحسب الرصيد المتاح' : 'Redeem based on your available balance'}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                  {isAr ? 'تتبّع فوري داخل اللوحة' : 'Tracked live in your dashboard'}
                </span>
              </div>
            </div>

            <Card className="rounded-[1.75rem] border-white/15 bg-white/95 text-slate-950 shadow-2xl shadow-violet-950/20">
              <CardHeader className="p-7 pb-4">
                <CardTitle className="text-2xl font-black">
                  {isAr ? 'حاسبة الريال السعودي' : 'SAR calculator'}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-600">
                  {isAr ? 'أدخل المبلغ المستهدف بالريال لنحسب عدد النقاط المطلوبة.' : 'Enter your target amount in SAR to calculate the points required.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 p-7 pt-0">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {isAr ? 'المبلغ المستهدف (ر.س)' : 'Target amount (SAR)'}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={targetSar}
                    onChange={(event) => setTargetSar(event.target.value)}
                    className="h-12 rounded-2xl border-violet-200 bg-violet-50/40 text-base shadow-none focus-visible:border-violet-400 focus-visible:ring-violet-300/30"
                  />
                </div>

                <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#f5f3ff_0%,#ede9fe_100%)] p-5 ring-1 ring-violet-200/70">
                  <p className="text-sm font-semibold text-violet-700">
                    {isAr ? 'النقاط المطلوبة' : 'Points needed'}
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-tight text-violet-950">
                    {pointsNeeded.toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {isAr
                      ? `للوصول إلى ${Math.max(parsedTarget || 0, 0).toLocaleString('ar-SA')} ر.س`
                      : `To reach ${Math.max(parsedTarget || 0, 0).toLocaleString('en-US')} SAR`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-violet-200/30 bg-[linear-gradient(135deg,#1e1b4b_0%,#312e81_20%,#4c1d95_58%,#6d28d9_100%)] p-10 text-center text-white shadow-2xl shadow-violet-900/25 sm:p-14">
            <div className="pointer-events-none absolute right-0 top-0 -mr-[10%] -mt-[10%] h-[360px] w-[360px] rounded-full bg-[#a78bfa] opacity-20 blur-[100px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 -mb-[12%] -ml-[10%] h-[280px] w-[280px] rounded-full bg-white opacity-5 blur-[90px]" />

            <div className="relative z-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                <TrendingUp className="h-8 w-8 text-[#c4b5fd]" />
              </div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                {isAr ? 'ابدأ في بناء دخل متكرر من كل توصية' : 'Start building recurring income from every recommendation'}
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-violet-100 sm:text-lg">
                {isAr
                  ? 'انضم إلى برنامج المسوّقين، استلم رابطك الخاص، وابدأ بتحويل جمهورك إلى مبيعات ونقاط قابلة للسحب.'
                  : 'Join the marketeer program, get your referral link, and turn your audience into sales and redeemable points.'}
              </p>
              <Link
                href={`/${locale}/become-marketeer/apply`}
                className="mt-8 inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-bold text-violet-900 shadow-xl transition-all hover:-translate-y-1 hover:bg-violet-50"
              >
                {applyNow}
                <ArrowRight className="h-5 w-5 text-violet-500 rtl:-scale-x-100" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
