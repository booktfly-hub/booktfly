'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Plane, Ticket, BedDouble, CarFront, PlaneTakeoff, Flame, PackageIcon } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { LanguageSwitcher } from './language-switcher'
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-2 md:mt-4 px-4 sm:px-6 pointer-events-none transition-all duration-500">
      <nav 
        className={cn(
          "pointer-events-auto w-full transition-all duration-500 flex flex-col",
          scrolled 
            ? "max-w-5xl rounded-full bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl shadow-slate-200/50" 
            : "max-w-7xl rounded-none bg-transparent"
        )}
      >
        <div className={cn("flex items-center justify-between transition-all duration-500 px-4 sm:px-6 py-1 gap-4")}>
          {/* Logo */}
          <Link href={`/${locale}`} className="relative flex z-5">
            <div className={cn("relative transition-all duration-500 flex items-center justify-center w-30 h-12 overflow-hidden rounded-lg")}>
              <Image 
                src="/navbar.png"   
                width={120} height={48}
                alt="BooktFly" 
                className="object-cover" 
                priority 
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map(({ href, label, icon: Icon, highlight }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 border-none px-4 py-2 text-sm font-bold transition-all rounded-xl",
                  isNavItemActive(href)
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-md shadow-[color:var(--color-primary)]/20 hover:brightness-95"
                    : highlight
                      ? "text-amber-600 hover:bg-amber-50"
                      : scrolled
                        ? "hover:border-primary/20 hover:bg-white"
                        : "text-primary hover:bg-white/80"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isNavItemActive(href)
                      ? "text-white"
                      : highlight
                        ? "text-amber-600"
                        : "text-primary/70"
                  )}
                />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex flex-nowrap items-center gap-1.5 sm:gap-6 min-w-0 shrink-0">
            <div className="hidden sm:flex items-center">
               <LanguageSwitcher />
            </div>

            {loading ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:block h-10 w-10 rounded-lg bg-slate-200/80 animate-pulse" />
                <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 p-1.5 pe-4 shadow-sm">
                  <div className="h-9 w-9 rounded-xl bg-slate-200 animate-pulse" />
                  <div className="hidden lg:block h-4 w-24 rounded bg-slate-200 animate-pulse" />
                  <div className="h-4 w-4 rounded bg-slate-200 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="flex flex-nowrap items-center gap-1.5 sm:gap-4 min-w-0 shrink-0">
                {user ? (
                  <>
                    <NotificationBell userId={user.id} />

                    {/* User dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 p-1.5 pe-4 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-sm font-black shadow-lg shadow-primary/20">
                          {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="hidden lg:inline text-sm font-bold max-w-[120px] truncate text-primary">
                          {profile?.full_name || user.email}
                        </span>
                        <ChevronDown className={cn("h-4 w-4 text-primary/50 transition-transform duration-300", userMenuOpen && "rotate-180")} />
                      </button>

                      {userMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setUserMenuOpen(false)}
                          />
                          <div className="absolute end-0 mt-3 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl z-20 overflow-hidden p-2 origin-top-right animate-in fade-in zoom-in-95 duration-150"
                          >
                              <div className="px-4 py-3 bg-muted/30 rounded-xl mb-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('common.account')}</p>
                                <p className="text-sm font-bold truncate text-foreground">{profile?.full_name || user.email}</p>
                              </div>
                              
                              <div className="space-y-1">
                                {getDashboardLink() && (
                                  <Link
                                    href={getDashboardLink()!}
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted rounded-xl transition-colors"
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
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted rounded-xl transition-colors"
                                >
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  {t('nav.profile')}
                                </Link>
                                <Link
                                  href={`/${locale}/my-bookings`}
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted rounded-xl transition-colors"
                                >
                                  <Ticket className="h-4 w-4 text-muted-foreground" />
                                  {t('nav.my_bookings')}
                                </Link>
                              </div>
                              <div className="h-px bg-border/50 my-2" />
                              <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
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
                        "z-10inline-flex shrink-0 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap",
                        isAr ? "text-[10px] sm:text-sm font-bold px-2 sm:px-5 py-2 sm:py-2.5" : "text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 sm:py-2.5"
                      )}
                    >
                      {t('common.login')}
                    </Link>
                    <Link
                      href={`/${locale}/auth/signup`}
                      className={cn(
                        "z-100 shrink-0 rounded-lg bg-[var(--color-primary)] text-white transition-all shadow-md shadow-[color:var(--color-primary)]/20 hover:brightness-95 hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap",
                        isAr ? "text-[10px] sm:text-sm font-bold px-2 sm:px-5 py-2 sm:py-2.5" : "text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 sm:py-2.5"
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
              className="md:hidden shrink-0 self-center p-2 rounded-xl hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden rounded-b-[2rem] transition-[max-height,opacity] duration-300 ease-in-out",
            mobileOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          )}
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
                      'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition-colors',
                      isActive
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm shadow-[color:var(--color-primary)]/20'
                        : highlight
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-slate-200 bg-slate-50 text-foreground hover:bg-white'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-white' : highlight ? 'text-amber-600' : 'text-primary/70')} />
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
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      {t('nav.profile')}
                    </Link>
                    <Link
                      href={`/${locale}/my-bookings`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                    >
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      {t('nav.my_bookings')}
                    </Link>
                    {getDashboardLink() && (
                      <Link
                        href={getDashboardLink()!}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
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
                      onClick={() => { handleSignOut(); setMobileOpen(false) }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('common.logout')}
                    </button>
                  </>
                )}
              </div>
        </div>
      </nav>
    </div>
  )
}
