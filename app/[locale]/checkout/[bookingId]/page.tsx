'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn, formatPrice, formatPriceEN, shortId } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { DetailPageSkeleton } from '@/components/shared/loading-skeleton'
import type { Booking } from '@/types'

type CheckoutState = 'form' | 'processing' | 'success' | 'failed'

export default function CheckoutPage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const bookingId = params.bookingId as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<CheckoutState>('form')

  // Dummy card form state
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const Back = isAr ? ChevronRight : ChevronLeft
  const fmt = isAr ? formatPrice : formatPriceEN

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`)
        const data = await res.json()
        if (data.booking) {
          setBooking(data.booking)
          // If already confirmed, show success
          if (data.booking.status === 'confirmed') {
            setState('success')
          }
        }
      } catch {
        // Error handled
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [bookingId])

  if (loading) return <DetailPageSkeleton />

  if (!booking) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('errors.not_found')}</h2>
        <button
          onClick={() => router.push(`/${locale}/trips`)}
          className="text-accent hover:underline text-sm mt-2"
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  const handlePay = async () => {
    // Basic validation for dummy form
    if (cardNumber.replace(/\s/g, '').length < 16 || expiry.length < 5 || cvv.length < 3) {
      toast({
        title: t('common.error'),
        description: t('errors.invalid_input'),
        variant: 'destructive',
      })
      return
    }

    setState('processing')

    // Simulate 2-second payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        setState('success')
      } else {
        setState('failed')
      }
    } catch {
      setState('failed')
    }
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16)
    return cleaned.replace(/(\d{4})/g, '$1 ').trim()
  }

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4)
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`
    }
    return cleaned
  }

  // Success state
  if (state === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('booking.booking_confirmed')}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t('booking.booking_reference')}: <span className="font-mono font-bold text-foreground">{shortId(bookingId)}</span>
        </p>
        <div className="rounded-xl border bg-card p-5 mb-8 text-start space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('booking.total_amount')}</span>
            <span className="font-semibold">{fmt(booking.total_amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('booking.seats_count')}</span>
            <span>{booking.seats_count}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}/my-bookings/${bookingId}`}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            {t('booking.view_booking')}
          </Link>
          <Link
            href={`/${locale}/my-bookings`}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
          >
            {t('booking.my_bookings_title')}
          </Link>
        </div>
      </div>
    )
  }

  // Processing state
  if (state === 'processing') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="h-10 w-10 text-warning animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('booking.payment_processing')}
        </h2>
        <p className="text-muted-foreground">
          {t('common.loading')}
        </p>
      </div>
    )
  }

  // Failed state
  if (state === 'failed') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('booking.payment_failed')}
        </h2>
        <p className="text-muted-foreground mb-6">
          {t('errors.generic')}
        </p>
        <button
          onClick={() => setState('form')}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          {t('booking.try_again')}
        </button>
      </div>
    )
  }

  // Payment form
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <Back className="h-4 w-4" />
        {t('common.back')}
      </button>

      {/* Order summary */}
      <div className="rounded-xl border bg-card p-5 mb-6 space-y-3">
        <h3 className="font-semibold text-foreground">{t('booking.price_summary')}</h3>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {fmt(booking.price_per_seat)} x {booking.seats_count} {t('common.seats')}
          </span>
          <span>{fmt(booking.total_amount)}</span>
        </div>
        <div className="border-t pt-3 flex justify-between font-semibold text-lg">
          <span>{t('booking.total_amount')}</span>
          <span className="text-accent">{fmt(booking.total_amount)}</span>
        </div>
      </div>

      {/* Dummy credit card form */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">{t('booking.payment_details')}</h3>
        </div>

        {/* Card number */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            {isAr ? 'رقم البطاقة' : 'Card Number'}
          </label>
          <input
            type="text"
            dir="ltr"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {isAr ? 'تاريخ الانتهاء' : 'Expiry'}
            </label>
            <input
              type="text"
              dir="ltr"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              maxLength={5}
              className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* CVV */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              CVV
            </label>
            <input
              type="text"
              dir="ltr"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              maxLength={4}
              className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          className="w-full py-3 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
        >
          <Lock className="h-4 w-4" />
          {isAr ? `دفع ${fmt(booking.total_amount)}` : `Pay ${fmt(booking.total_amount)}`}
        </button>

        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          {isAr ? 'بيئة دفع آمنة ومشفرة' : 'Secure, encrypted payment'}
        </p>
      </div>
    </div>
  )
}
