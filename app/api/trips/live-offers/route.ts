import { NextRequest, NextResponse } from 'next/server'
import { fetchPartnerLiveOffers } from '@/lib/live-offers-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const offers = await fetchPartnerLiveOffers({
      origin: searchParams.get('origin') || undefined,
      destination: searchParams.get('destination') || undefined,
      departure_date: searchParams.get('date_from') || undefined,
      return_date: searchParams.get('date_to') || undefined,
      trip_type: searchParams.get('trip_type') || undefined,
    })

    return NextResponse.json({ offers })
  } catch {
    return NextResponse.json({ offers: [] }, { status: 500 })
  }
}
