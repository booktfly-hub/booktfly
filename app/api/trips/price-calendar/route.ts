import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchMonthCalendar, resolveIata } from '@/lib/travelpayouts-server'

type DayEntry = {
  price: number
  source: 'platform' | 'partner'
  affiliate_url?: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const originInput = (searchParams.get('origin') || '').trim()
  const destinationInput = (searchParams.get('destination') || '').trim()
  const month = searchParams.get('month') // YYYY-MM format
  const cabinClass = searchParams.get('cabin_class')

  if (!originInput || !destinationInput || !month) {
    return NextResponse.json({ error: 'origin, destination, and month are required' }, { status: 400 })
  }

  const [originResolved, destinationResolved] = await Promise.all([
    originInput === 'ANY' ? Promise.resolve('ANY') : resolveIata(originInput),
    destinationInput === 'ANY' ? Promise.resolve('ANY') : resolveIata(destinationInput),
  ])

  const originCode = originResolved || originInput.toUpperCase()
  const destinationCode = destinationResolved || destinationInput.toUpperCase()

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

  // Fetch DB + partner calendar in parallel.
  // Partner lookup only when both endpoints are real IATA codes.
  const partnerEnabled = originCode !== 'ANY' && destinationCode !== 'ANY'
  const [dbResult, partnerCalendar] = await Promise.all([
    query,
    partnerEnabled
      ? fetchMonthCalendar({ origin: originCode, destination: destinationCode, month })
      : Promise.resolve({} as Record<string, { price: number; affiliate_url: string }>),
  ])

  if (dbResult.error) {
    return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 })
  }

  // Per-day entries: take the cheaper of platform vs partner.
  const entries: Record<string, DayEntry> = {}
  for (const trip of dbResult.data || []) {
    const date = trip.departure_at.split('T')[0]
    const existing = entries[date]
    if (!existing || trip.price_per_seat < existing.price) {
      entries[date] = { price: trip.price_per_seat, source: 'platform' }
    }
  }
  for (const [date, partner] of Object.entries(partnerCalendar)) {
    if (date < startDate || date > endDate) continue
    const existing = entries[date]
    if (!existing || partner.price < existing.price) {
      entries[date] = {
        price: partner.price,
        source: 'partner',
        affiliate_url: partner.affiliate_url,
      }
    }
  }

  // Backwards-compatible flat priceMap + new `entries` shape.
  const priceMap: Record<string, number> = {}
  for (const [date, e] of Object.entries(entries)) {
    priceMap[date] = e.price
  }

  const prices = Object.values(priceMap)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

  return NextResponse.json({
    prices: priceMap,
    entries,
    min_price: minPrice,
    max_price: maxPrice,
    total_days_with_flights: Object.keys(priceMap).length,
  })
}
