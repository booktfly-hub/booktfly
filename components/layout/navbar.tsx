'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Building2, Plane, Ticket } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/hooks/use-user'
import { LanguageSwitcher } from './language-switcher'
import { NotificationBell } from './notification-bell'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function Navbar() {
  const t = useTranslations()
  const locale = useLocale()
  const { user, profile, loading } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}`)
    router.refresh()
  }

  const getDashboardLink = () => {
    if (profile?.role === 'admin') return `/${locale}/admin`
    if (profile?.role === 'provider') return `/${locale}/provider/dashboard`
    return null
  }

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
        <div className={cn("flex items-center justify-between transition-all duration-500", scrolled ? "px-4 sm:px-6 py-1" : "px-2 py-1 md:py-2")}>
          {/* Logo - Visually huge but layout-friendly using negative margins */}
          <Link href={`/${locale}`} className="relative group flex items-center transition-transform hover:scale-[1.02] active:scale-[0.98] z-50">
            <Image 
              src="/navbar.png" 
              alt="BooktFly" 
              width={500} 
              height={150} 
              className={cn(
                "w-auto transition-all duration-500 object-contain -my-8 sm:-my-10 lg:-my-12", 
                scrolled ? "h-20 sm:h-24" : "h-28 sm:h-32 lg:h-36"
              )} 
              priority 
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href={`/${locale}/trips`}
              className={cn(
                "px-6 py-2.5 text-sm font-bold transition-all rounded-xl",
                scrolled 
                  ? "text-primary hover:bg-primary/5" 
                  : "text-primary hover:bg-white/50"
              )}
            >
              {t('nav.browse_trips')}
            </Link>
            <Link
              href={`/${locale}/become-provider`}
              className={cn(
                "px-6 py-2.5 text-sm font-bold transition-all rounded-xl",
                scrolled 
                  ? "text-primary hover:bg-primary/5" 
                  : "text-primary hover:bg-white/50"
              )}
            >
              {t('nav.become_provider')}
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center">
               <LanguageSwitcher />
            </div>

            {!loading && (
              <div className="flex items-center gap-2 sm:gap-4">
                {user && profile ? (
                  <>
                    <NotificationBell userId={user.id} />

                    {/* User dropdown */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 p-1.5 pe-4 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-sm font-black shadow-lg shadow-primary/20">
                          {profile.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="hidden lg:inline text-sm font-bold max-w-[120px] truncate text-primary">
                          {profile.full_name || profile.email}
                        </span>
                        <ChevronDown className={cn("h-4 w-4 text-primary/50 transition-transform duration-300", userMenuOpen && "rotate-180")} />
                      </motion.button>

                      <AnimatePresence>
                        {userMenuOpen && (
                          <>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 z-10"
                              onClick={() => setUserMenuOpen(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10, x: locale === 'ar' ? 20 : -20 }}
                              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute end-0 mt-3 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl z-20 overflow-hidden p-2 origin-top-right"
                            >
                              <div className="px-4 py-3 bg-muted/30 rounded-xl mb-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('common.account')}</p>
                                <p className="text-sm font-bold truncate text-foreground">{profile.full_name}</p>
                              </div>
                              
                              <div className="space-y-1">
                                {getDashboardLink() && (
                                  <Link
                                    href={getDashboardLink()!}
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted rounded-xl transition-colors"
                                  >
                                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                    {profile.role === 'admin'
                                      ? t('nav.admin_panel')
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
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${locale}/auth/login`}
                      className="hidden sm:inline-flex text-sm font-bold px-5 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      {t('common.login')}
                    </Link>
                    <Link
                      href={`/${locale}/auth/signup`}
                      className="text-sm font-bold px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      {t('common.signup')}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden rounded-b-[2rem]"
            >
              <div className="p-4 space-y-1">
                <Link
                  href={`/${locale}/trips`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  <Plane className="h-4 w-4 text-muted-foreground" />
                  {t('nav.browse_trips')}
                </Link>
                <Link
                  href={`/${locale}/become-provider`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {t('nav.become_provider')}
                </Link>
                
                {user && profile && (
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
                        {profile.role === 'admin' ? t('nav.admin_panel') : t('nav.provider_dashboard')}
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
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  )
}
