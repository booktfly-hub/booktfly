'use client'

import { useTranslations, useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

interface PriceBreakdownProps {
  pricePerSeat: number
  seatsCount: number
  commissionRate?: number
  currency?: string
  showDetailed?: boolean
  className?: string
}

export function PriceBreakdown({
  pricePerSeat,
  seatsCount,
  commissionRate = 0,
  currency = 'SAR',
  showDetailed = true,
  className,
}: PriceBreakdownProps) {
  const t = useTranslations('booking_flow')
  const locale = useLocale()
  const isAr = locale === 'ar'

  const subtotal = pricePerSeat * seatsCount
  // For display purposes, break down the price
  const baseFare = Math.round(subtotal * 0.85)
  const taxesFees = Math.round(subtotal * 0.10)
  const serviceFee = Math.round(subtotal * 0.05)
  const total = baseFare + taxesFees + serviceFee

  const currencyLabel = isAr ? (currency === 'SAR' ? 'ر.س' : '$') : currency

  function formatPrice(amount: number) {
    return `${amount.toLocaleString()} ${currencyLabel}`
  }

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <h4 className="font-semibold text-sm mb-3">{t('price_breakdown')}</h4>

      <div className="space-y-2">
        {showDetailed ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('base_fare')}</span>
              <span>{formatPrice(baseFare)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('taxes_fees')}</span>
              <span>{formatPrice(taxesFees)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('service_fee')}</span>
              <span>{formatPrice(serviceFee)}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>{t('total_price')}</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {formatPrice(pricePerSeat)} x {seatsCount}
              </span>
              <span className="font-semibold text-primary">{formatPrice(subtotal)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
