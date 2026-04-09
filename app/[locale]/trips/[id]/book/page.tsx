'use client'

import { Suspense, useCallback, useEffect, useRef, useState, use } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { arSA, enUS } from 'date-fns/locale'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { resolveApiErrorMessage } from '@/lib/api-error'
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
  Calendar,
  ShieldCheck,
  CheckCircle,
  Cake,
  IdCard,
  CalendarIcon,
  ScanLine,
  ImagePlus,
} from 'lucide-react'
import { capitalizeFirst, cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { MAX_SEATS_PER_BOOKING } from '@/lib/constants'
import { TRIP_TYPES, CABIN_CLASSES, BOOKING_TYPES } from '@/lib/constants'
import { BookingPageSkeleton } from '@/components/shared/loading-skeleton'
import { bookingContactSchema, getBookingSchema, passengerSchema } from '@/lib/validations'
import { Calendar as DateCalendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/components/ui/toaster'
import { SeatMap } from '@/components/trips/seat-map'
import { ProgressStepper } from '@/components/bookings/progress-stepper'
import { TrustBadges } from '@/components/bookings/trust-badges'
import { PriceBreakdown } from '@/components/bookings/price-breakdown'
import type { Trip } from '@/types'

type PassengerFormData = z.infer<typeof passengerSchema>
type BookingContactFormData = z.infer<typeof bookingContactSchema>
type BookingFormData = {
  contact: BookingContactFormData
  passengers: PassengerFormData[]
}

export default function BookTripPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
  return (
    <Suspense fallback={<BookingPageSkeleton />}>
      <BookTripContent params={params} />
    </Suspense>
  )
}

function BookTripContent({ params }: { params: Promise<{ id: string, locale: string }> }) {
  const t = useTranslations()
  const te = useTranslations('errors')
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const router = useRouter()
  const searchParams = useSearchParams()
  const { id: tripId } = use(params)

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const initialSeatsCount = parseInt(searchParams.get('seats') || '1', 10)
  const initialBookingType = searchParams.get('bookingType') === 'one_way' ? 'one_way' : 'round_trip'
  const [seatsCount, setSeatsCount] = useState(initialSeatsCount)
  const [bookingType] = useState<'round_trip' | 'one_way'>(initialBookingType)
  const [scanningIndex, setScanningIndex] = useState<number | null>(null)
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>([])
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const Arrow = isAr ? ArrowLeft : ArrowRight
  const Back = isAr ? ChevronRight : ChevronLeft

  const defaultPassenger: PassengerFormData = {
    first_name: '',
    last_name: '',
    date_of_birth: '',
    id_number: '',
    id_expiry_date: '',
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(
      getBookingSchema(locale).pick({ contact: true, passengers: true })
    ),
    defaultValues: {
      contact: {
        phone: '',
        email: '',
      },
      passengers: Array(initialSeatsCount).fill(defaultPassenger),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'passengers',
  })

  const seatMapEnabled = Boolean(trip?.seat_map_enabled && trip?.seat_map_config)
  const desiredPassengerCount = seatMapEnabled
    ? Math.max(selectedSeatNumbers.length, 1)
    : seatsCount

  useEffect(() => {
    const currentCount = fields.length
    if (desiredPassengerCount > currentCount) {
      append(Array(desiredPassengerCount - currentCount).fill(defaultPassenger))
    } else if (desiredPassengerCount < currentCount) {
      for (let i = currentCount - 1; i >= desiredPassengerCount; i--) {
        remove(i)
      }
    }
  }, [desiredPassengerCount])

  useEffect(() => {
    if (!seatMapEnabled) return
    setSeatsCount(Math.max(selectedSeatNumbers.length, 1))
    selectedSeatNumbers.forEach((seat, index) => {
      setValue(`passengers.${index}.seat_number`, seat, { shouldDirty: true })
    })
  }, [seatMapEnabled, selectedSeatNumbers, setValue])

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

  const handlePassportScan = useCallback(async (index: number, files: FileList | null) => {
    if (!files?.length) return
    setScanningIndex(index)
    try {
      const formData = new FormData()
      Array.from(files).forEach((f) => formData.append('images', f))
      const res = await fetch('/api/extract-passport', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok) {
        toast({
          title: isAr ? 'خطأ' : 'Error',
          description: resolveApiErrorMessage(result.error, te, 'image_process_failed'),
          variant: 'destructive',
        })
        return
      }
      const d = result.data
      if (d.first_name) setValue(`passengers.${index}.first_name`, d.first_name, { shouldValidate: true, shouldDirty: true })
      if (d.last_name) setValue(`passengers.${index}.last_name`, d.last_name, { shouldValidate: true, shouldDirty: true })
      if (d.date_of_birth) setValue(`passengers.${index}.date_of_birth`, d.date_of_birth, { shouldValidate: true, shouldDirty: true })
      if (d.id_number) setValue(`passengers.${index}.id_number`, d.id_number, { shouldValidate: true, shouldDirty: true })
      if (d.id_expiry_date) setValue(`passengers.${index}.id_expiry_date`, d.id_expiry_date, { shouldValidate: true, shouldDirty: true })
      toast({ title: isAr ? 'تم' : 'Done', description: isAr ? 'تم استخراج بيانات الجواز بنجاح' : 'Passport data extracted successfully' })
    } catch {
      toast({ title: isAr ? 'خطأ' : 'Error', description: isAr ? 'فشل قراءة الجواز' : 'Failed to read passport', variant: 'destructive' })
    } finally {
      setScanningIndex(null)
      if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = ''
    }
  }, [setValue, isAr])

  if (loading) return <BookingPageSkeleton />

  if (!trip || trip.status !== 'active') {
    router.push(`/${locale}/trips/${tripId}`)
    return null
  }

  const remaining = trip.total_seats - trip.booked_seats
  const maxBookable = Math.min(remaining, MAX_SEATS_PER_BOOKING)
  const resolvedBookingType = bookingType
  const billedSeatsCount = seatMapEnabled ? selectedSeatNumbers.length : seatsCount
  const effectivePrice = resolvedBookingType === 'one_way' && trip.price_per_seat_one_way
    ? trip.price_per_seat_one_way
    : trip.price_per_seat
  const totalPrice = effectivePrice * billedSeatsCount
  const fmt = (amount: number) => isAr ? formatPrice(amount, trip.currency) : formatPriceEN(amount, trip.currency)

  const originCity = isAr ? trip.origin_city_ar : capitalizeFirst(trip.origin_city_en || trip.origin_city_ar)
  const destCity = isAr ? trip.destination_city_ar : capitalizeFirst(trip.destination_city_en || trip.destination_city_ar)

  const departureDate = new Date(trip.departure_at).toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  )

  const toggleSeat = (seatNumber: string) => {
    if (!seatMapEnabled) return
    setSelectedSeatNumbers((current) => {
      if (current.includes(seatNumber)) {
        return current.filter((seat) => seat !== seatNumber)
      }
      if (current.length >= maxBookable) {
        return current
      }
      return [...current, seatNumber]
    })
  }

  const onSubmit = async (data: BookingFormData) => {
    if (seatMapEnabled && selectedSeatNumbers.length === 0) {
      toast({
        title: t('common.error'),
        description: isAr ? 'اختر مقعداً واحداً على الأقل قبل متابعة الحجز' : 'Select at least one seat before continuing',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const enrichedPassengers = data.passengers.map((passenger, index) => ({
        ...passenger,
        seat_number: selectedSeatNumbers[index],
      }))
      const firstPassenger = enrichedPassengers[0]
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId,
          passenger_name: `${firstPassenger.first_name} ${firstPassenger.last_name}`,
          passenger_phone: data.contact.phone,
          passenger_email: data.contact.email,
          seats_count: seatMapEnabled ? selectedSeatNumbers.length : seatsCount,
          contact: data.contact,
          passengers: enrichedPassengers,
          selected_seat_numbers: selectedSeatNumbers,
          booking_type: resolvedBookingType,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast({
          title: t('common.error'),
          description: resolveApiErrorMessage(result.error, te),
          variant: 'destructive',
        })
        return
      }

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

  const inputClass = 'w-full h-12 md:h-14 px-4 md:px-5 rounded-xl md:rounded-2xl bg-slate-50 border-none text-slate-900 text-base md:text-lg font-semibold focus:ring-2 focus:ring-primary focus:outline-none transition-colors hover:bg-slate-100'
  const errorInputClass = 'ring-2 ring-destructive bg-destructive/5'
  const labelClass = 'flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest'
  const localeDate = isAr ? arSA : enUS
  const parseDateValue = (value: string) => {
    if (!value) return undefined
    const parsed = parseISO(value)
    return isValid(parsed) ? parsed : undefined
  }

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 md:pt-32 lg:pt-36 lg:pb-12 animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={() => router.push(`/${locale}/trips/${tripId}`)}
        className="group inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 md:mb-8 transition-colors"
      >
        <div className="p-1.5 md:p-2 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
            <Back className="h-3 w-3 md:h-4 md:w-4 rtl:rotate-180" />
        </div>
        {t('common.back')}
      </button>

      {/* Progress Stepper */}
      <ProgressStepper currentStep={2} className="mb-8" />

      <div className="mb-8 md:mb-10">
         <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">{t('booking.title')}</h1>
         <p className="text-sm md:text-lg text-slate-500 font-medium">{isAr ? 'أدخل بيانات المسافرين لإتمام الحجز' : 'Enter passenger details to complete your booking'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Form Area */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8">

          {/* Trip summary card (Mini Ticket) */}
          <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />

             <div className="flex-1 ml-4 rtl:ml-0 rtl:mr-4">
                 <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                        <Plane className="h-4 w-4 md:h-5 md:w-5 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 block leading-none mb-1 truncate">{trip.airline}</span>
                        {trip.flight_number && (
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest">{trip.flight_number}</span>
                        )}
                    </div>
                 </div>

                 <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                    <span className="text-base sm:text-lg md:text-xl font-black text-slate-900 truncate">{originCity}</span>
                    <Arrow className="h-4 w-4 md:h-5 md:w-5 text-slate-300 rtl:rotate-180 shrink-0" />
                    <span className="text-base sm:text-lg md:text-xl font-black text-slate-900 truncate">{destCity}</span>
                 </div>
             </div>

             <div className="hidden sm:block w-px h-12 md:h-16 bg-slate-100" />

             <div className="flex flex-row sm:flex-col gap-2 md:gap-3 sm:min-w-[160px] md:min-w-[200px] overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold text-slate-600 bg-slate-50 px-2.5 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg border border-slate-100 whitespace-nowrap">
                    <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-400 shrink-0" />
                    <span>{departureDate}</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="px-2 md:px-3 py-1 rounded-md md:rounded-lg bg-primary/5 border border-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                        {isAr ? TRIP_TYPES[trip.trip_type].ar : TRIP_TYPES[trip.trip_type].en}
                    </span>
                    <span className="px-2 md:px-3 py-1 rounded-md md:rounded-lg bg-accent/5 border border-accent/10 text-accent text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                        {isAr ? CABIN_CLASSES[trip.cabin_class].ar : CABIN_CLASSES[trip.cabin_class].en}
                    </span>
                    <span className="px-2 md:px-3 py-1 rounded-md md:rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                      {isAr ? BOOKING_TYPES[resolvedBookingType].ar : BOOKING_TYPES[resolvedBookingType].en}
                    </span>
                </div>
             </div>
          </div>

          {/* Booking form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8" id="booking-form">
            <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-2 md:gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900">
                    {isAr ? 'بيانات التواصل الأساسية' : 'Primary Contact Details'}
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    {isAr ? 'تُستخدم للتواصل بخصوص الحجز فقط' : 'Used only for booking communication'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                  <label className={labelClass}>
                    <Phone className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    {isAr ? 'رقم الجوال' : 'Phone Number'}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('contact.phone')}
                    type="tel"
                    dir="ltr"
                    className={cn(inputClass, 'font-mono font-medium', errors.contact?.phone && errorInputClass)}
                    placeholder="+966 50 000 0000"
                  />
                  {errors.contact?.phone && (
                    <p className="text-xs font-bold text-destructive mt-1">{errors.contact.phone.message}</p>
                  )}
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className={labelClass}>
                    <Mail className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('contact.email')}
                    type="email"
                    dir="ltr"
                    className={cn(inputClass, errors.contact?.email && errorInputClass)}
                    placeholder="user@example.com"
                  />
                  {errors.contact?.email && (
                    <p className="text-xs font-bold text-destructive mt-1">{errors.contact.email.message}</p>
                  )}
                </div>
              </div>
            </div>

            {seatMapEnabled && trip.seat_map_config && (
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-2 md:gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Plane className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900">
                      {isAr ? 'اختيار المقاعد' : 'Seat Selection'}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">
                      {isAr ? 'المقاعد المحجوزة أو غير المتاحة ظاهرة بلون مختلف وتُقفل تلقائياً.' : 'Unavailable seats are disabled automatically based on existing reservations.'}
                    </p>
                  </div>
                </div>
                <SeatMap
                  config={trip.seat_map_config}
                  selectedSeats={selectedSeatNumbers}
                  unavailableSeats={trip.unavailable_seat_numbers || []}
                  onSeatClick={toggleSeat}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedSeatNumbers.length > 0 ? selectedSeatNumbers.map((seat) => (
                    <span key={seat} className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                      {isAr ? 'المقعد' : 'Seat'} {seat}
                    </span>
                  )) : (
                    <span className="text-sm text-slate-500">
                      {isAr ? 'اختر مقعداً واحداً أو أكثر للمتابعة.' : 'Select one or more seats to continue.'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-8 md:p-10 shadow-xl shadow-slate-200/40">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
                   <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-lg md:text-xl font-black text-primary">{index + 1}</span>
                   </div>
                   <div>
                     <h3 className="text-xl md:text-2xl font-black text-slate-900">
                       {t('booking.passenger_number', { number: index + 1 })}
                     </h3>
                     {seatMapEnabled && selectedSeatNumbers[index] && (
                       <p className="text-sm font-semibold text-primary">
                         {isAr ? `المقعد ${selectedSeatNumbers[index]}` : `Seat ${selectedSeatNumbers[index]}`}
                       </p>
                     )}
                   </div>
                </div>
                <div className="mb-4 md:mb-5 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs md:text-sm font-semibold text-amber-700">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  {isAr ? 'يرجى إدخال جميع بيانات المسافر باللغة الإنجليزية كما في جواز السفر' : 'Please enter all passenger details in English as shown on the passport'}
                </div>

                <div className="mb-6 md:mb-8">
                  <input
                    ref={(el) => { fileInputRefs.current[index] = el }}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePassportScan(index, e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    disabled={scanningIndex !== null}
                    className={cn(
                      'w-full flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-4 md:py-5 transition-all font-bold text-sm md:text-base',
                      scanningIndex === index
                        ? 'border-primary bg-primary/5 text-primary cursor-wait'
                        : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:border-primary hover:bg-primary/5 hover:text-primary'
                    )}
                  >
                    {scanningIndex === index ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {isAr ? 'جاري قراءة الجواز...' : 'Reading passport...'}
                      </>
                    ) : (
                      <>
                        <ScanLine className="h-5 w-5" />
                        {isAr ? 'مسح الجواز أو الهوية بالصورة' : 'Scan passport or ID from photo'}
                        <ImagePlus className="h-4 w-4 opacity-50" />
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    {/* First Name */}
                    <div className="space-y-1.5 md:space-y-2">
                      <label className={labelClass}>
                        <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        {isAr ? 'الاسم الأول (بالإنجليزية)' : 'First Name (English)'}
                        <span className="text-destructive">*</span>
                      </label>
                      <input
                        {...register(`passengers.${index}.first_name`)}
                        dir="ltr"
                        className={cn(inputClass, errors.passengers?.[index]?.first_name && errorInputClass)}
                        placeholder="First Name"
                        onInput={(e) => {
                          const el = e.currentTarget
                          const cleaned = el.value.replace(/[^a-zA-Z\s\-'.]/g, '')
                          if (cleaned !== el.value) el.value = cleaned
                        }}
                      />
                      {errors.passengers?.[index]?.first_name && (
                        <p className="text-xs font-bold text-destructive mt-1">{errors.passengers[index].first_name.message}</p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-1.5 md:space-y-2">
                      <label className={labelClass}>
                        <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        {isAr ? 'الاسم الأخير (بالإنجليزية)' : 'Last Name (English)'}
                        <span className="text-destructive">*</span>
                      </label>
                      <input
                        {...register(`passengers.${index}.last_name`)}
                        dir="ltr"
                        className={cn(inputClass, errors.passengers?.[index]?.last_name && errorInputClass)}
                        placeholder="Last Name"
                        onInput={(e) => {
                          const el = e.currentTarget
                          const cleaned = el.value.replace(/[^a-zA-Z\s\-'.]/g, '')
                          if (cleaned !== el.value) el.value = cleaned
                        }}
                      />
                      {errors.passengers?.[index]?.last_name && (
                        <p className="text-xs font-bold text-destructive mt-1">{errors.passengers[index].last_name.message}</p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-1.5 md:space-y-2">
                      <label className={labelClass}>
                        <Cake className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        {isAr ? 'تاريخ الميلاد' : 'Date of Birth'}
                        <span className="text-destructive">*</span>
                      </label>
                      <Popover>
                        <PopoverTrigger
                          className={cn(
                            inputClass,
                            'flex items-center justify-between text-start',
                            !watch(`passengers.${index}.date_of_birth`) && 'text-slate-400',
                            errors.passengers?.[index]?.date_of_birth && errorInputClass
                          )}
                        >
                          <span>
                            {watch(`passengers.${index}.date_of_birth`)
                              ? format(parseISO(watch(`passengers.${index}.date_of_birth`)), 'PPP', { locale: localeDate })
                              : (isAr ? 'اختر تاريخ الميلاد' : 'Select date of birth')}
                          </span>
                          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DateCalendar
                            mode="single"
                            captionLayout="dropdown"
                            startMonth={new Date(1920, 0)}
                            endMonth={new Date()}
                            defaultMonth={parseDateValue(watch(`passengers.${index}.date_of_birth`)) || new Date(2000, 0)}
                            selected={parseDateValue(watch(`passengers.${index}.date_of_birth`))}
                            onSelect={(date) => setValue(`passengers.${index}.date_of_birth`, date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true, shouldDirty: true })}
                            disabled={(date) => date > new Date()}
                            autoFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.passengers?.[index]?.date_of_birth && (
                        <p className="text-xs font-bold text-destructive mt-1">{errors.passengers[index].date_of_birth.message}</p>
                      )}
                    </div>

                    {/* ID / Passport Number */}
                    <div className="space-y-1.5 md:space-y-2">
                      <label className={labelClass}>
                        <IdCard className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        {isAr ? 'رقم الجواز أو البطاقة' : 'Passport / ID Number'}
                        <span className="text-destructive">*</span>
                      </label>
                      <input
                        {...register(`passengers.${index}.id_number`)}
                        dir="ltr"
                        className={cn(inputClass, 'font-mono font-medium', errors.passengers?.[index]?.id_number && errorInputClass)}
                        placeholder="Passport or ID number"
                        onInput={(e) => {
                          const el = e.currentTarget
                          const cleaned = el.value.replace(/[^a-zA-Z0-9]/g, '')
                          if (cleaned !== el.value) el.value = cleaned
                        }}
                      />
                      {errors.passengers?.[index]?.id_number && (
                        <p className="text-xs font-bold text-destructive mt-1">{errors.passengers[index].id_number.message}</p>
                      )}
                    </div>

                    {/* ID Expiry Date */}
                    <div className="space-y-1.5 md:space-y-2">
                      <label className={labelClass}>
                        <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        {isAr ? 'تاريخ انتهاء الإثبات' : 'ID Expiry Date'}
                        <span className="text-destructive">*</span>
                      </label>
                      <Popover>
                        <PopoverTrigger
                          className={cn(
                            inputClass,
                            'flex items-center justify-between text-start',
                            !watch(`passengers.${index}.id_expiry_date`) && 'text-slate-400',
                            errors.passengers?.[index]?.id_expiry_date && errorInputClass
                          )}
                        >
                          <span>
                            {watch(`passengers.${index}.id_expiry_date`)
                              ? format(parseISO(watch(`passengers.${index}.id_expiry_date`)), 'PPP', { locale: localeDate })
                              : (isAr ? 'اختر تاريخ الانتهاء' : 'Select expiry date')}
                          </span>
                          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DateCalendar
                            mode="single"
                            selected={parseDateValue(watch(`passengers.${index}.id_expiry_date`))}
                            onSelect={(date) => setValue(`passengers.${index}.id_expiry_date`, date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true, shouldDirty: true })}
                            autoFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.passengers?.[index]?.id_expiry_date && (
                        <p className="text-xs font-bold text-destructive mt-1">{errors.passengers[index].id_expiry_date.message}</p>
                      )}
                    </div>
                </div>
              </div>
            ))}
          </form>
        </div>

        {/* Sidebar: Price summary & Actions (Desktop) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-28 rounded-[2.5rem] bg-slate-900 p-8 shadow-2xl shadow-slate-900/20 text-white border border-slate-800 relative overflow-hidden">
             {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <div className="relative z-10">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">{t('booking.price_summary')}</h3>

                {/* Seats selector inside the dark card */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm mb-8">
                    <label className="block text-sm font-bold text-slate-300 mb-4 text-center">
                        {seatMapEnabled ? (isAr ? 'المقاعد المختارة' : 'Selected Seats') : t('booking.seats_count')}
                    </label>
                    {seatMapEnabled ? (
                      <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
                        <div className="text-3xl font-black">{selectedSeatNumbers.length}</div>
                        <div className="mt-2 flex flex-wrap justify-center gap-2">
                          {selectedSeatNumbers.map((seat) => (
                            <span key={seat} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wider text-white">
                              {seat}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-black/20 rounded-xl p-2 border border-white/5">
                          <button
                              type="button"
                              onClick={() => setSeatsCount(Math.max(1, seatsCount - 1))}
                              disabled={seatsCount <= 1}
                              className="h-12 w-12 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 text-white"
                          >
                              <Minus className="h-5 w-5" />
                          </button>
                          <span className="text-3xl font-black w-16 text-center">{seatsCount}</span>
                          <button
                              type="button"
                              onClick={() => setSeatsCount(Math.min(maxBookable, seatsCount + 1))}
                              disabled={seatsCount >= maxBookable}
                              className="h-12 w-12 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 text-white"
                          >
                              <Plus className="h-5 w-5" />
                          </button>
                      </div>
                    )}
                    <p className="text-xs font-semibold text-accent mt-3 text-center">
                        {remaining} {t('trips.seats_remaining')}
                    </p>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-300">
                        <span>{t('trips.price_per_seat')}</span>
                        <span className="font-mono bg-white/10 px-2 py-1 rounded">{fmt(effectivePrice)}</span>
                    </div>

                    <div className="border-t border-white/10 pt-6 mt-6">
                        <div className="flex items-end justify-between">
                            <span className="text-base font-bold text-slate-300">{t('booking.total_amount')}</span>
                            <span className="text-4xl font-black text-primary tracking-tighter">{fmt(totalPrice)}</span>
                        </div>
                    </div>
                </div>

                {/* Submit button */}
                <button
                type="submit"
                form="booking-form"
                disabled={submitting}
                className="group mt-10 w-full h-16 rounded-2xl bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                {submitting ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <CheckCircle className="h-6 w-6" />
                )}
                {submitting ? t('common.loading') : t('booking.proceed_to_payment')}
                <ArrowRight className="h-5 w-5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform opacity-50" />
                </button>

                <p className="text-xs font-medium text-slate-500 text-center leading-relaxed mt-6">
                {t('booking.terms_agreement')}
                </p>

                {/* Trust Badges */}
                <div className="mt-6">
                  <TrustBadges />
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Mobile Sticky Bottom Bar */}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 pb-safe z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
                {seatMapEnabled ? (
                  <span className="mb-1 text-xs font-semibold text-slate-300">
                    {selectedSeatNumbers.length > 0 ? selectedSeatNumbers.join(', ') : (isAr ? 'اختر مقاعد' : 'Select seats')}
                  </span>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                      <button
                      type="button"
                      onClick={() => setSeatsCount(Math.max(1, seatsCount - 1))}
                      disabled={seatsCount <= 1}
                      className="h-6 w-6 rounded bg-white/10 flex items-center justify-center text-white disabled:opacity-30"
                      >
                          <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold text-white w-4 text-center">{seatsCount}</span>
                      <button
                      type="button"
                      onClick={() => setSeatsCount(Math.min(maxBookable, seatsCount + 1))}
                      disabled={seatsCount >= maxBookable}
                      className="h-6 w-6 rounded bg-white/10 flex items-center justify-center text-white disabled:opacity-30"
                      >
                          <Plus className="h-3 w-3" />
                      </button>
                  </div>
                )}
                <span className="text-xl font-black text-primary leading-none">{fmt(totalPrice)}</span>
            </div>

            <button
            type="submit"
            form="booking-form"
            disabled={submitting}
            className="flex-1 h-12 rounded-xl bg-primary text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70"
            >
                {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <CheckCircle className="h-4 w-4" />
            )}
            {submitting ? t('common.loading') : t('booking.proceed_to_payment')}
            </button>
        </div>
    </div>
    </>
  )
}
