import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const originCode = searchParams.get('origin')
  const destinationCode = searchParams.get('destination')
  const month = searchParams.get('month') // YYYY-MM format
  const cabinClass = searchParams.get('cabin_class')

  if (!originCode || !destinationCode || !month) {
    return NextResponse.json({ error: 'origin, destination, and month are required' }, { status: 400 })
  }

  const startDate = `${month}-01`
  const [year, mon] = month.split('-').map(Number)
  const lastDay = new Date(year, mon, 0).getDate()
  const endDate = `${month}-${lastDay}`

  let query = supabaseAdmin
    .from('trips')
    .select('departure_at, price_per_seat')
    .eq('status', 'active')
    .gte('departure_at', `${startDate}T00:00:00`)
    .lte('departure_at', `${endDate}T23:59:59`)

  if (originCode !== 'ANY') query = query.eq('origin_code', originCode)
  if (destinationCode !== 'ANY') query = query.eq('destination_code', destinationCode)
  if (cabinClass) query = query.eq('cabin_class', cabinClass)

  const { data: trips, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 })
  }

  // Group by date and get minimum price
  const priceMap: Record<string, number> = {}
  for (const trip of trips || []) {
    const date = trip.departure_at.split('T')[0]
    if (!priceMap[date] || trip.price_per_seat < priceMap[date]) {
      priceMap[date] = trip.price_per_seat
    }
  }

  // Find min and max for color coding
  const prices = Object.values(priceMap)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

  return NextResponse.json({
    prices: priceMap,
    min_price: minPrice,
    max_price: maxPrice,
    total_days_with_flights: Object.keys(priceMap).length,
  })
}
