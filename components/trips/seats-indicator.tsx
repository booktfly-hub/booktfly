'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type SeatsIndicatorProps = {
  totalSeats: number
  bookedSeats: number
  className?: string
  compact?: boolean
}

export function SeatsIndicator({
  totalSeats,
  bookedSeats,
  className,
  compact = false,
}: SeatsIndicatorProps) {
  const t = useTranslations('trips')
  const remaining = totalSeats - bookedSeats
  const percentage = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0

  const barColor =
    percentage >= 90
      ? 'bg-destructive'
      : percentage >= 70
        ? 'bg-warning'
        : 'bg-success'

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        <span className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
          {remaining} {t('seats_remaining')}
        </span>
        {!compact && (
          <span className="text-xs text-muted-foreground">
            {bookedSeats} {t('seats_of')} {totalSeats}
          </span>
        )}
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
