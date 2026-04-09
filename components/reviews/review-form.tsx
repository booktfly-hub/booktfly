'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { StarRating } from './star-rating'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

interface ReviewFormProps {
  bookingId: string
  providerId: string
  tripId?: string
  roomId?: string
  carId?: string
  itemType?: 'trip' | 'room' | 'car' | 'package'
  onSuccess?: () => void
}

export function ReviewForm({
  bookingId,
  providerId,
  tripId,
  roomId,
  carId,
  itemType = 'trip',
  onSuccess,
}: ReviewFormProps) {
  const t = useTranslations('reviews')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError(t('rating_required'))
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          provider_id: providerId,
          trip_id: tripId || null,
          room_id: roomId || null,
          car_id: carId || null,
          item_type: itemType,
          rating,
          comment: comment.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || t('submit_error'))
        return
      }

      setSubmitted(true)
      onSuccess?.()
    } catch {
      setError(t('submit_error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-center">
        <p className="text-sm font-medium text-success">{t('thank_you')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h4 className="font-semibold text-sm">{t('leave_review')}</h4>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">{t('your_rating')}</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">{t('your_comment')}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('comment_placeholder')}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting || rating === 0} size="sm" className="gap-2">
        <Send className="h-3.5 w-3.5" />
        {submitting ? t('submitting') : t('submit_review')}
      </Button>
    </form>
  )
}
