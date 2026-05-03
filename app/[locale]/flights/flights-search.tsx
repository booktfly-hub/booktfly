'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plane, Loader2, Search } from 'lucide-react'

interface Place {
  id: string
  iata_code: string | null
  iata_city_code: string | null
  name: string
  city_name: string | null
  country: string | null
  type: string
}

interface OfferSlice {
  origin: { iata_code: string; city: string }
  destination: { iata_code: string; city: string }
  duration: string
  segments_count: number
  departing_at: string
  arriving_at: string
}

interface Offer {
  id: string
  total_amount: string
  total_currency: string
  owner: { name: string; iata_code: string; logo: string | null }
  slices: OfferSlice[]
}

function PlaceInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: { code: string; label: string }
  onChange: (v: { code: string; label: string }) => void
}) {
  const [q, setQ] = useState(value.label)
  const [results, setResults] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const tRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current)
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    tRef.current = setTimeout(async () => {
      const res = await fetch(`/api/duffel/places?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setResults(json.places || [])
    }, 200)
  }, [q])

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="text"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="City or airport"
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-72 overflow-auto">
          {results.map((p) => {
            const code = p.iata_code || p.iata_city_code || ''
            const label = `${p.name}${p.city_name ? ` (${p.city_name})` : ''}${code ? ` · ${code}` : ''}`
            return (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange({ code, label })
                  setQ(label)
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-500">
                  {p.city_name ? `${p.city_name} · ` : ''}
                  {p.country ? `${p.country} · ` : ''}
                  {code}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function fmtTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtDuration(d: string) {
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return d
  const h = m[1] ? `${m[1]}h ` : ''
  const min = m[2] ? `${m[2]}m` : ''
  return `${h}${min}`.trim()
}

export function FlightsSearch() {
  const params = useParams<{ locale: string }>()
  const locale = params?.locale || 'ar'
  const [origin, setOrigin] = useState({ code: '', label: '' })
  const [destination, setDestination] = useState({ code: '', label: '' })
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [adults, setAdults] = useState(1)
  const [cabinClass, setCabinClass] = useState<'economy' | 'premium_economy' | 'business' | 'first'>('economy')
  const [loading, setLoading] = useState(false)
  const [offers, setOffers] = useState<Offer[]>([])
  const [error, setError] = useState<string | null>(null)

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!origin.code || !destination.code || !departureDate) {
      setError('Please fill origin, destination and departure date')
      return
    }
    setLoading(true)
    setOffers([])
    try {
      const res = await fetch('/api/duffel/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin.code,
          destination: destination.code,
          departure_date: departureDate,
          return_date: returnDate || undefined,
          adults,
          cabin_class: cabinClass,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Search failed')
      } else {
        setOffers(json.offers || [])
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form
        onSubmit={onSearch}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-white border rounded-lg shadow-sm mb-6"
      >
        <div className="lg:col-span-2">
          <PlaceInput label="From" value={origin} onChange={setOrigin} />
        </div>
        <div className="lg:col-span-2">
          <PlaceInput label="To" value={destination} onChange={setDestination} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Departure</label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Return (optional)</label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Passengers</label>
          <input
            type="number"
            min={1}
            max={9}
            value={adults}
            onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Class</label>
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium Economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
        </div>
        <div className="lg:col-span-2 flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching…' : 'Search flights'}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {!loading && offers.length === 0 && !error && (
        <p className="text-center text-gray-500 py-12">
          Enter trip details to see available flights.
        </p>
      )}

      <div className="space-y-3">
        {offers.map((o) => (
          <div
            key={o.id}
            className="p-4 bg-white border rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center"
          >
            <div className="flex items-center gap-3 w-full md:w-48">
              {o.owner.logo ? (
                <img src={o.owner.logo} alt={o.owner.name} className="w-8 h-8" />
              ) : (
                <Plane className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <div className="font-medium text-sm">{o.owner.name}</div>
                <div className="text-xs text-gray-500">{o.owner.iata_code}</div>
              </div>
            </div>

            <div className="flex-1 space-y-2 w-full">
              {o.slices.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="text-right w-24">
                    <div className="font-semibold">{fmtTime(s.departing_at)}</div>
                    <div className="text-xs text-gray-500">
                      {s.origin.iata_code} · {fmtDate(s.departing_at)}
                    </div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xs text-gray-500">{fmtDuration(s.duration)}</div>
                    <div className="border-t border-dashed my-1" />
                    <div className="text-xs text-gray-500">
                      {s.segments_count > 1 ? `${s.segments_count - 1} stop${s.segments_count > 2 ? 's' : ''}` : 'Direct'}
                    </div>
                  </div>
                  <div className="w-24">
                    <div className="font-semibold">{fmtTime(s.arriving_at)}</div>
                    <div className="text-xs text-gray-500">
                      {s.destination.iata_code} · {fmtDate(s.arriving_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full md:w-32 text-right">
              <div className="text-2xl font-bold">
                {o.total_currency} {parseFloat(o.total_amount).toFixed(0)}
              </div>
              <Link
                href={`/${locale}/flights/${o.id}`}
                className="mt-2 inline-block text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
              >
                Select
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
