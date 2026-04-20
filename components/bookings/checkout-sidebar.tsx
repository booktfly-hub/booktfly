'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Shield, Lock, Plane, BedDouble, Car as CarIcon, Package as PackageIcon, Clock } from 'lucide-react'
import { cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { PaymentLogosRow } from '@/components/ui/payment-logos'
import { BnplBadge } from '@/components/ui/bnpl-badge'
import { CountdownTimer } from '@/components/ui/countdown-timer'

export type CheckoutSidebarKind = 'trip' | 'room' | 'car' | 'package'

export interface CheckoutLine {
  label: string
  amount: number
  emphasized?: boolean
  /** negative amount => discount/fee */
  type?: 'default' | 'discount' | 'fee' | 'tax'
}

interface CheckoutSidebarProps {
  kind: CheckoutSidebarKind
  title: string
  subtitle?: string
  /** primary date or range */
  dateLabel?: string
  /** secondary time/duration */
  timeLabel?: string
  lines: CheckoutLine[]
  totalAmount: number
  currency?: string
  holdUntil?: string | null
  /** extra content slot (e.g. selected fare tier summary) */
  children?: React.ReactNode
  /** show refund/cancellation summary */
  cancellationNote?: string
  className?: string
}

/**
 * Persistent sidebar shown on every checkout step.
 * Combines: item summary, date/time, line items, total, trust bar, payment logos, BNPL, countdown.
 */
export function CheckoutSidebar({
  kind,
  title,
  subtitle,
  dateLabel,
  timeLabel,
  lines,
  totalAmount,
  currency = 'SAR',
  holdUntil,
  children,
  cancellationNote,
  className,
}: CheckoutSidebarProps) {
  const t = useTranslations('checkout_sidebar')
  const locale = useLocale()
  const isAr = locale === 'ar'

  const Icon = kind === 'trip' ? Plane : kind === 'room' ? BedDouble : kind === 'car' ? CarIcon : PackageIcon

  const fmt = (n: number) => (isAr ? formatPrice(n, currency) : formatPriceEN(n, currency))

  return (
    <aside
      className={cn(
        'sticky top-24 rounded-2xl border border-border bg-card shadow-sm overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-border">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
          {dateLabel && (
            <p className="text-[11px] text-muted-foreground mt-1">
              <Clock className="inline h-3 w-3 me-1" />
              {dateLabel}
              {timeLabel && ` · ${timeLabel}`}
            </p>
          )}
        </div>
      </div>

      {/* Countdown (cart hold) */}
      {holdUntil && (
        <div className="px-4 pt-3">
          <CountdownTimer targetDate={holdUntil} compact />
        </div>
      )}

      {/* Extra content slot (e.g. fare tier, passengers, luggage) */}
      {children && <div className="px-4 py-3 border-b border-border text-xs">{children}</div>}

      {/* Line items */}
      {lines.length > 0 && (
        <div className="px-4 py-3 space-y-1.5 border-b border-border">
          {lines.map((line, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center justify-between text-xs',
                line.type === 'discount' && 'text-emerald-700',
                line.type === 'fee' && 'text-muted-foreground',
                line.emphasized && 'font-bold',
              )}
            >
              <span>{line.label}</span>
              <span className="tabular-nums">
                {line.type === 'discount' ? '-' : ''}
                {fmt(Math.abs(line.amount))}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{t('total')}</span>
          <span className="text-lg font-black tabular-nums">{fmt(totalAmount)}</span>
        </div>
        <BnplBadge price={totalAmount} currency={currency} variant="full" className="mt-2 w-full justify-center" />
      </div>

      {/* Trust / policy */}
      {cancellationNote && (
        <p className="px-4 py-2 text-[10px] text-muted-foreground border-b border-border">
          {cancellationNote}
        </p>
      )}

      <div className="px-4 py-3 bg-muted/30">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            {t('ssl')}
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {t('secure')}
          </span>
        </div>
        <PaymentLogosRow dense className="justify-center" />
      </div>
    </aside>
  )
}
