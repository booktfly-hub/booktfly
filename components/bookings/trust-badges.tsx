'use client'

import { useTranslations } from 'next-intl'
import { ShieldCheck, Lock, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PaymentLogosRow } from '@/components/ui/payment-logos'

interface TrustBadgesProps {
  className?: string
  showPayments?: boolean
}

export function TrustBadges({ className, showPayments = true }: TrustBadgesProps) {
  const t = useTranslations('booking_flow')

  const badges = [
    { icon: Lock, label: t('ssl_protected'), color: 'text-green-600' },
    { icon: ShieldCheck, label: t('secure_checkout'), color: 'text-blue-600' },
    { icon: RefreshCcw, label: t('money_back'), color: 'text-amber-600' },
  ]

  return (
    <div className={cn('rounded-lg border border-border bg-muted/30 p-3 space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {badges.map((badge) => (
          <div key={badge.label} className="flex items-center gap-1.5">
            <badge.icon className={cn('h-4 w-4', badge.color)} />
            <span className="text-xs text-muted-foreground">{badge.label}</span>
          </div>
        ))}
      </div>
      {showPayments && (
        <PaymentLogosRow className="justify-center" dense />
      )}
    </div>
  )
}
