'use client'

import { useLocale, useTranslations } from 'next-intl'
import { CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BnplBadgeProps {
  price: number
  currency?: string
  installments?: number
  /** compact = icon + short; inline = text only; full = icon + full label */
  variant?: 'compact' | 'inline' | 'full'
  className?: string
}

export function BnplBadge({
  price,
  currency = 'SAR',
  installments = 4,
  variant = 'compact',
  className,
}: BnplBadgeProps) {
  const locale = useLocale()
  const t = useTranslations('bnpl')
  const isAr = locale === 'ar'

  if (!price || price < 100) return null

  const per = Math.round(price / installments)
  const perFormatted = isAr
    ? per.toLocaleString('ar-SA')
    : per.toLocaleString('en-US')
  const curLabel = isAr
    ? currency === 'SAR' ? 'ر.س' : currency
    : currency

  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-semibold text-success',
          className,
        )}
      >
        {t('or_per_month', { amount: `${perFormatted} ${curLabel}`, count: installments })}
      </span>
    )
  }

  if (variant === 'full') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-success/20 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success',
          className,
        )}
      >
        <CreditCard className="h-3 w-3" />
        <span>
          {t('split_into', { count: installments })} · {perFormatted} {curLabel}/{t('month')}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-success/20 bg-success/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-success',
        className,
      )}
    >
      <CreditCard className="h-2.5 w-2.5" />
      {t('installments_badge', { count: installments })}
    </div>
  )
}
