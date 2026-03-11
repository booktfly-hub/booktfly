'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { FileText, Building2, Plane, BookOpen, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const supabase = createClient()
  const [stats, setStats] = useState({
    pendingApps: 0,
    activeProviders: 0,
    activeTrips: 0,
    monthBookings: 0,
    monthRevenue: 0,
  })

  useEffect(() => {
    async function fetchStats() {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [apps, providers, trips, bookings] = await Promise.all([
        supabase.from('provider_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('bookings').select('commission_amount').eq('status', 'confirmed').gte('created_at', startOfMonth),
      ])

      setStats({
        pendingApps: apps.count || 0,
        activeProviders: providers.count || 0,
        activeTrips: trips.count || 0,
        monthBookings: bookings.data?.length || 0,
        monthRevenue: bookings.data?.reduce((sum, b) => sum + Number(b.commission_amount), 0) || 0,
      })
    }
    fetchStats()
  }, [])

  const cards = [
    {
      label: t('applications'),
      value: stats.pendingApps,
      icon: FileText,
      href: `/${locale}/admin/applications?status=pending_review`,
      color: 'text-warning',
      suffix: locale === 'ar' ? 'معلق' : 'pending',
    },
    {
      label: t('providers'),
      value: stats.activeProviders,
      icon: Building2,
      href: `/${locale}/admin/providers`,
      color: 'text-success',
    },
    {
      label: t('trips'),
      value: stats.activeTrips,
      icon: Plane,
      href: `/${locale}/admin/trips`,
      color: 'text-accent',
    },
    {
      label: t('bookings'),
      value: stats.monthBookings,
      icon: BookOpen,
      href: `/${locale}/admin/bookings`,
      color: 'text-primary',
      suffix: locale === 'ar' ? 'هذا الشهر' : 'this month',
    },
    {
      label: t('revenue'),
      value: `${stats.monthRevenue.toLocaleString()} ${locale === 'ar' ? 'ر.س' : 'SAR'}`,
      icon: DollarSign,
      href: `/${locale}/admin/revenue`,
      color: 'text-success',
      suffix: locale === 'ar' ? 'عمولات هذا الشهر' : 'commissions this month',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('dashboard')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            {card.suffix && (
              <p className="text-xs text-muted-foreground">{card.suffix}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
