'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Gem } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoyaltyBadgeProps {
  estimatedEarn?: number
  className?: string
}

/** Small inline "you'll earn X pts" badge. Loads live wallet state on mount. */
export function LoyaltyBadge({ estimatedEarn, className }: LoyaltyBadgeProps) {
  const t = useTranslations('loyalty')
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/loyalty', { credentials: 'same-origin' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setBalance(data.wallet?.balance_points ?? 0)
      } catch { /* silent */ }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-200 px-2 py-1 text-[11px] font-semibold text-violet-700', className)}>
      <Gem className="h-3 w-3" />
      {estimatedEarn
        ? t('earn_on_booking', { points: estimatedEarn })
        : balance != null
          ? `${balance} ${t('label')}`
          : t('label')}
    </div>
  )
}
