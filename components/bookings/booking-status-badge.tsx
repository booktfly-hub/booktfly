'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import type { BookingStatus } from '@/types'

type BookingStatusBadgeProps = {
  status: BookingStatus
  className?: string
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const t = useTranslations('status')

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        BOOKING_STATUS_COLORS[status],
        className
      )}
    >
      {t(status)}
    </span>
  )
}
