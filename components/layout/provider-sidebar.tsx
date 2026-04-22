'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Plane,
  BedDouble,
  BookOpen,
  DollarSign,
  User,
  Menu,
  X,
  LogOut,
  ExternalLink,
  CarFront,
  PlaneTakeoff,
  PackageIcon,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { NotificationBell } from '@/components/layout/notification-bell'
import { useUser } from '@/hooks/use-user'

type NavItem = {
  key: string
  icon: LucideIcon
  href: string
}

type NavGroup = {
  key: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'group_overview',
    items: [{ key: 'dashboard', icon: LayoutDashboard, href: '/provider/dashboard' }],
  },
  {
    key: 'group_flights',
    items: [
      { key: 'my_trips', icon: Plane, href: '/provider/trips' },
      { key: 'bookings', icon: BookOpen, href: '/provider/bookings' },
      { key: 'trip_requests', icon: PlaneTakeoff, href: '/provider/trip-requests' },
    ],
  },
  {
    key: 'group_accommodations',
    items: [
      { key: 'my_rooms', icon: BedDouble, href: '/provider/rooms' },
      { key: 'room_bookings', icon: BookOpen, href: '/provider/room-bookings' },
    ],
  },
  {
    key: 'group_cars',
    items: [
      { key: 'my_cars', icon: CarFront, href: '/provider/cars' },
      { key: 'car_bookings', icon: BookOpen, href: '/provider/car-bookings' },
    ],
  },
  {
    key: 'group_packages',
    items: [
      { key: 'my_packages', icon: PackageIcon, href: '/provider/packages' },
      { key: 'package_bookings', icon: BookOpen, href: '/provider/package-bookings' },
    ],
  },
  {
    key: 'group_finance',
    items: [{ key: 'revenue', icon: DollarSign, href: '/provider/revenue' }],
  },
  {
    key: 'group_system',
    items: [{ key: 'profile', icon: User, href: '/provider/profile' }],
  },
]

function CollapsibleGroup({
  group,
  isActive,
  locale,
  t,
  onNavigate,
}: {
  group: NavGroup
  isActive: (href: string) => boolean
  locale: string
  t: (key: string) => string
  onNavigate: () => void
}) {
  const hasActiveItem = group.items.some((item) => isActive(item.href))
  const [open, setOpen] = useState(hasActiveItem)

  useEffect(() => {
    if (hasActiveItem && !open) setOpen(true)
  }, [hasActiveItem, open])

  if (group.items.length === 1) {
    const item = group.items[0]
    const active = isActive(item.href)

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
          <item.icon className={cn('h-5 w-5 shrink-0', active ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-900')} />
          <span className="flex-1">{t(item.key)}</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
      >
        <span className="flex-1 text-start">{t(group.key)}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <div className={cn('overflow-hidden transition-all duration-300 ease-in-out', open ? 'max-h-96' : 'max-h-0')}>
        <div className="space-y-0.5 pb-1">
          {group.items.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                onClick={onNavigate}
                className={cn(
                  'group ms-2 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                  active
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon className={cn('h-4.5 w-4.5 shrink-0', active ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-900')} />
                <span className="flex-1">{t(item.key)}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function ProviderSidebar() {
  const t = useTranslations('provider')
  const locale = useLocale()
  const pathname = usePathname()
  const { signOut, user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`
    return pathname === fullPath || pathname.startsWith(fullPath + '/')
  }

  const closeMobile = () => setMobileOpen(false)

  const handleSignOut = async () => {
    closeMobile()
    await signOut()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-100 p-6">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">{t('dashboard')}</h2>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-amber-600">Provider Panel</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <CollapsibleGroup
            key={group.key}
            group={group}
            isActive={isActive}
            locale={locale}
            t={t}
            onNavigate={closeMobile}
          />
        ))}
      </div>

      <div className="space-y-2 border-t border-slate-100 p-3">
        {user && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-sm font-bold text-slate-600">
              {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
            </span>
            <NotificationBell userId={user.id} />
          </div>
        )}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <Link
            href={`/${locale}`}
            onClick={closeMobile}
            className="flex min-w-0 flex-1 items-center gap-3 text-sm font-bold text-slate-600 transition-colors hover:text-slate-900"
          >
            <ExternalLink className="h-4.5 w-4.5 shrink-0 text-slate-400" />
            <span className="truncate">{locale === 'ar' ? 'الموقع الرئيسي' : 'Main website'}</span>
          </Link>
          <LanguageSwitcher className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900" />
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10"
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
        className="fixed bottom-6 start-6 z-50 rounded-full bg-slate-900 p-4 text-white shadow-2xl transition-transform hover:scale-105 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 z-40 h-[100vh] w-[280px] border-e border-slate-200 bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:sticky lg:shadow-none',
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
