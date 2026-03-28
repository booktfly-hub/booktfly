'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Filter,
  Globe,
  Search,
  Shield,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'

type ActivityLog = {
  id: string
  event_type: string
  user_id: string | null
  metadata: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  profile?: { full_name: string | null; email: string } | null
}

type DateRange = 'today' | 'week' | 'month' | 'custom'

const EVENT_TYPES = [
  'site_visit',
  'user_registered',
  'user_login',
  'booking_created',
  'booking_confirmed',
  'booking_cancelled',
  'booking_refunded',
  'payment_received',
  'provider_joined',
  'trip_created',
  'trip_removed',
  'marketeer_joined',
  'seat_reserved',
] as const

const EVENT_COLORS: Record<string, { dot: string; badge: string; text: string }> = {
  user_registered: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  provider_joined: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  marketeer_joined: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  user_login: { dot: 'bg-blue-500', badge: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  site_visit: { dot: 'bg-blue-500', badge: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  booking_created: { dot: 'bg-purple-500', badge: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  booking_confirmed: { dot: 'bg-purple-500', badge: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  payment_received: { dot: 'bg-amber-500', badge: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  seat_reserved: { dot: 'bg-amber-500', badge: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  booking_cancelled: { dot: 'bg-red-500', badge: 'bg-red-50 border-red-200', text: 'text-red-700' },
  booking_refunded: { dot: 'bg-red-500', badge: 'bg-red-50 border-red-200', text: 'text-red-700' },
  trip_removed: { dot: 'bg-red-500', badge: 'bg-red-50 border-red-200', text: 'text-red-700' },
  trip_created: { dot: 'bg-indigo-500', badge: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
}

const DEFAULT_COLOR = { dot: 'bg-gray-400', badge: 'bg-gray-50 border-gray-200', text: 'text-gray-700' }

const ITEMS_PER_PAGE = 50

function getRelativeTime(dateStr: string, locale: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (locale === 'ar') {
    if (diffSec < 60) return 'الآن'
    if (diffMin < 60) return `منذ ${diffMin} د`
    if (diffHour < 24) return `منذ ${diffHour} س`
    if (diffDay < 7) return `منذ ${diffDay} ي`
    return date.toLocaleDateString('ar-SA')
  }
  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US')
}

function formatAbsoluteTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function getDateStart(range: DateRange): string | null {
  const now = new Date()
  if (range === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return start.toISOString()
  }
  if (range === 'week') {
    const start = new Date(now)
    start.setDate(start.getDate() - 7)
    return start.toISOString()
  }
  if (range === 'month') {
    const start = new Date(now)
    start.setDate(start.getDate() - 30)
    return start.toISOString()
  }
  return null
}

function renderMetadata(metadata: Record<string, any> | null): React.ReactNode {
  if (!metadata || Object.keys(metadata).length === 0) return null
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {Object.entries(metadata).map(([key, value]) => (
        <div key={key} className="flex gap-2 text-xs">
          <span className="font-medium text-muted-foreground min-w-[80px]">{key.replace(/_/g, ' ')}</span>
          <span className="text-foreground break-all">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-9 w-9 bg-muted rounded-xl" />
      </div>
      <div className="h-8 w-16 bg-muted rounded mt-1" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 p-4 animate-pulse">
      <div className="flex flex-col items-center gap-1 mt-1">
        <div className="h-3 w-3 rounded-full bg-muted" />
        <div className="w-px h-12 bg-muted" />
      </div>
      <div className="flex-1 flex gap-4">
        <div className="h-4 w-16 bg-muted rounded" />
        <div className="h-5 w-28 bg-muted rounded-full" />
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
    </div>
  )
}

export default function AdminActivityLogs() {
  const t = useTranslations()
  const locale = useLocale()
  const supabase = createClient()

  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)

  const [eventFilter, setEventFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>('week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [eventsToday, setEventsToday] = useState(0)
  const [eventsWeek, setEventsWeek] = useState(0)
  const [uniqueUsersToday, setUniqueUsersToday] = useState(0)
  const [topEventType, setTopEventType] = useState('')

  const [newEventsCount, setNewEventsCount] = useState(0)
  const [newEvents, setNewEvents] = useState<ActivityLog[]>([])
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtTop = useRef(true)

  const fetchSummary = useCallback(async () => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    const [todayRes, weekRes, usersRes, topRes] = await Promise.all([
      supabase
        .from('activity_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
      supabase
        .from('activity_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString()),
      supabase
        .from('activity_logs')
        .select('user_id')
        .gte('created_at', todayStart.toISOString())
        .not('user_id', 'is', null),
      supabase
        .from('activity_logs')
        .select('event_type')
        .gte('created_at', todayStart.toISOString()),
    ])

    setEventsToday(todayRes.count ?? 0)
    setEventsWeek(weekRes.count ?? 0)

    const uniqueUsers = new Set((usersRes.data || []).map((r: any) => r.user_id))
    setUniqueUsersToday(uniqueUsers.size)

    const typeCounts: Record<string, number> = {}
    ;(topRes.data || []).forEach((r: any) => {
      typeCounts[r.event_type] = (typeCounts[r.event_type] || 0) + 1
    })
    const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
    setTopEventType(sorted[0]?.[0] || '-')
  }, [])

  const fetchLogs = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('activity_logs')
      .select('id, event_type, user_id, metadata, ip_address, user_agent, created_at, profile:profiles!activity_logs_user_id_fkey(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)

    if (eventFilter) {
      query = query.eq('event_type', eventFilter)
    }

    if (dateRange === 'custom') {
      if (customFrom) query = query.gte('created_at', new Date(customFrom).toISOString())
      if (customTo) {
        const toDate = new Date(customTo)
        toDate.setHours(23, 59, 59, 999)
        query = query.lte('created_at', toDate.toISOString())
      }
    } else {
      const start = getDateStart(dateRange)
      if (start) query = query.gte('created_at', start)
    }

    if (searchQuery.trim()) {
      const term = searchQuery.trim()
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(term)) {
        query = query.eq('user_id', term)
      }
    }

    const { data, count } = await query
    setLogs((data as any) || [])
    setTotalCount(count ?? 0)
    setLoading(false)
  }, [page, eventFilter, dateRange, customFrom, customTo, searchQuery])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    const channel = supabase
      .channel('activity-logs-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        async (payload) => {
          const newLog = payload.new as ActivityLog

          let profile = null
          if (newLog.user_id) {
            const { data } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', newLog.user_id)
              .single()
            profile = data
          }

          const enrichedLog = { ...newLog, profile }

          if (isAtTop.current && page === 0) {
            setLogs((prev) => [enrichedLog, ...prev.slice(0, ITEMS_PER_PAGE - 1)])
            setHighlightIds((prev) => new Set(prev).add(newLog.id))
            setTimeout(() => {
              setHighlightIds((prev) => {
                const next = new Set(prev)
                next.delete(newLog.id)
                return next
              })
            }, 3000)
          } else {
            setNewEvents((prev) => [enrichedLog, ...prev])
            setNewEventsCount((prev) => prev + 1)
          }

          setTotalCount((prev) => prev + 1)
          setEventsToday((prev) => prev + 1)
          fetchSummary()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [page, fetchSummary])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const handleScroll = () => {
      isAtTop.current = container.scrollTop < 100
    }
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const showNewEvents = () => {
    setLogs((prev) => [...newEvents, ...prev].slice(0, ITEMS_PER_PAGE))
    newEvents.forEach((e) => {
      setHighlightIds((prev) => new Set(prev).add(e.id))
      setTimeout(() => {
        setHighlightIds((prev) => {
          const next = new Set(prev)
          next.delete(e.id)
          return next
        })
      }, 3000)
    })
    setNewEvents([])
    setNewEventsCount(0)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setEventFilter('')
    setDateRange('week')
    setCustomFrom('')
    setCustomTo('')
    setSearchQuery('')
    setSearchInput('')
    setPage(0)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const isAr = locale === 'ar'

  const summaryCards = [
    {
      label: isAr ? 'أحداث اليوم' : 'Events Today',
      value: eventsToday,
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: isAr ? 'أحداث الأسبوع' : 'Events This Week',
      value: eventsWeek,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: isAr ? 'مستخدمون نشطون اليوم' : 'Unique Users Today',
      value: uniqueUsersToday,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: isAr ? 'أكثر حدث تكراراً' : 'Most Active Event',
      value: topEventType.replace(/_/g, ' '),
      icon: Shield,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  const eventTypeLabel = (type: string) => type.replace(/_/g, ' ')

  const dateRangeOptions: { key: DateRange; label: string }[] = [
    { key: 'today', label: isAr ? 'اليوم' : 'Today' },
    { key: 'week', label: isAr ? 'آخر 7 أيام' : 'Last 7 Days' },
    { key: 'month', label: isAr ? 'آخر 30 يوم' : 'Last 30 Days' },
    { key: 'custom', label: isAr ? 'مخصص' : 'Custom' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{isAr ? 'سجل النشاط' : 'Activity Logs'}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && logs.length === 0
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : summaryCards.map((card) => (
              <div key={card.label} className="bg-white rounded-2xl border p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{card.label}</span>
                  <div className={cn('p-2 rounded-xl', card.bg)}>
                    <card.icon className={cn('h-5 w-5', card.color)} />
                  </div>
                </div>
                <p className="text-2xl font-bold capitalize">{card.value}</p>
              </div>
            ))}
      </div>

      <div className="bg-white rounded-2xl border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
          <Filter className="h-4 w-4" />
          {isAr ? 'التصفية' : 'Filters'}
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={eventFilter}
            onChange={(e) => { setEventFilter(e.target.value); setPage(0) }}
            className="rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">{isAr ? 'كل الأحداث' : 'All Events'}</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {eventTypeLabel(type)}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
            {dateRangeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setDateRange(opt.key); setPage(0) }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  dateRange === opt.key
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => { setCustomFrom(e.target.value); setPage(0) }}
                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <span className="text-muted-foreground text-sm">{isAr ? 'إلى' : 'to'}</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => { setCustomTo(e.target.value); setPage(0) }}
                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}

          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isAr ? 'بحث بمعرف المستخدم...' : 'Search by user ID...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchQuery(searchInput)
                  setPage(0)
                }
              }}
              className="rounded-lg border ps-9 pe-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {(eventFilter || dateRange !== 'week' || searchQuery) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              {isAr ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {newEventsCount > 0 && (
        <button
          onClick={showNewEvents}
          className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
        >
          <Activity className="h-4 w-4" />
          {isAr
            ? `${newEventsCount} أحداث جديدة — اضغط للعرض`
            : `${newEventsCount} new events — click to show`}
        </button>
      )}

      <div ref={scrollRef} className="bg-white rounded-2xl border overflow-hidden">
        {loading ? (
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{isAr ? 'لا توجد أحداث' : 'No events found'}</p>
          </div>
        ) : (
          <div className="divide-y">
            <div className="hidden lg:grid grid-cols-[44px_100px_160px_1fr_1fr_120px] gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground">
              <span />
              <span>{isAr ? 'الوقت' : 'Time'}</span>
              <span>{isAr ? 'نوع الحدث' : 'Event Type'}</span>
              <span>{isAr ? 'المستخدم' : 'User'}</span>
              <span>{isAr ? 'التفاصيل' : 'Details'}</span>
              <span>{isAr ? 'IP' : 'IP Address'}</span>
            </div>
            {logs.map((log, index) => {
              const colors = EVENT_COLORS[log.event_type] || DEFAULT_COLOR
              const isExpanded = expandedId === log.id
              const isHighlighted = highlightIds.has(log.id)
              const isLast = index === logs.length - 1
              const metaPreview = log.metadata
                ? Object.values(log.metadata).filter((v) => typeof v === 'string').slice(0, 2).join(' · ')
                : null

              return (
                <div key={log.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className={cn(
                      'w-full text-start grid grid-cols-1 lg:grid-cols-[44px_100px_160px_1fr_1fr_120px] gap-x-2 gap-y-1 px-4 py-3 hover:bg-muted/30 transition-all duration-300 items-start',
                      isHighlighted && 'bg-blue-50/60 animate-pulse'
                    )}
                  >
                    <div className="hidden lg:flex flex-col items-center pt-1">
                      <div className={cn('h-3 w-3 rounded-full ring-2 ring-white', colors.dot)} />
                      {!isLast && <div className="w-px flex-1 min-h-[24px] bg-border mt-1" />}
                    </div>

                    <div className="text-xs text-muted-foreground pt-0.5" title={formatAbsoluteTime(log.created_at, locale)}>
                      <span className="lg:hidden inline-flex items-center gap-1.5 me-2">
                        <span className={cn('h-2.5 w-2.5 rounded-full inline-block', colors.dot)} />
                      </span>
                      {getRelativeTime(log.created_at, locale)}
                    </div>

                    <div>
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
                          colors.badge,
                          colors.text
                        )}
                      >
                        {eventTypeLabel(log.event_type)}
                      </span>
                    </div>

                    <div className="text-sm truncate">
                      {log.profile ? (
                        <span>
                          <span className="font-medium">{log.profile.full_name || (isAr ? 'بدون اسم' : 'No name')}</span>
                          <span className="text-muted-foreground ms-1.5 text-xs">{log.profile.email}</span>
                        </span>
                      ) : log.user_id ? (
                        <span className="text-xs text-muted-foreground font-mono">{log.user_id.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{isAr ? 'زائر' : 'Anonymous'}</span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground truncate pt-0.5">
                      {metaPreview || '-'}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span className="truncate">{log.ip_address || '-'}</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 ms-1 shrink-0" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 ms-1 shrink-0" />
                      )}
                    </div>
                  </button>

                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300',
                      isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <div className="px-4 pb-4 lg:ps-[60px] space-y-3">
                      <div className="bg-muted/40 rounded-xl p-4 space-y-3 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">{isAr ? 'الوقت الكامل' : 'Full Timestamp'}</p>
                            <p className="font-mono text-xs">{formatAbsoluteTime(log.created_at, locale)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">{isAr ? 'معرف الحدث' : 'Event ID'}</p>
                            <p className="font-mono text-xs">{log.id}</p>
                          </div>
                          {log.user_id && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">{isAr ? 'معرف المستخدم' : 'User ID'}</p>
                              <p className="font-mono text-xs">{log.user_id}</p>
                            </div>
                          )}
                          {log.ip_address && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">{isAr ? 'عنوان IP' : 'IP Address'}</p>
                              <p className="font-mono text-xs">{log.ip_address}</p>
                            </div>
                          )}
                        </div>

                        {log.user_agent && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">{isAr ? 'المتصفح' : 'User Agent'}</p>
                            <p className="font-mono text-xs break-all">{log.user_agent}</p>
                          </div>
                        )}

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">{isAr ? 'البيانات الإضافية' : 'Metadata'}</p>
                            {renderMetadata(log.metadata)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {isAr
                ? `${page * ITEMS_PER_PAGE + 1}-${Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} من ${totalCount}`
                : `${page * ITEMS_PER_PAGE + 1}-${Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <span className="text-sm font-medium px-2">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
