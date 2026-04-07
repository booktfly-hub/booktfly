'use client'

import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Zap, CalendarDays } from 'lucide-react'

type RoomAvailabilityBadgeProps = {
  instantBook: boolean
  availableFrom?: string | null
  availableTo?: string | null
  className?: string
}

export function RoomAvailabilityBadge({ instantBook, availableFrom, availableTo, className }: RoomAvailabilityBadgeProps) {
  const t = useTranslations('rooms')
  const locale = useLocale()
  const isAr = locale === 'ar'

  if (instantBook) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
        className
      )}>
        <Zap className="h-3.5 w-3.5" />
        {t('instant_book')}
      </span>
    )
  }

  if (availableFrom && availableTo) {
    const from = new Date(availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const to = new Date(availableTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20',
        className
      )}>
        <CalendarDays className="h-3.5 w-3.5" />
        {from} – {to}
      </span>
    )
  }

  return null
}
