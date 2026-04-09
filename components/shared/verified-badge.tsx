'use client'

import { useLocale } from 'next-intl'
import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerifiedBadgeProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function VerifiedBadge({ className, showLabel = false, size = 'sm' }: VerifiedBadgeProps) {
  const locale = useLocale()
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-blue-600', className)}
      title={locale === 'ar' ? 'مزود موثق' : 'Verified Provider'}
    >
      <BadgeCheck className={cn(iconSize, 'fill-blue-600 text-white')} />
      {showLabel && (
        <span className="text-xs font-medium">
          {locale === 'ar' ? 'موثق' : 'Verified'}
        </span>
      )}
    </span>
  )
}
