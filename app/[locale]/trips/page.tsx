import { createClient } from '@/lib/supabase/server'
import { TripsContent } from './trips-content'
import type { Trip } from '@/types'

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const str = (key: string) => {
    const v = params[key]
    return typeof v === 'string' ? v : ''
  }

  const origin = str('origin')
  const destination = str('destination')
  const tripType = str('trip_type') || 'one_way'
  const dateFrom = str('date_from')
  const dateTo = str('date_to')
  const priceMin = str('price_min')
  const priceMax = str('price_max')
  const cabinClass = str('cabin_class')
  const sort = str('sort') || 'newest'

  const supabase = await createClient()

  let query = supabase
    .from('trips')
    .select('*, provider:providers(*)', { count: 'exact' })
    .eq('status', 'active')

  if (origin) {
    query = query.or(
      `origin_city_ar.ilike.%${origin}%,origin_city_en.ilike.%${origin}%,origin_code.ilike.%${origin}%`
    )
  }
  if (destination) {
    query = query.or(
      `destination_city_ar.ilike.%${destination}%,destination_city_en.ilike.%${destination}%,destination_code.ilike.%${destination}%`
    )
  }
  if (dateFrom) query = query.gte('departure_at', dateFrom)
  if (dateTo) query = query.lte('departure_at', dateTo)
  if (priceMin) query = query.gte('price_per_seat', parseFloat(priceMin))
  if (priceMax) query = query.lte('price_per_seat', parseFloat(priceMax))
  if (tripType === 'one_way') {
    query = query.in('trip_type', ['one_way', 'round_trip'])
  } else if (tripType) {
    query = query.eq('trip_type', tripType)
  }
  if (cabinClass) query = query.eq('cabin_class', cabinClass)

  switch (sort) {
    case 'price_asc': query = query.order('price_per_seat', { ascending: true }); break
    case 'price_desc': query = query.order('price_per_seat', { ascending: false }); break
    case 'date': query = query.order('departure_at', { ascending: true }); break
    default: query = query.order('created_at', { ascending: false })
  }

  query = query.range(0, 11)

  const { data: trips, count } = await query

  return (
    <TripsContent
      initialTrips={(trips as Trip[]) || []}
      initialTotalPages={Math.ceil((count || 0) / 12)}
      initialFilters={{
        origin,
        destination,
        trip_type: tripType,
        date_from: dateFrom,
        date_to: dateTo,
        price_min: priceMin,
        price_max: priceMax,
        cabin_class: cabinClass,
        sort,
      }}
    />
  )
}
