import { notFound } from 'next/navigation'
import { CheckCircle2, Plane } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function fetchOrder(id: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${base}/api/duffel/orders/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return (await res.json()).order
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await fetchOrder(id)
  if (!order) notFound()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold">Booking confirmed</h1>
          <p className="text-sm text-gray-500">
            Reference: <span className="font-mono font-semibold">{order.booking_reference}</span>
          </p>
        </div>
      </div>

      <div className="p-4 bg-white border rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {order.owner.logo ? (
              <img src={order.owner.logo} alt={order.owner.name} className="w-8 h-8" />
            ) : (
              <Plane className="w-8 h-8 text-gray-400" />
            )}
            <span className="font-medium">{order.owner.name}</span>
          </div>
          <div className="text-xl font-bold">
            {order.total_currency} {parseFloat(order.total_amount).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {order.slices.map((s: any, i: number) => (
          <div key={i} className="p-4 bg-white border rounded-lg">
            <div className="font-semibold mb-2">
              {s.origin} → {s.destination}
            </div>
            {s.segments.map((seg: any, j: number) => (
              <div key={j} className="text-sm border-t pt-2 mt-2">
                <div className="font-medium">
                  {seg.flight_number} · {seg.marketing_carrier}
                </div>
                <div className="text-gray-500 text-xs">
                  {seg.origin} {new Date(seg.departing_at).toLocaleString()} → {seg.destination}{' '}
                  {new Date(seg.arriving_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border rounded-lg">
        <h3 className="font-semibold mb-2">Passengers</h3>
        <ul className="text-sm space-y-1">
          {order.passengers.map((p: any, i: number) => (
            <li key={i}>
              {p.given_name} {p.family_name} <span className="text-gray-500">({p.type})</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-gray-500 mt-6 text-center">
        This is a Duffel test-mode booking. No real flight has been ticketed; no money was charged.
      </p>
    </div>
  )
}
