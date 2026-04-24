'use client'

import { pick } from '@/lib/i18n-helpers'
import { Suspense, useCallback, useEffect, useRef, useState, use } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale'
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
  Users,
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
import { normalizeSeatNumber } from '@/lib/seat-map'
import { ProgressStepper } from '@/components/bookings/progress-stepper'
import { TrustBadges } from '@/components/bookings/trust-badges'
import { PriceBreakdown } from '@/components/bookings/price-breakdown'
import { BookForOtherToggle } from '@/components/bookings/book-for-other-toggle'
import { LuggageAddonPanel } from '@/components/bookings/luggage-addon-panel'
import { SavedPassengersPicker } from '@/components/shared/saved-passengers-picker'
import { FareTierSelector } from '@/components/trips/fare-tier-selector'
import { PassengerCategoryPicker, type PassengerCounts } from '@/components/shared/passenger-category-picker'
import { PassportNameHint } from '@/components/ui/passport-name-hint'
import { PhoneInput } from '@/components/shared/phone-input'
import { PriceFreezeButton } from '@/components/bookings/price-freeze-button'
import { LoyaltyBadge } from '@/components/shared/loyalty-badge'
import { HijriDatePicker } from '@/components/shared/hijri-date-picker'
import type { Trip, FareTier, SavedPassenger } from '@/types'

type PassengerFormData = z.infer<typeof passengerSchema>
type BookingContactFormData = z.infer<typeof bookingContactSchema>
type BookingFormData = {
  contact: BookingContactFormData
  passengers: PassengerFormData[]
}

type BookingDraft = {
  contact: BookingContactFormData
  passengers: PassengerFormData[]
  seats_count: number
  selected_seat_numbers: string[]
}

const LIVE_SEAT_REFRESH_MS = 15_000

