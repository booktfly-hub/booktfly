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
} from 'lucide-react'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { signOutAndRedirect } from '@/lib/auth-client'
import { LanguageSwitcher } from '@/components/layout/language-switcher'

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard, href: '/provider/dashboard' },
  { key: 'my_trips', icon: Plane, href: '/provider/trips' },
  { key: 'my_rooms', icon: BedDouble, href: '/provider/rooms' },
  { key: 'bookings', icon: BookOpen, href: '/provider/bookings' },
  { key: 'room_bookings', icon: BookOpen, href: '/provider/room-bookings' },
  { key: 'my_cars', icon: CarFront, href: '/provider/cars' },
  { key: 'car_bookings', icon: BookOpen, href: '/provider/car-bookings' },
  { key: 'trip_requests', icon: PlaneTakeoff, href: '/provider/trip-requests' },
  { key: 'revenue', icon: DollarSign, href: '/provider/revenue' },
  { key: 'profile', icon: User, href: '/provider/profile' },
]

export function ProviderSidebar() {
  const t = useTranslations('provider')
  const locale = useLocale()
  const pathname = usePathname()
  const supabase = useRef(createClient()).current
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`
    return pathname === fullPath || pathname.startsWith(fullPath + '/')
  }

  const handleSignOut = async () => {
    await signOutAndRedirect(supabase, locale)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-100">
        <h2 className="font-black text-2xl text-slate-900 tracking-tight">{t('dashboard')}</h2>
        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1">Provider Panel</p>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.key}
              href={`/${locale}${item.href}`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'group flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all',
                active
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className={cn("h-5 w-5", active ? "text-amber-300" : "text-slate-400 group-hover:text-slate-900")} />
              {t(item.key)}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-slate-100 space-y-3">
        <Link
          href={`/${locale}`}
          onClick={() => setMobileOpen(false)}
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
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed bottom-6 start-6 z-50 p-4 rounded-full bg-slate-900 text-white shadow-2xl hover:scale-105 transition-transform"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
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
