import { createClient } from '@/lib/supabase/server'
import { CuratedCategoryContent } from '@/components/trips/curated-category-content'
import type { Trip } from '@/types'

const PAGE_SIZE = 12

export default async function UmrahOfferPage() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('trips')
    .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
    .eq('status', 'active')
    .eq('curated_category', 'umrah_offer')
    .gt('departure_at', now)
    .order('departure_at', { ascending: true })
    .range(0, PAGE_SIZE - 1)

  return (
    <CuratedCategoryContent
      categoryKey="umrah_offer"
      heroImage="https://images.unsplash.com/photo-1564769625392-651b2c4f0b8a?auto=format&fit=crop&w=2400&q=85"
      pathSegment="umrah-offer"
      initialTrips={(data as Trip[]) || []}
      initialHasMore={(data?.length ?? 0) === PAGE_SIZE}
    />
  )
}
