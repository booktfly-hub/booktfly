import { ArrowDown, ArrowLeft, ArrowLeftRight, ArrowRight, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TripType } from '@/types'

type TripDirectionIndicatorProps = {
  tripType: TripType
  isAr: boolean
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function TripDirectionIndicator({
  tripType,
  isAr,
  orientation = 'horizontal',
  className,
}: TripDirectionIndicatorProps) {
  if (tripType === 'round_trip') {
    const Icon = orientation === 'vertical' ? ArrowUpDown : ArrowLeftRight
    return <Icon className={cn(className)} aria-hidden="true" />
  }

  const Icon = orientation === 'vertical'
    ? ArrowDown
    : (isAr ? ArrowLeft : ArrowRight)

  return <Icon className={cn(className)} aria-hidden="true" />
}
