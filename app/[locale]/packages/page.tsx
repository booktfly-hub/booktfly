import { createClient } from '@/lib/supabase/server'
import { PackagesContent } from './packages-content'
import type { Package as PackageType } from '@/types/database'

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const str = (key: string) => {
    const v = params[key]
    return typeof v === 'string' ? v : ''
  }

  const destination = str('destination')
  const includesFlight = str('includes_flight') === 'true'
  const includesHotel = str('includes_hotel') === 'true'
  const includesCar = str('includes_car') === 'true'
  const priceMin = str('price_min')
  const priceMax = str('price_max')
  const sort = str('sort') || 'newest'

  const supabase = await createClient()

  let query = supabase
    .from('packages')
    .select('*, provider:providers(*), trip:trips(*), room:rooms(*), car:cars(*)', { count: 'exact' })
    .eq('status', 'active')

  if (destination) {
    query = query.or(
      `destination_city_ar.ilike.%${destination}%,destination_city_en.ilike.%${destination}%`
    )
  }
  if (includesFlight) query = query.eq('includes_flight', true)
  if (includesHotel) query = query.eq('includes_hotel', true)
  if (includesCar) query = query.eq('includes_car', true)
  if (priceMin) query = query.gte('total_price', parseFloat(priceMin))
  if (priceMax) query = query.lte('total_price', parseFloat(priceMax))

  switch (sort) {
    case 'price_asc': query = query.order('total_price', { ascending: true }); break
    case 'price_desc': query = query.order('total_price', { ascending: false }); break
    default: query = query.order('created_at', { ascending: false })
  }

  query = query.range(0, 11)

  const { data: packages, count } = await query

  return (
    <PackagesContent
      initialPackages={(packages as PackageType[]) || []}
      initialTotalPages={Math.ceil((count || 0) / 12)}
      initialFilters={{
        destination,
        includes_flight: includesFlight,
        includes_hotel: includesHotel,
        includes_car: includesCar,
        price_min: priceMin,
        price_max: priceMax,
        sort,
      }}
    />
  )
}
