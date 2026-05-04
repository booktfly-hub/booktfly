import { NextResponse } from 'next/server'
import { getHotelOffers, getPopularHotelOffers } from '@/lib/booking-hotels'

export const runtime = 'nodejs'
export const revalidate = 300

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const destination = searchParams.get('destination') || ''
  const checkin = searchParams.get('date_from') || undefined
  const checkout = searchParams.get('date_to') || undefined

  let offers = destination
    ? getHotelOffers({ destination_iata: destination, checkin, checkout })
    : getPopularHotelOffers()

  return NextResponse.json({ offers })
}
