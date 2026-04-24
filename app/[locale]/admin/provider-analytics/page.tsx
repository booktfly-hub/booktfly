'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  DollarSign,
  Wallet,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Trophy,
  BarChart3,
  Building2,
  Plane,
  Calendar,
  TrendingUp,
} from 'lucide-react'

type ProviderStat = {
  id: string
  company_name_ar: string
  company_name_en: string | null
  provider_type: 'travel_agency' | 'hajj_umrah'
  status: 'active' | 'suspended'
  commission_rate: number | null
  created_at: string
  tripsCount: number
  activeTrips: number
  totalBookings: number
  revenue: number
  commissionPaid: number
  totalSeats: number
  bookedSeats: number
  occupancy: number
  walletBalance: number
  trips: {
    id: string
    status: string
    total_seats: number
    booked_seats: number
    created_at: string
    origin_city_ar: string
    destination_city_ar: string
  }[]
  bookings: {
    id: string
    status: string
    total_amount: number
    created_at: string
  }[]
  roomBookings: {
    id: string
    status: string
    total_amount: number
    created_at: string
  }[]
}

type SortField = 'revenue' | 'totalBookings' | 'occupancy' | 'created_at'
type SortDir = 'asc' | 'desc'

export default function ProviderAnalyticsPage() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const supabase = createClient()

  const [providers, setProviders] = useState<ProviderStat[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'travel_agency' | 'hajj_umrah'>('all')
  const [sortField, setSortField] = useState<SortField>('revenue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const perPage = 15

  const fetchData = useCallback(async () => {
    setLoading(true)

    const { data: providerRows } = await supabase
      .from('providers')
      .select('id, company_name_ar, company_name_en, provider_type, status, commission_rate, created_at')

    if (!providerRows || providerRows.length === 0) {
      setProviders([])
      setLoading(false)
      return
    }

    const providerIds = providerRows.map((p) => p.id)

    const [tripsRes, bookingsRes, roomBookingsRes, walletsRes] = await Promise.all([
      supabase
        .from('trips')
        .select('id, provider_id, status, total_seats, booked_seats, created_at, origin_city_ar, destination_city_ar')
        .in('provider_id', providerIds),
      supabase
        .from('bookings')
        .select('id, provider_id, status, total_amount, commission_amount, provider_payout, created_at')
        .in('provider_id', providerIds),
      supabase
        .from('room_bookings')
        .select('id, provider_id, status, total_amount, commission_amount, provider_payout, created_at')
        .in('provider_id', providerIds),
      supabase
        .from('provider_wallets')
        .select('provider_id, balance')
        .in('provider_id', providerIds),
    ])

    const trips = tripsRes.data || []
    const bookings = bookingsRes.data || []
    const roomBookings = roomBookingsRes.data || []
    const wallets = walletsRes.data || []

    const walletMap = new Map(wallets.map((w) => [w.provider_id, Number(w.balance)]))

    const stats: ProviderStat[] = providerRows.map((p) => {
      const pTrips = trips.filter((tr) => tr.provider_id === p.id)
      const pBookings = bookings.filter((b) => b.provider_id === p.id)
      const pRoomBookings = roomBookings.filter((rb) => rb.provider_id === p.id)

      const confirmedBookings = pBookings.filter((b) => b.status === 'confirmed')
      const confirmedRoomBookings = pRoomBookings.filter((rb) => rb.status === 'confirmed')

      const revenue =
        confirmedBookings.reduce((s, b) => s + Number(b.total_amount), 0) +
        confirmedRoomBookings.reduce((s, rb) => s + Number(rb.total_amount), 0)

      const commissionPaid =
        confirmedBookings.reduce((s, b) => s + Number(b.commission_amount), 0) +
        confirmedRoomBookings.reduce((s, rb) => s + Number(rb.commission_amount), 0)

      const totalSeats = pTrips.reduce((s, tr) => s + Number(tr.total_seats), 0)
      const bookedSeats = pTrips.reduce((s, tr) => s + Number(tr.booked_seats), 0)
      const occupancy = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0

      return {
        id: p.id,
        company_name_ar: p.company_name_ar,
        company_name_en: p.company_name_en,
        provider_type: p.provider_type,
        status: p.status,
        commission_rate: p.commission_rate,
        created_at: p.created_at,
        tripsCount: pTrips.length,
        activeTrips: pTrips.filter((tr) => tr.status === 'active').length,
        totalBookings: confirmedBookings.length + confirmedRoomBookings.length,
        revenue,
        commissionPaid,
        totalSeats,
        bookedSeats,
        occupancy,
        walletBalance: walletMap.get(p.id) || 0,
        trips: pTrips.map((tr) => ({
          id: tr.id,
          status: tr.status,
          total_seats: tr.total_seats,
          booked_seats: tr.booked_seats,
          created_at: tr.created_at,
          origin_city_ar: tr.origin_city_ar,
          destination_city_ar: tr.destination_city_ar,
        })),
        bookings: pBookings.map((b) => ({
          id: b.id,
          status: b.status,
          total_amount: Number(b.total_amount),
          created_at: b.created_at,
        })),
        roomBookings: pRoomBookings.map((rb) => ({
          id: rb.id,
          status: rb.status,
          total_amount: Number(rb.total_amount),
          created_at: rb.created_at,
        })),
      }
    })

    setProviders(stats)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = useMemo(() => {
    let result = [...providers]

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter)
    }
    if (typeFilter !== 'all') {
      result = result.filter((p) => p.provider_type === typeFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (p) =>
          p.company_name_ar.toLowerCase().includes(q) ||
          (p.company_name_en && p.company_name_en.toLowerCase().includes(q))
      )
    }

    result.sort((a, b) => {
      let aVal: number, bVal: number
      switch (sortField) {
        case 'revenue':
          aVal = a.revenue
          bVal = b.revenue
          break
        case 'totalBookings':
          aVal = a.totalBookings
          bVal = b.totalBookings
          break
        case 'occupancy':
          aVal = a.occupancy
          bVal = b.occupancy
          break
        case 'created_at':
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
          break
        default:
          aVal = 0
          bVal = 0
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })

    return result
  }, [providers, statusFilter, typeFilter, search, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const totalProviders = providers.length
  const activeProviders = providers.filter((p) => p.status === 'active').length
  const suspendedProviders = providers.filter((p) => p.status === 'suspended').length
  const newThisMonth = providers.filter((p) => new Date(p.created_at) >= thisMonthStart).length
  const totalRevenue = providers.reduce((s, p) => s + p.revenue, 0)
  const avgRevenue = totalProviders > 0 ? Math.round(totalRevenue / totalProviders) : 0
  const totalPayouts = providers.reduce((s, p) => s + (p.revenue - p.commissionPaid), 0)

  const travelAgencyCount = providers.filter((p) => p.provider_type === 'travel_agency').length
  const hajjUmrahCount = providers.filter((p) => p.provider_type === 'hajj_umrah').length
  const travelAgencyPct = totalProviders > 0 ? Math.round((travelAgencyCount / totalProviders) * 100) : 0
  const hajjUmrahPct = totalProviders > 0 ? Math.round((hajjUmrahCount / totalProviders) * 100) : 0

  const topByRevenue = [...providers].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  const topByBookings = [...providers].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 5)
  const topByOccupancy = [...providers].sort((a, b) => b.occupancy - a.occupancy).slice(0, 5)

  const cur = pick(locale, 'ر.س', 'SAR', 'SAR')

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
    setPage(1)
  }

  function providerName(p: ProviderStat) {
    return isAr ? p.company_name_ar : p.company_name_en || p.company_name_ar
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function statusBadge(status: string) {
    if (status === 'active')
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          {pick(locale, 'نشط', 'Active', 'Aktif')}
        </span>
      )
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
        {pick(locale, 'معلق', 'Suspended', 'Askıya Alındı')}
      </span>
    )
  }

  function typeBadge(type: string) {
    if (type === 'travel_agency')
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {pick(locale, 'وكالة سفر', 'Travel Agency', 'Seyahat Acentesi')}
        </span>
      )
    return (
      <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
        {pick(locale, 'حج وعمرة', 'Hajj & Umrah', 'Hac ve Umre')}
      </span>
    )
  }

  function tripStatusBadge(status: string) {
    const map: Record<string, { bg: string; text: string; ar: string; en: string }> = {
      active: { bg: 'bg-emerald-50', text: 'text-emerald-700', ar: 'نشط', en: 'Active' },
      sold_out: { bg: 'bg-amber-50', text: 'text-amber-700', ar: 'مكتمل', en: 'Sold Out' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-600', ar: 'منتهي', en: 'Expired' },
      removed: { bg: 'bg-red-50', text: 'text-red-700', ar: 'محذوف', en: 'Removed' },
      deactivated: { bg: 'bg-gray-100', text: 'text-gray-600', ar: 'معطل', en: 'Deactivated' },
    }
    const s = map[status] || { bg: 'bg-gray-100', text: 'text-gray-600', ar: status, en: status }
    return (
      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', s.bg, s.text)}>
        {isAr ? s.ar : s.en}
      </span>
    )
  }

  function bookingStatusBadge(status: string) {
    const map: Record<string, { bg: string; text: string; ar: string; en: string }> = {
      confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', ar: 'مؤكد', en: 'Confirmed' },
      payment_processing: { bg: 'bg-amber-50', text: 'text-amber-700', ar: 'قيد الدفع', en: 'Processing' },
      payment_failed: { bg: 'bg-red-50', text: 'text-red-700', ar: 'فشل الدفع', en: 'Failed' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', ar: 'ملغي', en: 'Cancelled' },
      refunded: { bg: 'bg-blue-50', text: 'text-blue-700', ar: 'مسترد', en: 'Refunded' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', ar: 'مرفوض', en: 'Rejected' },
      cancellation_pending: { bg: 'bg-amber-50', text: 'text-amber-700', ar: 'بانتظار الإلغاء', en: 'Cancel Pending' },
    }
    const s = map[status] || { bg: 'bg-gray-100', text: 'text-gray-600', ar: status, en: status }
    return (
      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', s.bg, s.text)}>
        {isAr ? s.ar : s.en}
      </span>
    )
  }

  function HorizontalBar({ items, color }: { items: { name: string; value: number }[]; color: string }) {
    const max = items.length > 0 ? Math.max(...items.map((i) => i.value)) : 1
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="truncate max-w-[180px]">{item.name}</span>
              <span className="font-semibold tabular-nums">{item.value.toLocaleString()}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', color)}
                style={{ width: `${max > 0 ? (item.value / max) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">{pick(locale, 'لا توجد بيانات', 'No data', 'Veri yok')}</p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border p-5 space-y-3 animate-pulse">
              <div className="h-5 w-5 bg-gray-200 rounded" />
              <div className="h-6 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border p-6 space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{pick(locale, 'تحليلات مزودي الخدمة', 'Provider Analytics', 'Tedarikçi Analitiği')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          {
            label: pick(locale, 'إجمالي المزودين', 'Total Providers', 'Toplam Tedarikçi'),
            value: totalProviders,
            icon: Users,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
          },
          {
            label: pick(locale, 'المزودون النشطون', 'Active Providers', 'Aktif Tedarikçiler'),
            value: activeProviders,
            icon: UserCheck,
            iconColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
          },
          {
            label: pick(locale, 'المزودون المعلقون', 'Suspended Providers', 'Askıya Alınan Tedarikçiler'),
            value: suspendedProviders,
            icon: UserX,
            iconColor: 'text-red-600',
            bgColor: 'bg-red-50',
          },
          {
            label: pick(locale, 'مزودون جدد هذا الشهر', 'New This Month', 'Bu Ay Yeni'),
            value: newThisMonth,
            icon: UserPlus,
            iconColor: 'text-violet-600',
            bgColor: 'bg-violet-50',
          },
          {
            label: pick(locale, 'متوسط الإيراد لكل مزود', 'Avg Revenue/Provider', 'Ortalama Gelir/Tedarikçi'),
            value: `${avgRevenue.toLocaleString()} ${cur}`,
            icon: DollarSign,
            iconColor: 'text-amber-600',
            bgColor: 'bg-amber-50',
          },
          {
            label: pick(locale, 'إجمالي مدفوعات المزودين', 'Total Payouts', 'Toplam Ödeme'),
            value: `${totalPayouts.toLocaleString()} ${cur}`,
            icon: Wallet,
            iconColor: 'text-teal-600',
            bgColor: 'bg-teal-50',
          },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border p-5">
            <div className={cn('inline-flex items-center justify-center h-10 w-10 rounded-xl mb-3', card.bgColor)}>
              <card.icon className={cn('h-5 w-5', card.iconColor)} />
            </div>
            <p className="text-xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b space-y-4">
          <h2 className="text-lg font-semibold">{pick(locale, 'أداء المزودين', 'Provider Performance', 'Tedarikçi Performansı')}</h2>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder={pick(locale, 'بحث باسم الشركة...', 'Search by company name...', 'Şirket adına göre ara...')}
                className="w-full ps-9 pe-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter)
                setPage(1)
              }}
              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">{pick(locale, 'جميع الحالات', 'All Statuses', 'Tüm Durumlar')}</option>
              <option value="active">{pick(locale, 'نشط', 'Active', 'Aktif')}</option>
              <option value="suspended">{pick(locale, 'معلق', 'Suspended', 'Askıya Alındı')}</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as typeof typeFilter)
                setPage(1)
              }}
              className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">{pick(locale, 'جميع الأنواع', 'All Types', 'Tüm Türler')}</option>
              <option value="travel_agency">{pick(locale, 'وكالة سفر', 'Travel Agency', 'Seyahat Acentesi')}</option>
              <option value="hajj_umrah">{pick(locale, 'حج وعمرة', 'Hajj & Umrah', 'Hac ve Umre')}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{pick(locale, 'المزود', 'Provider', 'Tedarikçi')}</th>
                <th className="text-start p-3 font-medium">{pick(locale, 'النوع', 'Type', 'Tür')}</th>
                <th className="text-start p-3 font-medium">{pick(locale, 'الحالة', 'Status', 'Durum')}</th>
                <th
                  className="text-start p-3 font-medium cursor-pointer select-none hover:text-primary"
                  onClick={() => handleSort('created_at')}
                >
                  <span className="inline-flex items-center gap-1">
                    {pick(locale, 'تاريخ الانضمام', 'Joined', 'Katıldı')}
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </span>
                </th>
                <th className="text-start p-3 font-medium">{pick(locale, 'الرحلات', 'Trips', 'Geziler')}</th>
                <th className="text-start p-3 font-medium">{pick(locale, 'نشطة', 'Active', 'Aktif')}</th>
                <th
                  className="text-start p-3 font-medium cursor-pointer select-none hover:text-primary"
                  onClick={() => handleSort('totalBookings')}
                >
                  <span className="inline-flex items-center gap-1">
                    {pick(locale, 'الحجوزات', 'Bookings', 'Rezervasyonlar')}
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </span>
                </th>
                <th
                  className="text-start p-3 font-medium cursor-pointer select-none hover:text-primary"
                  onClick={() => handleSort('revenue')}
                >
                  <span className="inline-flex items-center gap-1">
                    {pick(locale, 'الإيرادات', 'Revenue', 'Gelir')}
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </span>
                </th>
                <th className="text-start p-3 font-medium">{pick(locale, 'العمولة', 'Commission', 'Komisyon')}</th>
                <th
                  className="text-start p-3 font-medium cursor-pointer select-none hover:text-primary"
                  onClick={() => handleSort('occupancy')}
                >
                  <span className="inline-flex items-center gap-1">
                    {pick(locale, 'الإشغال', 'Occupancy', 'Doluluk')}
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </span>
                </th>
                <th className="text-start p-3 font-medium">{pick(locale, 'المحفظة', 'Wallet', 'Cüzdan')}</th>
                <th className="p-3 w-10" />
              </tr>
            </thead>
            {paginated.length === 0 && (
              <tbody>
                <tr>
                  <td colSpan={12} className="text-center py-12 text-muted-foreground">
                    {pick(locale, 'لا توجد نتائج', 'No results found', 'Sonuç bulunamadı')}
                  </td>
                </tr>
              </tbody>
            )}
            {paginated.map((p) => (
              <tbody key={p.id}>
                <tr
                    className={cn(
                      'border-b hover:bg-muted/30 cursor-pointer transition-colors',
                      expandedId === p.id && 'bg-muted/20'
                    )}
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  >
                    <td className="p-3 font-medium">{providerName(p)}</td>
                    <td className="p-3">{typeBadge(p.provider_type)}</td>
                    <td className="p-3">{statusBadge(p.status)}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(p.created_at)}</td>
                    <td className="p-3 tabular-nums">{p.tripsCount}</td>
                    <td className="p-3 tabular-nums">{p.activeTrips}</td>
                    <td className="p-3 tabular-nums">{p.totalBookings}</td>
                    <td className="p-3 tabular-nums font-medium">{p.revenue.toLocaleString()} {cur}</td>
                    <td className="p-3 tabular-nums">{p.commissionPaid.toLocaleString()} {cur}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              p.occupancy >= 75
                                ? 'bg-emerald-500'
                                : p.occupancy >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-red-400'
                            )}
                            style={{ width: `${p.occupancy}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-xs">{p.occupancy}%</span>
                      </div>
                    </td>
                    <td className="p-3 tabular-nums">{p.walletBalance.toLocaleString()} {cur}</td>
                    <td className="p-3">
                      {expandedId === p.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr className="border-b bg-muted/10">
                      <td colSpan={12} className="p-0">
                        <div className="p-6 space-y-6">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl border p-4">
                              <Plane className="h-4 w-4 text-blue-500 mb-1" />
                              <p className="text-lg font-bold">{p.tripsCount}</p>
                              <p className="text-xs text-muted-foreground">{pick(locale, 'إجمالي الرحلات', 'Total Trips', 'Toplam Gezi')}</p>
                            </div>
                            <div className="bg-white rounded-xl border p-4">
                              <Calendar className="h-4 w-4 text-emerald-500 mb-1" />
                              <p className="text-lg font-bold">{p.totalBookings}</p>
                              <p className="text-xs text-muted-foreground">{pick(locale, 'إجمالي الحجوزات', 'Total Bookings', 'Toplam Rezervasyon')}</p>
                            </div>
                            <div className="bg-white rounded-xl border p-4">
                              <DollarSign className="h-4 w-4 text-amber-500 mb-1" />
                              <p className="text-lg font-bold">{p.revenue.toLocaleString()} {cur}</p>
                              <p className="text-xs text-muted-foreground">{pick(locale, 'إجمالي الإيرادات', 'Total Revenue', 'Toplam Gelir')}</p>
                            </div>
                            <div className="bg-white rounded-xl border p-4">
                              <TrendingUp className="h-4 w-4 text-violet-500 mb-1" />
                              <p className="text-lg font-bold">{p.occupancy}%</p>
                              <p className="text-xs text-muted-foreground">{pick(locale, 'متوسط الإشغال', 'Avg Occupancy', 'Ortalama Doluluk')}</p>
                            </div>
                          </div>

                          {p.trips.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-3">{pick(locale, 'الرحلات', 'Trips', 'Geziler')}</h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {p.trips.map((trip) => (
                                  <div key={trip.id} className="flex items-center justify-between bg-white rounded-lg border p-3 text-sm">
                                    <div className="flex items-center gap-3">
                                      {tripStatusBadge(trip.status)}
                                      <span>
                                        {trip.origin_city_ar} → {trip.destination_city_ar}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                      <span className="tabular-nums">
                                        {trip.booked_seats}/{trip.total_seats} {pick(locale, 'مقعد', 'seats', 'koltuk')}
                                      </span>
                                      <span>{formatDate(trip.created_at)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(p.bookings.length > 0 || p.roomBookings.length > 0) && (
                            <div>
                              <h4 className="font-semibold text-sm mb-3">{pick(locale, 'سجل الحجوزات', 'Booking History', 'Rezervasyon Geçmişi')}</h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {[...p.bookings, ...p.roomBookings]
                                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                  .map((b) => (
                                    <div key={b.id} className="flex items-center justify-between bg-white rounded-lg border p-3 text-sm">
                                      <div className="flex items-center gap-3">
                                        {bookingStatusBadge(b.status)}
                                        <span className="tabular-nums font-medium">
                                          {b.total_amount.toLocaleString()} {cur}
                                        </span>
                                      </div>
                                      <span className="text-muted-foreground">{formatDate(b.created_at)}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {p.trips.length === 0 && p.bookings.length === 0 && p.roomBookings.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              {pick(locale, 'لا يوجد نشاط بعد', 'No activity yet', 'Henüz etkinlik yok')}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
              </tbody>
            ))}
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              {pick(locale, `عرض ${(page - 1) * perPage + 1}-${Math.min(page * perPage, filtered.length)} من ${filtered.length}`, `Showing ${(page - 1) * perPage + 1}-${Math.min(page * perPage, filtered.length)} of ${filtered.length}`)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <span className="text-sm tabular-nums px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">{pick(locale, 'الأعلى إيرادات', 'Top by Revenue', 'Gelire Göre En İyi')}</h3>
          </div>
          <HorizontalBar
            items={topByRevenue.map((p) => ({ name: providerName(p), value: p.revenue }))}
            color="bg-amber-500"
          />
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">{pick(locale, 'الأعلى حجوزات', 'Top by Bookings', 'Rezervasyona Göre En İyi')}</h3>
          </div>
          <HorizontalBar
            items={topByBookings.map((p) => ({ name: providerName(p), value: p.totalBookings }))}
            color="bg-blue-500"
          />
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold">{pick(locale, 'الأعلى إشغالاً', 'Top by Occupancy', 'Doluluğa Göre En İyi')}</h3>
          </div>
          <HorizontalBar
            items={topByOccupancy.map((p) => ({ name: providerName(p), value: p.occupancy }))}
            color="bg-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-violet-500" />
          <h3 className="font-semibold">{pick(locale, 'توزيع أنواع المزودين', 'Provider Type Distribution', 'Tedarikçi Türü Dağılımı')}</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex h-10 rounded-xl overflow-hidden">
              {travelAgencyPct > 0 && (
                <div
                  className="bg-blue-500 flex items-center justify-center text-white text-xs font-semibold transition-all duration-500"
                  style={{ width: `${travelAgencyPct}%` }}
                >
                  {travelAgencyPct > 10 ? `${travelAgencyPct}%` : ''}
                </div>
              )}
              {hajjUmrahPct > 0 && (
                <div
                  className="bg-purple-500 flex items-center justify-center text-white text-xs font-semibold transition-all duration-500"
                  style={{ width: `${hajjUmrahPct}%` }}
                >
                  {hajjUmrahPct > 10 ? `${hajjUmrahPct}%` : ''}
                </div>
              )}
              {totalProviders === 0 && <div className="bg-gray-200 w-full" />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>
              {pick(locale, 'وكالات السفر', 'Travel Agencies', 'Seyahat Acenteleri')} ({travelAgencyCount}) - {travelAgencyPct}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span>
              {pick(locale, 'حج وعمرة', 'Hajj & Umrah', 'Hac ve Umre')} ({hajjUmrahCount}) - {hajjUmrahPct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
