'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plane, Upload, Loader2, CheckCircle2, Clock, XCircle, Building2, CreditCard } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ClientContractStep } from '@/components/checkout/client-contract-step'

type BookingData = {
  booking: {
    id: string
    passenger_name: string
    passenger_email: string
    seats_count: number
    total_amount: number
    status: string
    transfer_receipt_url: string | null
    booking_type: string
    price_per_seat: number
    contract_signed_at: string | null
    buyer_signature_url: string | null
    created_at: string
    trip: {
      airline: string
      origin_city_en: string | null
      origin_city_ar: string
      destination_city_en: string | null
      destination_city_ar: string
      departure_at: string
      return_at: string | null
      cabin_class: string
    }
  }
  bank: {
    bank_name_en: string
    bank_iban: string
    bank_account_holder_en: string
  } | null
}

export default function GuestBookingPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  useEffect(() => {
    fetch(`/api/guest/booking/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Failed to load booking'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('receipt', file)

      const res = await fetch(`/api/guest/booking/${token}`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Upload failed')
        return
      }

      setUploaded(true)
      if (data) {
        setData({
          ...data,
          booking: { ...data.booking, transfer_receipt_url: 'uploaded' },
        })
      }
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { booking, bank } = data
  const trip = booking.trip
  const isConfirmed = booking.status === 'confirmed'
  const isPending = booking.status === 'payment_processing'
  const hasReceipt = !!booking.transfer_receipt_url

  // Guest must sign the client contract before seeing payment details
  if (isPending && !booking.contract_signed_at) {
    return (
      <ClientContractStep
        bookingId={booking.id}
        guestToken={token}
        onSigned={() => {
          fetch(`/api/guest/booking/${token}`).then(r => r.json()).then(d => { if (!d.error) setData(d) })
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Image src="/logo.png" alt="BooktFly" width={180} height={60} className="mx-auto" />
        </div>

        {/* Status Banner */}
        <div className={cn(
          'rounded-2xl p-4 text-center font-bold text-sm',
          isConfirmed && 'bg-green-50 text-green-700 border border-green-200',
          isPending && !hasReceipt && 'bg-amber-50 text-amber-700 border border-amber-200',
          isPending && hasReceipt && 'bg-blue-50 text-blue-700 border border-blue-200',
          !isConfirmed && !isPending && 'bg-red-50 text-red-700 border border-red-200',
        )}>
          {isConfirmed && (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Payment Confirmed - Booking Complete!
            </span>
          )}
          {isPending && !hasReceipt && (
            <span className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5" /> Payment Required - Please complete your transfer
            </span>
          )}
          {isPending && hasReceipt && (
            <span className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5" /> Receipt Uploaded - Under Review
            </span>
          )}
          {!isConfirmed && !isPending && (
            <span className="flex items-center justify-center gap-2">
              <XCircle className="h-5 w-5" /> Booking {booking.status.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-blue-500 text-white p-5">
            <div className="flex items-center gap-3">
              <Plane className="h-6 w-6" />
              <div>
                <p className="font-black text-lg">
                  {trip.origin_city_en || trip.origin_city_ar} &rarr; {trip.destination_city_en || trip.destination_city_ar}
                </p>
                <p className="text-blue-100 text-sm">{trip.airline} &middot; {trip.cabin_class}</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Passenger</span>
              <span className="font-bold text-slate-900">{booking.passenger_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Departure</span>
              <span className="font-bold text-slate-900">
                {new Date(trip.departure_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Seats</span>
              <span className="font-bold text-slate-900">{booking.seats_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Type</span>
              <span className="font-bold text-slate-900">{booking.booking_type === 'round_trip' ? 'Round Trip' : 'One Way'}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between">
              <span className="font-bold text-slate-900">Total Amount</span>
              <span className="text-xl font-black text-blue-600">{booking.total_amount.toLocaleString()} SAR</span>
            </div>
          </div>
        </div>

        {/* Bank Transfer Info */}
        {isPending && !hasReceipt && bank && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-500" />
              Bank Transfer Details
            </h3>
            <div className="space-y-3 bg-amber-50 rounded-xl p-4 border border-amber-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Bank</span>
                <span className="font-bold text-slate-900">{bank.bank_name_en}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">IBAN</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{bank.bank_iban}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Account Holder</span>
                <span className="font-bold text-slate-900">{bank.bank_account_holder_en}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount</span>
                <span className="font-black text-blue-600">{booking.total_amount.toLocaleString()} SAR</span>
              </div>
            </div>
          </div>
        )}

        {/* Upload Receipt */}
        {isPending && !hasReceipt && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Upload Transfer Receipt
            </h3>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl mb-3">{error}</p>
            )}

            <label className="block cursor-pointer">
              <div className={cn(
                'border-2 border-dashed rounded-2xl p-8 text-center transition-colors',
                uploading ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
              )}>
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                ) : (
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                )}
                <p className="text-sm font-bold text-slate-700">
                  {uploading ? 'Uploading...' : 'Click to upload receipt'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, or PDF</p>
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        )}

        {/* Upload Success */}
        {(uploaded || (isPending && hasReceipt)) && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
            <CheckCircle2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="font-bold text-blue-700">Receipt Uploaded Successfully!</p>
            <p className="text-sm text-blue-600 mt-1">
              Your payment is being reviewed. You will receive a confirmation email once verified.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          Powered by BooktFly &middot; &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
