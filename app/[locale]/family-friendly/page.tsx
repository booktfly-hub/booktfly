import { createClient } from '@/lib/supabase/server'
import { CuratedCategoryContent } from '@/components/trips/curated-category-content'
import type { Trip } from '@/types'

const PAGE_SIZE = 12

export default async function FamilyFriendlyPage() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('trips')
    .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
    .eq('status', 'active')
    .eq('curated_category', 'family_friendly')
    .gt('departure_at', now)
    .order('departure_at', { ascending: true })
    .range(0, PAGE_SIZE - 1)

  return (
    <CuratedCategoryContent
      categoryKey="family_friendly"
      heroImage="https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=2400&q=85"
      pathSegment="family-friendly"
      initialTrips={(data as Trip[]) || []}
      initialHasMore={(data?.length ?? 0) === PAGE_SIZE}
    />
  )
}
