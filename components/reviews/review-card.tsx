'use client'

import { useLocale, useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { ar as arLocale, enUS } from 'date-fns/locale'
import { StarRating } from './star-rating'
import type { Review } from '@/types'

interface ReviewCardProps {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  const locale = useLocale()
  const t = useTranslations('reviews')
  const isAr = locale === 'ar'

  const reviewerName = review.reviewer?.full_name || t('anonymous')
  const timeAgo = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
    locale: isAr ? arLocale : enUS,
  })

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
            {reviewerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">{reviewerName}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <StarRating value={review.rating} readonly size="sm" />
      </div>
      {review.comment && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  )
}
