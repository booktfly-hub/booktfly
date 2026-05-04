import { NextRequest, NextResponse } from 'next/server'
import { createDuffelSession } from '@/lib/duffel-server'
import { buildSearchDeepLink } from '@/lib/travelpayouts'

export const runtime = 'nodejs'

/** Create a Duffel Links session and redirect the user to it.
 *  Falls back to Travelpayouts search if Duffel is not configured. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const origin = (searchParams.get('origin') || '').toUpperCase()
  const destination = (searchParams.get('destination') || '').toUpperCase()
  const date = searchParams.get('date') || ''
  const ref = searchParams.get('ref') || undefined

  if (!origin || !destination) {
    return NextResponse.json({ error: 'origin and destination required' }, { status: 400 })
  }

  const sessionUrl = await createDuffelSession({ origin, destination, date, reference: ref })

  if (sessionUrl) {
    return NextResponse.redirect(sessionUrl)
  }

  // Fallback: redirect to Travelpayouts search deeplink
  const fallback = date
    ? buildSearchDeepLink({ origin, destination, departure_at: date, sub_id: 'duffel_fallback' })
    : `https://www.aviasales.com/search/${origin}${destination}1?marker=${process.env.TRAVELPAYOUTS_MARKER ?? ''}`

  return NextResponse.redirect(fallback)
}
