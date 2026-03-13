import { getTranslations, getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getProvider } from '@/lib/supabase/provider'
import { formatPrice, cn, shortId } from '@/lib/utils'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import type { Booking } from '@/types'
import {
  Plane,
  BookOpen,
  DollarSign,
  Armchair,
  ArrowRight,
  TrendingUp,
  ArrowLeft
} from 'lucide-react'

export default async function ProviderDashboardPage() {
  const locale = await getLocale()
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const [t, ts, tc] = await Promise.all([
    getTranslations('provider'),
    getTranslations('status'),
    getTranslations('common'),
  ])

  const { supabase, provider } = await getProvider(locale)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    { count: activeTrips },
    { count: totalBookings },
    { data: monthBookings },
    { data: seatData },
    { data: recent },
  ] = await Promise.all([
    supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', provider.id)
      .eq('status', 'active'),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', provider.id)
      .eq('status', 'confirmed'),
    supabase
      .from('bookings')
      .select('provider_payout')
      .eq('provider_id', provider.id)
      .eq('status', 'confirmed')
      .gte('created_at', startOfMonth.toISOString()),
    supabase
      .from('bookings')
      .select('seats_count')
      .eq('provider_id', provider.id)
      .eq('status', 'confirmed'),
    supabase
      .from('bookings')
      .select('*, trip:trips(*), buyer:profiles!bookings_buyer_id_fkey(*)')
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const monthlyRevenue =
    monthBookings?.reduce((sum, b) => sum + (b.provider_payout || 0), 0) ?? 0
  const seatsSold =
    seatData?.reduce((sum, b) => sum + (b.seats_count || 0), 0) ?? 0
  const recentBookings = (recent as Booking[]) ?? []

  const stats = {
    activeTrips: activeTrips ?? 0,
    totalBookings: totalBookings ?? 0,
    monthlyRevenue,
    seatsSold,
  }

  const statCards = [
    { label: t('active_trips'), value: stats.activeTrips, icon: Plane, color: 'text-primary', bg: 'bg-primary/10' },
    { label: t('total_bookings'), value: stats.totalBookings, icon: BookOpen, color: 'text-accent', bg: 'bg-accent/10' },
    { label: t('monthly_revenue'), value: formatPrice(stats.monthlyRevenue), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: t('seats_sold'), value: stats.seatsSold, icon: Armchair, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('dashboard')}</h1>
            <p className="text-slate-500 font-medium mt-1">{isAr ? 'مرحباً بعودتك إلى لوحة التحكم' : 'Welcome back to your dashboard'}</p>
          </div>
          <Link
            href={`/${locale}/provider/trips/new`}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-sm hover:shadow-md"
           >
            <Plane className="h-4 w-4" />
            {isAr ? 'رحلة جديدة' : 'New Trip'}
          </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div
            key={card.label}
            className="group bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", card.bg)}>
                <card.icon className={cn("h-6 w-6", card.color)} />
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <TrendingUp className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-900">{t('recent_activity')}</h2>
          <Link
            href={`/${locale}/provider/bookings`}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            {tc('view_all')}
            <Arrow className="h-4 w-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentBookings.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">{tc('no_results')}</p>
            </div>
          ) : (
            recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between gap-4 p-6 md:p-8 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-5 min-w-0">
                  <div className="hidden sm:flex h-12 w-12 rounded-full bg-primary/5 border border-primary/10 items-center justify-center shrink-0">
                      <span className="text-primary font-black text-sm">{booking.passenger_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 truncate mb-1">
                      {booking.passenger_name}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 truncate">
                      <span className="font-bold text-slate-700">{booking.trip?.origin_code}</span>
                      <ArrowRight className="h-3 w-3 rtl:rotate-180 text-slate-300" />
                      <span className="font-bold text-slate-700">{booking.trip?.destination_code}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-xs ml-2">
                         {booking.seats_count} {tc('seats')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-lg font-black text-slate-900">
                    {formatPrice(booking.total_amount)}
                  </p>
                  <span
                    className={cn(
                      'text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider',
                      BOOKING_STATUS_COLORS[booking.status] || 'bg-slate-100 text-slate-600'
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
