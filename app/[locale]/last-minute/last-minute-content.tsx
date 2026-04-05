'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { TripCard } from '@/components/trips/trip-card'
import { EmptyState } from '@/components/shared/empty-state'
import type { Trip } from '@/types'
import { Loader2, Flame } from 'lucide-react'

const PAGE_SIZE = 12

interface LastMinuteContentProps {
  initialTrips: Trip[]
  initialHasMore: boolean
}

export function LastMinuteContent({ initialTrips, initialHasMore }: LastMinuteContentProps) {
  const t = useTranslations('lastMinute')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const supabase = createClient()
      const now = new Date().toISOString()
      const cutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const offset = trips.length

      const { data } = await supabase
        .from('trips')
        .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
        .eq('status', 'active')
        .gt('departure_at', now)
        .lte('departure_at', cutoff)
        .order('departure_at', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)

      if (data) {
        setTrips((prev) => [...prev, ...(data as Trip[])])
        setHasMore(data.length === PAGE_SIZE)
      }
    } catch { /* silently */ } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-bold text-orange-700">{t('badge')}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{t('title')}</h1>
        <p className="text-slate-500 text-lg max-w-md mx-auto">{t('subtitle')}</p>
      </div>

      {trips.length === 0 ? (
        <EmptyState icon={Flame} message={t('no_deals')} description={t('check_back')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
        </div>
      )}

      {hasMore && trips.length > 0 && (
        <div className="flex justify-center pt-2 pb-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-card border rounded-xl text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            {isAr ? 'تحميل المزيد' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
