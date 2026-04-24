'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ReviewCard } from './review-card'
import { StarRating } from './star-rating'
import type { Review } from '@/types'

interface ReviewListProps {
  providerId: string
  tripId?: string
  roomId?: string
  carId?: string
  packageId?: string
}

export function ReviewList({ providerId, tripId, roomId, carId, packageId }: ReviewListProps) {
  const locale = useLocale()
  const t = useTranslations('reviews')
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState(0)

  useEffect(() => {
    async function fetchReviews() {
      try {
        const params = new URLSearchParams({ provider_id: providerId })
        if (tripId) params.set('trip_id', tripId)
        if (roomId) params.set('room_id', roomId)
        if (carId) params.set('car_id', carId)
        if (packageId) params.set('package_id', packageId)

        const res = await fetch(`/api/reviews?${params}`)
        if (res.ok) {
          const data = await res.json()
          setReviews(data.reviews)
          setAvgRating(data.avg_rating || 0)
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [providerId, tripId, roomId, carId, packageId])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {t('no_reviews')}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <StarRating value={avgRating} readonly size="md" showValue />
        <span className="text-sm text-muted-foreground">
          ({reviews.length} {t('reviews_count')})
        </span>
      </div>
      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}
