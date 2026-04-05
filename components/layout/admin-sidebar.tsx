'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  FileText,
  Building2,
  Plane,
  BedDouble,
  BookOpen,
  DollarSign,
  Settings,
  Menu,
  X,
  LogOut,
  PenSquare,
  Banknote,
  ExternalLink,
  Star,
  PlaneTakeoff,
  ChevronDown,
  Users,
  Activity,
  Bell,
  BarChart3,
  TrendingUp,
  CarFront,
  PackageIcon,
  type LucideIcon,
} from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { useUser } from '@/hooks/use-user'

type NavItem = {
  key: string
  icon: LucideIcon
  href: string
  badgeKey?: string
}

type NavGroup = {
  key: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'group_overview',
    items: [
      { key: 'dashboard', icon: LayoutDashboard, href: '/admin' },
    ],
  },
  {
    key: 'group_monitoring',
    items: [
      { key: 'users', icon: Users, href: '/admin/users' },
      { key: 'activity_logs', icon: Activity, href: '/admin/activity-logs' },
      { key: 'alerts', icon: Bell, href: '/admin/alerts', badgeKey: 'alerts' },
    ],
  },
  {
    key: 'group_flights',
    items: [
      { key: 'trips', icon: Plane, href: '/admin/trips' },
      { key: 'flight_analytics', icon: BarChart3, href: '/admin/flight-analytics' },
      { key: 'bookings', icon: BookOpen, href: '/admin/bookings', badgeKey: 'bookings' },
      { key: 'flight_requests', icon: PlaneTakeoff, href: '/admin/flight-requests' },
      { key: 'trip_edit_requests', icon: PenSquare, href: '/admin/trip-edit-requests' },
    ],
  },
  {
    key: 'group_accommodations',
    items: [
      { key: 'rooms', icon: BedDouble, href: '/admin/rooms' },
      { key: 'room_bookings', icon: BookOpen, href: '/admin/room-bookings', badgeKey: 'roomBookings' },
    ],
  },
  {
    key: 'group_cars',
    items: [
      { key: 'cars', icon: CarFront, href: '/admin/cars' },
      { key: 'car_bookings', icon: CarFront, href: '/admin/car-bookings', badgeKey: 'carBookings' },
    ],
  },
  {
    key: 'group_packages',
    items: [
      { key: 'packages', icon: PackageIcon, href: '/admin/packages' },
      { key: 'package_bookings', icon: PackageIcon, href: '/admin/package-bookings', badgeKey: 'packageBookings' },
    ],
  },
  {
    key: 'group_providers',
    items: [
      { key: 'applications', icon: FileText, href: '/admin/applications', badgeKey: 'applications' },
      { key: 'providers', icon: Building2, href: '/admin/providers' },
      { key: 'provider_analytics', icon: TrendingUp, href: '/admin/provider-analytics' },
    ],
  },
  {
    key: 'group_marketing',
    items: [
      { key: 'marketeers', icon: Star, href: '/admin/marketeer-list' },
      { key: 'marketeer_applications', icon: FileText, href: '/admin/marketeers', badgeKey: 'marketeerApplications' },
    ],
  },
  {
    key: 'group_finance',
    items: [
      { key: 'revenue', icon: DollarSign, href: '/admin/revenue' },
      { key: 'withdrawals', icon: Banknote, href: '/admin/withdrawals', badgeKey: 'withdrawals' },
    ],
  },
  {
    key: 'group_system',
    items: [
      { key: 'settings', icon: Settings, href: '/admin/settings' },
    ],
  },
]

type BadgeCounts = Record<string, number>

