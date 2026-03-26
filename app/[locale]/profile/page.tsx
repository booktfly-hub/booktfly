'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, Calendar, Lock, Check, LayoutDashboard, BadgeCheck, ShieldCheck } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function ProfilePage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const { user, profile, loading } = useUser()
  const isAr = locale === 'ar'

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!profile || initialized) return

    setFullName(profile.full_name || '')
    setPhone(profile.phone || '')
    setInitialized(true)
  }, [initialized, profile])

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.replace(`/${locale}/auth/login`)
    }
  }, [loading, user, profile, router, locale])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8 sm:pt-32 lg:pt-36">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded-lg w-48" />
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="h-20 w-20 rounded-full bg-muted mx-auto" />
            <div className="h-4 bg-muted rounded w-32 mx-auto" />
            <div className="space-y-3">
              <div className="h-10 bg-muted rounded-xl" />
              <div className="h-10 bg-muted rounded-xl" />
              <div className="h-10 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || t('errors.generic'))
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError(t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8 sm:pt-32 lg:pt-36">
      <h1 className="text-2xl font-bold text-foreground mb-8">
        {t('profile.title')}
      </h1>

      {/* Avatar & Info Header */}
      <div className="rounded-2xl border bg-card p-6 mb-6">
        <div className="flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-primary/20 mb-3">
            {profile.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <h2 className="text-lg font-bold text-foreground">
            {profile.full_name || profile.email}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            {profile.role === 'provider' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">
                <BadgeCheck className="h-3.5 w-3.5" />
                {t('profile.service_provider')}
              </span>
            )}
            {profile.role === 'admin' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('profile.role_admin')}
              </span>
            )}
            {profile.role === 'buyer' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                <User className="h-3.5 w-3.5" />
                {t('profile.role_buyer')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
            <Calendar className="h-3.5 w-3.5" />
            {t('profile.member_since')} {memberSince}
          </div>
        </div>
      </div>

      {/* Provider Dashboard Banner */}
      {profile.role === 'provider' && (
        <Link
          href={`/${locale}/provider/dashboard`}
          className="flex items-center justify-between rounded-2xl border border-accent/20 bg-accent/5 p-5 mb-6 group hover:border-accent/40 hover:bg-accent/10 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{t('nav.provider_dashboard')}</p>
              <p className="text-xs text-muted-foreground">{t('profile.go_to_dashboard')}</p>
            </div>
          </div>
          <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className={cn("h-4 w-4", isAr && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      )}

      {/* Edit Form */}
      <div className="rounded-2xl border bg-card p-6">
        <h3 className="text-base font-bold text-foreground mb-5">
          {t('profile.personal_info')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              {t('profile.full_name')}
            </label>
            <div className="relative">
              <User className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isAr ? "right-3" : "left-3")} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={cn(
                  "w-full rounded-xl border bg-background px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                )}
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              {t('profile.email')}
            </label>
            <div className="relative">
              <Mail className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isAr ? "right-3" : "left-3")} />
              <input
                type="email"
                value={profile.email}
                disabled
                className={cn(
                  "w-full rounded-xl border bg-muted/50 px-10 py-2.5 text-sm text-muted-foreground cursor-not-allowed",
                )}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              {t('profile.phone')}
            </label>
            <div className="relative">
              <Phone className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isAr ? "right-3" : "left-3")} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={cn(
                  "w-full rounded-xl border bg-background px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                )}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-xl">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2">
              <Check className="h-4 w-4" />
              {t('profile.profile_updated')}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {saving ? t('common.loading') : t('profile.update_profile')}
            </button>

            <Link
              href={`/${locale}/auth/reset-password`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
            >
              <Lock className="h-4 w-4" />
              {t('profile.change_password')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
