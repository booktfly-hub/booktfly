'use client'

import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Home, Search, Heart, BookOpen, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('mobile_nav')

  // Don't show on admin/provider/marketeer pages or pages with their own sticky bottom bar
  if (
    pathname.includes('/admin') ||
    pathname.includes('/provider') ||
    pathname.includes('/marketeer') ||
    pathname.match(/\/trips\/[^/]+/) ||
    pathname.match(/\/rooms\/[^/]+/) ||
    pathname.match(/\/cars\/[^/]+/) ||
    pathname.match(/\/packages\/[^/]+/)
  ) {
    return null
  }

  const items = [
    { href: `/${locale}`, icon: Home, label: t('home'), match: (p: string) => p === `/${locale}` },
    { href: `/${locale}/trips`, icon: Search, label: t('search'), match: (p: string) => p.includes('/trips') },
    { href: `/${locale}/saved`, icon: Heart, label: t('saved'), match: (p: string) => p.includes('/saved') },
    { href: `/${locale}/my-bookings`, icon: BookOpen, label: t('bookings'), match: (p: string) => p.includes('/my-bookings') },
    { href: `/${locale}/profile`, icon: User, label: t('profile'), match: (p: string) => p.includes('/profile') },
  ]

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm md:hidden safe-area-pb"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = item.match(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
