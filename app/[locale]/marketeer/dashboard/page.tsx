'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Star, Wallet, Loader2, TrendingUp, Users, AlertCircle,
  Copy, CheckCheck, BarChart3, MessageSquare, ArrowLeft, ArrowRight, Plane,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Marketeer, FlypointsTransaction } from '@/types'

type TopTrip = {
  trip_id: string
  label_ar: string
  label_en: string
  bookings: number
  revenue: number
}

type DashboardData = {
  marketeer: Marketeer
  balance: number
  sar_value: number
  sar_rate: number
  total_earned: number
  referral_count: number
  transactions: FlypointsTransaction[]
  attributed_count: number
  confirmed_count: number
  conversion_rate: number
  attributed_revenue: number
  pending_payout: number
  top_trips: TopTrip[]
}

export default function MarkeeteerDashboardPage() {
  const locale = useLocale() as 'ar' | 'en' | 'tr'
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
      .catch(() => setError(pick(locale, 'خطأ في تحميل البيانات', 'Failed to load data', 'Veriler yüklenemedi')))
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

  const { marketeer, balance, sar_value, sar_rate, total_earned, referral_count, transactions, attributed_count, confirmed_count, conversion_rate, attributed_revenue, pending_payout, top_trips } = data
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/ref/${marketeer.referral_code}`
    : `/ref/${marketeer.referral_code}`

  const statCards = [
    {
      label: pick(locale, 'رصيد FlyPoints', 'FlyPoints Balance', 'FlyPoints Bakiyesi'),
      value: balance.toLocaleString(),
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      href: `/${locale}/marketeer/wallet`,
    },
    {
      label: pick(locale, 'القيمة بالريال', 'SAR Value', 'SAR Değeri'),
      value: `${sar_value.toLocaleString()} ${pick(locale, 'ر.س', 'SAR', 'SAR')}`,
      icon: Wallet,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      href: `/${locale}/marketeer/wallet`,
    },
    {
      label: pick(locale, 'إجمالي المكتسب', 'Total Earned', 'Toplam Kazanılan'),
      value: total_earned.toLocaleString(),
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      href: `/${locale}/marketeer/revenue`,
    },
    {
      label: pick(locale, 'الإحالات', 'Referrals', 'Referanslar'),
      value: referral_count.toString(),
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      href: `/${locale}/marketeer/users`,
    },
  ]

  const navCards = [
    {
      href: `/${locale}/marketeer/book`,
      icon: Plane,
      color: 'text-sky-500',
      bg: 'bg-sky-500/10',
      title: pick(locale, 'حجز لعميل', 'Book for Customer', 'Müşteri İçin Rezervasyon Yap'),
      desc: pick(locale, 'احجز تذكرة نيابة عن عميلك وارسل له رابط الدفع', 'Create a booking for your customer and send them a payment link', 'Müşteriniz için bir rezervasyon oluşturun ve onlara bir ödeme bağlantısı gönderin'),
      value: null,
      unit: null,
    },
    {
      href: `/${locale}/marketeer/users`,
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      title: pick(locale, 'المستخدمون', 'Users', 'Kullanıcılar'),
      desc: pick(locale, 'عرض المستخدمين المُحالين عبر رابطك', 'View users referred through your link', 'Bağlantınız üzerinden yönlendirilen kullanıcıları görüntüle'),
      value: referral_count,
      unit: pick(locale, 'مستخدم', 'users', 'kullanıcı'),
    },
    {
      href: `/${locale}/marketeer/revenue`,
      icon: BarChart3,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      title: pick(locale, 'الإيرادات', 'Revenue', 'Gelir'),
      desc: pick(locale, 'سجل النقاط والمعاملات', 'Points history and transactions', 'Puan geçmişi ve işlemleri'),
      value: transactions.length,
      unit: pick(locale, 'معاملة', 'transactions', 'işlem'),
    },
    {
      href: `/${locale}/marketeer/wallet`,
      icon: Wallet,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      title: pick(locale, 'المحفظة', 'Wallet', 'Cüzdan'),
      desc: pick(locale, 'رصيدك وطلبات السحب', 'Your balance and withdrawal requests', 'Bakiyeniz ve çekim talepleriniz'),
      value: `${sar_value.toLocaleString()} ${pick(locale, 'ر.س', 'SAR', 'SAR')}`,
      unit: null,
    },
    {
      href: `/${locale}/marketeer/reviews`,
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      title: pick(locale, 'التقييمات', 'Reviews', 'Yorumlar'),
      desc: pick(locale, 'تقييمات العملاء', 'Customer reviews for you', 'Sizin için müşteri yorumları'),
      value: null,
      unit: null,
    },
    {
      href: `/${locale}/marketeer/chat`,
      icon: MessageSquare,
      color: 'text-slate-500',
      bg: 'bg-slate-500/10',
      title: pick(locale, 'المحادثات', 'Chat', 'Sohbet'),
      desc: pick(locale, 'تواصل مع العملاء', 'Communicate with customers', 'Müşterilerle iletişim kurun'),
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
          {pick(locale, 'لوحة المسوّق', 'Marketeer Dashboard', 'Pazarlamacı Paneli')}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {pick(locale, `مرحباً، ${marketeer.full_name}`, `Welcome back, ${marketeer.full_name}`)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <Link
            key={card.label}
            href={card.href}
            className="group bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110', card.bg)}>
              <card.icon className={cn('h-6 w-6', card.color)} />
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{card.value}</p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Referral link */}
      <div
        className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm animate-fade-in-up"
        style={{ animationDelay: '320ms' }}
      >
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
          {pick(locale, 'رابط الإحالة', 'Referral Link', 'Referans Bağlantısı')}
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
            {copied ? (pick(locale, 'تم النسخ', 'Copied!', 'Kopyalandı!')) : (pick(locale, 'نسخ الرابط', 'Copy Link', 'Bağlantıyı Kopyala'))}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          {pick(locale, `معدّل التحويل: 1 نقطة = ${sar_rate} ر.س`, `Conversion rate: 1 point = ${sar_rate} SAR`)}
        </p>
      </div>

      {/* Conversion funnel + pending payout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: pick(locale, 'نقرات محوّلة', 'Attributed Clicks', 'Atfedilen Tıklamalar'), value: attributed_count.toString(), color: 'text-slate-700' },
          { label: pick(locale, 'حجوزات مؤكدة', 'Confirmed Bookings', 'Onaylı Rezervasyonlar'), value: confirmed_count.toString(), color: 'text-emerald-600' },
          { label: pick(locale, 'معدل التحويل', 'Conversion Rate', 'Dönüşüm Oranı'), value: `${conversion_rate}%`, color: 'text-sky-600' },
          { label: pick(locale, 'دفعة معلّقة', 'Pending Payout', 'Bekleyen Ödeme'), value: `${pending_payout.toLocaleString()} ${pick(locale, 'ر.س', 'SAR', 'SAR')}`, color: 'text-amber-600' },
        ].map((m) => (
          <div key={m.label} className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{m.label}</p>
            <p className={cn('text-2xl font-black tracking-tighter', m.color)}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Top trips */}
      {top_trips.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {pick(locale, 'أفضل الرحلات', 'Top Trips', 'En İyi Geziler')}
            </p>
            <p className="text-xs font-bold text-slate-400">
              {pick(locale, `إجمالي ${attributed_revenue.toLocaleString()} ر.س`, `${attributed_revenue.toLocaleString()} SAR total`)}
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {top_trips.map((t, i) => (
              <Link
                key={t.trip_id}
                href={`/${locale}/trips/${t.trip_id}`}
                className="flex items-center justify-between py-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-7 w-7 rounded-full bg-slate-100 text-slate-600 text-xs font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                    {isAr ? t.label_ar : t.label_en}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-bold text-slate-500">
                    {t.bookings} {pick(locale, 'حجز', 'bookings', 'rezervasyon')}
                  </span>
                  <span className="text-sm font-black text-emerald-600">
                    {t.revenue.toLocaleString()} {pick(locale, 'ر.س', 'SAR', 'SAR')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Points Breakdown */}
      {transactions.length > 0 && (() => {
        const eventLabels: Record<string, { ar: string; en: string; color: string }> = {
          registration_bonus: { ar: 'مكافأة التسجيل', en: 'Registration', color: 'bg-emerald-500' },
          invite_customer: { ar: 'دعوة عملاء', en: 'Customer Invites', color: 'bg-purple-500' },
          referral_marketeer: { ar: 'دعوة مسوّقين', en: 'Marketeer Invites', color: 'bg-indigo-500' },
          sell_ticket: { ar: 'بيع تذاكر', en: 'Ticket Sales', color: 'bg-blue-500' },
          sell_hotel: { ar: 'بيع فنادق', en: 'Hotel Sales', color: 'bg-cyan-500' },
          referral_client_booking: { ar: 'عمولة مسوّقين', en: 'Sub-marketeer Commission', color: 'bg-amber-500' },
        }
        const grouped = transactions.reduce((acc, tx) => {
          if (tx.points <= 0) return acc
          acc[tx.event_type] = (acc[tx.event_type] || 0) + tx.points
          return acc
        }, {} as Record<string, number>)
        const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1])
        if (entries.length === 0) return null

        return (
          <div
            className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm animate-fade-in-up"
            style={{ animationDelay: '400ms' }}
          >
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              {pick(locale, 'مصادر النقاط', 'Points Sources', 'Puan Kaynakları')}
            </p>
            <div className="space-y-3">
              {entries.map(([eventType, pts]) => {
                const label = eventLabels[eventType] || { ar: eventType, en: eventType, color: 'bg-slate-400' }
                const pct = total_earned > 0 ? Math.round((pts / total_earned) * 100) : 0
                return (
                  <div key={eventType}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-bold text-slate-700">{isAr ? label.ar : label.en}</span>
                      <span className="font-black text-slate-900">{pts.toLocaleString()} <span className="text-xs text-slate-400">({pct}%)</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', label.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

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
                  {pick(locale, 'قريباً', 'Soon', 'Yakında')}
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
