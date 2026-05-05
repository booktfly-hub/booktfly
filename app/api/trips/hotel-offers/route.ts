import { NextResponse } from 'next/server'
import { getHotelOffers, getHotelOffersForCity, getPopularHotelOffers } from '@/lib/booking-hotels'

export const runtime = 'nodejs'
export const revalidate = 300

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const destination = searchParams.get('destination') || ''
  const city = searchParams.get('city') || ''
  const checkin = searchParams.get('date_from') || undefined
  const checkout = searchParams.get('date_to') || undefined
  const adults = searchParams.get('adults') ? parseInt(searchParams.get('adults')!) : undefined

  let offers
  if (destination) {
    offers = getHotelOffers({ destination_iata: destination, checkin, checkout, adults })
  } else if (city) {
    offers = getHotelOffersForCity({ city, checkin, checkout, adults })
  } else {
    offers = getPopularHotelOffers()
  }

  return NextResponse.json({ offers })
}
