import { createClient } from '@/lib/supabase/server'
import { CuratedCategoryContent } from '@/components/trips/curated-category-content'
import type { Trip } from '@/types'

const PAGE_SIZE = 12

export default async function WeekendGetawayPage() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('trips')
    .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
    .eq('status', 'active')
    .eq('curated_category', 'weekend_getaway')
    .gt('departure_at', now)
    .order('departure_at', { ascending: true })
    .range(0, PAGE_SIZE - 1)

  return (
    <CuratedCategoryContent
      categoryKey="weekend_getaway"
      heroImage="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=85"
      pathSegment="weekend-getaway"
      initialTrips={(data as Trip[]) || []}
      initialHasMore={(data?.length ?? 0) === PAGE_SIZE}
    />
  )
}
