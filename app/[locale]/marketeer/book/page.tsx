'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Search, Loader2, Plane, User, Mail, Phone, CreditCard, CheckCircle2, Copy, CheckCheck, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Trip } from '@/types'

export default function MarkeeteerBookPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [step, setStep] = useState<'search' | 'form' | 'done'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [trips, setTrips] = useState<Trip[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ bookingId: string; paymentUrl: string; ref: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    passenger_name: '',
    passenger_email: '',
    passenger_phone: '',
    passenger_id_number: '',
    seats_count: 1,
    booking_type: 'round_trip' as 'one_way' | 'round_trip',
  })

  async function searchTrips() {
    setSearching(true)
    setError('')
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (searchQuery) params.set('destination', searchQuery)
      const res = await fetch(`/api/trips?${params}`)
      const data = await res.json()
      setTrips(data.data || [])
    } catch {
      setError('Failed to search trips')
    } finally {
      setSearching(false)
    }
  }

  function selectTrip(trip: Trip) {
    setSelectedTrip(trip)
    setForm(prev => ({
      ...prev,
      booking_type: trip.trip_type === 'round_trip' ? 'round_trip' : 'one_way',
    }))
    setStep('form')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTrip) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/marketeers/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: selectedTrip.id,
          seats_count: form.seats_count,
          booking_type: form.booking_type,
          passenger_name: form.passenger_name,
          passenger_email: form.passenger_email,
          passenger_phone: form.passenger_phone,
          passenger_id_number: form.passenger_id_number || undefined,
          passengers: [{
            first_name: form.passenger_name.split(' ')[0] || form.passenger_name,
            last_name: form.passenger_name.split(' ').slice(1).join(' ') || '-',
            date_of_birth: '1990-01-01',
            id_number: form.passenger_id_number || 'N/A',
            id_expiry_date: '2030-01-01',
          }],
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create booking')
        return
      }

      setResult({ bookingId: data.bookingId, paymentUrl: data.paymentUrl, ref: data.ref })
      setStep('done')
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'done' && result) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in-up">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-6">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Booking Created!</h2>
          <p className="text-slate-500 mb-6">
            Booking #{result.ref} has been created. An email with payment instructions has been sent to the customer.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Link</p>
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl border bg-white px-3 py-2 font-mono text-xs text-slate-600 break-all">
                  {result.paymentUrl}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.paymentUrl)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2500)
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all',
                    copied ? 'bg-green-500/10 text-green-600' : 'bg-slate-900 text-white hover:bg-slate-800'
                  )}
                >
                  {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('search'); setSelectedTrip(null); setResult(null); setForm({ passenger_name: '', passenger_email: '', passenger_phone: '', passenger_id_number: '', seats_count: 1, booking_type: 'round_trip' }) }}
                className="flex-1 px-5 py-3 rounded-2xl border text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Book Another
              </button>
              <Link
                href={`/${locale}/marketeer/dashboard`}
                className="flex-1 px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold text-center hover:bg-slate-800 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {isAr ? 'حجز لعميل' : 'Book for Customer'}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {isAr ? 'احجز تذكرة نيابة عن عميلك' : 'Create a booking on behalf of your customer'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Step 1: Search & Select Trip */}
      {step === 'search' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              Step 1: Select a Trip
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchTrips()}
                  placeholder="Search by destination..."
                  className="w-full ps-12 pe-4 py-3 rounded-2xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <button
                onClick={searchTrips}
                disabled={searching}
                className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
              </button>
            </div>
          </div>

          {trips.length > 0 && (
            <div className="space-y-3">
              {trips.map((trip) => {
                const remaining = trip.total_seats - trip.booked_seats
                return (
                  <button
                    key={trip.id}
                    onClick={() => selectTrip(trip)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-start"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Plane className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {trip.origin_city_en || trip.origin_city_ar} → {trip.destination_city_en || trip.destination_city_ar}
                          </p>
                          <p className="text-xs text-slate-500">
                            {trip.airline} · {new Date(trip.departure_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {trip.cabin_class}
                          </p>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="text-lg font-black text-slate-900">{trip.price_per_seat.toLocaleString()} SAR</p>
                        <p className="text-xs text-slate-500">{remaining} seats left</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Customer Info Form */}
      {step === 'form' && selectedTrip && (
        <div className="space-y-6">
          {/* Selected trip summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-bold text-slate-900">
                  {selectedTrip.origin_city_en || selectedTrip.origin_city_ar} → {selectedTrip.destination_city_en || selectedTrip.destination_city_ar}
                </p>
                <p className="text-xs text-slate-500">{selectedTrip.airline} · {new Date(selectedTrip.departure_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
            <button onClick={() => setStep('search')} className="text-sm font-bold text-blue-600 hover:text-blue-700">
              Change
            </button>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-5">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Step 2: Customer Information
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    dir="ltr"
                    value={form.passenger_name}
                    onChange={(e) => setForm(f => ({ ...f, passenger_name: e.target.value.replace(/[^a-zA-Z\s\-'.]/g, '') }))}
                    placeholder="John Doe (English)"
                    className="w-full ps-10 pe-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="email"
                    value={form.passenger_email}
                    onChange={(e) => setForm(f => ({ ...f, passenger_email: e.target.value }))}
                    placeholder="john@example.com"
                    className="w-full ps-10 pe-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone *</label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="tel"
                    value={form.passenger_phone}
                    onChange={(e) => setForm(f => ({ ...f, passenger_phone: e.target.value }))}
                    placeholder="+966 5XX XXX XXXX"
                    dir="ltr"
                    className="w-full ps-10 pe-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">ID/Passport Number</label>
                <div className="relative">
                  <CreditCard className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.passenger_id_number}
                    onChange={(e) => setForm(f => ({ ...f, passenger_id_number: e.target.value }))}
                    placeholder="Optional"
                    className="w-full ps-10 pe-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Seats *</label>
                <input
                  required
                  type="number"
                  min={1}
                  max={selectedTrip.total_seats - selectedTrip.booked_seats}
                  value={form.seats_count}
                  onChange={(e) => setForm(f => ({ ...f, seats_count: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {selectedTrip.trip_type === 'round_trip' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Booking Type *</label>
                  <select
                    value={form.booking_type}
                    onChange={(e) => setForm(f => ({ ...f, booking_type: e.target.value as 'one_way' | 'round_trip' }))}
                    className="w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="round_trip">Round Trip</option>
                    <option value="one_way">One Way</option>
                  </select>
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Price per seat</span>
                <span className="font-bold text-slate-900">
                  {((form.booking_type === 'one_way' && selectedTrip.price_per_seat_one_way) ? selectedTrip.price_per_seat_one_way : selectedTrip.price_per_seat).toLocaleString()} SAR
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Seats</span>
                <span className="font-bold text-slate-900">&times; {form.seats_count}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-xl font-black text-blue-600">
                  {(((form.booking_type === 'one_way' && selectedTrip.price_per_seat_one_way) ? selectedTrip.price_per_seat_one_way : selectedTrip.price_per_seat) * form.seats_count).toLocaleString()} SAR
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Booking & Send Email'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
