'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Star,
  Wallet,
  Copy,
  CheckCheck,
  Loader2,
  TrendingUp,
  Users,
  Plus,
  Minus,
  AlertCircle,
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

export default function MarkeeteerDashboardPage() {
  const t = useTranslations('marketeer')
  const locale = useLocale() as 'ar' | 'en'
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/marketeers/dashboard', {
      headers: { 'Accept-Language': locale },
      cache: 'no-store',
    })
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
      .catch(() => setError(locale === 'ar' ? 'خطأ في تحميل البيانات' : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [locale, router])

  function copyReferralLink() {
    if (!data) return
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    navigator.clipboard.writeText(`${origin}/ref/${data.marketeer.referral_code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function getEventLabel(type: string) {
    const key = `event_${type}` as Parameters<typeof t>[0]
    try { return t(key) } catch { return type }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-44 pb-16 flex items-center justify-center px-4">
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

  const stats = [
    {
      label: t('flypoints_balance'),
      value: balance.toLocaleString(),
      sub: t('points_rate', { rate: sar_rate }),
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
    {
      label: t('sar_equivalent'),
      value: `${sar_value.toLocaleString()} ${locale === 'ar' ? 'ر.س' : 'SAR'}`,
      sub: locale === 'ar' ? `${balance.toLocaleString()} نقطة` : `${balance.toLocaleString()} points`,
      icon: Wallet,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: t('stats_total_earned'),
      value: total_earned.toLocaleString(),
      sub: locale === 'ar' ? 'إجمالي النقاط المكتسبة' : 'Lifetime points earned',
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: t('stats_referrals'),
      value: referral_count.toString(),
      sub: locale === 'ar' ? 'عميل مُحال' : 'referred users',
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 bg-muted/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{t('dashboard_title')}</h1>
          </div>
          <p className="text-muted-foreground text-sm ms-13">
            {locale === 'ar' ? `مرحباً، ${marketeer.full_name}` : `Welcome, ${marketeer.full_name}`}
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((s, i) => (
            <Card
              key={i}
              className="border-border/50 transition-colors hover:border-primary/30"
            >
              <CardContent className="p-5">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', s.bg)}>
                  <s.icon className={cn('h-5 w-5', s.color)} />
                </div>
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Referral link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                {t('referral_link')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 rounded-xl border border-border/50 bg-muted/50 px-4 py-3 font-mono text-sm text-muted-foreground break-all">
                  {referralLink}
                </div>
                <Button
                  onClick={copyReferralLink}
                  variant={copied ? 'outline' : 'default'}
                  className={cn(
                    'h-12 shrink-0 rounded-xl px-5 text-sm font-medium',
                    copied && 'border-green-500/20 bg-green-500/10 text-green-600 hover:bg-green-500/15'
                  )}
                >
                  {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t('link_copied') : t('copy_link')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {locale === 'ar'
                  ? 'شارك هذا الرابط وستكسب نقاط عن كل عميل يسجل أو يحجز عبره'
                  : 'Share this link to earn points for every signup and booking made through it'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden border-border/50">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg">{t('transactions_title')}</CardTitle>
            </CardHeader>

            {transactions.length === 0 ? (
              <CardContent className="px-6 py-16 text-center">
                <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">{t('no_transactions')}</p>
              </CardContent>
            ) : (
              <CardContent className="p-0">
                {transactions.map((tx, index) => {
                  const isPositive = tx.points > 0
                  const Icon = EVENT_ICONS[tx.event_type] ?? Star
                  return (
                    <div key={tx.id}>
                      <div className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/30">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                          isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
                        )}>
                          {isPositive
                            ? <Plus className="h-4 w-4 text-green-600" />
                            : <Minus className="h-4 w-4 text-red-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-sm">{getEventLabel(tx.event_type)}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t('expires_at')}: {new Date(tx.expires_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                        <div className="text-end shrink-0">
                          <p className={cn('font-bold text-sm', isPositive ? 'text-green-600' : 'text-red-600')}>
                            {isPositive ? '+' : ''}{tx.points.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                      </div>
                      {index < transactions.length - 1 && <Separator />}
                    </div>
                  )
                })}
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
