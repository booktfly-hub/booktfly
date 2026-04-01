'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Wallet,
  Star,
  MessageSquare,
  Menu,
  X,
  LogOut,
  ExternalLink,
  Contact,
  Send,
  PlaneTakeoff,
} from 'lucide-react'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { signOutAndRedirect } from '@/lib/auth-client'
import { LanguageSwitcher } from '@/components/layout/language-switcher'

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard, href: '/marketeer/dashboard' },
  { key: 'users', icon: Users, href: '/marketeer/users' },
  { key: 'customers', icon: Contact, href: '/marketeer/customers' },
  { key: 'campaigns', icon: Send, href: '/marketeer/campaigns' },
  { key: 'trip_requests', icon: PlaneTakeoff, href: '/marketeer/trip-requests' },
  { key: 'revenue', icon: BarChart3, href: '/marketeer/revenue' },
  { key: 'wallet', icon: Wallet, href: '/marketeer/wallet' },
  { key: 'reviews', icon: Star, href: '/marketeer/reviews' },
  { key: 'chat', icon: MessageSquare, href: '/marketeer/chat' },
]

const LABELS: Record<string, { ar: string; en: string }> = {
  dashboard: { ar: 'الرئيسية', en: 'Dashboard' },
  users: { ar: 'المستخدمون', en: 'Users' },
  customers: { ar: 'العملاء', en: 'Customers' },
  campaigns: { ar: 'الحملات', en: 'Campaigns' },
  trip_requests: { ar: 'طلبات الرحلات', en: 'Trip Requests' },
  revenue: { ar: 'الإيرادات', en: 'Revenue' },
  wallet: { ar: 'المحفظة', en: 'Wallet' },
  reviews: { ar: 'التقييمات', en: 'Reviews' },
  chat: { ar: 'المحادثات', en: 'Chat' },
}

export function MarkeeteerSidebar() {
  const locale = useLocale() as 'ar' | 'en'
  const pathname = usePathname()
  const supabase = useRef(createClient()).current
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`
    return pathname === fullPath || pathname.startsWith(fullPath + '/')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-100">
        <h2 className="font-black text-2xl text-slate-900 tracking-tight">
          {locale === 'ar' ? 'لوحة المسوّق' : 'Marketeer'}
        </h2>
        <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">
          {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
        </p>
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
              <item.icon className={cn('h-5 w-5', active ? 'text-yellow-300' : 'text-slate-400 group-hover:text-slate-900')} />
              {LABELS[item.key][locale]}
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
          onClick={() => signOutAndRedirect(supabase, locale)}
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
          onClick={() => setMobileOpen(false)}
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
