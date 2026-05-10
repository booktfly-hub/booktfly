import { NextResponse } from 'next/server'
import { getLiveHotelOffers, getLivePopularHotelOffers } from '@/lib/booking-hotels'

export const runtime = 'nodejs'
export const revalidate = 300

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const destination = searchParams.get('destination') || ''
  const city = searchParams.get('city') || ''
  const checkin = searchParams.get('date_from') || undefined
  const checkout = searchParams.get('date_to') || undefined
  const adults = searchParams.get('adults') ? parseInt(searchParams.get('adults')!) : undefined
  const currency = (searchParams.get('currency') || '').toUpperCase() || undefined

  let offers
  if (destination || city) {
    offers = await getLiveHotelOffers({
      destination_iata: destination || undefined,
      city: city || undefined,
      checkin,
      checkout,
      adults,
      currency,
    })
  } else {
    offers = await getLivePopularHotelOffers(currency)
  }

  return NextResponse.json({ offers })
}
