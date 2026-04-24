import { createClient } from '@/lib/supabase/server'
import { LastMinuteContent } from './last-minute-content'
import type { Trip } from '@/types'

const PAGE_SIZE = 12

export default async function LastMinutePage() {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const cutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const [tripsResult, roomsResult, carsResult] = await Promise.all([
    supabase
      .from('trips')
      .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
      .eq('status', 'active')
      .gt('departure_at', now)
      .lte('departure_at', cutoff)
      .order('departure_at', { ascending: true })
      .range(0, PAGE_SIZE - 1),
    supabase
      .from('rooms')
      .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
      .eq('status', 'active')
      .eq('is_last_minute', true)
      .lte('available_from', cutoff)
      .gte('available_to', now)
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1),
    supabase
      .from('cars')
      .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
      .eq('status', 'active')
      .eq('is_last_minute', true)
      .lte('available_from', cutoff)
      .gte('available_to', now)
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1),
  ])

  return (
    <LastMinuteContent
      initialTrips={(tripsResult.data as Trip[]) || []}
      initialHasMore={(tripsResult.data?.length ?? 0) === PAGE_SIZE}
      initialRooms={(roomsResult.data as any[]) || []}
      initialRoomsHasMore={(roomsResult.data?.length ?? 0) === PAGE_SIZE}
      initialCars={(carsResult.data as any[]) || []}
      initialCarsHasMore={(carsResult.data?.length ?? 0) === PAGE_SIZE}
    />
  )
}
