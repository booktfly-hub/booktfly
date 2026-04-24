'use client'

import { pick } from '@/lib/i18n-helpers'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect, useId } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Plane, Ticket, BedDouble, CarFront, PlaneTakeoff, Flame, PackageIcon, Heart } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { LanguageSwitcher } from './language-switcher'
import { CurrencySwitcher } from '@/components/shared/currency-switcher'
import { NotificationBell } from './notification-bell'
import { cn } from '@/lib/utils'

export function Navbar() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const pathname = usePathname()
  const { user, profile, loading, signOut } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const mobileMenuId = useId()
  const userMenuId = useId()
  const heroOverlayRoutes = new Set([
    `/${locale}`,
    `/${locale}/trips`,
    `/${locale}/rooms`,
    `/${locale}/cars`,
    `/${locale}/packages`,
    `/${locale}/last-minute`,
  ])
  const useHeroOverlay = heroOverlayRoutes.has(pathname) && !scrolled

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen && !userMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        setUserMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, userMenuOpen])

  const handleSignOut = async () => {
    setUserMenuOpen(false)
    await signOut()
  }

  const getDashboardLink = () => {
    if (profile?.role === 'admin') return `/${locale}/admin`
    if (profile?.role === 'provider') return `/${locale}/provider/dashboard`
    if (profile?.role === 'marketeer') return `/${locale}/marketeer/dashboard`
    return null
  }

  const navItems = [
    { href: `/${locale}/trips`, label: t('nav.flights'), icon: Plane },
    { href: `/${locale}/rooms`, label: t('nav.hotels'), icon: BedDouble },
    { href: `/${locale}/cars`, label: t('nav.cars'), icon: CarFront },
    { href: `/${locale}/packages`, label: t('nav.packages'), icon: PackageIcon },
    { href: `/${locale}/last-minute`, label: t('nav.last_minute'), icon: Flame, highlight: true },
    { href: `/${locale}/trip-requests`, label: t('nav.trip_requests'), icon: PlaneTakeoff },
  ]

  const isNavItemActive = (href: string) =>
    href !== '#' && (pathname === href || pathname.startsWith(`${href}/`))

  const desktopCompact = scrolled || useHeroOverlay

  return (
    <div
      className={cn(
        'z-50 flex justify-center px-4 pt-2 transition-all duration-300 sm:px-6 md:pt-3',
        useHeroOverlay
          ? 'fixed left-0 right-0 top-0 pointer-events-none'
          : 'sticky top-0'
      )}
    >
      <nav
        className={cn(
          'pointer-events-auto flex w-full flex-col border transition-all duration-300',
          useHeroOverlay
            ? 'max-w-7xl rounded-2xl border-white/15 bg-slate-950/30 shadow-[0_12px_40px_rgba(15,23,42,0.22)] backdrop-blur-xl'
            : 'max-w-7xl rounded-2xl border-border/80 bg-surface/95 shadow-lg shadow-slate-200/60 backdrop-blur-xl'
        )}
      >
        <div className={cn('flex items-center justify-between gap-3 px-3 py-1.5 transition-all duration-500 sm:gap-4 sm:px-4 md:px-6 xl:gap-5 xl:px-6 xl:py-2')}>
          {/* Logo */}
          <Link href={`/${locale}`} className="relative z-5 flex shrink-0">
            <div className={cn('relative flex h-14 w-40 items-center justify-center overflow-hidden rounded-lg transition-all duration-500 md:h-16 md:w-48 xl:w-44 2xl:w-48', desktopCompact && 'md:w-44')}>
              <Image 
                src="/navbar.png"   
                width={224} height={72}
                alt="BooktFly" 
                className="object-contain drop-shadow-[0_1px_6px_rgba(255,255,255,0.75)]" 
                priority 
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className={cn('hidden xl:flex flex-1 min-w-0 items-center justify-center overflow-x-auto scrollbar-hide transition-all duration-300', desktopCompact ? 'gap-1' : 'gap-2')}>
            {navItems.map(({ href, label, icon: Icon, highlight }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                title={label}
                className={cn(
                  'inline-flex items-center justify-center rounded-lg border border-transparent text-sm font-bold transition-colors',
                  desktopCompact ? 'gap-0 min-w-10 px-2.5 py-2' : 'gap-2 px-4 py-2',
                  isNavItemActive(href)
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : highlight
                          ? 'text-warning hover:bg-warning/10'
                          : useHeroOverlay
                            ? 'text-white drop-shadow-sm hover:bg-white/15'
                            : 'text-foreground hover:border-border hover:bg-muted'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    isNavItemActive(href)
                      ? 'text-white'
                        : highlight
                          ? 'text-warning'
                          : useHeroOverlay
                            ? 'text-white drop-shadow-sm'
                            : 'text-primary'
                      )}
                />
                <span
                  className={cn(
                    'hidden overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 md:inline-block',
                    desktopCompact ? 'ms-0 max-w-0 opacity-0' : 'max-w-32 opacity-100'
                  )}
                  aria-hidden={desktopCompact}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex flex-nowrap items-center gap-1.5 sm:gap-4 min-w-0 shrink-0">
            <div className="hidden xl:flex items-center gap-1">
               <LanguageSwitcher compact={desktopCompact} className={cn(useHeroOverlay ? 'text-white drop-shadow-sm hover:bg-white/15' : 'text-muted-foreground hover:bg-muted hover:text-foreground')} />
               <CurrencySwitcher className={cn(desktopCompact ? 'px-2 py-1 text-xs' : 'px-2 py-1 text-xs', useHeroOverlay ? 'text-white drop-shadow-sm hover:bg-white/15' : 'text-foreground hover:bg-muted')} />
            </div>

            {loading ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:block h-10 w-10 rounded-lg bg-slate-200/80 animate-pulse" />
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-1.5 pe-4 shadow-sm">
                  <div className="h-9 w-9 rounded-xl bg-slate-200 animate-pulse" />
                  <div className="hidden lg:block h-4 w-24 rounded bg-slate-200 animate-pulse" />
                  <div className="h-4 w-4 rounded bg-slate-200 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="flex flex-nowrap items-center gap-1.5 sm:gap-4 min-w-0 shrink-0">
                {user ? (
                  <>
                    <NotificationBell
                      userId={user.id}
                      className={cn(useHeroOverlay && 'hover:bg-white/10')}
                      iconClassName={cn(useHeroOverlay ? 'text-white drop-shadow-sm' : 'text-foreground')}
                    />

                    {/* User dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className={cn(
                          'flex items-center rounded-lg border p-1.5 shadow-sm transition-all hover:shadow-md',
                          useHeroOverlay ? 'border-white/10 bg-white/10 hover:bg-white/20' : 'border-border bg-surface',
                          desktopCompact ? 'gap-1 pe-1.5' : 'gap-2 pe-4'
                        )}
                        aria-expanded={userMenuOpen}
                        aria-controls={userMenuId}
                        aria-label={profile?.full_name || user.email || t('common.account')}
                      >
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black shadow-sm transition-colors",
                          useHeroOverlay ? 'bg-white text-primary' : 'bg-primary text-primary-foreground'
                        )}>
                          {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                          <span
                          className={cn(
                            'hidden overflow-hidden whitespace-nowrap text-sm font-bold transition-[max-width,opacity,margin] duration-300 xl:inline-block',
                            useHeroOverlay ? 'text-white drop-shadow-sm' : 'text-primary',
                            desktopCompact ? 'ms-0 max-w-0 opacity-0' : 'max-w-[140px] opacity-100'
                          )}
                          aria-hidden={desktopCompact}
                        >
                          {profile?.full_name || user.email}
                        </span>
                        <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', useHeroOverlay ? 'text-white' : 'text-primary', userMenuOpen && 'rotate-180')} />
                      </button>

                      {userMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setUserMenuOpen(false)}
                          />
                          <div
                            id={userMenuId}
                            className="absolute end-0 z-20 mt-3 w-64 origin-top-right overflow-hidden rounded-lg border border-border bg-surface p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150"
                            aria-label={t('common.account')}
                          >
                              <div className="mb-2 rounded-lg bg-muted px-4 py-3">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('common.account')}</p>
                                <p className="text-sm font-bold truncate text-foreground">{profile?.full_name || user.email}</p>
                              </div>
                              
                              <div className="space-y-1">
                                {getDashboardLink() && (
                                  <Link
                                    href={getDashboardLink()!}
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                                  >
                                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                    {profile?.role === 'admin'
                                      ? t('nav.admin_panel')
                                      : profile?.role === 'marketeer'
                                        ? t('profile.go_to_marketeer_dashboard')
                                        : t('nav.provider_dashboard')}
                                  </Link>
                                )}
                                <Link
                                  href={`/${locale}/profile`}
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  {t('nav.profile')}
                                </Link>
                                <Link
                                  href={`/${locale}/my-bookings`}
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                  <Ticket className="h-4 w-4 text-muted-foreground" />
                                  {t('nav.my_bookings')}
                                </Link>
                                <Link
                                  href={`/${locale}/saved`}
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                  <Heart className="h-4 w-4 text-muted-foreground" />
                                  {t('nav.saved')}
                                </Link>
                              </div>
                              <div className="h-px bg-border/50 my-2" />
                              <button
                                type="button"
                                onClick={handleSignOut}
                                className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                              >
                                <LogOut className="h-4 w-4" />
                                {t('common.logout')}
                              </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-nowrap items-center gap-1 sm:gap-2 min-w-0 shrink-0">
                    <Link
                      href={`/${locale}/auth/login`}
                      className={cn(
                        'inline-flex shrink-0 rounded-xl transition-colors whitespace-nowrap',
                        useHeroOverlay ? 'text-white drop-shadow-sm hover:bg-white/20' : 'text-slate-700 hover:bg-slate-100',
                        desktopCompact
                          ? pick(locale, 'text-[10px] font-bold px-2 py-2', 'text-xs font-bold px-2.5 py-2', 'text-xs font-bold px-2.5 py-2')
                          : pick(locale, 'text-[10px] sm:text-sm font-bold px-2 sm:px-5 py-2 sm:py-2.5', 'text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 sm:py-2.5', 'text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 sm:py-2.5')
                      )}
                    >
                      {t('common.login')}
                    </Link>
                    <Link
                      href={`/${locale}/auth/signup`}
                      className={cn(
                        'shrink-0 rounded-lg shadow-sm transition-colors whitespace-nowrap',
                        useHeroOverlay ? 'bg-white text-primary hover:bg-white/90' : 'bg-primary text-primary-foreground hover:bg-primary/90',
                        desktopCompact
                          ? pick(locale, 'text-[10px] font-bold px-2 py-2', 'text-xs font-bold px-2.5 py-2', 'text-xs font-bold px-2.5 py-2')
                          : pick(locale, 'text-[10px] sm:text-sm font-bold px-2 sm:px-5 py-2 sm:py-2.5', 'text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 sm:py-2.5', 'text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 sm:py-2.5')
                      )}
                    >
                      {t('common.signup')}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              className={cn('xl:hidden shrink-0 self-center rounded-lg p-2 transition-colors', useHeroOverlay ? 'hover:bg-white/10' : 'hover:bg-muted')}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
            >
              {mobileOpen ? (
                <X className={cn('h-5 w-5', useHeroOverlay ? 'text-white drop-shadow-sm' : 'text-foreground')} />
              ) : (
                <Menu className={cn('h-5 w-5', useHeroOverlay ? 'text-white drop-shadow-sm' : 'text-foreground')} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            id={mobileMenuId}
            className="overflow-hidden rounded-b-lg border-t border-border bg-surface/95 backdrop-blur-xl xl:hidden"
          >
              <div className="p-4 space-y-1">
                {navItems.map(({ href, label, icon: Icon, highlight }) => {
                  const isActive = isNavItemActive(href)
                  return (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-bold transition-colors',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : highlight
                          ? 'border-orange-200 bg-orange-50 text-orange-700'
                          : 'border-border bg-muted text-foreground hover:bg-surface'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-primary-foreground' : highlight ? 'text-orange-600' : 'text-primary')} />
                    {label}
                  </Link>
                  )
                })}
                {user && (
                  <>
                    <div className="h-px bg-border/50 my-2" />
                    <Link
                      href={`/${locale}/profile`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      {t('nav.profile')}
                    </Link>
                    <Link
                      href={`/${locale}/my-bookings`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      {t('nav.my_bookings')}
                    </Link>
                    <Link
                      href={`/${locale}/saved`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      {t('nav.saved')}
                    </Link>
                    {getDashboardLink() && (
                      <Link
                        href={getDashboardLink()!}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        {profile?.role === 'admin'
                          ? t('nav.admin_panel')
                          : profile?.role === 'marketeer'
                            ? t('profile.go_to_marketeer_dashboard')
                            : t('nav.provider_dashboard')}
                      </Link>
                    )}
                  </>
                )}

                <div className="h-px bg-border/50 my-2" />

                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-medium text-muted-foreground">{locale === 'ar' ? 'اللغة' : 'Language'}</span>
                  <LanguageSwitcher />
                </div>

                {user && (
                  <>
                    <div className="h-px bg-border/50 my-2" />
                    <button
                      type="button"
                      onClick={() => { handleSignOut(); setMobileOpen(false) }}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('common.logout')}
                    </button>
                  </>
                )}
              </div>
          </div>
        )}
      </nav>
    </div>
  )
}
