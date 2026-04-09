export type SocialProofBadgeType = 'most_booked' | 'best_value' | 'top_rated'

export function getSocialProofBadge(trip: {
  booked_seats?: number
  total_seats?: number
  price_per_seat?: number
  provider?: { avg_rating?: number; review_count?: number }
}): SocialProofBadgeType | null {
  if (trip.provider?.avg_rating && trip.provider.avg_rating >= 4.5 && (trip.provider.review_count || 0) >= 3) {
    return 'top_rated'
  }
  if (trip.total_seats && trip.booked_seats && trip.booked_seats / trip.total_seats >= 0.7) {
    return 'most_booked'
  }
  return null
}
