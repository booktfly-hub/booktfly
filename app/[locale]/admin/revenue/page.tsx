'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, TrendingUp, Users, BookOpen } from 'lucide-react'

export default function AdminRevenue() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const supabase = createClient()
  const [stats, setStats] = useState({
    gross: 0,
    commissions: 0,
    payouts: 0,
    bookingCount: 0,
    avgValue: 0,
  })
  const [byProvider, setByProvider] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount, commission_amount, provider_payout, provider_id, provider:providers(company_name_ar)')
        .eq('status', 'confirmed')

      if (bookings && bookings.length > 0) {
        const gross = bookings.reduce((s, b) => s + Number(b.total_amount), 0)
        const commissions = bookings.reduce((s, b) => s + Number(b.commission_amount), 0)
        const payouts = bookings.reduce((s, b) => s + Number(b.provider_payout), 0)

        setStats({
          gross,
          commissions,
          payouts,
          bookingCount: bookings.length,
          avgValue: Math.round(gross / bookings.length),
        })

        // Group by provider
        const grouped: Record<string, { name: string; bookings: number; gross: number; commission: number; payout: number }> = {}
        bookings.forEach((b) => {
          const pid = b.provider_id
          if (!grouped[pid]) {
            grouped[pid] = {
              name: (b.provider as any)?.company_name_ar || 'Unknown',
              bookings: 0,
              gross: 0,
              commission: 0,
              payout: 0,
            }
          }
          grouped[pid].bookings++
          grouped[pid].gross += Number(b.total_amount)
          grouped[pid].commission += Number(b.commission_amount)
          grouped[pid].payout += Number(b.provider_payout)
        })
        setByProvider(Object.values(grouped).sort((a, b) => b.gross - a.gross))
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const cur = locale === 'ar' ? 'ر.س' : 'SAR'

  const cards = [
    { label: t('gross'), value: `${stats.gross.toLocaleString()} ${cur}`, icon: DollarSign, color: 'text-primary' },
    { label: t('commissions'), value: `${stats.commissions.toLocaleString()} ${cur}`, icon: TrendingUp, color: 'text-success' },
    { label: t('payouts'), value: `${stats.payouts.toLocaleString()} ${cur}`, icon: Users, color: 'text-accent' },
    { label: t('booking_count'), value: stats.bookingCount, icon: BookOpen, color: 'text-primary' },
    { label: t('avg_value'), value: `${stats.avgValue.toLocaleString()} ${cur}`, icon: DollarSign, color: 'text-warning' },
  ]

  if (loading) return <div className="animate-pulse p-8">{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('revenue_overview')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border p-5">
            <card.icon className={`h-5 w-5 ${card.color} mb-2`} />
            <p className="text-xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Per Provider */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <h3 className="font-semibold p-4 border-b">{t('top_providers')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{locale === 'ar' ? 'المزود' : 'Provider'}</th>
                <th className="text-start p-3 font-medium">{t('booking_count')}</th>
                <th className="text-start p-3 font-medium">{t('gross')}</th>
                <th className="text-start p-3 font-medium">{t('commissions')}</th>
                <th className="text-start p-3 font-medium">{t('payouts')}</th>
              </tr>
            </thead>
            <tbody>
              {byProvider.map((p, i) => (
                <tr key={i} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">{p.bookings}</td>
                  <td className="p-3">{p.gross.toLocaleString()} {cur}</td>
                  <td className="p-3">{p.commission.toLocaleString()} {cur}</td>
                  <td className="p-3">{p.payout.toLocaleString()} {cur}</td>
                </tr>
              ))}
              {byProvider.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{locale === 'ar' ? 'لا توجد بيانات' : 'No data'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
