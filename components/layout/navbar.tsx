'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import Image from 'next/image'
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { LanguageSwitcher } from './language-switcher'
import { NotificationBell } from './notification-bell'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const t = useTranslations()
  const locale = useLocale()
  const { user, profile, loading } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            <Image src="/navbar.png" alt="BooktFly" width={200} height={64} className="h-16 w-auto" priority />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href={`/${locale}/trips`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.browse_trips')}
            </Link>
            <Link
              href={`/${locale}/become-provider`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('nav.become_provider')}
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {!loading && (
              <>
                {user && profile ? (
                  <div className="flex items-center gap-2">
                    <NotificationBell userId={user.id} />

                    {/* User dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-secondary/80 transition-colors"
                      >
                        <div className="h-6 w-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
                          {profile.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="hidden sm:inline max-w-24 truncate">
                          {profile.full_name || profile.email}
                        </span>
                        <ChevronDown className="h-3 w-3" />
                      </button>

                      {userMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setUserMenuOpen(false)}
                          />
                          <div className="absolute end-0 mt-2 w-48 rounded-lg bg-white border shadow-lg z-20">
                            {getDashboardLink() && (
                              <Link
                                href={getDashboardLink()!}
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                              >
                                <LayoutDashboard className="h-4 w-4" />
                                {profile.role === 'admin'
                                  ? t('nav.admin_panel')
                                  : t('nav.provider_dashboard')}
                              </Link>
                            )}
                            <Link
                              href={`/${locale}/my-bookings`}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                            >
                              <User className="h-4 w-4" />
                              {t('nav.my_bookings')}
                            </Link>
                            <button
                              onClick={handleSignOut}
                              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors"
                            >
                              <LogOut className="h-4 w-4" />
                              {t('common.logout')}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${locale}/auth/login`}
                      className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      {t('common.login')}
                    </Link>
                    <Link
                      href={`/${locale}/auth/signup`}
                      className="text-sm font-medium px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                    >
                      {t('common.signup')}
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t pt-4 space-y-2">
            <Link
              href={`/${locale}/trips`}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
            >
              {t('nav.browse_trips')}
            </Link>
            <Link
              href={`/${locale}/become-provider`}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
            >
              {t('nav.become_provider')}
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
