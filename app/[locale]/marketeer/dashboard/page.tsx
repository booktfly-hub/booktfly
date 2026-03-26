'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Star, Wallet, Loader2, TrendingUp, Users, AlertCircle,
  Copy, CheckCheck, BarChart3, MessageSquare, ArrowLeft, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Marketeer, FlypointsTransaction } from '@/types'

type DashboardData = {
  marketeer: Marketeer
  balance: number
  sar_value: number
  sar_rate: number
  total_earned: number
  referral_count: number
  transactions: FlypointsTransaction[]
}

export default function MarkeeteerDashboardPage() {
  const locale = useLocale() as 'ar' | 'en'
  const router = useRouter()
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/marketeers/dashboard', { headers: { 'Accept-Language': locale }, cache: 'no-store' })
      .then((r) => r.json())
      .then((result) => {
        if (result.error) {
          if (result.error.includes('not found') || result.error.includes('العثور')) {
            router.replace(`/${locale}/become-marketeer`)
          } else {
            setError(result.error)
          }
        } else {
          setData(result.data)
        }
      })
      .catch(() => setError(isAr ? 'خطأ في تحميل البيانات' : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [locale, router, isAr])

  function copyReferralLink() {
    if (!data) return
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    navigator.clipboard.writeText(`${origin}/ref/${data.marketeer.referral_code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  const { marketeer, balance, sar_value, sar_rate, total_earned, referral_count, transactions } = data
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/ref/${marketeer.referral_code}`
    : `/ref/${marketeer.referral_code}`

  const statCards = [
    {
      label: isAr ? 'رصيد FlyPoints' : 'FlyPoints Balance',
      value: balance.toLocaleString(),
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
    {
      label: isAr ? 'القيمة بالريال' : 'SAR Value',
      value: `${sar_value.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}`,
      icon: Wallet,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: isAr ? 'إجمالي المكتسب' : 'Total Earned',
      value: total_earned.toLocaleString(),
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: isAr ? 'الإحالات' : 'Referrals',
      value: referral_count.toString(),
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ]

  const navCards = [
    {
      href: `/${locale}/marketeer/users`,
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      title: isAr ? 'المستخدمون' : 'Users',
      desc: isAr ? 'عرض المستخدمين المُحالين عبر رابطك' : 'View users referred through your link',
      value: referral_count,
      unit: isAr ? 'مستخدم' : 'users',
    },
    {
      href: `/${locale}/marketeer/revenue`,
      icon: BarChart3,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      title: isAr ? 'الإيرادات' : 'Revenue',
      desc: isAr ? 'سجل النقاط والمعاملات' : 'Points history and transactions',
      value: transactions.length,
      unit: isAr ? 'معاملة' : 'transactions',
    },
    {
      href: `/${locale}/marketeer/wallet`,
      icon: Wallet,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      title: isAr ? 'المحفظة' : 'Wallet',
      desc: isAr ? 'رصيدك وطلبات السحب' : 'Your balance and withdrawal requests',
      value: `${sar_value.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}`,
      unit: null,
    },
    {
      href: `/${locale}/marketeer/reviews`,
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      title: isAr ? 'التقييمات' : 'Reviews',
      desc: isAr ? 'تقييمات العملاء' : 'Customer reviews for you',
      value: null,
      unit: null,
    },
    {
      href: `/${locale}/marketeer/chat`,
      icon: MessageSquare,
      color: 'text-slate-500',
      bg: 'bg-slate-500/10',
      title: isAr ? 'المحادثات' : 'Chat',
      desc: isAr ? 'تواصل مع العملاء' : 'Communicate with customers',
      value: null,
      unit: null,
      soon: true,
    },
  ]

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {isAr ? 'لوحة المسوّق' : 'Marketeer Dashboard'}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {isAr ? `مرحباً، ${marketeer.full_name}` : `Welcome back, ${marketeer.full_name}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div
            key={card.label}
            className="group bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110', card.bg)}>
              <card.icon className={cn('h-6 w-6', card.color)} />
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{card.value}</p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div
        className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm animate-fade-in-up"
        style={{ animationDelay: '320ms' }}
      >
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
          {isAr ? 'رابط الإحالة' : 'Referral Link'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-600 break-all">
            {referralLink}
          </div>
          <button
            onClick={copyReferralLink}
            className={cn(
              'flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold shrink-0 transition-all',
              copied
                ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            )}
          >
            {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? (isAr ? 'تم النسخ' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy Link')}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          {isAr
            ? `معدّل التحويل: 1 نقطة = ${sar_rate} ر.س`
            : `Conversion rate: 1 point = ${sar_rate} SAR`}
        </p>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {navCards.map((card, idx) => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up flex flex-col"
            style={{ animationDelay: `${(idx + 4) * 80}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110', card.bg)}>
                <card.icon className={cn('h-6 w-6', card.color)} />
              </div>
              {card.soon ? (
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                  {isAr ? 'قريباً' : 'Soon'}
                </span>
              ) : (
                <Arrow className="h-5 w-5 text-slate-300 group-hover:text-slate-600 transition-colors group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              )}
            </div>
            <p className="text-lg font-black text-slate-900 mb-1">{card.title}</p>
            <p className="text-sm text-slate-500 flex-1">{card.desc}</p>
            {card.value !== null && (
              <p className="text-2xl font-black text-slate-900 mt-4 tracking-tighter">
                {card.value}
                {card.unit && <span className="text-sm font-bold text-slate-400 ms-1">{card.unit}</span>}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
