'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  Users, ShieldCheck, Building2, Megaphone, Search, ChevronLeft, ChevronRight,
  CheckCircle2, Star, Link2, Loader2, UserCheck, UserPlus, Repeat,
} from 'lucide-react'
import type { Profile, UserRole } from '@/types'

type DateRange = 'today' | 'week' | 'month' | 'year' | 'all'

type EnrichedUser = Profile & {
  hasBooking: boolean
  isProvider: boolean
  isMarketeer: boolean
  isReferred: boolean
  providerStatus: 'active' | 'suspended' | null
  marketeerStatus: 'active' | 'suspended' | null
  bookingCount: number
}

type RoleCounts = { buyer: number; provider: number; marketeer: number; admin: number }

type FunnelData = { registered: number; booked: number; repeat: number }

type DailyReg = { date: string; count: number }

const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const supabase = createClient()

  const [users, setUsers] = useState<EnrichedUser[]>([])
  const [roleCounts, setRoleCounts] = useState<RoleCounts>({ buyer: 0, provider: 0, marketeer: 0, admin: 0 })
  const [funnel, setFunnel] = useState<FunnelData>({ registered: 0, booked: 0, repeat: 0 })
  const [dailyRegs, setDailyRegs] = useState<DailyReg[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(0)
    }, 500)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [searchQuery])

  const getDateFilter = useCallback(() => {
    const now = new Date()
    switch (dateRange) {
      case 'today': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        return start.toISOString()
      }
      case 'week': {
        const start = new Date(now)
        start.setDate(now.getDate() - 7)
        return start.toISOString()
      }
      case 'month': {
        const start = new Date(now)
        start.setMonth(now.getMonth() - 1)
        return start.toISOString()
      }
      case 'year': {
        const start = new Date(now)
        start.setFullYear(now.getFullYear() - 1)
        return start.toISOString()
      }
      default:
        return null
    }
  }, [dateRange])

  const loadRoleCounts = useCallback(async () => {
    const roles: (keyof RoleCounts)[] = ['buyer', 'provider', 'marketeer', 'admin']
    const counts: RoleCounts = { buyer: 0, provider: 0, marketeer: 0, admin: 0 }
    await Promise.all(
      roles.map(async (role) => {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', role)
        counts[role] = count || 0
      })
    )
    setRoleCounts(counts)
  }, [])

  const loadFunnel = useCallback(async () => {
    const { count: registered } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { data: buyersWithBookings } = await supabase
      .from('bookings')
      .select('buyer_id')

    const uniqueBuyers = new Set((buyersWithBookings || []).map(b => b.buyer_id).filter(Boolean))
    const booked = uniqueBuyers.size

    const buyerBookingCounts: Record<string, number> = {}
    ;(buyersWithBookings || []).forEach(b => {
      if (b.buyer_id) {
        buyerBookingCounts[b.buyer_id] = (buyerBookingCounts[b.buyer_id] || 0) + 1
      }
    })
    const repeat = Object.values(buyerBookingCounts).filter(c => c > 1).length

    setFunnel({ registered: registered || 0, booked, repeat })
  }, [])

  const loadDailyRegs = useCallback(async () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    const grouped: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const key = d.toISOString().split('T')[0]
      grouped[key] = 0
    }

    ;(data || []).forEach(p => {
      const key = p.created_at.split('T')[0]
      if (grouped[key] !== undefined) grouped[key]++
    })

    setDailyRegs(Object.entries(grouped).map(([date, count]) => ({ date, count })))
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter)
    }

    const dateFilter = getDateFilter()
    if (dateFilter) {
      query = query.gte('created_at', dateFilter)
    }

    if (debouncedSearch.trim()) {
      query = query.or(`email.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`)
    }

    const { data: profiles, count } = await query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (!profiles) {
      setUsers([])
      setTotalCount(0)
      setLoading(false)
      return
    }

    const userIds = profiles.map(p => p.id)

    const [
      { data: bookings },
      { data: providers },
      { data: marketeers },
    ] = await Promise.all([
      supabase.from('bookings').select('buyer_id').in('buyer_id', userIds),
      supabase.from('providers').select('user_id, status').in('user_id', userIds),
      supabase.from('marketeers').select('user_id, status').in('user_id', userIds),
    ])

    const bookingMap: Record<string, number> = {}
    ;(bookings || []).forEach(b => {
      if (b.buyer_id) bookingMap[b.buyer_id] = (bookingMap[b.buyer_id] || 0) + 1
    })

    const providerMap: Record<string, 'active' | 'suspended'> = {}
    ;(providers || []).forEach(p => { providerMap[p.user_id] = p.status as 'active' | 'suspended' })

    const marketeerMap: Record<string, 'active' | 'suspended'> = {}
    ;(marketeers || []).forEach(m => { marketeerMap[m.user_id] = m.status as 'active' | 'suspended' })

    const enriched: EnrichedUser[] = profiles.map(p => ({
      ...p,
      hasBooking: (bookingMap[p.id] || 0) > 0,
      isProvider: !!providerMap[p.id],
      isMarketeer: !!marketeerMap[p.id],
      isReferred: !!p.referred_by,
      providerStatus: providerMap[p.id] || null,
      marketeerStatus: marketeerMap[p.id] || null,
      bookingCount: bookingMap[p.id] || 0,
    }))

    setUsers(enriched)
    setTotalCount(count || 0)
    setLoading(false)
  }, [roleFilter, dateRange, debouncedSearch, page, getDateFilter])

  useEffect(() => {
    loadRoleCounts()
    loadFunnel()
    loadDailyRegs()
  }, [loadRoleCounts, loadFunnel, loadDailyRegs])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const roleCards = [
    { role: 'buyer' as const, count: roleCounts.buyer, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', label: isAr ? 'مشترين' : 'Buyers' },
    { role: 'provider' as const, count: roleCounts.provider, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', label: isAr ? 'مزودين' : 'Providers' },
    { role: 'marketeer' as const, count: roleCounts.marketeer, icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50', label: isAr ? 'مسوّقين' : 'Marketeers' },
    { role: 'admin' as const, count: roleCounts.admin, icon: ShieldCheck, color: 'text-red-600', bg: 'bg-red-50', label: isAr ? 'مدراء' : 'Admins' },
  ]

  const roleTabs: { value: 'all' | UserRole; label: string }[] = [
    { value: 'all', label: isAr ? 'الكل' : 'All' },
    { value: 'buyer', label: isAr ? 'مشترين' : 'Buyers' },
    { value: 'provider', label: isAr ? 'مزودين' : 'Providers' },
    { value: 'marketeer', label: isAr ? 'مسوّقين' : 'Marketeers' },
  ]

  const dateRanges: { value: DateRange; label: string }[] = [
    { value: 'today', label: isAr ? 'اليوم' : 'Today' },
    { value: 'week', label: isAr ? 'هذا الأسبوع' : 'This Week' },
    { value: 'month', label: isAr ? 'هذا الشهر' : 'This Month' },
    { value: 'year', label: isAr ? 'هذه السنة' : 'This Year' },
    { value: 'all', label: isAr ? 'الكل' : 'All Time' },
  ]

  function getUserStatus(user: EnrichedUser): { label: string; variant: 'emerald' | 'amber' | 'red' } {
    if (user.role === 'provider') {
      if (user.providerStatus === 'suspended') return { label: isAr ? 'موقوف' : 'Suspended', variant: 'red' }
      if (user.providerStatus === 'active') return { label: isAr ? 'نشط' : 'Active', variant: 'emerald' }
      return { label: isAr ? 'مسجّل' : 'Registered', variant: 'amber' }
    }
    if (user.role === 'marketeer') {
      if (user.marketeerStatus === 'suspended') return { label: isAr ? 'موقوف' : 'Suspended', variant: 'red' }
      if (user.marketeerStatus === 'active') return { label: isAr ? 'نشط' : 'Active', variant: 'emerald' }
      return { label: isAr ? 'مسجّل' : 'Registered', variant: 'amber' }
    }
    if (user.hasBooking) return { label: isAr ? 'نشط' : 'Active', variant: 'emerald' }
    return { label: isAr ? 'مسجّل' : 'Registered', variant: 'amber' }
  }

  function getRoleBadge(role: UserRole) {
    const map = {
      buyer: { label: isAr ? 'مشتري' : 'Buyer', cls: 'bg-blue-100 text-blue-700' },
      provider: { label: isAr ? 'مزود' : 'Provider', cls: 'bg-purple-100 text-purple-700' },
      marketeer: { label: isAr ? 'مسوّق' : 'Marketeer', cls: 'bg-amber-100 text-amber-700' },
      admin: { label: isAr ? 'مدير' : 'Admin', cls: 'bg-red-100 text-red-700' },
    }
    return map[role]
  }

  function getViewLink(user: EnrichedUser): string | null {
    if (user.role === 'provider') return `/${locale}/admin/providers`
    if (user.role === 'marketeer') return `/${locale}/admin/marketeer-list`
    return null
  }

  const statusVariantCls = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const maxBar = Math.max(...dailyRegs.map(d => d.count), 1)

  const funnelTotal = funnel.registered || 1
  const funnelItems = [
    { label: isAr ? 'مسجّل' : 'Registered', value: funnel.registered, pct: 100, color: 'bg-slate-400', icon: UserPlus },
    { label: isAr ? 'حجز' : 'Booked', value: funnel.booked, pct: Math.round((funnel.booked / funnelTotal) * 100), color: 'bg-blue-500', icon: UserCheck },
    { label: isAr ? 'عميل متكرر' : 'Repeat', value: funnel.repeat, pct: Math.round((funnel.repeat / funnelTotal) * 100), color: 'bg-emerald-500', icon: Repeat },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{isAr ? 'مراقبة المستخدمين' : 'User Monitoring'}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {roleCards.map((card) => (
          <div key={card.role} className="bg-white rounded-2xl border p-5">
            <div className={cn('inline-flex items-center justify-center rounded-xl p-2.5 mb-3', card.bg)}>
              <card.icon className={cn('h-5 w-5', card.color)} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.count.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border p-5 mb-6">
        <p className="text-sm font-semibold text-slate-900 mb-3">{isAr ? 'قمع التحويل' : 'Conversion Funnel'}</p>
        <div className="flex items-center gap-4">
          {funnelItems.map((item) => (
            <div key={item.label} className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <item.icon className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs text-slate-600">{item.label}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', item.color)} style={{ width: `${item.pct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-semibold text-slate-900">{item.value.toLocaleString()}</span>
                <span className="text-xs text-slate-500">{item.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم أو البريد...' : 'Search name or email...'}
            className="w-full rounded-lg border bg-white px-3 ps-9 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {roleTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setRoleFilter(tab.value); setPage(0) }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                roleFilter === tab.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border text-slate-600 hover:bg-slate-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {dateRanges.map((dr) => (
            <button
              key={dr.value}
              onClick={() => { setDateRange(dr.value); setPage(0) }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                dateRange === dr.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border text-slate-600 hover:bg-slate-50'
              )}
            >
              {dr.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{t('common.name')}</th>
                <th className="text-start p-3 font-medium">{t('common.email')}</th>
                <th className="text-start p-3 font-medium">{t('common.phone')}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'الدور' : 'Role'}</th>
                <th className="text-start p-3 font-medium">{t('common.date')}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'مؤشرات' : 'Indicators'}</th>
                <th className="text-start p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    {t('common.loading')}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">{t('common.no_results')}</td>
                </tr>
              ) : (
                users.map((user) => {
                  const status = getUserStatus(user)
                  const roleBadge = getRoleBadge(user.role)
                  const viewLink = getViewLink(user)
                  return (
                    <tr key={user.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium text-slate-900">{user.full_name || '—'}</td>
                      <td className="p-3 text-slate-600">{user.email}</td>
                      <td className="p-3 font-mono text-xs text-slate-600">{user.phone || '—'}</td>
                      <td className="p-3">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium', roleBadge.cls)}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 text-xs">
                        {new Date(user.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                      </td>
                      <td className="p-3">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-md text-xs font-medium', statusVariantCls[status.variant])}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {user.hasBooking && (
                            <span title={isAr ? 'لديه حجز' : 'Has booking'}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            </span>
                          )}
                          {user.isMarketeer && (
                            <span title={isAr ? 'مسوّق' : 'Marketeer'}>
                              <Star className="h-3.5 w-3.5 text-amber-500" />
                            </span>
                          )}
                          {user.isProvider && (
                            <span title={isAr ? 'مزود' : 'Provider'}>
                              <Building2 className="h-3.5 w-3.5 text-purple-500" />
                            </span>
                          )}
                          {user.isReferred && (
                            <span title={isAr ? 'مُحال' : 'Referred'}>
                              <Link2 className="h-3.5 w-3.5 text-blue-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {viewLink ? (
                          <Link
                            href={viewLink}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            {isAr ? 'عرض' : 'View'}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-slate-500">
              {isAr
                ? `عرض ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} من ${totalCount}`
                : `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} of ${totalCount}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {isAr ? 'السابق' : 'Prev'}
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                {isAr ? 'التالي' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border p-5">
        <p className="text-sm font-semibold text-slate-900 mb-4">
          {isAr ? 'التسجيلات اليومية (آخر 30 يوم)' : 'Daily Registrations (Last 30 Days)'}
        </p>
        <div className="flex items-end gap-1 h-40">
          {dailyRegs.map((day, i) => (
            <div
              key={day.date}
              className="flex-1 relative group"
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div
                className={cn(
                  'w-full rounded-t transition-colors',
                  hoveredBar === i ? 'bg-primary' : 'bg-primary/60'
                )}
                style={{ height: `${Math.max((day.count / maxBar) * 100, day.count > 0 ? 4 : 0)}%` }}
              />
              {hoveredBar === i && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                  <p className="font-medium">{day.count} {isAr ? 'تسجيل' : 'registrations'}</p>
                  <p className="text-slate-300">{day.date}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-slate-400">{dailyRegs[0]?.date || ''}</span>
          <span className="text-[10px] text-slate-400">{dailyRegs[dailyRegs.length - 1]?.date || ''}</span>
        </div>
      </div>
    </div>
  )
}
