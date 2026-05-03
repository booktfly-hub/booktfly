'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface Offer {
  id: string
  total_amount: string
  total_currency: string
  passengers: { id: string; type: 'adult' | 'child' | 'infant_without_seat' }[]
}

interface PaxState {
  id: string
  type: string
  title: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr'
  given_name: string
  family_name: string
  born_on: string
  gender: 'm' | 'f'
  email: string
  phone_number: string
}

export function BookingForm({ offer }: { offer: Offer }) {
  const router = useRouter()
  const [pax, setPax] = useState<PaxState[]>(
    offer.passengers.map((p) => ({
      id: p.id,
      type: p.type,
      title: 'mr',
      given_name: '',
      family_name: '',
      born_on: '',
      gender: 'm',
      email: '',
      phone_number: '',
    }))
  )
  const [card, setCard] = useState({ number: '4242 4242 4242 4242', exp: '12/30', cvc: '123', name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updatePax = (i: number, patch: Partial<PaxState>) =>
    setPax((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/duffel/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer_id: offer.id,
          passengers: pax,
          total_amount: offer.total_amount,
          total_currency: offer.total_currency,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Booking failed')
      } else {
        router.push(`/flights/orders/${json.order.id}?ref=${json.order.booking_reference}`)
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {pax.map((p, i) => (
        <div key={p.id} className="p-4 bg-white border rounded-lg space-y-3">
          <h3 className="font-semibold">
            Passenger {i + 1} <span className="text-xs text-gray-500">({p.type})</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Title</label>
              <select
                value={p.title}
                onChange={(e) => updatePax(i, { title: e.target.value as any })}
                className="w-full px-2 py-1.5 border rounded"
              >
                <option value="mr">Mr</option>
                <option value="ms">Ms</option>
                <option value="mrs">Mrs</option>
                <option value="miss">Miss</option>
                <option value="dr">Dr</option>
              </select>
            </div>
            <div>
              <label className="text-sm">First name</label>
              <input
                required
                value={p.given_name}
                onChange={(e) => updatePax(i, { given_name: e.target.value })}
                className="w-full px-2 py-1.5 border rounded"
              />
            </div>
            <div>
              <label className="text-sm">Last name</label>
              <input
                required
                value={p.family_name}
                onChange={(e) => updatePax(i, { family_name: e.target.value })}
                className="w-full px-2 py-1.5 border rounded"
              />
            </div>
            <div>
              <label className="text-sm">Date of birth</label>
              <input
                required
                type="date"
                value={p.born_on}
                onChange={(e) => updatePax(i, { born_on: e.target.value })}
                className="w-full px-2 py-1.5 border rounded"
              />
            </div>
            <div>
              <label className="text-sm">Gender</label>
              <select
                value={p.gender}
                onChange={(e) => updatePax(i, { gender: e.target.value as any })}
                className="w-full px-2 py-1.5 border rounded"
              >
                <option value="m">Male</option>
                <option value="f">Female</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Email</label>
              <input
                required
                type="email"
                value={p.email}
                onChange={(e) => updatePax(i, { email: e.target.value })}
                className="w-full px-2 py-1.5 border rounded"
              />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="text-sm">Phone (E.164, e.g. +966500000000)</label>
              <input
                required
                value={p.phone_number}
                onChange={(e) => updatePax(i, { phone_number: e.target.value })}
                placeholder="+966500000000"
                className="w-full px-2 py-1.5 border rounded"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="p-4 bg-white border rounded-lg space-y-3">
        <h3 className="font-semibold">Payment (test mode — Duffel balance)</h3>
        <p className="text-xs text-gray-500">
          In Duffel test mode, payment is debited from your test balance — no card is charged.
          The card fields below are illustrative only.
        </p>
        <div className="grid grid-cols-2 gap-3 opacity-60">
          <div className="col-span-2">
            <label className="text-sm">Card number</label>
            <input
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
              className="w-full px-2 py-1.5 border rounded"
            />
          </div>
          <div>
            <label className="text-sm">Exp</label>
            <input
              value={card.exp}
              onChange={(e) => setCard({ ...card, exp: e.target.value })}
              className="w-full px-2 py-1.5 border rounded"
            />
          </div>
          <div>
            <label className="text-sm">CVC</label>
            <input
              value={card.cvc}
              onChange={(e) => setCard({ ...card, cvc: e.target.value })}
              className="w-full px-2 py-1.5 border rounded"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Booking…' : `Confirm and book — ${offer.total_currency} ${parseFloat(offer.total_amount).toFixed(2)}`}
      </button>
    </form>
  )
}
