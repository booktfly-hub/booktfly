import { pick } from '@/lib/i18n-helpers'
import { getTranslations, getLocale } from 'next-intl/server'
import { getProvider } from '@/lib/supabase/provider'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { formatPrice, cn } from '@/lib/utils'
import { TrendingUp, BookOpen, DollarSign, Percent, Plane, BedDouble, CarFront } from 'lucide-react'

type MonthBucket = { month: string; bookings: number; revenue: number }

function groupByMonth(
  items: { created_at: string; provider_payout: number; status: string }[]
): MonthBucket[] {
  const map = new Map<string, MonthBucket>()
  for (const item of items) {
    const key = item.created_at.slice(0, 7)
    if (!map.has(key)) map.set(key, { month: key, bookings: 0, revenue: 0 })
    const bucket = map.get(key)!
    bucket.bookings++
    if (item.status === 'confirmed') bucket.revenue += item.provider_payout
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
}

function BarChart({ data, maxValue }: { data: { month: string; value: number }[]; maxValue: number }) {
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map(d => (
        <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
          <div className="text-xs font-bold text-slate-400">{d.value || ''}</div>
          <div
            className="w-full rounded-t-md bg-primary/80 transition-all"
            style={{ height: maxValue > 0 ? `${Math.max(4, (d.value / maxValue) * 100)}%` : '4%' }}
          />
          <div className="text-xs text-slate-400 truncate w-full text-center">
            {d.month.slice(5)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function ProviderAnalyticsPage() {
  const locale = await getLocale()
  const isAr = locale === 'ar'

  const [t] = await Promise.all([getTranslations('provider')])

  const { provider } = await getProvider(locale)

  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: bookings }, { data: roomBookings }, { data: carBookings }] = await Promise.all([
    supabaseAdmin
      .from('bookings')
      .select('id, status, total_amount, provider_payout, created_at')
      .eq('provider_id', provider.id)
      .gte('created_at', sixMonthsAgo)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('room_bookings')
      .select('id, status, total_amount, provider_payout, created_at')
      .eq('provider_id', provider.id)
      .gte('created_at', sixMonthsAgo),
    supabaseAdmin
      .from('car_bookings')
      .select('id, status, total_amount, provider_payout, created_at')
      .eq('provider_id', provider.id)
      .gte('created_at', sixMonthsAgo),
  ])

  const allBookings = [
    ...(bookings ?? []),
    ...(roomBookings ?? []),
    ...(carBookings ?? []),
  ]

  const totalBookings = allBookings.length
  const confirmedBookings = allBookings.filter(b => b.status === 'confirmed').length
  const processingBookings = allBookings.filter(b => b.status === 'payment_processing').length
  const cancelledBookings = allBookings.filter(b => b.status === 'cancelled').length
  const totalRevenue = allBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.provider_payout || 0), 0)
  const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0

  const flightMonthly = groupByMonth(bookings ?? [])
  const allMonthly = groupByMonth(allBookings)
  const maxBookings = Math.max(...allMonthly.map(m => m.bookings), 1)

  const kpiCards = [
    {
      label: isAr ? 'إجمالي الحجوزات' : t('total_bookings'),
      value: totalBookings,
      icon: BookOpen,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      label: isAr ? 'الحجوزات المؤكدة' : t('confirmed_bookings'),
      value: confirmedBookings,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: isAr ? 'إجمالي الإيرادات' : t('total_revenue'),
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: isAr ? 'معدل التحويل' : t('conversion_rate'),
      value: `${conversionRate.toFixed(1)}%`,
      icon: Percent,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
  ]

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {isAr ? 'الإحصاءات' : t('analytics')}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {pick(locale, 'آخر 6 أشهر', 'Last 6 months', 'Son 6 ay')}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, idx) => (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm animate-fade-in-up"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center', card.bg)}>
                <card.icon className={cn('h-6 w-6', card.color)} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Bookings Chart */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <h2 className="text-lg font-black text-slate-900 mb-6">
          {isAr ? 'الحجوزات الشهرية' : t('monthly_bookings')}
        </h2>
        {allMonthly.length > 0 ? (
          <BarChart
            data={allMonthly.map(m => ({ month: m.month, value: m.bookings }))}
            maxValue={maxBookings}
          />
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-400 text-sm font-medium">
            {pick(locale, 'لا توجد بيانات', 'No data available', 'Veri mevcut değil')}
          </div>
        )}
      </div>

      {/* Booking Status Breakdown + Product Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <h2 className="text-lg font-black text-slate-900 mb-6">
            {isAr ? 'توزيع حالات الحجز' : t('booking_status_breakdown')}
          </h2>
          <div className="space-y-4">
            <StatusRow
              label={pick(locale, 'مؤكد', 'Confirmed', 'Onaylandı')}
              count={confirmedBookings}
              total={totalBookings}
              colorClass="bg-emerald-500"
            />
            <StatusRow
              label={pick(locale, 'قيد المعالجة', 'Payment Processing', 'Ödeme İşleniyor')}
              count={processingBookings}
              total={totalBookings}
              colorClass="bg-amber-400"
            />
            <StatusRow
              label={pick(locale, 'ملغى', 'Cancelled', 'İptal Edildi')}
              count={cancelledBookings}
              total={totalBookings}
              colorClass="bg-red-500"
            />
          </div>
        </div>

        {/* Product Type Breakdown */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <h2 className="text-lg font-black text-slate-900 mb-6">
            {isAr ? 'حسب نوع المنتج' : t('product_breakdown')}
          </h2>
          <div className="space-y-4">
            <ProductRow
              label={pick(locale, 'الرحلات', 'Flights', 'Uçuşlar')}
              count={bookings?.length ?? 0}
              icon={Plane}
              colorClass="text-primary bg-primary/10"
            />
            <ProductRow
              label={pick(locale, 'الغرف', 'Rooms', 'Odalar')}
              count={roomBookings?.length ?? 0}
              icon={BedDouble}
              colorClass="text-amber-600 bg-amber-500/10"
            />
            <ProductRow
              label={pick(locale, 'السيارات', 'Cars', 'Araçlar')}
              count={carBookings?.length ?? 0}
              icon={CarFront}
              colorClass="text-violet-500 bg-violet-500/10"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusRow({
  label,
  count,
  total,
  colorClass,
}: {
  label: string
  count: number
  total: number
  colorClass: string
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm font-bold text-slate-700">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function ProductRow({
  label,
  count,
  icon: Icon,
  colorClass,
}: {
  label: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', colorClass.split(' ')[1])}>
        <Icon className={cn('h-5 w-5', colorClass.split(' ')[0])} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-700">{label}</p>
      </div>
      <p className="text-2xl font-black text-slate-900">{count}</p>
    </div>
  )
}
