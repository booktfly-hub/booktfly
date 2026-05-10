import { createClient } from '@/lib/supabase/server'
import { TripsContent } from './trips-content'
import { fetchPartnerLiveOffers } from '@/lib/live-offers-server'
import { getHotelOffers } from '@/lib/booking-hotels'
import { expandWithNearby, isIataCode } from '@/lib/nearby-airports'
import type { Trip } from '@/types'

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const escapeLike = (value: string) => value.replace(/[%_,()]/g, '')
  const buildLocationGroup = (prefix: 'origin' | 'destination', raw: string) => {
    const term = escapeLike(raw)
    return `or(${prefix}_city_ar.ilike.%${term}%,${prefix}_city_en.ilike.%${term}%,${prefix}_code.ilike.%${term}%)`
  }
  const buildLocationGroupExpanded = (
    prefix: 'origin' | 'destination',
    raw: string,
    includeNearby: boolean,
  ) => {
    if (!includeNearby || !isIataCode(raw)) return buildLocationGroup(prefix, raw)
    const codes = expandWithNearby(raw)
    const codeMatches = codes.map((c) => `${prefix}_code.ilike.${escapeLike(c)}`).join(',')
    return `or(${codeMatches})`
  }
  const shiftDate = (iso: string, days: number) => {
    const d = new Date(`${iso}T00:00:00.000Z`)
    if (Number.isNaN(d.getTime())) return iso
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().slice(0, 10)
  }
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
  const adults = Math.max(1, Math.min(9, parseInt(str('adults') || '1', 10) || 1))
  const children = Math.max(0, Math.min(9, parseInt(str('children') || '0', 10) || 0))
  const infants = Math.max(0, Math.min(9, parseInt(str('infants') || '0', 10) || 0))
  const includeNearby = str('include_nearby') === '1' || str('include_nearby') === 'true'
  const flexDaysRaw = parseInt(str('flex_days') || '0', 10)
  const flexDays = Math.max(0, Math.min(3, Number.isFinite(flexDaysRaw) ? flexDaysRaw : 0))
  const cabinForLive: 'Y' | 'C' =
    cabinClass === 'business' || cabinClass === 'first' ? 'C' : 'Y'

  const supabase = await createClient()

  // Use filter() for complex multi-column OR logic per field
  // Origin: city_ar OR city_en OR code
  // Destination: city_ar OR city_en OR code
  // Both conditions must match when provided
  let query = supabase
    .from('trips')
    .select('*, provider:providers(*)', { count: 'exact' })
    .eq('status', 'active')

  if (origin && destination) {
    query = query.or(
      `and(${buildLocationGroupExpanded('origin', origin, includeNearby)},${buildLocationGroupExpanded('destination', destination, includeNearby)})`,
    )
  } else if (origin) {
    query = query.or(buildLocationGroupExpanded('origin', origin, includeNearby))
  } else if (destination) {
    query = query.or(buildLocationGroupExpanded('destination', destination, includeNearby))
  }
  if (dateFrom) query = query.gte('departure_at', flexDays > 0 ? shiftDate(dateFrom, -flexDays) : dateFrom)
  if (dateTo) query = query.lte('departure_at', flexDays > 0 ? shiftDate(dateTo, flexDays) : dateTo)
  else if (dateFrom && flexDays > 0) query = query.lte('departure_at', shiftDate(dateFrom, flexDays))
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

  const [liveOffers, hotelOffers] = await Promise.all([
    fetchPartnerLiveOffers({
      origin,
      destination,
      departure_date: dateFrom || undefined,
      return_date: dateTo || undefined,
      trip_type: tripType,
      adults,
      children,
      infants,
      cabin_class: cabinForLive,
    }),
    destination
      ? getHotelOffers({ destination_iata: destination, checkin: dateFrom || undefined, checkout: dateTo || undefined })
      : Promise.resolve([]),
  ])

  return (
    <TripsContent
      initialTrips={(trips as Trip[]) || []}
      initialTotalPages={Math.ceil((count || 0) / 12)}
      liveOffers={liveOffers}
      hotelOffers={hotelOffers}
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
        adults,
        children,
        infants,
        include_nearby: includeNearby,
        flex_days: flexDays,
      }}
    />
  )
}
