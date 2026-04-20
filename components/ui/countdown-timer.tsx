'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCountdown, getUrgencyLevel } from '@/lib/last-minute'

type CountdownTimerProps = {
  targetDate: string
  className?: string
  compact?: boolean
}

export function CountdownTimer({ targetDate, className, compact = false }: CountdownTimerProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [countdown, setCountdown] = useState(formatCountdown(targetDate))
  const urgency = getUrgencyLevel(targetDate)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatCountdown(targetDate))
    }, 60_000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (!urgency) return null

  const { days, hours, minutes } = countdown

  const urgencyColors = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-accent/10 text-accent border-accent/20',
    low: 'bg-warning/10 text-warning border-warning/20',
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold', urgencyColors[urgency], urgency === 'high' && 'animate-pulse', className)}>
        <Clock className="h-3.5 w-3.5" />
        <span>
          {days > 0 && `${days}${isAr ? 'ي' : 'd'} `}
          {hours}{isAr ? 'س' : 'h'} {minutes}{isAr ? 'د' : 'm'}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border', urgencyColors[urgency], urgency === 'high' && 'animate-pulse', className)}>
      <Clock className="h-5 w-5 shrink-0" />
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-widest opacity-70">
          {isAr ? 'ينتهي خلال' : 'Expires in'}
        </span>
        <span className="text-lg font-black leading-tight">
          {days > 0 && `${days}${isAr ? ' يوم' : 'd'} `}
          {hours}{isAr ? ' ساعة' : 'h'} {minutes}{isAr ? ' دقيقة' : 'm'}
        </span>
      </div>
    </div>
  )
}
