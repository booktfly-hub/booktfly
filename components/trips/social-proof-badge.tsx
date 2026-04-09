'use client'

import { useLocale } from 'next-intl'
import { TrendingUp, Award, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type BadgeType = 'most_booked' | 'best_value' | 'top_rated'

interface SocialProofBadgeProps {
  type: BadgeType
  className?: string
}

const badges = {
  most_booked: {
    ar: 'الأكثر حجزاً',
    en: 'Most Booked',
    icon: TrendingUp,
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  best_value: {
    ar: 'أفضل قيمة',
    en: 'Best Value',
    icon: Award,
    bg: 'bg-green-50 text-green-700 border-green-200',
  },
  top_rated: {
    ar: 'الأعلى تقييماً',
    en: 'Top Rated',
    icon: Star,
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
}

export function SocialProofBadge({ type, className }: SocialProofBadgeProps) {
  const locale = useLocale()
  const badge = badges[type]
  const Icon = badge.icon

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
      badge.bg,
      className
    )}>
      <Icon className="h-3 w-3" />
      {locale === 'ar' ? badge.ar : badge.en}
    </span>
  )
}

