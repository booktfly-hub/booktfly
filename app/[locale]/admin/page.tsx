'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  UserPlus,
  Plane,
  BookOpen,
  DollarSign,
  FileText,
  Building2,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  Ticket,
  CreditCard,
  UserCheck,
  Radio,
  FileSignature,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type MetricCard = {
  key: string
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  bg: string
  change?: number
  href: string
}

type ActivityLog = {
  id: string
  event_type: string
  description: string
  user_id: string | null
  metadata: Record<string, string> | null
  created_at: string
  profile?: { full_name: string | null; email: string } | null
}

type AdminAlert = {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  dismissed: boolean
  created_at: string
}

type TopTrip = {
  id: string
  airline: string
  origin_code: string | null
  destination_code: string | null
  origin_city_ar: string
  destination_city_ar: string
  origin_city_en: string | null
  destination_city_en: string | null
  total_seats: number
  booked_seats: number
  booking_count: number
}

type TopProvider = {
  id: string
  company_name_ar: string
  company_name_en: string | null
  revenue: number
}

type RecentBooking = {
  id: string
  passenger_name: string
  total_amount: number
  status: string
  created_at: string
  trip?: { airline: string; origin_code: string | null; destination_code: string | null } | null
}

type DashboardData = {
  totalUsers: number
  newUsersToday: number
  activeTrips: number
  totalBookings: number
  revenueThisMonth: number
  pendingApplications: number
  activeProviders: number
  pendingPayments: number
  unsignedContracts: number
  prevTotalUsers: number
  prevNewUsersToday: number
  prevActiveTrips: number
  prevTotalBookings: number
  prevRevenueThisMonth: number
  prevPendingApplications: number
  prevActiveProviders: number
  prevPendingPayments: number
  visitors: number
  registeredUsers: number
  customers: number
  marketeers: number
  providers: number
  activityLogs: ActivityLog[]
  alerts: AdminAlert[]
  topTrips: TopTrip[]
  topProviders: TopProvider[]
  recentBookings: RecentBooking[]
}

const initialData: DashboardData = {
  totalUsers: 0,
  newUsersToday: 0,
  activeTrips: 0,
  totalBookings: 0,
  revenueThisMonth: 0,
  pendingApplications: 0,
  activeProviders: 0,
  pendingPayments: 0,
  unsignedContracts: 0,
  prevTotalUsers: 0,
  prevNewUsersToday: 0,
  prevActiveTrips: 0,
  prevTotalBookings: 0,
  prevRevenueThisMonth: 0,
  prevPendingApplications: 0,
  prevActiveProviders: 0,
  prevPendingPayments: 0,
  visitors: 0,
  registeredUsers: 0,
  customers: 0,
  marketeers: 0,
  providers: 0,
  activityLogs: [],
  alerts: [],
  topTrips: [],
  topProviders: [],
  recentBookings: [],
}

function getEventIcon(eventType: string) {
  if (eventType.includes('booking')) return BookOpen
  if (eventType.includes('trip')) return Plane
  if (eventType.includes('payment')) return CreditCard
  if (eventType.includes('application')) return FileText
  if (eventType.includes('login') || eventType.includes('signup') || eventType.includes('register')) return UserCheck
  if (eventType.includes('provider')) return Building2
  return Activity
}

function getEventColor(eventType: string) {
  if (eventType.includes('booking')) return 'text-blue-500 bg-blue-500/10'
  if (eventType.includes('trip')) return 'text-amber-600 bg-amber-500/10'
  if (eventType.includes('payment')) return 'text-emerald-500 bg-emerald-500/10'
  if (eventType.includes('application')) return 'text-violet-500 bg-violet-500/10'
  if (eventType.includes('login') || eventType.includes('signup') || eventType.includes('register')) return 'text-cyan-500 bg-cyan-500/10'
  if (eventType.includes('provider')) return 'text-orange-500 bg-orange-500/10'
  return 'text-slate-500 bg-slate-500/10'
}

