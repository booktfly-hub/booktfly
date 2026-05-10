'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Bell, BellRing, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/i18n-helpers'
import { useUser } from '@/hooks/use-user'

interface TrackRouteButtonProps {
  originCode: string
  destinationCode: string
  cabinClass?: string
  /** Optional reference price; saved as the alert's target_price. */
  targetPrice?: number
  className?: string
}

export function TrackRouteButton({
  originCode,
  destinationCode,
  cabinClass,
  targetPrice,
  className,
}: TrackRouteButtonProps) {
  const t = useTranslations('price_alerts')
  const locale = useLocale()
  const { user, loading: userLoading } = useUser()

  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState<'created' | 'exists' | null>(null)

  // On mount + when route changes, check whether an alert already exists.
  useEffect(() => {
    let cancelled = false
    if (!user || !originCode || !destinationCode) {
      setActive(false)
      return
    }
    setLoading(true)
    fetch('/api/price-alerts')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: { alerts?: { origin_code: string; destination_code: string; is_active: boolean }[] }) => {
        if (cancelled) return
        const exists = (data.alerts || []).some(
          (a) =>
            a.is_active &&
            a.origin_code?.toUpperCase() === originCode.toUpperCase() &&
            a.destination_code?.toUpperCase() === destinationCode.toUpperCase(),
        )
        setActive(exists)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [user, originCode, destinationCode])

  const canShow = !!originCode && !!destinationCode

  if (!canShow) return null

  // Logged-out users get a CTA pointing to login that returns here.
  if (!user && !userLoading) {
    const next = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
    return (
      <Link
        href={`/${locale}/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}
        className={cn(
          'inline-flex items-center gap-1.5 h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs md:text-sm font-bold transition-colors',
          className,
        )}
      >
        <Bell className="h-4 w-4" />
        <span className="hidden md:inline">{t('set_alert')}</span>
      </Link>
    )
  }

  const handleClick = async () => {
    if (loading || active) return
    setLoading(true)
    try {
      const res = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_code: originCode,
          destination_code: destinationCode,
          target_price: targetPrice,
          cabin_class: cabinClass || 'economy',
        }),
      })
      if (res.ok) {
        setActive(true)
        setHint('created')
        setTimeout(() => setHint(null), 2000)
      } else if (res.status === 409) {
        setActive(true)
        setHint('exists')
        setTimeout(() => setHint(null), 2000)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const label = active
    ? pick(locale, 'يتم تتبعه', 'Tracked', 'Takip ediliyor')
    : pick(locale, 'تتبع المسار', 'Track route', 'Rotayı takip et')

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || active}
      title={
        hint === 'created'
          ? t('alert_set')
          : active
            ? t('active')
            : t('set_alert')
      }
      className={cn(
        'inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs md:text-sm font-bold transition-colors',
        active
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-slate-50 hover:bg-slate-100 text-slate-700',
        className,
      )}
    >
      {active ? (
        <Check className="h-4 w-4" />
      ) : hint === 'created' ? (
        <BellRing className="h-4 w-4 text-amber-500" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      <span className="hidden md:inline">{label}</span>
    </button>
  )
}
