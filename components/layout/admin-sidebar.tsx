'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  FileText,
  Building2,
  Plane,
  BookOpen,
  DollarSign,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard, href: '/admin' },
  { key: 'applications', icon: FileText, href: '/admin/applications' },
  { key: 'providers', icon: Building2, href: '/admin/providers' },
  { key: 'trips', icon: Plane, href: '/admin/trips' },
  { key: 'bookings', icon: BookOpen, href: '/admin/bookings' },
  { key: 'revenue', icon: DollarSign, href: '/admin/revenue' },
  { key: 'settings', icon: Settings, href: '/admin/settings' },
]

export function AdminSidebar() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`
    if (href === '/admin') return pathname === fullPath
    return pathname === fullPath || pathname.startsWith(fullPath + '/')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg text-primary">{t('dashboard')}</h2>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={`/${locale}${item.href}`}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <item.icon className="h-5 w-5" />
            {t(item.key)}
          </Link>
        ))}
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed bottom-4 start-4 z-50 p-3 rounded-full bg-accent text-accent-foreground shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-e transition-transform duration-300',
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
