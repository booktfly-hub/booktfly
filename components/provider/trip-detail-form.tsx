'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations, useLocale } from 'next-intl'
import { resolveApiErrorMessage } from '@/lib/api-error'
import { formatPrice, cn, shortId } from '@/lib/utils'
import { TRIP_STATUS_COLORS, BOOKING_STATUS_COLORS } from '@/lib/constants'
import { toast } from '@/components/ui/toaster'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SeatMap } from '@/components/trips/seat-map'
import { TripPricingPolicyCard } from '@/components/trips/trip-pricing-policy-card'
import { PriceHistoryWidget } from '@/components/provider/price-history-widget'
import { DEFAULT_SEAT_MAP_CONFIG, countSeatMapCapacity, normalizeSeatNumber, parseSeatRowList } from '@/lib/seat-map'
import { format, isValid, parseISO, startOfDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import type { Trip, Booking } from '@/types'
import {
  Loader2,
  Save,
  Power,
  PowerOff,
  ImageIcon,
  X,
  CalendarIcon,
  Clock3,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react'

type EditableFields = {
  airline: string
  flight_number: string
  origin_city_ar: string
  origin_city_en: string
  origin_code: string
  destination_city_ar: string
  destination_city_en: string
  destination_code: string
  departure_at: string
  return_at: string
  cabin_class: string
  listing_type: string
  is_direct: boolean
  price_per_seat: number
  price_per_seat_one_way: number
  total_seats: number
  currency: string
  description_ar: string
  description_en: string
}

type Props = {
  trip: Trip
  bookings: Booking[]
}

const parseDateTimeValue = (value?: string | null) => {
  if (!value) return undefined
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

const getTimeValue = (value?: string | null) => {
  if (!value) return ''
  return value.slice(11, 16)
}

const TIME_MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
const TIME_HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))

const to12HourParts = (value: string) => {
  if (!value) return { hour: '', minute: '', period: 'AM' as 'AM' | 'PM' }
  const [rawHours = '00', minute = '00'] = value.split(':')
  const hours24 = Number(rawHours)
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const normalizedHour = hours24 % 12 || 12
  return { hour: String(normalizedHour).padStart(2, '0'), minute, period }
}

const from12HourParts = (hour: string, minute: string, period: 'AM' | 'PM') => {
  if (!hour || !minute) return ''
  const hourNumber = Number(hour)
  const normalizedHour = period === 'PM' ? hourNumber % 12 + 12 : hourNumber % 12
  return `${String(normalizedHour).padStart(2, '0')}:${minute}`
}

function TimeSelect({ value, onChange, locale }: { value: string; onChange: (v: string) => void; locale: 'ar' | 'en' | 'tr' }) {
  const { hour, minute, period } = to12HourParts(value)
  return (
    <Popover>
      <PopoverTrigger className={cn('flex h-11 w-full items-center justify-between rounded-lg border bg-background px-4 text-sm transition-colors hover:bg-slate-50', value ? 'text-slate-900' : 'text-slate-500')}>
        <span>{value ? `${hour}:${minute} ${period}` : (locale === 'ar' ? 'اختر الوقت' : 'Select time')}</span>
        <ChevronDown className="h-4 w-4 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4" align="start">
        <div className="grid grid-cols-3 gap-3">
          <div className="relative">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{locale === 'ar' ? 'الساعة' : 'Hour'}</span>
            <select value={hour} onChange={(e) => onChange(from12HourParts(e.target.value, minute || '00', period as 'AM' | 'PM'))} className="h-10 w-full appearance-none rounded-lg border bg-background px-3 pe-8 text-sm">
              <option value="">--</option>
              {TIME_HOURS_12.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="relative">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{locale === 'ar' ? 'الدقيقة' : 'Minute'}</span>
            <select value={minute} onChange={(e) => onChange(from12HourParts(hour || '12', e.target.value, period as 'AM' | 'PM'))} className="h-10 w-full appearance-none rounded-lg border bg-background px-3 pe-8 text-sm">
              <option value="">--</option>
              {TIME_MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="relative">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{locale === 'ar' ? 'الفترة' : 'AM/PM'}</span>
            <select value={period} onChange={(e) => onChange(from12HourParts(hour || '12', minute || '00', e.target.value as 'AM' | 'PM'))} className="h-10 w-full appearance-none rounded-lg border bg-background px-3 pe-8 text-sm">
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function TripDetailForm({ trip: initialTrip, bookings }: Props) {
  const t = useTranslations('provider')
  const tt = useTranslations('trips')
  const ts = useTranslations('status')
  const tc = useTranslations('common')
  const te = useTranslations('errors')
  const locale = useLocale() as 'ar' | 'en' | 'tr'
  const initialSeatMapConfig = initialTrip.seat_map_config ?? DEFAULT_SEAT_MAP_CONFIG

  const [trip, setTrip] = useState(initialTrip)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialTrip.image_url)
  const [checkedBaggageKg, setCheckedBaggageKg] = useState<number | ''>(initialTrip.checked_baggage_kg ?? '')
  const [cabinBaggageKg, setCabinBaggageKg] = useState<number | ''>(initialTrip.cabin_baggage_kg ?? '')
  const [mealIncluded, setMealIncluded] = useState(initialTrip.meal_included)
  const [seatSelectionIncluded, setSeatSelectionIncluded] = useState(initialTrip.seat_selection_included)
  const [seatMapEnabled, setSeatMapEnabled] = useState(Boolean(initialTrip.seat_map_enabled && initialTrip.seat_map_config))
  const [seatMapRows, setSeatMapRows] = useState(initialSeatMapConfig.rows)
  const [upFrontRowsText, setUpFrontRowsText] = useState(initialSeatMapConfig.up_front_rows.join(', '))
  const [extraLegroomRowsText, setExtraLegroomRowsText] = useState(initialSeatMapConfig.extra_legroom_rows.join(', '))
  const [blockedSeats, setBlockedSeats] = useState<string[]>(initialSeatMapConfig.blocked_seats)
  const [nameChangeAllowed, setNameChangeAllowed] = useState(initialTrip.name_change_allowed ?? false)
  const [nameChangeFee, setNameChangeFee] = useState<number | ''>(initialTrip.name_change_fee ?? 0)
  const [nameChangeRefundable, setNameChangeRefundable] = useState(initialTrip.name_change_is_refundable ?? true)
  const [childDiscountPct, setChildDiscountPct] = useState<number | ''>(initialTrip.child_discount_percentage ?? 0)
  const [infantDiscountPct, setInfantDiscountPct] = useState<number | ''>(initialTrip.infant_discount_percentage ?? 0)
  const [specialDiscountPct, setSpecialDiscountPct] = useState<number | ''>(initialTrip.special_discount_percentage ?? 0)
  const [specialDiscountLabelAr, setSpecialDiscountLabelAr] = useState(initialTrip.special_discount_label_ar ?? '')
  const [specialDiscountLabelEn, setSpecialDiscountLabelEn] = useState(initialTrip.special_discount_label_en ?? '')
  const [commissionOverride, setCommissionOverride] = useState<number | ''>(initialTrip.commission_rate_override ?? '')

  const hasBookings = bookings.some((b) => b.status === 'confirmed' || b.status === 'payment_processing')

  const { register, handleSubmit, watch, setValue } = useForm<EditableFields>({
    defaultValues: {
      airline: initialTrip.airline,
      flight_number: initialTrip.flight_number || '',
      origin_city_ar: initialTrip.origin_city_ar,
      origin_city_en: initialTrip.origin_city_en || '',
      origin_code: initialTrip.origin_code || '',
      destination_city_ar: initialTrip.destination_city_ar,
      destination_city_en: initialTrip.destination_city_en || '',
      destination_code: initialTrip.destination_code || '',
      departure_at: initialTrip.departure_at,
      return_at: initialTrip.return_at || '',
      cabin_class: initialTrip.cabin_class,
      listing_type: initialTrip.listing_type,
      is_direct: initialTrip.is_direct,
      price_per_seat: initialTrip.price_per_seat,
      price_per_seat_one_way: initialTrip.price_per_seat_one_way || 0,
      total_seats: initialTrip.total_seats,
      currency: initialTrip.currency,
      description_ar: initialTrip.description_ar || '',
      description_en: initialTrip.description_en || '',
    },
  })

  const currency = watch('currency')
  const departureAt = watch('departure_at')
  const returnAt = watch('return_at')
  const departureDate = parseDateTimeValue(departureAt)
  const returnDate = parseDateTimeValue(returnAt)
  const departureTime = getTimeValue(departureAt)
  const returnTime = getTimeValue(returnAt)
  const seatMapConfig = {
    rows: seatMapRows,
    left_columns: initialSeatMapConfig.left_columns,
    right_columns: initialSeatMapConfig.right_columns,
    blocked_seats: blockedSeats,
    up_front_rows: parseSeatRowList(upFrontRowsText).filter((row) => row <= seatMapRows),
    extra_legroom_rows: parseSeatRowList(extraLegroomRowsText).filter((row) => row <= seatMapRows),
  }
  const seatMapCapacity = countSeatMapCapacity(seatMapConfig)

  const updateDateTimeField = (field: 'departure_at' | 'return_at', nextDate?: Date, nextTime?: string) => {
    const currentValue = field === 'departure_at' ? departureAt : returnAt
    const fallbackDate = parseDateTimeValue(currentValue) ?? new Date()
    const sourceDate = nextDate ?? fallbackDate
    const time = nextTime ?? getTimeValue(currentValue) ?? '00:00'
    const [hours, minutes] = (time || '00:00').split(':')
    const merged = new Date(sourceDate)
    merged.setHours(Number(hours || 0), Number(minutes || 0), 0, 0)
    setValue(field, format(merged, "yyyy-MM-dd'T'HH:mm"), { shouldDirty: true })
  }

  function handleImageChange(file: File | null) {
    setImageFile(file)
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImagePreview(trip?.image_url ?? null)
    }
  }

  function toggleBlockedSeat(seatNumber: string) {
    const normalized = normalizeSeatNumber(seatNumber)
    setBlockedSeats((current) =>
      current.includes(normalized)
        ? current.filter((seat) => seat !== normalized)
        : [...current, normalized]
    )
  }

  async function onSubmit(data: EditableFields) {
    setSaving(true)
    try {
      const formData = new FormData()
      const computedTotalSeats = seatMapEnabled ? seatMapCapacity : data.total_seats

      Object.entries(data).forEach(([key, value]) => {
        if (key === 'total_seats') {
          formData.append('total_seats', String(computedTotalSeats))
          return
        }
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value))
        }
      })

      formData.append('checked_baggage_kg', checkedBaggageKg === '' ? '' : String(checkedBaggageKg))
      formData.append('cabin_baggage_kg', cabinBaggageKg === '' ? '' : String(cabinBaggageKg))
      formData.append('meal_included', String(mealIncluded))
      formData.append('name_change_allowed', String(nameChangeAllowed))
      formData.append('name_change_fee', String(nameChangeFee === '' ? 0 : nameChangeFee))
      formData.append('name_change_is_refundable', String(nameChangeRefundable))
      formData.append('child_discount_percentage', String(childDiscountPct === '' ? 0 : childDiscountPct))
      formData.append('infant_discount_percentage', String(infantDiscountPct === '' ? 0 : infantDiscountPct))
      formData.append('special_discount_percentage', String(specialDiscountPct === '' ? 0 : specialDiscountPct))
      formData.append('special_discount_label_ar', specialDiscountLabelAr)
      formData.append('special_discount_label_en', specialDiscountLabelEn)
      formData.append('commission_rate_override', commissionOverride === '' ? '' : String(commissionOverride))
      formData.append('seat_selection_included', String(seatSelectionIncluded))
      formData.append('seat_map_enabled', String(seatMapEnabled))
      if (seatMapEnabled) {
        formData.append('seat_map_config', JSON.stringify(seatMapConfig))
      }

      if (imageFile) {
        formData.append('image', imageFile)
      }

      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        body: formData,
      })
      const result = await res.json()

      if (!res.ok) {
        toast({ title: resolveApiErrorMessage(result.error, te), variant: 'destructive' })
        return
      }

      if (result.pending_approval) {
        toast({
          title: locale === 'ar' ? 'تم إرسال طلب التعديل للمراجعة' : 'Edit request submitted for review',
          variant: 'success',
        })
      } else {
        setTrip(result.data)
        toast({ title: tc('success'), variant: 'success' })
      }
    } catch {
      toast({ title: tc('error'), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus() {
    setToggling(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}/deactivate`, { method: 'PATCH' })
      const result = await res.json()
      if (!res.ok) {
        toast({ title: resolveApiErrorMessage(result.error, te), variant: 'destructive' })
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

  const inputClass = 'w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t('edit_trip')}</h1>
        <span className={cn('px-3 py-1 rounded-full text-sm font-medium', TRIP_STATUS_COLORS[trip.status] || '')}>
          {ts(trip.status)}
        </span>
      </div>

      {hasBookings && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <p className="text-sm font-medium text-warning">
            {locale === 'ar'
              ? 'هذه الرحلة عليها حجوزات. التعديلات ستُرسل للإدارة للموافقة عليها أولاً.'
              : 'This trip has bookings. Changes will be sent to admin for approval first.'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Listing Type */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{t('listing_type')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <select {...register('listing_type')} className={inputClass}>
              <option value="seats">{t('listing_seats')}</option>
              <option value="trip">{t('listing_trip')}</option>
            </select>
          </div>
        </div>

        {/* Airline & Flight */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{tt('airline')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{tt('airline')} *</label>
              <input {...register('airline')} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{tt('flight_number')} <span className="text-muted-foreground">({tc('optional')})</span></label>
              <input {...register('flight_number')} dir="ltr" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{tc('from')} → {tc('to')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{tt('filter_origin')} ({locale === 'ar' ? 'عربي' : 'Arabic'}) *</label>
              <input {...register('origin_city_ar')} dir="rtl" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{tt('filter_origin')} ({locale === 'ar' ? 'إنجليزي' : 'English'})</label>
              <input {...register('origin_city_en')} dir="ltr" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">IATA ({tc('from')})</label>
              <input {...register('origin_code')} dir="ltr" maxLength={3} className={cn(inputClass, 'uppercase')} />
            </div>
          </div>
          <hr />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{tt('filter_destination')} ({locale === 'ar' ? 'عربي' : 'Arabic'}) *</label>
              <input {...register('destination_city_ar')} dir="rtl" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{tt('filter_destination')} ({locale === 'ar' ? 'إنجليزي' : 'English'})</label>
              <input {...register('destination_city_en')} dir="ltr" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">IATA ({tc('to')})</label>
              <input {...register('destination_code')} dir="ltr" maxLength={3} className={cn(inputClass, 'uppercase')} />
            </div>
          </div>
        </div>

        {/* Trip Type & Dates */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{tt('trip_type')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{tt('cabin_class')} *</label>
              <select {...register('cabin_class')} className={inputClass}>
                <option value="economy">{tt('economy')}</option>
                <option value="business">{tt('business')}</option>
                <option value="first">{tt('first')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{tt('departure')} *</label>
              <input type="hidden" {...register('departure_at')} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                <Popover>
                  <PopoverTrigger className={cn('flex h-11 w-full items-center justify-between rounded-lg border bg-background px-4 text-sm', departureDate ? 'text-slate-900' : 'text-slate-500')}>
                    {departureDate ? format(departureDate, 'd MMM yyyy', { locale: enUS }) : <span>{tt('departure_date')}</span>}
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={departureDate} onSelect={(date) => date && updateDateTimeField('departure_at', date)} initialFocus />
                  </PopoverContent>
                </Popover>
                <div className="relative">
                  <Clock3 className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <div className="ps-10">
                    <TimeSelect value={departureTime} locale={locale} onChange={(v) => updateDateTimeField('departure_at', undefined, v)} />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{tt('return_date')} <span className="text-muted-foreground">({tc('optional')})</span></label>
              <input type="hidden" {...register('return_at')} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                <Popover>
                  <PopoverTrigger className={cn('flex h-11 w-full items-center justify-between rounded-lg border bg-background px-4 text-sm', returnDate ? 'text-slate-900' : 'text-slate-500')}>
                    {returnDate ? format(returnDate, 'd MMM yyyy', { locale: enUS }) : <span>{tt('return_date')}</span>}
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={returnDate} onSelect={(date) => date && updateDateTimeField('return_at', date)} disabled={(date) => Boolean(departureDate && startOfDay(date) < startOfDay(departureDate))} initialFocus />
                  </PopoverContent>
                </Popover>
                <div className="relative">
                  <Clock3 className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <div className="ps-10">
                    <TimeSelect value={returnTime} locale={locale} onChange={(v) => updateDateTimeField('return_at', undefined, v)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('is_direct')} id="is_direct" className="rounded" />
            <label htmlFor="is_direct" className="text-sm font-medium">{tt('direct')}</label>
          </div>
        </div>

        {/* Seats & Price */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{tc('seats')} & {tc('price')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{tt('total_seats')} *</label>
              <input
                type="number"
                min={trip.booked_seats}
                {...register('total_seats', { valueAsNumber: true })}
                disabled={seatMapEnabled}
                value={seatMapEnabled ? seatMapCapacity : watch('total_seats')}
                className={inputClass}
              />
              {seatMapEnabled && (
                <p className="text-xs text-slate-500 mt-1">
                  {locale === 'ar' ? 'يتم حساب العدد تلقائياً من خريطة المقاعد.' : 'Calculated automatically from the seat map.'}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{tc('currency')} *</label>
              <select {...register('currency')} className={inputClass}>
                <option value="SAR">{tc('sar')} (SAR)</option>
                <option value="USD">{tc('usd')} (USD)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{locale === 'ar' ? 'سعر المقعد (ذهاب وعودة)' : 'Price Per Seat (Round Trip)'} ({currency === 'USD' ? tc('usd') : tc('sar')}) *</label>
              <input type="number" min={1} step={0.01} {...register('price_per_seat', { valueAsNumber: true })} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {locale === 'ar' ? 'سعر المقعد (ذهاب فقط)' : 'Price Per Seat (One Way)'} ({currency === 'USD' ? tc('usd') : tc('sar')}) *
              </label>
              <input type="number" min={1} step={0.01} {...register('price_per_seat_one_way', { valueAsNumber: true })} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{locale === 'ar' ? 'مزايا الرحلة' : 'Flight Benefits'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{locale === 'ar' ? 'وزن الأمتعة المشحونة (كجم)' : 'Checked baggage (kg)'}</label>
              <input
                type="number"
                min={0}
                value={checkedBaggageKg}
                onChange={(e) => setCheckedBaggageKg(e.target.value ? Number(e.target.value) : '')}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{locale === 'ar' ? 'وزن الأمتعة اليدوية (كجم)' : 'Cabin baggage (kg)'}</label>
              <input
                type="number"
                min={0}
                value={cabinBaggageKg}
                onChange={(e) => setCabinBaggageKg(e.target.value ? Number(e.target.value) : '')}
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={mealIncluded} onChange={(e) => setMealIncluded(e.target.checked)} />
              <span>{locale === 'ar' ? 'تشمل وجبة' : 'Meal included'}</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={seatSelectionIncluded} onChange={(e) => setSeatSelectionIncluded(e.target.checked)} />
              <span>{locale === 'ar' ? 'يشمل اختيار المقعد' : 'Seat selection included'}</span>
            </label>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">{locale === 'ar' ? 'خريطة المقاعد' : 'Seat Map'}</h2>
              <p className="text-sm text-slate-500">
                {locale === 'ar' ? 'فعّلها ليختار العميل المقاعد مباشرة ويتم حجزها تلقائياً.' : 'Enable exact seat selection and automatic seat locking.'}
              </p>
            </div>
            <label className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 sm:w-auto sm:justify-start">
              <input type="checkbox" checked={seatMapEnabled} onChange={(e) => setSeatMapEnabled(e.target.checked)} />
              <span>{locale === 'ar' ? 'تفعيل' : 'Enable'}</span>
            </label>
          </div>

          {seatMapEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">{locale === 'ar' ? 'عدد الصفوف' : 'Rows'}</label>
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={seatMapRows}
                    onChange={(e) => setSeatMapRows(Math.max(1, Math.min(80, Number(e.target.value) || 1)))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{locale === 'ar' ? 'صفوف المقدمة' : 'Up front rows'}</label>
                  <input
                    value={upFrontRowsText}
                    onChange={(e) => setUpFrontRowsText(e.target.value)}
                    placeholder="1,2,3,4,5"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{locale === 'ar' ? 'صفوف المساحة الإضافية' : 'Extra legroom rows'}</label>
                  <input
                    value={extraLegroomRowsText}
                    onChange={(e) => setExtraLegroomRowsText(e.target.value)}
                    placeholder="11,12"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-600 mb-3">
                  {locale === 'ar' ? 'انقر على المقعد لحجبه من البيع. ألوان المقاعد تمثل الفئات المختلفة.' : 'Click a seat to block it from sale. Seat colors represent the configured tiers.'}
                </p>
                <SeatMap config={seatMapConfig} blockedSeatsEditable onSeatClick={toggleBlockedSeat} />
              </div>
            </>
          )}
        </div>

        {/* Description */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{tc('description')}</h2>
          <div>
            <label className="text-sm font-medium block mb-1.5">{tc('description')} ({locale === 'ar' ? 'عربي' : 'Arabic'})</label>
            <textarea {...register('description_ar')} dir="rtl" rows={3} className={cn(inputClass, 'resize-none')} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">{tc('description')} ({locale === 'ar' ? 'إنجليزي' : 'English'})</label>
            <textarea {...register('description_en')} dir="ltr" rows={3} className={cn(inputClass, 'resize-none')} />
          </div>
        </div>

        {/* Image */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{locale === 'ar' ? 'صورة الرحلة' : 'Trip Image'}</h2>
          {imagePreview ? (
            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
              <Image src={imagePreview} alt="Trip" fill sizes="100vw" className="object-cover" unoptimized={imagePreview.startsWith('blob:')} />
              <button type="button" onClick={() => handleImageChange(null)} className="absolute top-2 end-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{locale === 'ar' ? 'اضغط لرفع صورة' : 'Click to upload'}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)} />
            </label>
          )}
        </div>

        {/* Price change history */}
        <PriceHistoryWidget tripId={initialTrip.id} />

        {/* Name-change + discounts + commission override */}
        <TripPricingPolicyCard
          nameChangeAllowed={nameChangeAllowed}
          onNameChangeAllowedChange={setNameChangeAllowed}
          nameChangeFee={nameChangeFee}
          onNameChangeFeeChange={setNameChangeFee}
          nameChangeRefundable={nameChangeRefundable}
          onNameChangeRefundableChange={setNameChangeRefundable}
          childDiscountPct={childDiscountPct}
          onChildDiscountChange={setChildDiscountPct}
          infantDiscountPct={infantDiscountPct}
          onInfantDiscountChange={setInfantDiscountPct}
          specialDiscountPct={specialDiscountPct}
          onSpecialDiscountChange={setSpecialDiscountPct}
          specialDiscountLabelAr={specialDiscountLabelAr}
          onSpecialDiscountLabelArChange={setSpecialDiscountLabelAr}
          specialDiscountLabelEn={specialDiscountLabelEn}
          onSpecialDiscountLabelEnChange={setSpecialDiscountLabelEn}
          commissionOverride={commissionOverride}
          onCommissionOverrideChange={setCommissionOverride}
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {hasBookings ? (locale === 'ar' ? 'إرسال للمراجعة' : 'Submit for Review') : tc('save')}
          </button>

          {(trip.status === 'active' || trip.status === 'deactivated') && (
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={toggling}
              className={cn(
                'px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2',
                trip.status === 'active' ? 'bg-warning/10 text-warning hover:bg-warning/20' : 'bg-success/10 text-success hover:bg-success/20'
              )}
            >
              {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : trip.status === 'active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
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
          <div className="p-8 text-center text-sm text-muted-foreground">{tc('no_results')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-start p-3 font-medium">{locale === 'ar' ? 'المسافر' : 'Passenger'}</th>
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
                      <p className="text-xs text-muted-foreground">{shortId(booking.id)}</p>
                    </td>
                    <td className="p-3">{booking.seats_count}</td>
                    <td className="p-3 font-medium">{formatPrice(booking.total_amount, trip.currency)}</td>
                    <td className="p-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', BOOKING_STATUS_COLORS[booking.status] || '')}>
                        {ts(booking.status)}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {new Date(booking.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
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
