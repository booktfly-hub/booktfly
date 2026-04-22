'use client'

import { useTranslations } from 'next-intl'
import { ShieldCheck, Lock, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PaymentLogosRow } from '@/components/ui/payment-logos'

interface TrustBadgesProps {
  className?: string
  showPayments?: boolean
  tone?: 'light' | 'dark'
}

export function TrustBadges({ className, showPayments = true, tone = 'light' }: TrustBadgesProps) {
  const t = useTranslations('booking_flow')

  const badges = [
    {
      icon: Lock,
      label: t('ssl_protected'),
      color: tone === 'dark' ? 'text-emerald-300' : 'text-green-600',
    },
    {
      icon: ShieldCheck,
      label: t('secure_checkout'),
      color: tone === 'dark' ? 'text-sky-300' : 'text-blue-600',
    },
    {
      icon: RefreshCcw,
      label: t('money_back'),
      color: tone === 'dark' ? 'text-amber-200' : 'text-amber-600',
    },
  ]

  return (
    <div
      className={cn(
        'space-y-3 rounded-lg border p-3',
        tone === 'dark'
          ? 'border-white/10 bg-white/5'
          : 'border-border bg-muted/30',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        {badges.map((badge) => (
          <div key={badge.label} className="flex items-center gap-1.5">
            <badge.icon className={cn('h-4 w-4', badge.color)} />
            <span className={cn('text-xs', tone === 'dark' ? 'text-slate-200' : 'text-muted-foreground')}>
              {badge.label}
            </span>
          </div>
        ))}
      </div>
      {showPayments && (
        <PaymentLogosRow className={cn('justify-center', tone === 'dark' && '[&_*]:brightness-110')} dense />
      )}
    </div>
  )
}
