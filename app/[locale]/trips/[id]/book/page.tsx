'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plane,
  ArrowRight,
  ArrowLeft,
  Minus,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  CreditCard,
  IdCard,
} from 'lucide-react'
import { cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { MAX_SEATS_PER_BOOKING } from '@/lib/constants'
import { TRIP_TYPES, CABIN_CLASSES } from '@/lib/constants'
import { DetailPageSkeleton } from '@/components/shared/loading-skeleton'
import { toast } from '@/components/ui/toaster'
import type { Trip } from '@/types'

const bookingFormSchema = z.object({
  passenger_name: z.string().min(2),
  passenger_phone: z.string().min(9),
  passenger_email: z.string().email(),
  passenger_id_number: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingFormSchema>

export default function BookTripPage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = params.id as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [seatsCount, setSeatsCount] = useState(
    parseInt(searchParams.get('seats') || '1', 10)
  )

  const Arrow = isAr ? ArrowLeft : ArrowRight
  const Back = isAr ? ChevronRight : ChevronLeft

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
  })

  useEffect(() => {
    async function fetchTrip() {
      try {
        const res = await fetch(`/api/trips/${tripId}`)
        const data = await res.json()
        if (data.trip) {
          setTrip(data.trip)
        }
      } catch {
        // Error handled
      } finally {
        setLoading(false)
      }
    }
    fetchTrip()
  }, [tripId])

  if (loading) return <DetailPageSkeleton />

  if (!trip || trip.status !== 'active') {
    router.push(`/${locale}/trips/${tripId}`)
    return null
  }

  const remaining = trip.total_seats - trip.booked_seats
  const maxBookable = Math.min(remaining, MAX_SEATS_PER_BOOKING)
  const totalPrice = trip.price_per_seat * seatsCount
  const fmt = isAr ? formatPrice : formatPriceEN

  const originCity = isAr ? trip.origin_city_ar : (trip.origin_city_en || trip.origin_city_ar)
  const destCity = isAr ? trip.destination_city_ar : (trip.destination_city_en || trip.destination_city_ar)

  const departureDate = new Date(trip.departure_at).toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
  )

  const onSubmit = async (data: BookingFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId,
          passenger_name: data.passenger_name,
          passenger_phone: data.passenger_phone,
          passenger_email: data.passenger_email,
          passenger_id_number: data.passenger_id_number || undefined,
          seats_count: seatsCount,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast({
          title: t('common.error'),
          description: result.error || t('errors.generic'),
          variant: 'destructive',
        })
        return
      }

      // Redirect to checkout page
      router.push(`/${locale}/checkout/${result.bookingId}`)
    } catch {
      toast({
        title: t('common.error'),
        description: t('errors.network_error'),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <Back className="h-4 w-4" />
        {t('common.back')}
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-8">{t('booking.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          {/* Trip summary card */}
          <div className="rounded-xl border bg-card p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Plane className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">{trip.airline}</span>
              {trip.flight_number && (
                <span className="text-xs text-muted-foreground">({trip.flight_number})</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{originCity}</span>
              <Arrow className="h-4 w-4 text-accent" />
              <span className="font-semibold">{destCity}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{departureDate}</span>
              <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">
                {isAr ? TRIP_TYPES[trip.trip_type].ar : TRIP_TYPES[trip.trip_type].en}
              </span>
              <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">
                {isAr ? CABIN_CLASSES[trip.cabin_class].ar : CABIN_CLASSES[trip.cabin_class].en}
              </span>
            </div>
          </div>

          {/* Passenger form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <h3 className="font-semibold text-foreground">{t('booking.passenger_details')}</h3>

              {/* Name */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {t('booking.passenger_name')}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  {...register('passenger_name')}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                    errors.passenger_name && 'border-destructive focus:ring-destructive'
                  )}
                />
                {errors.passenger_name && (
                  <p className="text-xs text-destructive mt-1">{t('common.required')}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {t('booking.passenger_phone')}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  {...register('passenger_phone')}
                  type="tel"
                  dir="ltr"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                    errors.passenger_phone && 'border-destructive focus:ring-destructive'
                  )}
                />
                {errors.passenger_phone && (
                  <p className="text-xs text-destructive mt-1">{t('common.required')}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {t('booking.passenger_email')}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  {...register('passenger_email')}
                  type="email"
                  dir="ltr"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                    errors.passenger_email && 'border-destructive focus:ring-destructive'
                  )}
                />
                {errors.passenger_email && (
                  <p className="text-xs text-destructive mt-1">{t('common.required')}</p>
                )}
              </div>

              {/* ID Number (optional) */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
                  {t('booking.passenger_id')}
                  <span className="text-xs text-muted-foreground">({t('common.optional')})</span>
                </label>
                <input
                  {...register('passenger_id_number')}
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Seats selector */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-4">{t('booking.seats_count')}</h3>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSeatsCount(Math.max(1, seatsCount - 1))}
                  disabled={seatsCount <= 1}
                  className="h-10 w-10 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-2xl font-bold w-12 text-center">{seatsCount}</span>
                <button
                  type="button"
                  onClick={() => setSeatsCount(Math.min(maxBookable, seatsCount + 1))}
                  disabled={seatsCount >= maxBookable}
                  className="h-10 w-10 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="text-sm text-muted-foreground">
                  ({remaining} {t('trips.seats_remaining')})
                </span>
              </div>
            </div>

            {/* Submit button (visible on mobile, hidden on desktop since sidebar has it) */}
            <button
              type="submit"
              disabled={submitting}
              className="lg:hidden w-full py-3 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {submitting ? t('common.loading') : t('booking.proceed_to_payment')}
            </button>
          </form>
        </div>

        {/* Sidebar: Price summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-xl border bg-card p-6 space-y-5">
            <h3 className="font-semibold text-foreground">{t('booking.price_summary')}</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('trips.price_per_seat')}</span>
                <span>{fmt(trip.price_per_seat)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('booking.seats_count')}</span>
                <span>{seatsCount}</span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between font-semibold text-lg">
                <span>{t('booking.total_amount')}</span>
                <span className="text-accent">{fmt(totalPrice)}</span>
              </div>
            </div>

            {/* Desktop submit */}
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={submitting}
              className="hidden lg:flex w-full py-3 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors disabled:opacity-60 items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {submitting ? t('common.loading') : t('booking.proceed_to_payment')}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              {t('booking.terms_agreement')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
