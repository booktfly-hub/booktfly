'use client'

import { lkey, pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Star, TrendingUp, Users, Plus, Minus, BarChart3, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlypointsTransaction, Marketeer } from '@/types'

type DashboardData = {
  marketeer: Marketeer
  balance: number
  sar_value: number
  sar_rate: number
  total_earned: number
  referral_count: number
  transactions: FlypointsTransaction[]
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  registration_bonus: Star,
  booking_sale: TrendingUp,
  referral_client_signup: Users,
  referral_client_booking: TrendingUp,
  referral_marketeer: Users,
  weekly_bonus: Star,
  speed_bonus: Star,
  rating_bonus: Star,
  content_bonus: Star,
  share_bonus: Star,
  travel_bonus: Star,
  cancellation_penalty: Minus,
  bad_rating_penalty: Minus,
  no_response_penalty: Minus,
  manual_adjustment: Star,
}

const EVENT_LABELS: Record<string, { ar: string; en: string }> = {
  registration_bonus: { ar: 'مكافأة التسجيل', en: 'Registration Bonus' },
  booking_sale: { ar: 'بيع حجز', en: 'Booking Sale' },
  referral_client_signup: { ar: 'تسجيل عميل مُحال', en: 'Referred Client Signup' },
  referral_client_booking: { ar: 'حجز عميل مُحال', en: 'Referred Client Booking' },
  referral_marketeer: { ar: 'إحالة مسوّق جديد', en: 'Marketeer Referral' },
  weekly_bonus: { ar: 'مكافأة أسبوعية', en: 'Weekly Bonus' },
  speed_bonus: { ar: 'مكافأة السرعة', en: 'Speed Bonus' },
  rating_bonus: { ar: 'مكافأة التقييم', en: 'Rating Bonus' },
  content_bonus: { ar: 'مكافأة المحتوى', en: 'Content Bonus' },
  share_bonus: { ar: 'مكافأة المشاركة', en: 'Share Bonus' },
  travel_bonus: { ar: 'مكافأة السفر المتكرر', en: 'Travel Bonus' },
  cancellation_penalty: { ar: 'خصم الإلغاء', en: 'Cancellation Penalty' },
  bad_rating_penalty: { ar: 'خصم التقييم السيئ', en: 'Bad Rating Penalty' },
  no_response_penalty: { ar: 'خصم عدم الرد', en: 'No Response Penalty' },
  manual_adjustment: { ar: 'تعديل يدوي', en: 'Manual Adjustment' },
}

export default function MarkeeteerRevenuePage() {
  const locale = useLocale() as 'ar' | 'en' | 'tr'
  const isAr = locale === 'ar'
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/marketeers/dashboard', { headers: { 'Accept-Language': locale }, cache: 'no-store' })
      .then((r) => r.json())
      .then((res) => {
        if (res.error?.includes('not found') || res.error?.includes('العثور')) {
          router.replace(`/${locale}/become-marketeer`)
        } else {
          setData(res.data)
        }
      })
      .finally(() => setLoading(false))
  }, [locale, router])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const transactions = data?.transactions ?? []
  const earned = transactions.filter((tx) => tx.points > 0).reduce((s, tx) => s + tx.points, 0)
  const deducted = transactions.filter((tx) => tx.points < 0).reduce((s, tx) => s + tx.points, 0)

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {pick(locale, 'الإيرادات', 'Revenue', 'Gelir')}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {pick(locale, 'سجل نقاط FlyPoints والمعاملات', 'FlyPoints history and transactions', 'FlyPoints geçmişi ve işlemleri')}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
            <BarChart3 className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">{transactions.length}</p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            {pick(locale, 'إجمالي المعاملات', 'Total Transactions', 'Toplam İşlem')}
          </p>
        </div>
        <div className="bg-white border border-green-200 rounded-[2rem] p-6 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-3xl font-black text-green-600">+{earned.toLocaleString()}</p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            {pick(locale, 'إجمالي المكتسب', 'Total Earned', 'Toplam Kazanılan')}
          </p>
        </div>
        <div className="bg-white border border-red-200 rounded-[2rem] p-6 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <Minus className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-3xl font-black text-red-600">{deducted.toLocaleString()}</p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            {pick(locale, 'إجمالي المخصوم', 'Total Deducted', 'Toplam Kesinti')}
          </p>
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-900">{pick(locale, 'سجل المعاملات', 'Transaction History', 'İşlem Geçmişi')}</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Star className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">
              {pick(locale, 'لا توجد معاملات بعد. شارك رابط الإحالة لتبدأ في كسب النقاط.', 'No transactions yet. Share your referral link to start earning points.', 'Henüz işlem yok. Puan kazanmaya başlamak için referans bağlantınızı paylaşın.')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isPositive = tx.points > 0
              const Icon = EVENT_ICONS[tx.event_type] ?? Star
              const label = EVENT_LABELS[tx.event_type]?.[lkey(locale)] ?? tx.event_type
              return (
                <div key={tx.id} className="flex items-center gap-5 p-6 hover:bg-slate-50 transition-colors">
                  <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center shrink-0', isPositive ? 'bg-green-500/10' : 'bg-red-500/10')}>
                    {isPositive
                      ? <Plus className="h-5 w-5 text-green-600" />
                      : <Minus className="h-5 w-5 text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                      <p className="font-bold text-slate-900">{label}</p>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {pick(locale, 'تنتهي في', 'Expires', 'Son Geçerlilik')}: {new Date(tx.expires_at).toLocaleDateString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'))}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className={cn('text-lg font-black', isPositive ? 'text-green-600' : 'text-red-600')}>
                      {isPositive ? '+' : ''}{tx.points.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'))}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
