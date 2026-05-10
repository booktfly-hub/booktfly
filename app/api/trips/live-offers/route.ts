import { NextRequest, NextResponse } from 'next/server'
import { fetchPartnerLiveOffers } from '@/lib/live-offers-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const adults = Number(searchParams.get('adults')) || undefined
    const children = Number(searchParams.get('children')) || undefined
    const infants = Number(searchParams.get('infants')) || undefined
    const rawCabin = searchParams.get('cabin_class')
    const cabin_class: 'Y' | 'C' | undefined =
      rawCabin === 'business' || rawCabin === 'first' || rawCabin === 'C'
        ? 'C'
        : rawCabin === 'economy' || rawCabin === 'Y'
          ? 'Y'
          : undefined

    const offers = await fetchPartnerLiveOffers({
      origin: searchParams.get('origin') || undefined,
      destination: searchParams.get('destination') || undefined,
      departure_date: searchParams.get('date_from') || undefined,
      return_date: searchParams.get('date_to') || undefined,
      trip_type: searchParams.get('trip_type') || undefined,
      adults,
      children,
      infants,
      cabin_class,
      currency: searchParams.get('currency') || undefined,
    })

    return NextResponse.json({ offers })
  } catch {
    return NextResponse.json({ offers: [] }, { status: 500 })
  }
}
