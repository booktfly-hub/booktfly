import { createClient } from '@/lib/supabase/server'
import { RoomsContent } from './rooms-content'
import type { Room } from '@/types'

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const str = (key: string) => {
    const v = params[key]
    return typeof v === 'string' ? v : ''
  }

  const city = str('city')
  const category = str('category')
  const priceMin = str('price_min')
  const priceMax = str('price_max')
  const capacityMin = str('capacity_min')
  const checkIn = str('check_in')
  const days = str('days')
  const roomsCount = str('rooms_count')
  const passengers = str('passengers')
  const sort = str('sort') || 'newest'

  const supabase = await createClient()

  let query = supabase
    .from('rooms')
    .select('*, provider:providers(*)', { count: 'exact' })
    .eq('status', 'active')

  if (city) {
    query = query.or(`city_ar.ilike.%${city}%,city_en.ilike.%${city}%`)
  }
  if (category) query = query.eq('category', category)
  if (priceMin) query = query.gte('price_per_night', parseFloat(priceMin))
  if (priceMax) query = query.lte('price_per_night', parseFloat(priceMax))
  const effectiveCapacity = passengers || capacityMin
  if (effectiveCapacity) query = query.gte('max_capacity', parseInt(effectiveCapacity, 10))
  if (checkIn) {
    const checkInDate = new Date(checkIn)
    const daysNum = days ? parseInt(days, 10) : 0
    const checkOutDate = daysNum > 0
      ? new Date(checkInDate.getTime() + daysNum * 24 * 60 * 60 * 1000)
      : checkInDate
    const checkInStr = checkInDate.toISOString().split('T')[0]
    const checkOutStr = checkOutDate.toISOString().split('T')[0]
    query = query.or(`available_from.is.null,available_from.lte.${checkInStr}`)
    query = query.or(`available_to.is.null,available_to.gte.${checkOutStr}`)
  }

  switch (sort) {
    case 'price_asc': query = query.order('price_per_night', { ascending: true }); break
    case 'price_desc': query = query.order('price_per_night', { ascending: false }); break
    default: query = query.order('created_at', { ascending: false })
  }

  query = query.range(0, 11)

  const { data: rooms, count } = await query

  return (
    <RoomsContent
      initialRooms={(rooms as Room[]) || []}
      initialTotalPages={Math.ceil((count || 0) / 12)}
      initialFilters={{
        city,
        category,
        price_min: priceMin,
        price_max: priceMax,
        capacity_min: capacityMin,
        check_in: checkIn,
        days,
        rooms_count: roomsCount,
        passengers,
        sort,
      }}
    />
  )
}