function createDefaultPassenger(): PassengerFormData {
  return {
    first_name: '',
    last_name: '',
    date_of_birth: '',
    id_number: '',
    id_expiry_date: '',
  }
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
  const locale = useLocale() as 'ar' | 'en' | 'tr'
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
  // New familiarity upgrade state
  const [bookingForOther, setBookingForOther] = useState(false)
  const [extraCheckedBags, setExtraCheckedBags] = useState(0)
  const [selectedFareTier, setSelectedFareTier] = useState<string | null>(null)
  const [passengerCounts, setPassengerCounts] = useState<PassengerCounts>({ adults: initialSeatsCount, children: 0, infants: 0 })
  const [bookingType] = useState<'round_trip' | 'one_way'>(initialBookingType)
  const [bookingStep, setBookingStep] = useState<'details' | 'seats'>('details')
  const [scanningIndex, setScanningIndex] = useState<number | null>(null)
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>([])
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const selectedSeatsRef = useRef<string[]>([])
  const draftRestoredRef = useRef(false)

  const Arrow = isAr ? ArrowLeft : ArrowRight
  const Back = isAr ? ChevronRight : ChevronLeft
  const draftStorageKey = `trip-booking-draft:${tripId}`

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    trigger,
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
      passengers: Array.from({ length: initialSeatsCount }, () => createDefaultPassenger()),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'passengers',
  })

  const [passengerAgeCategories, setPassengerAgeCategories] = useState<Record<number, 'adult' | 'child' | 'infant'>>({})
  const setAgeCategory = (index: number, cat: 'adult' | 'child' | 'infant') =>
    setPassengerAgeCategories((cur) => ({ ...cur, [index]: cat }))

  const seatMapEnabled = Boolean(trip?.seat_map_enabled && trip?.seat_map_config)
  const desiredPassengerCount = seatMapEnabled
    ? Math.max(selectedSeatNumbers.length, 1)
    : seatsCount
  const watchedContact = watch('contact')
  const watchedPassengers = watch('passengers')

  useEffect(() => {
    const currentCount = fields.length
    if (desiredPassengerCount > currentCount) {
      append(Array.from({ length: desiredPassengerCount - currentCount }, () => createDefaultPassenger()), { shouldFocus: false })
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
    selectedSeatsRef.current = selectedSeatNumbers
  }, [selectedSeatNumbers])

  useEffect(() => {
    let active = true

    async function fetchTrip() {
      try {
        const res = await fetch(`/api/trips/${tripId}`)
        const data = await res.json()
        if (!active || !data.trip) return

        const nextTrip = data.trip as Trip
        const unavailableSeats = new Set((nextTrip.unavailable_seat_numbers || []).map(normalizeSeatNumber))
        const conflictedSeats = selectedSeatsRef.current.filter((seat) => unavailableSeats.has(normalizeSeatNumber(seat)))

        setTrip(nextTrip)

        if (conflictedSeats.length > 0) {
          setSelectedSeatNumbers((current) => current.filter((seat) => !unavailableSeats.has(normalizeSeatNumber(seat))))
          toast({
            title: pick(locale, 'تم تحديث المقاعد', 'Seats updated', 'Koltuklar güncellendi'),
            description: pick(locale, `أصبحت المقاعد ${conflictedSeats.join(', ')} غير متاحة وتمت إزالتها من اختيارك.`, `Seats ${conflictedSeats.join(', ')} were just taken and have been removed from your selection.`),
            variant: 'destructive',
          })
        }
      } catch {
        // Error handled
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void fetchTrip()

    return () => {
      active = false
    }
  }, [tripId, isAr])

  useEffect(() => {
    if (!trip?.seat_map_enabled) return

    const intervalId = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}`)
        const data = await res.json()
        if (!data.trip) return

        const nextTrip = data.trip as Trip
        const unavailableSeats = new Set((nextTrip.unavailable_seat_numbers || []).map(normalizeSeatNumber))
        const conflictedSeats = selectedSeatsRef.current.filter((seat) => unavailableSeats.has(normalizeSeatNumber(seat)))

        setTrip(nextTrip)

        if (conflictedSeats.length > 0) {
          setSelectedSeatNumbers((current) => current.filter((seat) => !unavailableSeats.has(normalizeSeatNumber(seat))))
          toast({
            title: pick(locale, 'تم تحديث المقاعد', 'Seats updated', 'Koltuklar güncellendi'),
            description: pick(locale, `أصبحت المقاعد ${conflictedSeats.join(', ')} غير متاحة وتمت إزالتها من اختيارك.`, `Seats ${conflictedSeats.join(', ')} were just taken and have been removed from your selection.`),
            variant: 'destructive',
          })
        }
      } catch {
        // Silent background refresh
      }
    }, LIVE_SEAT_REFRESH_MS)

    return () => window.clearInterval(intervalId)
  }, [trip?.seat_map_enabled, tripId, isAr])

  useEffect(() => {
    if (!trip || draftRestoredRef.current) return

    draftRestoredRef.current = true

    try {
      const rawDraft = window.sessionStorage.getItem(draftStorageKey)
      if (!rawDraft) return

      const draft = JSON.parse(rawDraft) as Partial<BookingDraft>
      const unavailableSeats = new Set((trip.unavailable_seat_numbers || []).map(normalizeSeatNumber))
      const maxRestorableSeats = Math.min(trip.total_seats - trip.booked_seats, MAX_SEATS_PER_BOOKING)
      const restoredSelectedSeats = Array.from(
        new Set((draft.selected_seat_numbers || []).map(normalizeSeatNumber))
      ).filter((seat) => !unavailableSeats.has(seat)).slice(0, maxRestorableSeats)
      const removedSeatsCount = (draft.selected_seat_numbers || []).length - restoredSelectedSeats.length
      const nextSeatsCount = seatMapEnabled
        ? Math.max(restoredSelectedSeats.length, 1)
        : Math.min(Math.max(Number(draft.seats_count || initialSeatsCount), 1), maxRestorableSeats)
      const nextPassengerCount = nextSeatsCount
      const passengers = Array.from({ length: nextPassengerCount }, (_, index) => ({
        ...createDefaultPassenger(),
        ...(draft.passengers?.[index] || {}),
        seat_number: seatMapEnabled ? restoredSelectedSeats[index] : draft.passengers?.[index]?.seat_number,
      }))

      setSelectedSeatNumbers(restoredSelectedSeats)
      setSeatsCount(nextSeatsCount)
      reset({
        contact: {
          phone: draft.contact?.phone || '',
          email: draft.contact?.email || '',
        },
        passengers,
      })

      if (removedSeatsCount > 0) {
        toast({
          title: pick(locale, 'تم تحديث المقاعد', 'Seats updated', 'Koltuklar güncellendi'),
          description: pick(locale, 'بعض المقاعد المحفوظة سابقاً لم تعد متاحة وتمت إزالتها من المسودة.', 'Some previously saved seats are no longer available and were removed from your draft.', 'Daha önce kaydedilen bazı koltuklar artık mevcut değil ve taslağınızdan kaldırıldı.'),
          variant: 'destructive',
        })
      }
    } catch {
      window.sessionStorage.removeItem(draftStorageKey)
    }
  }, [draftStorageKey, initialSeatsCount, isAr, reset, seatMapEnabled, trip])

  useEffect(() => {
    if (!trip) return

    const activePassengerCount = seatMapEnabled
      ? Math.max(selectedSeatNumbers.length, 1)
      : seatsCount
    const passengersToPersist = (watchedPassengers || [])
      .slice(0, activePassengerCount)
      .map((passenger, index) => ({
        ...createDefaultPassenger(),
        ...passenger,
        seat_number: seatMapEnabled ? selectedSeatNumbers[index] : passenger?.seat_number,
      }))

    const draft: BookingDraft = {
      contact: {
        phone: watchedContact?.phone || '',
        email: watchedContact?.email || '',
      },
      passengers: passengersToPersist,
      seats_count: seatsCount,
      selected_seat_numbers: selectedSeatNumbers,
    }

    window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draft))
  }, [draftStorageKey, seatMapEnabled, seatsCount, selectedSeatNumbers, trip, watchedContact, watchedPassengers])

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
          title: pick(locale, 'خطأ', 'Error', 'Hata'),
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
      toast({ title: pick(locale, 'تم', 'Done', 'Tamam'), description: pick(locale, 'تم استخراج بيانات الجواز بنجاح', 'Passport data extracted successfully', 'Pasaport verileri başarıyla çıkarıldı') })
    } catch {
      toast({ title: pick(locale, 'خطأ', 'Error', 'Hata'), description: pick(locale, 'فشل قراءة الجواز', 'Failed to read passport', 'Pasaport okunamadı'), variant: 'destructive' })
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
    pick(locale, 'ar-SA', 'en-US', 'tr-TR'),
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  )
  const unavailableSeatNumbers = trip.unavailable_seat_numbers || []
  const unavailableSeatSet = new Set(unavailableSeatNumbers.map(normalizeSeatNumber))

  const toggleSeat = (seatNumber: string) => {
    if (!seatMapEnabled) return
    const normalizedSeatNumber = normalizeSeatNumber(seatNumber)
    if (unavailableSeatSet.has(normalizedSeatNumber)) return

    setSelectedSeatNumbers((current) => {
      if (current.includes(normalizedSeatNumber)) {
        return current.filter((seat) => seat !== normalizedSeatNumber)
      }
      if (current.length >= maxBookable) {
        return current
      }
      return [...current, normalizedSeatNumber]
    })
  }

  const handleDetailsNext = async () => {
    const valid = await trigger(['contact', 'passengers'])
    if (!valid) return
    setBookingStep('seats')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = async (data: BookingFormData) => {
    if (seatMapEnabled && selectedSeatNumbers.length === 0) {
      toast({
        title: t('common.error'),
        description: pick(locale, 'اختر مقعداً واحداً على الأقل قبل متابعة الحجز', 'Select at least one seat before continuing', 'Devam etmeden önce en az bir koltuk seçin'),
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const enrichedPassengers = data.passengers.map((passenger, index) => ({
        ...passenger,
        seat_number: selectedSeatNumbers[index],
        age_category: passengerAgeCategories[index] ?? 'adult',
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

      window.sessionStorage.removeItem(draftStorageKey)
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
  const localeDate = enUS
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
      <ProgressStepper
        currentStep={seatMapEnabled ? (bookingStep === 'details' ? 2 : 3) : 2}
        hasSeatStep={seatMapEnabled}
        className="mb-8"
      />

      <div className="mb-8 md:mb-10">
         <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
           {seatMapEnabled && bookingStep === 'seats'
             ? (pick(locale, 'اختيار المقاعد', 'Select Your Seats', 'Koltuklarınızı Seçin'))
             : t('booking.title')}
         </h1>
         <p className="text-sm md:text-lg text-slate-500 font-medium">
           {seatMapEnabled && bookingStep === 'seats'
             ? (pick(locale, 'اختر مقعدك على متن الرحلة', 'Choose your preferred seat on the flight', 'Uçuşta tercih ettiğiniz koltuğu seçin'))
             : (pick(locale, 'أدخل بيانات المسافرين لإتمام الحجز', 'Enter passenger details to complete your booking', 'Rezervasyonunuzu tamamlamak için yolcu ayrıntılarını girin'))}
         </p>
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
            {(!seatMapEnabled || bookingStep === 'details') && (<>

            {/* Fare tier selector (P0-6) */}
            {trip.fare_tiers && trip.fare_tiers.length > 0 && (
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <FareTierSelector
                  tiers={trip.fare_tiers as FareTier[]}
                  value={selectedFareTier}
                  onChange={setSelectedFareTier}
                  currency={trip.currency}
                />
              </div>
            )}

            {/* Passenger age-category picker (P0-8) */}
            <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-black text-slate-900">
                {pick(locale, 'عدد المسافرين', 'Passengers', 'Yolcular')}
              </h3>
              <PassengerCategoryPicker
                value={passengerCounts}
                onChange={(c) => {
                  setPassengerCounts(c)
                  setSeatsCount(c.adults + c.children + c.infants)
                }}
                maxTotal={MAX_SEATS_PER_BOOKING}
              />
            </div>

            {/* Book-for-other toggle (P1-15) */}
            <BookForOtherToggle value={bookingForOther} onChange={setBookingForOther} />

            {/* Luggage add-on panel (P1-13) */}
            <LuggageAddonPanel
              cabinKg={trip.cabin_baggage_kg ?? 7}
              checkedKg={trip.checked_baggage_kg}
              extraBags={extraCheckedBags}
              onChange={setExtraCheckedBags}
              currency={trip.currency}
            />

            {/* Price freeze + loyalty strip (P3-27, P3-28) */}
            <div className="grid gap-3 md:grid-cols-2">
              <PriceFreezeButton tripId={trip.id} price={trip.price_per_seat * seatsCount} currency={trip.currency} />
              <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-2">
                <LoyaltyBadge estimatedEarn={Math.floor((trip.price_per_seat * seatsCount) / 10)} />
              </div>
            </div>

            <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-2 md:gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900">
                    {pick(locale, 'بيانات التواصل الأساسية', 'Primary Contact Details', 'Birincil İletişim Ayrıntıları')}
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    {pick(locale, 'تُستخدم للتواصل بخصوص الحجز فقط', 'Used only for booking communication', 'Yalnızca rezervasyon iletişimi için kullanılır')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                  <label className={labelClass}>
                    <Phone className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    {pick(locale, 'رقم الجوال', 'Phone Number', 'Telefon Numarası')}
                    <span className="text-destructive">*</span>
                  </label>
                  {/* Intl phone input (P0-3b) */}
                  <PhoneInput
                    value={watch('contact.phone') as string | null | undefined}
                    onChange={(e164) => setValue('contact.phone', e164, { shouldValidate: true })}
                    error={!!errors.contact?.phone}
                  />
                  {errors.contact?.phone && (
                    <p className="text-xs font-bold text-destructive mt-1">{errors.contact.phone.message}</p>
                  )}
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className={labelClass}>
                    <Mail className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    {pick(locale, 'البريد الإلكتروني', 'Email', 'E-posta')}
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
                         {pick(locale, `المقعد ${selectedSeatNumbers[index]}`, `Seat ${selectedSeatNumbers[index]}`)}
                       </p>
                     )}
                   </div>
                </div>
                {/* Passport hint + saved passengers picker (P0-10 + P2-22) */}
                <PassportNameHint variant="expanded" className="mb-4 md:mb-5" />
                <SavedPassengersPicker
                  className="mb-4"
                  onSelect={(p: SavedPassenger) => {
                    setValue(`passengers.${index}.first_name`, p.first_name)
                    setValue(`passengers.${index}.last_name`, p.last_name)
                    setValue(`passengers.${index}.date_of_birth`, p.date_of_birth)
                    setValue(`passengers.${index}.id_number`, p.id_number)
                    setValue(`passengers.${index}.id_expiry_date`, p.id_expiry_date)
                  }}
                />

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
                        {pick(locale, 'جاري قراءة الجواز...', 'Reading passport...', 'Pasaport okunuyor...')}
                      </>
                    ) : (
                      <>
                        <ScanLine className="h-5 w-5" />
                        {pick(locale, 'مسح الجواز أو الهوية بالصورة', 'Scan passport or ID from photo', 'Fotoğraftan pasaport veya kimlik tara')}
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
                        {pick(locale, 'الاسم الأول (بالإنجليزية)', 'First Name (English)', 'Ad (İngilizce)')}
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
                        {pick(locale, 'الاسم الأخير (بالإنجليزية)', 'Last Name (English)', 'Soyad (İngilizce)')}
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
                        {pick(locale, 'تاريخ الميلاد', 'Date of Birth', 'Doğum Tarihi')}
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
                              : (pick(locale, 'اختر تاريخ الميلاد', 'Select date of birth', 'Doğum tarihi seç'))}
                          </span>
                          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          {/* Hijri-aware DOB picker (P0-1) */}
                          <HijriDatePicker
                            value={parseDateValue(watch(`passengers.${index}.date_of_birth`))}
                            onChange={(date) => setValue(`passengers.${index}.date_of_birth`, date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true, shouldDirty: true })}
                            maxDate={new Date()}
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
                        {pick(locale, 'رقم الجواز أو البطاقة', 'Passport / ID Number', 'Pasaport / Kimlik Numarası')}
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
                        {pick(locale, 'تاريخ انتهاء الإثبات', 'ID Expiry Date', 'Kimlik Son Geçerlilik Tarihi')}
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
                              : (pick(locale, 'اختر تاريخ الانتهاء', 'Select expiry date', 'Son geçerlilik tarihini seç'))}
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

                    {/* Age category — drives per-passenger discounts */}
                    <div className="space-y-1.5 md:space-y-2 sm:col-span-2">
                      <label className={labelClass}>
                        <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        {pick(locale, 'فئة العمر', 'Age category', 'Yaş kategorisi')}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['adult', 'child', 'infant'] as const).map((cat) => {
                          const selected = (passengerAgeCategories[index] ?? 'adult') === cat
                          const label = cat === 'adult' ? t('discount.adult') : cat === 'child' ? t('discount.child') : t('discount.infant')
                          const pctKey = cat === 'child' ? 'child_discount_percentage' : cat === 'infant' ? 'infant_discount_percentage' : null
                          const pct = pctKey ? Number(trip[pctKey as 'child_discount_percentage' | 'infant_discount_percentage'] ?? 0) : 0
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setAgeCategory(index, cat)}
                              className={cn(
                                'rounded-xl border px-3 py-2 text-xs font-bold transition-colors text-center',
                                selected
                                  ? 'border-primary bg-primary text-white shadow-sm'
                                  : 'border-slate-200 bg-white hover:border-primary/40'
                              )}
                            >
                              <span className="block">{label}</span>
                              {pct > 0 && <span className="block text-[10px] font-semibold opacity-70">−{pct}%</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                </div>
              </div>
            ))}
            </>)}

            {seatMapEnabled && bookingStep === 'seats' && trip.seat_map_config && (
              <div className="space-y-4">
              <button
                type="button"
                onClick={() => { setBookingStep('details'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <Back className="h-4 w-4 rtl:rotate-180" />
                {pick(locale, 'تعديل بيانات المسافرين', 'Edit passenger details', 'Yolcu ayrıntılarını düzenle')}
              </button>
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <SeatMap
                  config={trip.seat_map_config}
                  selectedSeats={selectedSeatNumbers}
                  unavailableSeats={unavailableSeatNumbers}
                  onSeatClick={toggleSeat}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedSeatNumbers.length > 0 ? selectedSeatNumbers.map((seat) => (
                    <span key={seat} className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                      {pick(locale, 'المقعد', 'Seat', 'Koltuk')} {seat}
                    </span>
                  )) : (
                    <span className="text-sm text-slate-500">
                      {pick(locale, 'اختر مقعداً واحداً أو أكثر للمتابعة.', 'Select one or more seats to continue.', 'Devam etmek için bir veya daha fazla koltuk seçin.')}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  form="booking-form"
                  disabled={submitting || selectedSeatNumbers.length === 0}
                  className="mt-6 w-full h-14 rounded-2xl bg-primary text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-primary/15 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {submitting ? t('common.loading') : (pick(locale, 'تأكيد المقاعد والمتابعة للدفع', 'Confirm Seats & Proceed to Payment', 'Koltukları Onayla ve Ödemeye Geç'))}
                </button>
              </div>
              </div>
            )}
          </form>
        </div>

        {/* Sidebar: Price summary & Actions (Desktop) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-28 rounded-[2rem] bg-slate-900 p-6 shadow-2xl shadow-slate-900/20 text-white border border-slate-800 relative overflow-hidden">
             {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <div className="relative z-10">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">{t('booking.price_summary')}</h3>

                {/* Seats selector inside the dark card */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm mb-5">
                    <label className="block text-xs font-bold text-slate-300 mb-3 text-center uppercase tracking-wider">
                        {seatMapEnabled ? (pick(locale, 'المقاعد المختارة', 'Selected Seats', 'Seçilen Koltuklar')) : t('booking.seats_count')}
                    </label>
                    {seatMapEnabled ? (
                      <div className="rounded-xl border border-white/5 bg-black/20 p-3 text-center">
                        <div className="text-2xl font-black leading-none">{selectedSeatNumbers.length}</div>
                        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                          {selectedSeatNumbers.map((seat) => (
                            <span key={seat} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">
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
                              className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 text-white"
                          >
                              <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-2xl font-black w-14 text-center">{seatsCount}</span>
                          <button
                              type="button"
                              onClick={() => setSeatsCount(Math.min(maxBookable, seatsCount + 1))}
                              disabled={seatsCount >= maxBookable}
                              className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 text-white"
                          >
                              <Plus className="h-4 w-4" />
                          </button>
                      </div>
                    )}
                    <p className="text-[11px] font-semibold text-accent mt-2 text-center">
                        {remaining} {t('trips.seats_remaining')}
                    </p>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                        <span>{t('trips.price_per_seat')}</span>
                        <span className="font-mono bg-white/10 px-2 py-1 rounded text-[11px]">{fmt(effectivePrice)}</span>
                    </div>

                    <div className="border-t border-white/10 pt-4 mt-4">
                        <div className="flex items-end justify-between">
                            <span className="text-sm font-bold text-slate-300">{t('booking.total_amount')}</span>
                            <span className="text-3xl font-black text-primary tracking-tighter">{fmt(totalPrice)}</span>
                        </div>
                    </div>
                </div>

                {/* Submit / Next button */}
                {seatMapEnabled && bookingStep === 'details' ? (
                  <button
                    type="button"
                    onClick={handleDetailsNext}
                    className="group mt-6 w-full h-14 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:-translate-y-1"
                  >
                    <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                    {pick(locale, 'متابعة لاختيار المقاعد', 'Continue to Seat Selection', 'Koltuk Seçimine Devam')}
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="booking-form"
                    disabled={submitting}
                    className="group mt-6 w-full h-14 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-5 w-5" />
                    )}
                    {submitting ? t('common.loading') : t('booking.proceed_to_payment')}
                    <ArrowRight className="h-4.5 w-4.5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform opacity-50" />
                  </button>
                )}

                <p className="text-[11px] font-medium text-slate-500 text-center leading-relaxed mt-4">
                {t('booking.terms_agreement')}
                </p>

                {/* Trust Badges */}
                <div className="mt-4">
                  <TrustBadges showPayments={false} tone="dark" />
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
                    {selectedSeatNumbers.length > 0 ? selectedSeatNumbers.join(', ') : (pick(locale, 'اختر مقاعد', 'Select seats', 'Koltuk seç'))}
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

            {seatMapEnabled && bookingStep === 'details' ? (
              <button
                type="button"
                onClick={handleDetailsNext}
                className="flex-1 h-12 rounded-xl bg-primary text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                {pick(locale, 'متابعة', 'Continue', 'Devam')}
              </button>
            ) : seatMapEnabled && bookingStep === 'seats' ? (
              <span className="flex-1 h-12 rounded-xl bg-slate-700 text-slate-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-center px-2">
                {pick(locale, 'اختر مقعدك أعلاه للمتابعة', 'Select your seat above to continue', 'Devam etmek için yukarıdaki koltuğunuzu seçin')}
              </span>
            ) : (
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
            )}
        </div>
    </div>
    </>
  )
}
