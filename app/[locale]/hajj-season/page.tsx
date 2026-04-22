import { createClient } from '@/lib/supabase/server'
import { CuratedCategoryContent } from '@/components/trips/curated-category-content'
import type { Trip } from '@/types'

const PAGE_SIZE = 12

export default async function HajjSeasonPage() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('trips')
    .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
    .eq('status', 'active')
    .eq('curated_category', 'hajj_season')
    .gt('departure_at', now)
    .order('departure_at', { ascending: true })
    .range(0, PAGE_SIZE - 1)

  return (
    <CuratedCategoryContent
      categoryKey="hajj_season"
      heroImage="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=2400&q=85"
      pathSegment="hajj-season"
      initialTrips={(data as Trip[]) || []}
      initialHasMore={(data?.length ?? 0) === PAGE_SIZE}
    />
  )
}
