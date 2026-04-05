import { createClient } from '@/lib/supabase/server'
import { LastMinuteContent } from './last-minute-content'
import type { Trip } from '@/types'

const PAGE_SIZE = 12

export default async function LastMinutePage() {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const cutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('trips')
    .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
    .eq('status', 'active')
    .gt('departure_at', now)
    .lte('departure_at', cutoff)
    .order('departure_at', { ascending: true })
    .range(0, PAGE_SIZE - 1)

  return (
    <LastMinuteContent
      initialTrips={(data as Trip[]) || []}
      initialHasMore={(data?.length ?? 0) === PAGE_SIZE}
    />
  )
}
