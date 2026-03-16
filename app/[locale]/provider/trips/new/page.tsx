'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { getTripSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, isValid, parseISO, startOfDay } from 'date-fns'
import { arSA, enUS } from 'date-fns/locale'
import {
  Loader2,
  ImageIcon,
  X,
  Armchair,
  Plane,
  CalendarIcon,
  Clock3,
  ChevronDown,
} from 'lucide-react'

type FormData = z.infer<ReturnType<typeof getTripSchema>>

const parseDateTimeValue = (value?: string) => {
  if (!value) return undefined
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

const getTimeValue = (value?: string) => {
  if (!value) return ''
  return value.slice(11, 16)
}

const TIME_MINUTES = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, '0')
)

const TIME_HOURS_12 = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, '0')
)

type TimeSelectProps = {
  value: string
  onChange: (value: string) => void
  locale: 'ar' | 'en'
}

const to12HourParts = (
  value: string
): { hour: string; minute: string; period: 'AM' | 'PM' } => {
  if (!value) {
    return { hour: '', minute: '', period: 'AM' as 'AM' | 'PM' }
  }

  const [rawHours = '00', minute = '00'] = value.split(':')
  const hours24 = Number(rawHours)
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const normalizedHour = hours24 % 12 || 12

  return {
    hour: String(normalizedHour).padStart(2, '0'),
    minute,
    period,
  }
}

const from12HourParts = (
  hour: string,
  minute: string,
  period: 'AM' | 'PM'
) => {
  if (!hour || !minute) return ''

  const hourNumber = Number(hour)
  const normalizedHour =
    period === 'PM'
      ? hourNumber % 12 + 12
      : hourNumber % 12

  return `${String(normalizedHour).padStart(2, '0')}:${minute}`
}

