'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { TRIP_STATUS_COLORS } from '@/lib/constants'
import type { TripStatus } from '@/types'

type TripStatusBadgeProps = {
  status: TripStatus
  className?: string
}

export function TripStatusBadge({ status, className }: TripStatusBadgeProps) {
  const t = useTranslations('status')

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        TRIP_STATUS_COLORS[status],
        className
      )}
    >
      {t(status)}
    </span>
  )
}
