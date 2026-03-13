'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { formatPrice, cn, shortId } from '@/lib/utils'
import { TRIP_STATUS_COLORS, BOOKING_STATUS_COLORS } from '@/lib/constants'
import { toast } from '@/components/ui/toaster'
import type { Trip, Booking } from '@/types'
import {
  Loader2,
  Save,
  Power,
  PowerOff,
  ImageIcon,
  X,
} from 'lucide-react'

type EditableFields = {
  price_per_seat: number
  total_seats: number
  description_ar: string
  description_en: string
}

type Props = {
  trip: Trip
  bookings: Booking[]
}

export function TripDetailForm({ trip: initialTrip, bookings }: Props) {
  const t = useTranslations('provider')
  const tt = useTranslations('trips')
  const ts = useTranslations('status')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const [trip, setTrip] = useState(initialTrip)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialTrip.image_url)

  const { register, handleSubmit } = useForm<EditableFields>({
    defaultValues: {
      price_per_seat: initialTrip.price_per_seat,
      total_seats: initialTrip.total_seats,
      description_ar: initialTrip.description_ar || '',
      description_en: initialTrip.description_en || '',
    },
  })

  function handleImageChange(file: File | null) {
    setImageFile(file)
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImagePreview(trip?.image_url ?? null)
    }
  }

  async function onSubmit(data: EditableFields) {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('price_per_seat', String(data.price_per_seat))
      formData.append('total_seats', String(data.total_seats))
      formData.append('description_ar', data.description_ar)
      formData.append('description_en', data.description_en)
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        body: formData,
      })
      const result = await res.json()

      if (!res.ok) {
        toast({ title: result.error || tc('error'), variant: 'destructive' })
        return
      }

      setTrip(result.data)
      toast({ title: tc('success'), variant: 'success' })
    } catch {
      toast({ title: tc('error'), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus() {
    setToggling(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}/deactivate`, {
        method: 'PATCH',
      })
      const result = await res.json()

      if (!res.ok) {
        toast({ title: result.error || tc('error'), variant: 'destructive' })
        return
      }

      setTrip(result.data)
      toast({ title: tc('success'), variant: 'success' })
    } catch {
      toast({ title: tc('error'), variant: 'destructive' })
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('edit_trip')}</h1>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            TRIP_STATUS_COLORS[trip.status] || ''
          )}
        >
          {ts(trip.status)}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Immutable Fields (display only) */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {locale === 'ar' ? 'بيانات الرحلة' : 'Trip Information'}
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{tt('airline')}</p>
              <p className="font-medium">{trip.airline}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{tt('flight_number')}</p>
              <p className="font-medium">{trip.flight_number || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{tc('from')}</p>
              <p className="font-medium">
                {locale === 'ar'
                  ? trip.origin_city_ar
                  : trip.origin_city_en || trip.origin_city_ar}
                {trip.origin_code && ` (${trip.origin_code})`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{tc('to')}</p>
              <p className="font-medium">
                {locale === 'ar'
                  ? trip.destination_city_ar
                  : trip.destination_city_en || trip.destination_city_ar}
                {trip.destination_code && ` (${trip.destination_code})`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{tt('departure')}</p>
              <p className="font-medium">
                {new Date(trip.departure_at).toLocaleString(
                  locale === 'ar' ? 'ar-SA' : 'en-US'
                )}
              </p>
            </div>
            {trip.return_at && (
              <div>
                <p className="text-muted-foreground">{tt('return_date')}</p>
                <p className="font-medium">
                  {new Date(trip.return_at).toLocaleString(
                    locale === 'ar' ? 'ar-SA' : 'en-US'
                  )}
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">{tt('trip_type')}</p>
              <p className="font-medium">{tt(trip.trip_type)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{tt('cabin_class')}</p>
              <p className="font-medium">{tt(trip.cabin_class)}</p>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {locale === 'ar' ? 'بيانات قابلة للتعديل' : 'Editable Fields'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('price_per_seat')} ({tc('sar')})
              </label>
              <input
                type="number"
                min={1}
                step={0.01}
                {...register('price_per_seat', { valueAsNumber: true })}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('total_seats')}
              </label>
              <input
                type="number"
                min={trip.booked_seats}
                {...register('total_seats', { valueAsNumber: true })}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">
              {tc('description')} ({locale === 'ar' ? 'عربي' : 'Arabic'})
            </label>
            <textarea
              {...register('description_ar')}
              dir="rtl"
              rows={3}
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">
              {tc('description')} ({locale === 'ar' ? 'إنجليزي' : 'English'})
            </label>
            <textarea
              {...register('description_en')}
              dir="ltr"
              rows={3}
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Image */}
          <div>
            <label className="text-sm font-medium block mb-1.5">
              {locale === 'ar' ? 'صورة الرحلة' : 'Trip Image'}
            </label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                <img
                  src={imagePreview}
                  alt="Trip"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleImageChange(null)}
                  className="absolute top-2 end-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {locale === 'ar' ? 'اضغط لرفع صورة' : 'Click to upload'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) =>
                    handleImageChange(e.target.files?.[0] ?? null)
                  }
                />
              </label>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {tc('save')}
          </button>

          {(trip.status === 'active' || trip.status === 'deactivated') && (
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={toggling}
              className={cn(
                'px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2',
                trip.status === 'active'
                  ? 'bg-warning/10 text-warning hover:bg-warning/20'
                  : 'bg-success/10 text-success hover:bg-success/20'
              )}
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : trip.status === 'active' ? (
                <PowerOff className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              {trip.status === 'active' ? t('deactivate') : t('reactivate')}
            </button>
          )}
        </div>
      </form>

      {/* Bookings for this trip */}
      <div className="bg-card border rounded-xl">
        <div className="p-5 border-b">
          <h2 className="font-semibold">{tc('bookings')}</h2>
        </div>
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {tc('no_results')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-start p-3 font-medium">
                    {locale === 'ar' ? 'المسافر' : 'Passenger'}
                  </th>
                  <th className="text-start p-3 font-medium">{tc('seats')}</th>
                  <th className="text-start p-3 font-medium">{tc('total')}</th>
                  <th className="text-start p-3 font-medium">{tc('status')}</th>
                  <th className="text-start p-3 font-medium">{tc('date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/20">
                    <td className="p-3">
                      <p className="font-medium">{booking.passenger_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shortId(booking.id)}
                      </p>
                    </td>
                    <td className="p-3">{booking.seats_count}</td>
                    <td className="p-3 font-medium">
                      {formatPrice(booking.total_amount)}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          BOOKING_STATUS_COLORS[booking.status] || ''
                        )}
                      >
                        {ts(booking.status)}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {new Date(booking.created_at).toLocaleDateString(
                        locale === 'ar' ? 'ar-SA' : 'en-US'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
