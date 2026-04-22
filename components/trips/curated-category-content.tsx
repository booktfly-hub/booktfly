'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { TripCard } from '@/components/trips/trip-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CategoryHero } from '@/components/shared/category-hero'
import { ShareButton } from '@/components/shared/share-button'
import type { Trip } from '@/types'
import { Loader2, Sparkles } from 'lucide-react'

const PAGE_SIZE = 12

export type CuratedCategorySlug =
  | 'weekend_getaway'
  | 'hajj_season'
  | 'umrah_offer'
  | 'family_friendly'

interface Props {
  categoryKey: CuratedCategorySlug
  heroImage: string
  pathSegment: string
  initialTrips: Trip[]
  initialHasMore: boolean
}

export function CuratedCategoryContent({
  categoryKey,
  heroImage,
  pathSegment,
  initialTrips,
  initialHasMore,
}: Props) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const supabase = createClient()
      const now = new Date().toISOString()
      const offset = trips.length
      const { data } = await supabase
        .from('trips')
        .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
        .eq('status', 'active')
        .eq('curated_category', categoryKey)
        .gt('departure_at', now)
        .order('departure_at', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)

      if (data) {
        setTrips((prev) => [...prev, ...(data as Trip[])])
        setHasMore(data.length === PAGE_SIZE)
      }
    } catch {} finally {
      setLoadingMore(false)
    }
  }

  const heroEyebrow = t(`category_heroes.${categoryKey}.eyebrow`)
  const heroTitle = t(`category_heroes.${categoryKey}.title`)
  const heroDescription = t(`category_heroes.${categoryKey}.description`)

  return (
    <>
      <CategoryHero
        eyebrow={heroEyebrow}
        title={heroTitle}
        description={heroDescription}
        image={heroImage}
      />
      <div className="min-h-screen -mt-20 pt-0 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 relative z-20">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-primary">{heroTitle}</span>
          </div>
        </div>

        {trips.length > 0 && (
          <div className="mx-auto max-w-3xl rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/5 via-slate-50 to-primary/5 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">
                    {heroEyebrow}
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {isAr
                      ? `${trips.length}+ رحلة مختارة لك`
                      : `${trips.length}+ handpicked trips`}
                  </p>
                </div>
              </div>
              <ShareButton
                variant="pill"
                url={`/${locale}/${pathSegment}`}
                title={heroTitle}
                text={heroDescription}
              />
            </div>
          </div>
        )}

        {trips.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            message={isAr ? 'لا توجد رحلات متاحة حالياً' : 'No trips available right now'}
            description={isAr ? 'عد لاحقاً — الرحلات تتحدث يومياً' : 'Check back soon — trips are added daily'}
          />
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
    </>
  )
}
