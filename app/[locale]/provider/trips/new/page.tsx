'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { tripSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import {
  Loader2,
  Upload,
  ImageIcon,
  X,
} from 'lucide-react'

type FormData = z.infer<typeof tripSchema>

export default function NewTripPage() {
  const t = useTranslations('provider')
  const tt = useTranslations('trips')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      trip_type: 'one_way',
      cabin_class: 'economy',
      total_seats: 1,
      price_per_seat: 0,
    },
  })

  const tripType = watch('trip_type')

  function handleImageChange(file: File | null) {
    setImageFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    } else {
      setImagePreview(null)
    }
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value))
        }
      })

      if (imageFile) {
        formData.append('image', imageFile)
      }

      const res = await fetch('/api/trips', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        toast({
          title: result.error || tc('error'),
          variant: 'destructive',
        })
        return
      }

      toast({
        title: tc('success'),
        variant: 'success',
      })
      router.push(`/${locale}/provider/trips`)
    } catch {
      toast({ title: tc('error'), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('new_trip')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Airline & Flight */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{tt('airline')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('airline')} *
              </label>
              <input
                {...register('airline')}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.airline && (
                <p className="text-destructive text-sm mt-1">
                  {errors.airline.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('flight_number')}{' '}
                <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input
                {...register('flight_number')}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {tc('from')} → {tc('to')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('filter_origin')} ({locale === 'ar' ? 'عربي' : 'Arabic'}) *
              </label>
              <input
                {...register('origin_city_ar')}
                dir="rtl"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.origin_city_ar && (
                <p className="text-destructive text-sm mt-1">
                  {errors.origin_city_ar.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('filter_origin')} ({locale === 'ar' ? 'إنجليزي' : 'English'}){' '}
                <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input
                {...register('origin_city_en')}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                IATA ({tc('from')}){' '}
                <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input
                {...register('origin_code')}
                dir="ltr"
                maxLength={3}
                placeholder="e.g. RUH"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
              />
            </div>
          </div>

          <hr />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('filter_destination')} ({locale === 'ar' ? 'عربي' : 'Arabic'}) *
              </label>
              <input
                {...register('destination_city_ar')}
                dir="rtl"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.destination_city_ar && (
                <p className="text-destructive text-sm mt-1">
                  {errors.destination_city_ar.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('filter_destination')} ({locale === 'ar' ? 'إنجليزي' : 'English'}){' '}
                <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input
                {...register('destination_city_en')}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                IATA ({tc('to')}){' '}
                <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input
                {...register('destination_code')}
                dir="ltr"
                maxLength={3}
                placeholder="e.g. JED"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
              />
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{tt('trip_type')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('trip_type')} *
              </label>
              <select
                {...register('trip_type')}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="one_way">{tt('one_way')}</option>
                <option value="round_trip">{tt('round_trip')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('cabin_class')} *
              </label>
              <select
                {...register('cabin_class')}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="economy">{tt('economy')}</option>
                <option value="business">{tt('business')}</option>
                <option value="first">{tt('first')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('departure')} *
              </label>
              <input
                type="datetime-local"
                {...register('departure_at')}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.departure_at && (
                <p className="text-destructive text-sm mt-1">
                  {errors.departure_at.message}
                </p>
              )}
            </div>
            {tripType === 'round_trip' && (
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  {tt('return_date')}{' '}
                  <span className="text-muted-foreground">({tc('optional')})</span>
                </label>
                <input
                  type="datetime-local"
                  {...register('return_at')}
                  dir="ltr"
                  className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* Seats & Price */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {tc('seats')} & {tc('price')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('total_seats')} *
              </label>
              <input
                type="number"
                min={1}
                {...register('total_seats', { valueAsNumber: true })}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.total_seats && (
                <p className="text-destructive text-sm mt-1">
                  {errors.total_seats.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('price_per_seat')} ({tc('sar')}) *
              </label>
              <input
                type="number"
                min={1}
                step={0.01}
                {...register('price_per_seat', { valueAsNumber: true })}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.price_per_seat && (
                <p className="text-destructive text-sm mt-1">
                  {errors.price_per_seat.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{tc('description')}</h2>
          <div>
            <label className="text-sm font-medium block mb-1.5">
              {tc('description')} ({locale === 'ar' ? 'عربي' : 'Arabic'}){' '}
              <span className="text-muted-foreground">({tc('optional')})</span>
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
              {tc('description')} ({locale === 'ar' ? 'إنجليزي' : 'English'}){' '}
              <span className="text-muted-foreground">({tc('optional')})</span>
            </label>
            <textarea
              {...register('description_en')}
              dir="ltr"
              rows={3}
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {locale === 'ar' ? 'صورة الرحلة' : 'Trip Image'}{' '}
            <span className="text-muted-foreground text-sm font-normal">
              ({tc('optional')})
            </span>
          </h2>
          {imagePreview ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
              <img
                src={imagePreview}
                alt="Trip preview"
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
            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {locale === 'ar' ? 'اضغط لرفع صورة' : 'Click to upload image'}
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

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('post_trip')}
        </button>
      </form>
    </div>
  )
}
