import { notFound } from 'next/navigation'
import { BookingForm } from './booking-form'

export const dynamic = 'force-dynamic'

async function fetchOffer(offerId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${base}/api/duffel/offers/${offerId}`, { cache: 'no-store' })
  if (!res.ok) return null
  const json = await res.json()
  return json.offer
}

export default async function BookFlightPage({
  params,
}: {
  params: Promise<{ offerId: string; locale: string }>
}) {
  const { offerId } = await params
  const offer = await fetchOffer(offerId)
  if (!offer) notFound()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Complete your booking</h1>
      <p className="text-sm text-gray-500 mb-6">
        Test mode — no real money will be charged.
      </p>

      <div className="p-4 bg-white border rounded-lg mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">{offer.owner.name}</div>
          <div className="text-2xl font-bold">
            {offer.total_currency} {parseFloat(offer.total_amount).toFixed(2)}
          </div>
        </div>
        {offer.slices.map((s: any, i: number) => (
          <div key={i} className="text-sm border-t pt-3 mt-3">
            <div className="font-medium">
              {s.origin.iata_code} → {s.destination.iata_code}
            </div>
            <div className="text-gray-500 text-xs">
              {new Date(s.departing_at).toLocaleString()} —{' '}
              {new Date(s.arriving_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <BookingForm offer={offer} />
    </div>
  )
}
