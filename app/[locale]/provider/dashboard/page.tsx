'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useProvider } from '@/hooks/use-provider'
import { formatPrice } from '@/lib/utils'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import { cn, shortId } from '@/lib/utils'
import type { Booking } from '@/types'
import {
  Plane,
  BookOpen,
  DollarSign,
  Armchair,
  Loader2,
  ArrowRight,
} from 'lucide-react'

type Stats = {
  activeTrips: number
  totalBookings: number
  monthlyRevenue: number
  seatsSold: number
}

export default function ProviderDashboardPage() {
  const t = useTranslations('provider')
  const ts = useTranslations('status')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { user } = useUser()
  const { provider, loading: providerLoading } = useProvider(user?.id)
  const [stats, setStats] = useState<Stats>({
    activeTrips: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    seatsSold: 0,
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!provider) return

    async function fetchDashboardData() {
      const supabase = createClient()

      // Fetch active trips count
      const { count: activeTrips } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', provider!.id)
        .eq('status', 'active')

      // Fetch total bookings count
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', provider!.id)
        .eq('status', 'confirmed')

      // Fetch this month's revenue
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: monthBookings } = await supabase
        .from('bookings')
        .select('provider_payout')
        .eq('provider_id', provider!.id)
        .eq('status', 'confirmed')
        .gte('created_at', startOfMonth.toISOString())

      const monthlyRevenue =
        monthBookings?.reduce((sum, b) => sum + (b.provider_payout || 0), 0) ?? 0

      // Fetch total seats sold
      const { data: seatData } = await supabase
        .from('bookings')
        .select('seats_count')
        .eq('provider_id', provider!.id)
        .eq('status', 'confirmed')

      const seatsSold =
        seatData?.reduce((sum, b) => sum + (b.seats_count || 0), 0) ?? 0

      // Fetch recent 5 bookings
      const { data: recent } = await supabase
        .from('bookings')
        .select('*, trip:trips(*), buyer:profiles!bookings_buyer_id_fkey(*)')
        .eq('provider_id', provider!.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        activeTrips: activeTrips ?? 0,
        totalBookings: totalBookings ?? 0,
        monthlyRevenue,
        seatsSold,
      })
      setRecentBookings((recent as Booking[]) ?? [])
      setLoading(false)
    }

    fetchDashboardData()
  }, [provider])

  if (providerLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const statCards = [
    { label: t('active_trips'), value: stats.activeTrips, icon: Plane },
    { label: t('total_bookings'), value: stats.totalBookings, icon: BookOpen },
    {
      label: t('monthly_revenue'),
      value: formatPrice(stats.monthlyRevenue),
      icon: DollarSign,
    },
    { label: t('seats_sold'), value: stats.seatsSold, icon: Armchair },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{t('dashboard')}</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-card border rounded-xl p-5 space-y-2"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <card.icon className="h-4 w-4" />
              <span className="text-sm">{card.label}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-card border rounded-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold">{t('recent_activity')}</h2>
          <Link
            href={`/${locale}/provider/bookings`}
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            {tc('view_all')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y">
          {recentBookings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {tc('no_results')}
            </div>
          ) : (
            recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {booking.passenger_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {booking.trip?.origin_city_ar} → {booking.trip?.destination_city_ar}{' '}
                    &middot; {booking.seats_count} {tc('seats')}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-medium">
                    {formatPrice(booking.total_amount)}
                  </p>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      BOOKING_STATUS_COLORS[booking.status] || ''
                    )}
                  >
                    {ts(booking.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
