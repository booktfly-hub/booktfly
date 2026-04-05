import { createClient } from '@/lib/supabase/server'
import { CarsContent } from './cars-content'
import type { Car as CarType } from '@/types'

export default async function CarsPage({
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
  const transmission = str('transmission')
  const fuelType = str('fuel_type')
  const priceMin = str('price_min')
  const priceMax = str('price_max')
  const seatsMin = str('seats_min')
  const sort = str('sort') || 'newest'
  const pickupType = str('pickup_type')
  const pickupDate = str('pickup_date')
  const returnDate = str('return_date')

  const supabase = await createClient()

  let query = supabase
    .from('cars')
    .select('*, provider:providers(*)', { count: 'exact' })
    .eq('status', 'active')

  if (city) query = query.or(`city_ar.ilike.%${city}%,city_en.ilike.%${city}%`)
  if (category) query = query.eq('category', category)
  if (priceMin) query = query.gte('price_per_day', parseFloat(priceMin))
  if (priceMax) query = query.lte('price_per_day', parseFloat(priceMax))
  if (transmission) query = query.eq('transmission', transmission)
  if (fuelType) query = query.eq('fuel_type', fuelType)
  if (pickupType) query = query.eq('pickup_type', pickupType)
  if (seatsMin) query = query.gte('seats', parseInt(seatsMin, 10))
  if (pickupDate) {
    const pickupStr = new Date(pickupDate).toISOString().split('T')[0]
    query = query.or(`available_from.is.null,available_from.lte.${pickupStr}`)
  }
  if (returnDate) {
    const returnStr = new Date(returnDate).toISOString().split('T')[0]
    query = query.or(`available_to.is.null,available_to.gte.${returnStr}`)
  }

  switch (sort) {
    case 'price_asc': query = query.order('price_per_day', { ascending: true }); break
    case 'price_desc': query = query.order('price_per_day', { ascending: false }); break
    default: query = query.order('created_at', { ascending: false })
  }

  query = query.range(0, 11)

  const { data: cars, count } = await query

  return (
    <CarsContent
      initialCars={(cars as CarType[]) || []}
      initialTotalPages={Math.ceil((count || 0) / 12)}
      initialFilters={{
        city, category, transmission, fuel_type: fuelType,
        price_min: priceMin, price_max: priceMax, seats_min: seatsMin,
        sort, pickup_type: pickupType, return_same: true,
        return_city: '', pickup_date: pickupDate, return_date: returnDate,
      }}
    />
  )
}