function useBadgeCounts() {
  const [counts, setCounts] = useState<BadgeCounts>({})
  const supabase = useRef(createClient()).current

  const fetchCounts = useCallback(async () => {
    const [
      { count: applications },
      { count: marketeerApplications },
      { count: withdrawals },
      { count: bookings },
      { count: roomBookings },
      { count: carBookings },
      { count: packageBookings },
      alertsRes,
    ] = await Promise.all([
      supabase.from('provider_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabase.from('marketeer_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'payment_processing'),
      supabase.from('room_bookings').select('*', { count: 'exact', head: true }).eq('status', 'payment_processing'),
      supabase.from('car_bookings').select('*', { count: 'exact', head: true }).eq('status', 'payment_processing'),
      supabase.from('package_bookings').select('*', { count: 'exact', head: true }).eq('status', 'payment_processing'),
      fetch('/api/admin/alerts?filter=active&page=0').then(r => r.ok ? r.json() : { total: 0 }).catch(() => ({ total: 0 })),
    ])

    setCounts({
      applications: applications ?? 0,
      marketeerApplications: marketeerApplications ?? 0,
      withdrawals: withdrawals ?? 0,
      bookings: bookings ?? 0,
      roomBookings: roomBookings ?? 0,
      alerts: alertsRes.total ?? 0,
      carBookings: carBookings ?? 0,
      packageBookings: packageBookings ?? 0,
    })
  }, [supabase])

  useEffect(() => {
    fetchCounts()
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [fetchCounts])

  return counts
}

function Badge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-white text-[11px] font-bold leading-none">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function CollapsibleGroup({
  group,
  isActive,
  badges,
  locale,
  t,
  onNavigate,
}: {
  group: NavGroup
  isActive: (href: string) => boolean
  badges: BadgeCounts
  locale: string
  t: (key: string) => string
  onNavigate: () => void
}) {
  const hasActiveItem = group.items.some((item) => isActive(item.href))
  const [open, setOpen] = useState(hasActiveItem)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number>(0)

  useEffect(() => {
    if (hasActiveItem && !open) setOpen(true)
  }, [hasActiveItem])

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [open, group.items.length])

  const groupBadgeCount = group.items.reduce((sum, item) => {
    if (item.badgeKey) return sum + (badges[item.badgeKey] ?? 0)
    return sum
  }, 0)

  if (group.items.length === 1) {
    const item = group.items[0]
    const active = isActive(item.href)
    const itemBadge = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0
    return (
      <div className="mb-1">
        <Link
          href={`/${locale}${item.href}`}
          onClick={onNavigate}
          className={cn(
            'group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all',
            active
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <item.icon className={cn('h-5 w-5 shrink-0', active ? 'text-destructive' : 'text-slate-400 group-hover:text-slate-900')} />
          <span className="flex-1">{t(item.key)}</span>
          <Badge count={itemBadge} />
        </Link>
      </div>
    )
  }

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
      >
        <span className="flex-1 text-start">{t(group.key)}</span>
        <Badge count={groupBadgeCount} />
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      <div
        style={{ maxHeight: open ? contentHeight : 0 }}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
      >
        <div ref={contentRef} className="space-y-0.5 pb-1">
          {group.items.map((item) => {
            const active = isActive(item.href)
            const itemBadge = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0
            return (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                onClick={onNavigate}
                className={cn(
                  'group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ms-2',
                  active
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon className={cn('h-4.5 w-4.5 shrink-0', active ? 'text-destructive' : 'text-slate-400 group-hover:text-slate-900')} />
                <span className="flex-1">{t(item.key)}</span>
                <Badge count={itemBadge} />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const pathname = usePathname()
  const { signOut } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const badges = useBadgeCounts()

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`
    if (href === '/admin') return pathname === fullPath
    return pathname === fullPath || pathname.startsWith(fullPath + '/')
  }

  const onAlertsPage = pathname.startsWith(`/${locale}/admin/alerts`)
  const effectiveBadges = onAlertsPage ? { ...badges, alerts: 0 } : badges

  const handleSignOut = async () => {
    setMobileOpen(false)
    await signOut()
  }

  const closeMobile = () => setMobileOpen(false)

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-100">
        <h2 className="font-black text-2xl text-slate-900 tracking-tight">{t('dashboard')}</h2>
        <p className="text-xs font-bold text-destructive uppercase tracking-widest mt-1">Admin Panel</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group) => (
          <CollapsibleGroup
            key={group.key}
            group={group}
            isActive={isActive}
            badges={effectiveBadges}
            locale={locale}
            t={t}
            onNavigate={closeMobile}
          />
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 space-y-3">
        <Link
          href={`/${locale}`}
          onClick={closeMobile}
          className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <ExternalLink className="h-5 w-5 text-slate-400" />
          {locale === 'ar' ? 'الموقع الرئيسي' : 'Main website'}
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <LanguageSwitcher />
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        className="lg:hidden fixed bottom-6 start-6 z-50 p-4 rounded-full bg-slate-900 text-white shadow-2xl hover:scale-105 transition-transform"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 z-40 h-[100vh] w-[280px] bg-white border-e border-slate-200 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          locale === 'ar' && !mobileOpen && 'translate-x-full lg:translate-x-0',
          locale === 'ar' && mobileOpen && 'translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