function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'critical':
      return { border: 'border-red-200 bg-red-50', icon: AlertCircle, iconColor: 'text-red-500', badge: 'bg-red-100 text-red-700' }
    case 'warning':
      return { border: 'border-amber-200 bg-amber-50', icon: AlertTriangle, iconColor: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' }
    default:
      return { border: 'border-blue-200 bg-blue-50', icon: Info, iconColor: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' }
  }
}

function relativeTime(dateStr: string, isAr: boolean) {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (isAr) {
    if (seconds < 60) return 'الآن'
    if (minutes < 60) return `منذ ${minutes} د`
    if (hours < 24) return `منذ ${hours} س`
    return `منذ ${days} ي`
  }
  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-2xl bg-slate-100" />
        <div className="h-6 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="h-4 w-24 bg-slate-100 rounded mb-2" />
      <div className="h-8 w-20 bg-slate-100 rounded" />
    </div>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse', className)}>
      <div className="h-5 w-40 bg-slate-100 rounded mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 bg-slate-100 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const supabase = createClient()
  const [data, setData] = useState<DashboardData>(initialData)
  const [loading, setLoading] = useState(true)
  const activityRef = useRef<ActivityLog[]>([])
  const alertsRef = useRef<AdminAlert[]>([])

  const dismissAlert = useCallback(async (alertId: string) => {
    await supabase.from('admin_alerts').update({ dismissed: true }).eq('id', alertId)
    setData(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => a.id !== alertId),
    }))
  }, [supabase])

  const fetchData = useCallback(async () => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

    const [
      totalUsersRes,
      newUsersTodayRes,
      activeTripsRes,
      totalBookingsRes,
      revenueRes,
      pendingAppsRes,
      activeProvidersRes,
      pendingPaymentsRes,
      prevNewUsersRes,
      prevActiveTripsRes,
      prevBookingsRes,
      prevRevenueRes,
      prevAppsRes,
      prevProvidersRes,
      prevPaymentsRes,
      visitorsRes,
      customersRes,
      marketeersRes,
      providersCountRes,
      activityRes,
      alertsRes,
      topTripsRes,
      recentBookingsRes,
      unsignedFlightRes,
      unsignedRoomRes,
      unsignedCarRes,
      unsignedPackageRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('bookings').select('commission_amount').eq('status', 'confirmed').gte('created_at', monthStart),
      supabase.from('provider_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabase.from('providers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'payment_processing'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', yesterdayStart).lt('created_at', todayStart),
      supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'active').lt('created_at', monthStart),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed').gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
      supabase.from('bookings').select('commission_amount').eq('status', 'confirmed').gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
      supabase.from('provider_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review').lt('created_at', monthStart),
      supabase.from('providers').select('*', { count: 'exact', head: true }).eq('status', 'active').lt('created_at', monthStart),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'payment_processing').lt('created_at', todayStart),
      supabase.from('activity_logs').select('*', { count: 'exact', head: true }).eq('event_type', 'site_visit'),
      supabase.from('bookings').select('buyer_id').eq('status', 'confirmed').not('buyer_id', 'is', null),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'marketeer'),
      supabase.from('providers').select('*', { count: 'exact', head: true }),
      supabase.from('activity_logs').select('*, profile:profiles(full_name, email)').order('created_at', { ascending: false }).limit(20),
      supabase.from('admin_alerts').select('*').eq('dismissed', false).order('created_at', { ascending: false }),
      supabase.from('trips').select('id, airline, origin_code, destination_code, origin_city_ar, destination_city_ar, origin_city_en, destination_city_en, total_seats, booked_seats').eq('status', 'active').order('booked_seats', { ascending: false }).limit(5),
      supabase.from('bookings').select('id, passenger_name, total_amount, status, created_at, trip:trips(airline, origin_code, destination_code)').order('created_at', { ascending: false }).limit(5),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).is('contract_signed_at', null).eq('status', 'payment_processing'),
      supabase.from('room_bookings').select('*', { count: 'exact', head: true }).is('contract_signed_at', null).eq('status', 'payment_processing'),
      supabase.from('car_bookings').select('*', { count: 'exact', head: true }).is('contract_signed_at', null).eq('status', 'payment_processing'),
      supabase.from('package_bookings').select('*', { count: 'exact', head: true }).is('contract_signed_at', null).eq('status', 'payment_processing'),
    ])

    const unsignedContracts =
      (unsignedFlightRes.count || 0) +
      (unsignedRoomRes.count || 0) +
      (unsignedCarRes.count || 0) +
      (unsignedPackageRes.count || 0)

    const uniqueBuyers = new Set((customersRes.data || []).map(b => b.buyer_id)).size
    const revenueThisMonth = (revenueRes.data || []).reduce((sum, b) => sum + Number(b.commission_amount), 0)
    const prevRevenueThisMonth = (prevRevenueRes.data || []).reduce((sum, b) => sum + Number(b.commission_amount), 0)

    const prevTotalUsers = (totalUsersRes.count || 0) - (newUsersTodayRes.count || 0)

    const topTrips: TopTrip[] = (topTripsRes.data || []).map(trip => ({
      ...trip,
      booking_count: trip.booked_seats,
    }))

    const providerRevenueMap = new Map<string, { name_ar: string; name_en: string | null; revenue: number }>()
    const confirmedBookings = revenueRes.data || []
    if (confirmedBookings.length > 0) {
      const { data: bookingsWithProvider } = await supabase
        .from('bookings')
        .select('commission_amount, provider:providers(id, company_name_ar, company_name_en)')
        .eq('status', 'confirmed')
        .gte('created_at', monthStart)
        .limit(200)

      for (const b of bookingsWithProvider || []) {
        const prov = b.provider as unknown as { id: string; company_name_ar: string; company_name_en: string | null } | null
        if (prov) {
          const existing = providerRevenueMap.get(prov.id)
          if (existing) {
            existing.revenue += Number(b.commission_amount)
          } else {
            providerRevenueMap.set(prov.id, {
              name_ar: prov.company_name_ar,
              name_en: prov.company_name_en,
              revenue: Number(b.commission_amount),
            })
          }
        }
      }
    }

    const topProviders: TopProvider[] = Array.from(providerRevenueMap.entries())
      .map(([id, p]) => ({ id, company_name_ar: p.name_ar, company_name_en: p.name_en, revenue: p.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const activities = (activityRes.data || []) as ActivityLog[]
    const alerts = (alertsRes.data || []) as AdminAlert[]
    activityRef.current = activities
    alertsRef.current = alerts

    setData({
      totalUsers: totalUsersRes.count || 0,
      newUsersToday: newUsersTodayRes.count || 0,
      activeTrips: activeTripsRes.count || 0,
      totalBookings: totalBookingsRes.count || 0,
      revenueThisMonth,
      pendingApplications: pendingAppsRes.count || 0,
      activeProviders: activeProvidersRes.count || 0,
      pendingPayments: pendingPaymentsRes.count || 0,
      unsignedContracts,
      prevTotalUsers,
      prevNewUsersToday: prevNewUsersRes.count || 0,
      prevActiveTrips: prevActiveTripsRes.count || 0,
      prevTotalBookings: prevBookingsRes.count || 0,
      prevRevenueThisMonth: prevRevenueThisMonth,
      prevPendingApplications: prevAppsRes.count || 0,
      prevActiveProviders: prevProvidersRes.count || 0,
      prevPendingPayments: prevPaymentsRes.count || 0,
      visitors: visitorsRes.count || 0,
      registeredUsers: totalUsersRes.count || 0,
      customers: uniqueBuyers,
      marketeers: marketeersRes.count || 0,
      providers: providersCountRes.count || 0,
      activityLogs: activities,
      alerts,
      topTrips,
      topProviders,
      recentBookings: (recentBookingsRes.data || []).map((b: Record<string, unknown>) => ({
        ...b,
        trip: Array.isArray(b.trip) ? b.trip[0] || null : b.trip,
      })) as RecentBooking[],
    })
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        const newLog = payload.new as ActivityLog
        setData(prev => ({
          ...prev,
          activityLogs: [newLog, ...prev.activityLogs].slice(0, 20),
        }))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_alerts' }, (payload) => {
        const newAlert = payload.new as AdminAlert
        if (!newAlert.dismissed) {
          setData(prev => ({
            ...prev,
            alerts: [newAlert, ...prev.alerts],
          }))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const metricCards: MetricCard[] = [
    {
      key: 'totalUsers',
      label: t('total_users'),
      value: data.totalUsers,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      change: calcChange(data.totalUsers, data.prevTotalUsers),
      href: `/${locale}/admin/users`,
    },
    {
      key: 'newUsersToday',
      label: t('new_users_today'),
      value: data.newUsersToday,
      icon: UserPlus,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
      change: calcChange(data.newUsersToday, data.prevNewUsersToday),
      href: `/${locale}/admin/users`,
    },
    {
      key: 'activeTrips',
      label: t('active_trips'),
      value: data.activeTrips,
      icon: Plane,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
      change: calcChange(data.activeTrips, data.prevActiveTrips),
      href: `/${locale}/admin/trips`,
    },
    {
      key: 'totalBookings',
      label: t('total_bookings'),
      value: data.totalBookings,
      icon: BookOpen,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      change: calcChange(data.totalBookings, data.prevTotalBookings),
      href: `/${locale}/admin/bookings`,
    },
    {
      key: 'revenueThisMonth',
      label: t('revenue_this_month'),
      value: `${data.revenueThisMonth.toLocaleString()} ${pick(locale, 'ر.س', 'SAR', 'SAR')}`,
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      change: calcChange(data.revenueThisMonth, data.prevRevenueThisMonth),
      href: `/${locale}/admin/revenue`,
    },
    {
      key: 'pendingApplications',
      label: t('pending_applications'),
      value: data.pendingApplications,
      icon: FileText,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      change: calcChange(data.pendingApplications, data.prevPendingApplications),
      href: `/${locale}/admin/applications`,
    },
    {
      key: 'activeProviders',
      label: t('active_providers'),
      value: data.activeProviders,
      icon: Building2,
      color: 'text-teal-500',
      bg: 'bg-teal-500/10',
      change: calcChange(data.activeProviders, data.prevActiveProviders),
      href: `/${locale}/admin/providers`,
    },
    {
      key: 'pendingPayments',
      label: t('pending_payments'),
      value: data.pendingPayments,
      icon: Clock,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      change: calcChange(data.pendingPayments, data.prevPendingPayments),
      href: `/${locale}/admin/bookings`,
    },
    {
      key: 'unsignedContracts',
      label: locale === 'ar' ? 'عقود غير موقّعة' : 'Unsigned contracts',
      value: data.unsignedContracts,
      icon: FileSignature,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
      change: 0,
      href: `/${locale}/admin/bookings`,
    },
  ]

  const funnelStages = [
    { label: t('visitors'), value: data.visitors, color: 'from-slate-400 to-slate-500' },
    { label: t('registered_users'), value: data.registeredUsers, color: 'from-blue-400 to-blue-500' },
    { label: t('customers'), value: data.customers, color: 'from-emerald-400 to-emerald-500' },
    { label: t('marketeers'), value: data.marketeers, color: 'from-violet-400 to-violet-500' },
    { label: t('providers'), value: data.providers, color: 'from-amber-400 to-amber-500' },
  ]

  const maxFunnel = Math.max(...funnelStages.map(s => s.value), 1)

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-emerald-100 text-emerald-700',
      payment_processing: 'bg-amber-100 text-amber-700',
      payment_failed: 'bg-red-100 text-red-700',
      cancelled: 'bg-slate-100 text-slate-600',
      refunded: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      cancellation_pending: 'bg-orange-100 text-orange-700',
    }
    return styles[status] || 'bg-slate-100 text-slate-600'
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-[1600px] mx-auto">
        <div>
          <div className="h-8 w-64 bg-slate-100 rounded animate-pulse mb-2" />
          <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonBlock />
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <SkeletonBlock className="lg:col-span-3" />
          <SkeletonBlock className="lg:col-span-2" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{t('dashboard')}</h1>
          <p className="text-slate-500 font-medium">
            {pick(locale, 'مركز عمليات المنصة', 'Platform operations center', 'Platform operasyon merkezi')}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
          <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-600">{t('live')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => {
          const changeVal = card.change ?? 0
          const isPositive = changeVal >= 0
          const isNeutral = changeVal === 0
          return (
            <Link
              key={card.key}
              href={card.href}
              className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up cursor-pointer"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', card.bg)}>
                  <card.icon className={cn('h-5 w-5', card.color)} />
                </div>
                {!isNeutral && (
                  <div className={cn(
                    'flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold',
                    isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  )}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{Math.abs(changeVal)}%</span>
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</p>
            </Link>
          )
        })}
      </div>

      <div
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-fade-in-up"
        style={{ animationDelay: '500ms' }}
      >
        <h2 className="text-lg font-bold text-slate-900 mb-6">{t('conversion_funnel')}</h2>
        <div className="space-y-3">
          {funnelStages.map((stage, idx) => {
            const widthPercent = Math.max((stage.value / maxFunnel) * 100, 4)
            const prevValue = idx > 0 ? funnelStages[idx - 1].value : null
            const conversionPercent = prevValue && prevValue > 0 ? Math.round((stage.value / prevValue) * 100) : null
            return (
              <div key={stage.label} className="flex items-center gap-4">
                <div className="w-28 shrink-0 text-end">
                  <p className="text-sm font-bold text-slate-700">{stage.label}</p>
                </div>
                <div className="flex-1 relative">
                  <div className="h-9 rounded-lg overflow-hidden bg-slate-50">
                    <div
                      className={cn('h-full rounded-lg bg-gradient-to-r transition-all duration-700 ease-out flex items-center justify-end px-3', stage.color)}
                      style={{ width: `${widthPercent}%` }}
                    >
                      <span className="text-xs font-bold text-white drop-shadow-sm">
                        {stage.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-20 shrink-0">
                  {conversionPercent !== null && (
                    <span className="text-xs font-semibold text-slate-400">
                      {conversionPercent}% {t('of_previous')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in-up"
        style={{ animationDelay: '600ms' }}
      >
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">{t('recent_activity')}</h2>
            <div className="flex items-center gap-3">
              <Link href={`/${locale}/admin/activity-logs`} className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
                {pick(locale, 'عرض الكل', 'View All', 'Tümünü Görüntüle')}
              </Link>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-400">{t('live')}</span>
              </div>
            </div>
          </div>
          <div className="space-y-1 max-h-[480px] overflow-y-auto">
            {data.activityLogs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Activity className="h-10 w-10 mb-3" />
                <p className="text-sm font-medium">{t('no_activity')}</p>
              </div>
            )}
            {data.activityLogs.map((log) => {
              const Icon = getEventIcon(log.event_type)
              const colorClasses = getEventColor(log.event_type)
              const [iconColor, iconBg] = colorClasses.split(' ')
              const profileData = log.profile as { full_name: string | null; email: string } | null
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', iconBg)}>
                    <Icon className={cn('h-4 w-4', iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {log.description || log.event_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {profileData?.full_name || profileData?.email || (pick(locale, 'مستخدم مجهول', 'Unknown user', 'Bilinmeyen kullanıcı'))}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-400 shrink-0">
                    {relativeTime(log.created_at, isAr)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">{t('active_alerts')}</h2>
            <Link href={`/${locale}/admin/alerts`} className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
              {pick(locale, 'عرض الكل', 'View All', 'Tümünü Görüntüle')}
            </Link>
          </div>
          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {data.alerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
                <p className="text-sm font-bold text-emerald-700">{t('all_clear')}</p>
              </div>
            )}
            {data.alerts.map((alert) => {
              const styles = getSeverityStyles(alert.severity)
              const SeverityIcon = styles.icon
              return (
                <div
                  key={alert.id}
                  className={cn('p-4 rounded-xl border transition-all', styles.border)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <SeverityIcon className={cn('h-5 w-5 shrink-0 mt-0.5', styles.iconColor)} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-800">{alert.title}</p>
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase', styles.badge)}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{alert.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{relativeTime(alert.created_at, isAr)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-slate-200/50 transition-colors shrink-0"
                    >
                      <X className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up"
        style={{ animationDelay: '700ms' }}
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">{t('flights_overview')}</h2>
            <Link href={`/${locale}/admin/trips`} className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
              {pick(locale, 'عرض الكل', 'View All', 'Tümünü Görüntüle')}
            </Link>
          </div>
          <div className="space-y-3">
            {data.topTrips.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">{pick(locale, 'لا توجد رحلات', 'No trips', 'Gezi yok')}</p>
            )}
            {data.topTrips.map((trip) => {
              const occupancy = trip.total_seats > 0 ? Math.round((trip.booked_seats / trip.total_seats) * 100) : 0
              const origin = isAr ? trip.origin_city_ar : (trip.origin_city_en || trip.origin_city_ar)
              const dest = isAr ? trip.destination_city_ar : (trip.destination_city_en || trip.destination_city_ar)
              return (
                <div key={trip.id} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Plane className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700">{trip.airline}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {trip.origin_code || origin} → {trip.destination_code || dest}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          occupancy >= 80 ? 'bg-red-400' : occupancy >= 50 ? 'bg-amber-400' : 'bg-emerald-400'
                        )}
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-10 text-end">{occupancy}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">
                      {trip.booked_seats}/{trip.total_seats} {pick(locale, 'مقعد', 'seats', 'koltuk')}
                    </span>
                    <span className="text-[10px] text-slate-400">{t('occupancy')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">{t('top_providers')}</h2>
            <Link href={`/${locale}/admin/providers`} className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
              {pick(locale, 'عرض الكل', 'View All', 'Tümünü Görüntüle')}
            </Link>
          </div>
          <div className="space-y-3">
            {data.topProviders.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">{pick(locale, 'لا توجد بيانات', 'No data', 'Veri yok')}</p>
            )}
            {data.topProviders.map((provider, idx) => {
              const maxRevenue = data.topProviders[0]?.revenue || 1
              const barPercent = Math.max((provider.revenue / maxRevenue) * 100, 8)
              return (
                <div key={provider.id} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-700 truncate">
                        {isAr ? provider.company_name_ar : (provider.company_name_en || provider.company_name_ar)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">
                      {provider.revenue.toLocaleString()} {pick(locale, 'ر.س', 'SAR', 'SAR')}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">{t('recent_bookings')}</h2>
            <Link href={`/${locale}/admin/bookings`} className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
              {pick(locale, 'عرض الكل', 'View All', 'Tümünü Görüntüle')}
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentBookings.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">{pick(locale, 'لا توجد حجوزات', 'No bookings', 'Rezervasyon yok')}</p>
            )}
            {data.recentBookings.map((booking) => {
              const tripData = booking.trip as { airline: string; origin_code: string | null; destination_code: string | null } | null
              return (
                <div key={booking.id} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-slate-700 truncate">{booking.passenger_name}</span>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusBadge(booking.status))}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Ticket className="h-3 w-3" />
                      {tripData && (
                        <span>{tripData.airline} {tripData.origin_code} → {tripData.destination_code}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-600">
                      {booking.total_amount.toLocaleString()} {pick(locale, 'ر.س', 'SAR', 'SAR')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{relativeTime(booking.created_at, isAr)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
