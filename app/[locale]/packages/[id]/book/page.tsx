'use client'

import Image from 'next/image'
import { Suspense, useEffect, useState, use } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resolveApiErrorMessage } from '@/lib/api-error'
import {
  Sparkles,
  MapPin,
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
  Plane,
  BedDouble,
  CarFront,
} from 'lucide-react'
import { cn, formatPriceEN } from '@/lib/utils'
import { RoomBookingPageSkeleton } from '@/components/shared/loading-skeleton'
import { getPackageBookingSchema } from '@/lib/validations'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/components/ui/toaster'
import type { Package } from '@/types/database'

type PackageBookingFormData = {
  guest_name: string
  guest_phone: string
  guest_email: string
  number_of_people: number
  start_date: string
  end_date: string
}

export default function BookPackagePage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  return (
    <Suspense fallback={<RoomBookingPageSkeleton />}>
      <BookPackageContent params={params} />
    </Suspense>
  )
}

function BookPackageContent({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const t = useTranslations()
  const te = useTranslations('errors')
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const router = useRouter()
  const { id: packageId } = use(params)

  const [pkg, setPkg] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const Back = isAr ? ChevronRight : ChevronLeft

  const schema = getPackageBookingSchema(locale).omit({ package_id: true })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PackageBookingFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      guest_name: '',
      guest_phone: '',
      guest_email: '',
      number_of_people: 1,
      start_date: '',
      end_date: '',
    },
  })

  const numberOfPeople = watch('number_of_people')
  const startDate = watch('start_date')
  const endDate = watch('end_date')

  useEffect(() => {
    async function fetchPackage() {
      try {
        const res = await fetch(`/api/packages/${packageId}`)
        const data = await res.json()
        if (data.package) {
          setPkg(data.package)
          if (data.package.start_date) {
            setValue('start_date', data.package.start_date, { shouldValidate: false })
          }
          if (data.package.end_date) {
            setValue('end_date', data.package.end_date, { shouldValidate: false })
          }
        }
      } catch {
        // Error handled
      } finally {
        setLoading(false)
      }
    }
    fetchPackage()
  }, [packageId, setValue])

  if (loading) return <RoomBookingPageSkeleton />

  if (!pkg || pkg.status !== 'active') {
    router.push(`/${locale}/packages/${packageId}`)
    return null
  }

  const name = isAr ? pkg.name_ar : (pkg.name_en || pkg.name_ar)
  const destination = isAr ? pkg.destination_city_ar : (pkg.destination_city_en || pkg.destination_city_ar)
  const fmt = (amount: number) => formatPriceEN(amount, pkg.currency)
  const formatDisplayNumber = (value: number) => new Intl.NumberFormat('en-US').format(value)
  const totalPrice = pkg.total_price * numberOfPeople
  const firstImage = pkg.images?.[0]
  const availableSpots = pkg.max_bookings - pkg.current_bookings

  const parseDateValue = (value: string) => {
    if (!value) return undefined
    const parsed = parseISO(value)
    return isValid(parsed) ? parsed : undefined
  }

  const onSubmit = async (data: PackageBookingFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/package-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: packageId,
          guest_name: data.guest_name,
          guest_phone: data.guest_phone || undefined,
          guest_email: data.guest_email || undefined,
          number_of_people: data.number_of_people,
          start_date: data.start_date,
          end_date: data.end_date,
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

      router.push(`/${locale}/checkout/${result.bookingId}?type=package`)
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
          onClick={() => router.push(`/${locale}/packages/${packageId}`)}
          className="group inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 md:mb-8 transition-colors"
        >
          <div className="p-1.5 md:p-2 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
            <Back className="h-3 w-3 md:h-4 md:w-4 rtl:rotate-180" />
          </div>
          {t('common.back')}
        </button>

        <div className="mb-8 md:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">{isAr ? 'حجز الباقة' : 'Book Your Package'}</h1>
          <p className="text-sm md:text-lg text-slate-500 font-medium">{isAr ? 'أدخل بيانات الحجز لإتمام العملية' : 'Enter booking details to complete your reservation'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* Form Area */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">

            {/* Package summary card */}
            <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-5 md:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />

              <div className="flex items-center gap-4 flex-1 ml-4 rtl:ml-0 rtl:mr-4">
                {firstImage ? (
                  <Image src={firstImage} alt={name} width={80} height={80} className="h-16 w-16 md:h-20 md:w-20 rounded-xl md:rounded-2xl object-cover shrink-0" />
                ) : (
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl md:rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Sparkles className="h-8 w-8 text-slate-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 truncate">{name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-500">{destination}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {pkg.includes_flight && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                        <Plane className="h-3 w-3" /> {t('packages.flight')}
                      </span>
                    )}
                    {pkg.includes_hotel && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                        <BedDouble className="h-3 w-3" /> {t('packages.hotel')}
                      </span>
                    )}
                    {pkg.includes_car && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                        <CarFront className="h-3 w-3" /> {t('packages.car')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden sm:block w-px h-12 md:h-16 bg-slate-100" />

              <div className="sm:min-w-[140px] md:min-w-[160px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('packages.per_person')}</p>
                <p className="text-xl md:text-2xl font-black text-slate-900">{fmt(pkg.total_price)}</p>
              </div>
            </div>

            {/* Booking form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8" id="package-booking-form">
              {/* Guest info */}
              <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-2 md:gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900">
                      {t('packages.guest_info')}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">
                      {isAr ? 'الاسم ومعلومات التواصل' : 'Name and contact information'}
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
                      {...register('guest_name')}
                      className={cn(inputClass, errors.guest_name && errorInputClass)}
                      placeholder={isAr ? 'اسم الضيف الكامل' : 'Full guest name'}
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
                    <input
                      {...register('guest_phone')}
                      type="tel"
                      dir="ltr"
                      className={cn(inputClass, 'font-mono font-medium', errors.guest_phone && errorInputClass)}
                      placeholder="+966 50 000 0000"
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
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900">
                      {t('packages.package_details')}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">
                      {isAr ? 'عدد الأشخاص وتواريخ السفر' : 'Number of people and travel dates'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  {/* Number of People */}
                  <div className="space-y-1.5 md:space-y-2 md:col-span-2">
                    <label className={labelClass}>
                      <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('packages.number_of_people')}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={availableSpots}
                      {...register('number_of_people', { valueAsNumber: true })}
                      className={cn(inputClass, errors.number_of_people && errorInputClass)}
                      placeholder="1"
                    />
                    {errors.number_of_people && (
                      <p className="text-xs font-bold text-destructive mt-1">{errors.number_of_people.message}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {isAr ? `الأماكن المتاحة: ${availableSpots}` : `Available spots: ${availableSpots}`}
                    </p>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className={labelClass}>
                      <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('packages.start_date')}
                      <span className="text-destructive">*</span>
                    </label>
                    <Popover>
                      <PopoverTrigger
                        className={cn(
                          inputClass,
                          'flex items-center justify-between text-start',
                          !startDate && 'text-slate-400',
                          errors.start_date && errorInputClass
                        )}
                      >
                        <span>
                          {startDate
                            ? format(parseISO(startDate), 'PPP', { locale: enUS })
                            : (isAr ? 'اختر تاريخ البدء' : 'Select start date')}
                        </span>
                        <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parseDateValue(startDate)}
                          onSelect={(date) => setValue('start_date', date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true, shouldDirty: true })}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.start_date && (
                      <p className="text-xs font-bold text-destructive mt-1">{errors.start_date.message}</p>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className={labelClass}>
                      <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('packages.end_date')}
                      <span className="text-destructive">*</span>
                    </label>
                    <Popover>
                      <PopoverTrigger
                        className={cn(
                          inputClass,
                          'flex items-center justify-between text-start',
                          !endDate && 'text-slate-400',
                          errors.end_date && errorInputClass
                        )}
                      >
                        <span>
                          {endDate
                            ? format(parseISO(endDate), 'PPP', { locale: enUS })
                            : (isAr ? 'اختر تاريخ الانتهاء' : 'Select end date')}
                        </span>
                        <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parseDateValue(endDate)}
                          onSelect={(date) => setValue('end_date', date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true, shouldDirty: true })}
                          disabled={(date) => {
                            const minDate = startDate ? parseISO(startDate) : new Date()
                            return date <= minDate
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.end_date && (
                      <p className="text-xs font-bold text-destructive mt-1">{errors.end_date.message}</p>
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
                    <span>{t('packages.per_person')}</span>
                    <span className="font-mono bg-white/10 px-2 py-1 rounded">{fmt(pkg.total_price)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium text-slate-300">
                    <span>{t('packages.number_of_people')}</span>
                    <span className="font-mono bg-white/10 px-2 py-1 rounded" dir="ltr">{formatDisplayNumber(numberOfPeople)}</span>
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
                  form="package-booking-form"
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
            form="package-booking-form"
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
