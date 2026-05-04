'use client'

import { pick } from '@/lib/i18n-helpers'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resolveApiErrorMessage } from '@/lib/api-error'
import {
  BedDouble,
  MapPin,
  Minus,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle,
  CalendarIcon,
  Users,
} from 'lucide-react'
import { cn, formatPriceEN } from '@/lib/utils'
import { ROOM_CATEGORIES, MAX_ROOMS_PER_BOOKING } from '@/lib/constants'
import { RoomBookingPageSkeleton } from '@/components/shared/loading-skeleton'
import { PhoneInput } from '@/components/shared/phone-input'
import { getRoomBookingSchema } from '@/lib/validations'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/components/ui/toaster'
import type { Room } from '@/types'

type RoomBookingFormData = {
  guest_name: string
  guest_phone: string
  guest_email: string
  check_in_date: string
  number_of_days: number
  number_of_people: number
  rooms_count: number
}

function sanitizeGuestName(value: string) {
  return value.replace(/[^a-zA-Z\s\-'.]/g, '')
}

export default function BookRoomPage() {
  return <BookRoomContent />
}

function BookRoomContent() {
  const t = useTranslations()
  const te = useTranslations('errors')
  const locale = useLocale() as 'ar' | 'en' | 'tr'
  const isAr = locale === 'ar'
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams<{ id: string }>()
  const roomId = params.id

  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const initialRoomsCount = Math.min(parseInt(searchParams.get('rooms') || '1', 10), MAX_ROOMS_PER_BOOKING)
  const initialDays = Math.max(parseInt(searchParams.get('days') || '1', 10), 1)
  const initialPassengers = Math.max(parseInt(searchParams.get('passengers') || '1', 10), 1)

  const Back = isAr ? ChevronRight : ChevronLeft

  const schema = getRoomBookingSchema(locale).omit({ room_id: true })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<RoomBookingFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      guest_name: '',
      guest_phone: '',
      guest_email: '',
      check_in_date: '',
      number_of_days: initialDays,
      number_of_people: initialPassengers,
      rooms_count: initialRoomsCount,
    },
  })

  const roomsCount = watch('rooms_count')
  const numberOfDays = watch('number_of_days')
  const numberOfPeople = watch('number_of_people')
  const checkInDate = watch('check_in_date')
  const maxGuests = room ? room.max_capacity * roomsCount : 1

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`/api/rooms/${roomId}`)
        const data = await res.json()
        if (data.room) {
          setRoom(data.room)
        }
      } catch {
        // Error handled
      } finally {
        setLoading(false)
      }
    }
    fetchRoom()
  }, [roomId])

  useEffect(() => {
    if (room && numberOfPeople > maxGuests) {
      setValue('number_of_people', maxGuests, { shouldValidate: true, shouldDirty: true })
    }
  }, [maxGuests, numberOfPeople, room, setValue])

  if (loading) return <RoomBookingPageSkeleton />

  if (!room || room.status !== 'active') {
    router.push(`/${locale}/rooms/${roomId}`)
    return null
  }

  const name = isAr ? room.name_ar : (room.name_en || room.name_ar)
  const city = isAr ? room.city_ar : (room.city_en || room.city_ar)
  const categoryLabel = ROOM_CATEGORIES[room.category as keyof typeof ROOM_CATEGORIES]
  const categoryText = categoryLabel ? (isAr ? categoryLabel.ar : categoryLabel.en) : room.category
  const fmt = (amount: number) => formatPriceEN(amount, room.currency)
  const formatDisplayNumber = (value: number) => new Intl.NumberFormat('en-US').format(value)
  const totalPrice = room.price_per_night * numberOfDays * roomsCount
  const firstImage = room.images?.[0]

  const parseDateValue = (value: string) => {
    if (!value) return undefined
    const parsed = parseISO(value)
    return isValid(parsed) ? parsed : undefined
  }

  const onSubmit = async (data: RoomBookingFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/room-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          guest_name: data.guest_name,
          guest_phone: data.guest_phone || undefined,
          guest_email: data.guest_email || undefined,
          check_in_date: data.check_in_date,
          number_of_days: data.number_of_days,
          number_of_people: data.number_of_people,
          rooms_count: data.rooms_count,
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

      router.push(`/${locale}/checkout/${result.bookingId}?type=room`)
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

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 md:pt-32 lg:pt-36 lg:pb-12 animate-fade-in-up">
        {/* Back button */}
        <button
          onClick={() => router.push(`/${locale}/rooms/${roomId}?rooms=${roomsCount}&days=${numberOfDays}`)}
          className="group inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 md:mb-8 transition-colors"
        >
          <div className="p-1.5 md:p-2 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
            <Back className="h-3 w-3 md:h-4 md:w-4 rtl:rotate-180" />
          </div>
          {t('common.back')}
        </button>

        <div className="mb-8 md:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">{t('room_booking.title')}</h1>
          <p className="text-sm md:text-lg text-slate-500 font-medium">{pick(locale, 'أدخل بيانات الحجز لإتمام العملية', 'Enter booking details to complete your reservation', 'Rezervasyonunuzu tamamlamak için rezervasyon ayrıntılarını girin')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* Form Area */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">

            {/* Room summary card */}
            <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />

              <div className="flex items-center gap-4 flex-1 ml-4 rtl:ml-0 rtl:mr-4">
                {firstImage ? (
                  <Image src={firstImage} alt={name} width={80} height={80} className="h-16 w-16 md:h-20 md:w-20 rounded-xl md:rounded-2xl object-cover shrink-0" />
                ) : (
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl md:rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                    <BedDouble className="h-8 w-8 text-slate-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 truncate">{name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-500">{city}</span>
                  </div>
                  <span className="inline-flex mt-2 px-2 md:px-3 py-1 rounded-md md:rounded-lg bg-primary/5 border border-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest">
                    {categoryText}
                  </span>
                </div>
              </div>

              <div className="hidden sm:block w-px h-12 md:h-16 bg-slate-100" />

              <div className="sm:min-w-[140px] md:min-w-[160px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('rooms.price_per_night')}</p>
                <p className="text-xl md:text-2xl font-black text-slate-900">{fmt(room.price_per_night)}</p>
              </div>
            </div>

            {/* Booking form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8" id="room-booking-form">
              {/* Guest info */}
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-2 md:gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900">
                      {pick(locale, 'بيانات الضيف', 'Guest Information', 'Misafir Bilgileri')}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">
                      {pick(locale, 'الاسم ومعلومات التواصل', 'Name and contact information', 'Ad ve iletişim bilgileri')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  {/* Guest Name */}
                  <div className="space-y-1.5 md:space-y-2 md:col-span-2">
                    <label className={labelClass}>
                      <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('room_booking.guest_name')}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...register('guest_name', {
                        setValueAs: (value) => (typeof value === 'string' ? sanitizeGuestName(value) : value),
                      })}
                      dir="ltr"
                      autoComplete="name"
                      className={cn(inputClass, errors.guest_name && errorInputClass)}
                      placeholder={pick(locale, 'اسم الضيف بالإنجليزية', 'Full guest name (English)', 'Misafirin tam adı (İngilizce)')}
                    />
                    {errors.guest_name && (
                      <p className="text-xs font-bold text-destructive mt-1">{errors.guest_name.message}</p>
                    )}
                  </div>

                  {/* Guest Phone */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className={labelClass}>
                      <Phone className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('room_booking.guest_phone')}
                    </label>
                    <Controller
                      name="guest_phone"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          value={field.value}
                          onChange={field.onChange}
                          defaultIso="SA"
                          error={!!errors.guest_phone}
                        />
                      )}
                    />
                    {errors.guest_phone && (
                      <p className="text-xs font-bold text-destructive mt-1">{errors.guest_phone.message}</p>
                    )}
                  </div>

                  {/* Guest Email */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className={labelClass}>
                      <Mail className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('room_booking.guest_email')}
                    </label>
                    <input
                      {...register('guest_email')}
                      type="email"
                      dir="ltr"
                      className={cn(inputClass, errors.guest_email && errorInputClass)}
                      placeholder="user@example.com"
                    />
                    {errors.guest_email && (
                      <p className="text-xs font-bold text-destructive mt-1">{errors.guest_email.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking details */}
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-2 md:gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <BedDouble className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900">
                      {pick(locale, 'تفاصيل الحجز', 'Booking Details', 'Rezervasyon Ayrıntıları')}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">
                      {pick(locale, 'التاريخ وعدد الليالي والغرف والأشخاص', 'Date, nights, rooms and guest count', 'Tarih, gece, oda ve misafir sayısı')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  {/* Check-in Date */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className={labelClass}>
                      <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('room_booking.check_in_date')}
                      <span className="text-destructive">*</span>
                    </label>
                    <Popover>
                      <PopoverTrigger
                        className={cn(
                          inputClass,
                          'flex items-center justify-between text-start',
                          !checkInDate && 'text-slate-400',
                          errors.check_in_date && errorInputClass
                        )}
                      >
                        <span>
                          {checkInDate
                            ? format(parseISO(checkInDate), 'PPP', { locale: enUS })
                            : (pick(locale, 'اختر تاريخ الدخول', 'Select check-in date', 'Giriş tarihi seç'))}
                        </span>
                        <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parseDateValue(checkInDate)}
                          onSelect={(date) => setValue('check_in_date', date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true, shouldDirty: true })}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.check_in_date && (
                      <p className="text-xs font-bold text-destructive mt-1">{errors.check_in_date.message}</p>
                    )}
                  </div>

                  {/* Number of People */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className={labelClass}>
                      <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('room_booking.number_of_people')}
                      <span className="text-destructive">*</span>
                    </label>
                    <div className={cn(
                      'flex items-center justify-between rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 p-2 h-12 md:h-14',
                      errors.number_of_people && 'ring-2 ring-destructive bg-destructive/5'
                    )}>
                      <button
                        type="button"
                        onClick={() => setValue('number_of_people', Math.max(1, numberOfPeople - 1), { shouldValidate: true, shouldDirty: true })}
                        disabled={numberOfPeople <= 1}
                        className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <div className="text-center">
                        <span className="block text-xl md:text-2xl font-black text-slate-950" dir="ltr">{formatDisplayNumber(numberOfPeople)}</span>
                        <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400" dir="ltr">
                          {`Max ${formatDisplayNumber(maxGuests)}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setValue('number_of_people', Math.min(maxGuests, numberOfPeople + 1), { shouldValidate: true, shouldDirty: true })}
                        disabled={numberOfPeople >= maxGuests}
                        className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {errors.number_of_people && (
                      <p className="text-xs font-bold text-destructive mt-1">{errors.number_of_people.message}</p>
                    )}
                  </div>

                  {/* Number of Days */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className={labelClass}>
                      <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('room_booking.number_of_days')}
                      <span className="text-destructive">*</span>
                    </label>
                    <div className={cn(
                      'flex items-center justify-between rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 p-2 h-12 md:h-14',
                      errors.number_of_days && 'ring-2 ring-destructive bg-destructive/5'
                    )}>
                      <button
                        type="button"
                        onClick={() => setValue('number_of_days', Math.max(1, numberOfDays - 1), { shouldValidate: true, shouldDirty: true })}
                        disabled={numberOfDays <= 1}
                        className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xl md:text-2xl font-black text-slate-950" dir="ltr">{formatDisplayNumber(numberOfDays)}</span>
                      <button
                        type="button"
                        onClick={() => setValue('number_of_days', numberOfDays + 1, { shouldValidate: true, shouldDirty: true })}
                        className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {errors.number_of_days && (
                      <p className="text-xs font-bold text-destructive mt-1">{errors.number_of_days.message}</p>
                    )}
                  </div>

                  {/* Rooms Count */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className={labelClass}>
                      <BedDouble className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('room_booking.rooms_count')}
                      <span className="text-destructive">*</span>
                    </label>
                    <div className="flex items-center justify-between rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 p-2 h-12 md:h-14">
                      <button
                        type="button"
                        onClick={() => setValue('rooms_count', Math.max(1, roomsCount - 1), { shouldValidate: true })}
                        disabled={roomsCount <= 1}
                        className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xl md:text-2xl font-black text-slate-950" dir="ltr">{formatDisplayNumber(roomsCount)}</span>
                      <button
                        type="button"
                        onClick={() => setValue('rooms_count', Math.min(MAX_ROOMS_PER_BOOKING, roomsCount + 1), { shouldValidate: true })}
                        disabled={roomsCount >= MAX_ROOMS_PER_BOOKING}
                        className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {errors.rooms_count && (
                      <p className="text-xs font-bold text-destructive mt-1">{errors.rooms_count.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar: Price summary & Actions (Desktop) */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 rounded-[2.5rem] bg-slate-900 p-8 shadow-2xl shadow-slate-900/20 text-white border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

              <div className="relative z-10">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">{t('room_booking.price_summary')}</h3>

                {/* Price Breakdown */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-300">
                    <span>{t('rooms.price_per_night')}</span>
                    <span className="font-mono bg-white/10 px-2 py-1 rounded">{fmt(room.price_per_night)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium text-slate-300">
                    <span>{t('room_booking.number_of_days')}</span>
                    <span className="font-mono bg-white/10 px-2 py-1 rounded" dir="ltr">{formatDisplayNumber(numberOfDays)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium text-slate-300">
                    <span>{t('room_booking.rooms_count')}</span>
                    <span className="font-mono bg-white/10 px-2 py-1 rounded" dir="ltr">{formatDisplayNumber(roomsCount)}</span>
                  </div>

                  <div className="border-t border-white/10 pt-6 mt-6">
                    <div className="flex items-end justify-between">
                      <span className="text-base font-bold text-slate-300">{t('room_booking.total_amount')}</span>
                      <span className="text-4xl font-black text-primary tracking-tighter">{fmt(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  form="room-booking-form"
                  disabled={submitting}
                  className="group mt-10 w-full h-16 rounded-2xl bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {submitting ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <CheckCircle className="h-6 w-6" />
                  )}
                  {submitting ? t('common.loading') : t('room_booking.proceed_to_payment')}
                  <ArrowRight className="h-5 w-5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform opacity-50" />
                </button>

                <p className="text-xs font-medium text-slate-500 text-center leading-relaxed mt-6">
                  {t('booking.terms_agreement')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 pb-safe z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('common.total')}</span>
            <span className="text-xl font-black text-primary leading-none">{fmt(totalPrice)}</span>
          </div>

          <button
            type="submit"
            form="room-booking-form"
            disabled={submitting}
            className="flex-1 h-12 rounded-xl bg-primary text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {submitting ? t('common.loading') : t('room_booking.proceed_to_payment')}
          </button>
        </div>
      </div>
    </>
  )
}