function TimeSelect({ value, onChange, locale }: TimeSelectProps) {
  const timeParts = to12HourParts(value)
  const hour = timeParts.hour
  const minute = timeParts.minute
  const period: 'AM' | 'PM' = timeParts.period
  const hourLabel = locale === 'ar' ? 'الساعة' : 'Hour'
  const minuteLabel = locale === 'ar' ? 'الدقيقة' : 'Minute'
  const periodLabel = locale === 'ar' ? 'الفترة' : 'AM/PM'
  const placeholder = locale === 'ar' ? 'اختر الوقت' : 'Select time'

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-lg border bg-background px-4 text-sm transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:outline-none',
          value ? 'text-slate-900' : 'text-slate-500'
        )}
      >
        <span>{value ? `${hour}:${minute} ${period}` : placeholder}</span>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4" align="start">
        <div className="grid grid-cols-3 gap-3">
          <div className="relative">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {hourLabel}
            </span>
            <select
              value={hour}
              onChange={(e) => onChange(from12HourParts(e.target.value, minute || '00', period))}
              className="h-10 w-full appearance-none rounded-lg border bg-background px-3 pe-8 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{'--'}</option>
              {TIME_HOURS_12.map((hourOption) => (
                <option key={hourOption} value={hourOption}>
                  {hourOption}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-3 top-[34px] h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {minuteLabel}
            </span>
            <select
              value={minute}
              onChange={(e) => onChange(from12HourParts(hour || '12', e.target.value, period))}
              className="h-10 w-full appearance-none rounded-lg border bg-background px-3 pe-8 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{'--'}</option>
              {TIME_MINUTES.map((minuteOption) => (
                <option key={minuteOption} value={minuteOption}>
                  {minuteOption}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-3 top-[34px] h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {periodLabel}
            </span>
            <select
              value={period}
              onChange={(e) => onChange(from12HourParts(hour || '12', minute || '00', e.target.value as 'AM' | 'PM'))}
              className="h-10 w-full appearance-none rounded-lg border bg-background px-3 pe-8 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
            <ChevronDown className="pointer-events-none absolute end-3 top-[34px] h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function NewTripPage() {
  const t = useTranslations('provider')
  const tt = useTranslations('trips')
  const tc = useTranslations('common')
  const locale = useLocale() as 'ar' | 'en'
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(getTripSchema(locale)),
    defaultValues: {
      listing_type: 'seats',
      trip_type: 'one_way',
      cabin_class: 'economy',
      currency: 'SAR',
      total_seats: 1,
      price_per_seat: 0,
    },
  })

  const tripType = watch('trip_type')
  const listingType = watch('listing_type')
  const currency = watch('currency')
  const departureAt = watch('departure_at')
  const returnAt = watch('return_at')
  const departureDate = parseDateTimeValue(departureAt)
  const returnDate = parseDateTimeValue(returnAt)
  const departureTime = getTimeValue(departureAt)
  const returnTime = getTimeValue(returnAt)

  useEffect(() => {
    if (tripType === 'one_way' && returnAt) {
      setValue('return_at', '', { shouldDirty: true, shouldValidate: true })
    }
  }, [tripType, returnAt, setValue])

  const updateDateTimeField = (field: 'departure_at' | 'return_at', nextDate?: Date, nextTime?: string) => {
    const currentValue = field === 'departure_at' ? departureAt : returnAt
    const fallbackDate = parseDateTimeValue(currentValue) ?? new Date()
    const sourceDate = nextDate ?? fallbackDate
    const time = nextTime ?? getTimeValue(currentValue) ?? '00:00'
    const [hours, minutes] = (time || '00:00').split(':')
    const merged = new Date(sourceDate)
    merged.setHours(Number(hours || 0), Number(minutes || 0), 0, 0)

    setValue(field, format(merged, "yyyy-MM-dd'T'HH:mm"), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const clearDateTimeField = (field: 'departure_at' | 'return_at') => {
    setValue(field, '', { shouldDirty: true, shouldValidate: true })
  }

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
        {/* Listing Type */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{t('listing_type')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <label
              className={cn(
                'flex flex-col items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all',
                listingType === 'seats'
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <input
                type="radio"
                value="seats"
                {...register('listing_type')}
                className="sr-only"
              />
              <Armchair className={cn('h-8 w-8', listingType === 'seats' ? 'text-primary' : 'text-slate-400')} />
              <span className={cn('font-bold text-sm', listingType === 'seats' ? 'text-primary' : 'text-slate-700')}>
                {t('listing_seats')}
              </span>
              <span className="text-xs text-muted-foreground text-center">{t('listing_seats_desc')}</span>
            </label>
            <label
              className={cn(
                'flex flex-col items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all',
                listingType === 'trip'
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <input
                type="radio"
                value="trip"
                {...register('listing_type')}
                className="sr-only"
              />
              <Plane className={cn('h-8 w-8', listingType === 'trip' ? 'text-primary' : 'text-slate-400')} />
              <span className={cn('font-bold text-sm', listingType === 'trip' ? 'text-primary' : 'text-slate-700')}>
                {t('listing_trip')}
              </span>
              <span className="text-xs text-muted-foreground text-center">{t('listing_trip_desc')}</span>
            </label>
          </div>
        </div>

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
              <input type="hidden" {...register('departure_at')} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      'flex h-11 w-full items-center justify-between rounded-lg border bg-background px-4 text-sm transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:outline-none',
                      departureDate ? 'text-slate-900' : 'text-slate-500'
                    )}
                  >
                    {departureDate
                      ? format(departureDate, 'PPP', { locale: locale === 'ar' ? arSA : enUS })
                      : <span>{tt('departure_date')}</span>}
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={(date) => date ? updateDateTimeField('departure_at', date) : clearDateTimeField('departure_at')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <div className="ps-10">
                      <TimeSelect
                        value={departureTime}
                        locale={locale}
                        onChange={(value) => updateDateTimeField('departure_at', undefined, value)}
                      />
                    </div>
                </div>
              </div>
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
                <input type="hidden" {...register('return_at')} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        'flex h-11 w-full items-center justify-between rounded-lg border bg-background px-4 text-sm transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:outline-none',
                        returnDate ? 'text-slate-900' : 'text-slate-500'
                      )}
                    >
                      {returnDate
                        ? format(returnDate, 'PPP', { locale: locale === 'ar' ? arSA : enUS })
                        : <span>{tt('return_date')}</span>}
                      <CalendarIcon className="h-4 w-4 opacity-60" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={(date) => date ? updateDateTimeField('return_at', date) : clearDateTimeField('return_at')}
                        disabled={(date) => Boolean(departureDate && startOfDay(date) < startOfDay(departureDate))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <div className="ps-10">
                      <TimeSelect
                        value={returnTime}
                        locale={locale}
                        onChange={(value) => updateDateTimeField('return_at', undefined, value)}
                      />
                    </div>
                  </div>
                </div>
                {errors.return_at && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.return_at.message}
                  </p>
                )}
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
                {tc('currency')} *
              </label>
              <select
                {...register('currency')}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="SAR">{tc('sar')} (SAR)</option>
                <option value="USD">{tc('usd')} (USD)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tt('price_per_seat')} ({currency === 'USD' ? tc('usd') : tc('sar')}) *
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
