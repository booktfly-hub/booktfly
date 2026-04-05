'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { resolveApiErrorMessage } from '@/lib/api-error'
import { getCarSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { CAR_CATEGORIES, CAR_FEATURES, TRANSMISSION_TYPES, FUEL_TYPES } from '@/lib/constants'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, isValid, parseISO } from 'date-fns'
import { arSA, enUS } from 'date-fns/locale'
import {
  Loader2,
  ImageIcon,
  X,
  CalendarIcon,
  MapPin,
  LocateFixed,
  Check,
  Plane,
  Building,
  Clock,
} from 'lucide-react'

type FormData = z.infer<ReturnType<typeof getCarSchema>>

export default function NewCarPage() {
  const tc = useTranslations('common')
  const te = useTranslations('errors')
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [locating, setLocating] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(getCarSchema(locale)),
    defaultValues: {
      currency: 'SAR',
      price_per_day: 0,
      seats_count: 5,
      year: new Date().getFullYear(),
      instant_book: true,
      features: [],
      category: '',
      transmission: 'automatic',
      fuel_type: 'petrol',
      pickup_type: 'branch',
      return_type: 'same_location',
    },
  })

  function onValidationError(fieldErrors: Record<string, unknown>) {
    for (const key of Object.keys(fieldErrors)) {
      const el = document.querySelector(`[name="${key}"]`) as HTMLInputElement | null
      if (el && el.type !== 'hidden') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        break
      }
    }
    const messages = Object.values(fieldErrors)
      .map((e) => (e as { message?: string })?.message)
      .filter(Boolean)
    if (messages.length > 0) {
      toast({ title: messages[0] as string, variant: 'destructive' })
    }
  }

  const currency = watch('currency')
  const instantBook = watch('instant_book')
  const availableFrom = watch('available_from')
  const availableTo = watch('available_to')
  const selectedFeatures = watch('features') || []
  const pickupType = watch('pickup_type')
  const returnType = watch('return_type')

  const availableFromDate = availableFrom ? parseISO(availableFrom) : undefined
  const availableToDate = availableTo ? parseISO(availableTo) : undefined

  function handleImageAdd(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 5 - imageFiles.length)
    if (newFiles.length === 0) return
    const updatedFiles = [...imageFiles, ...newFiles]
    setImageFiles(updatedFiles)
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f))
    setImagePreviews((prev) => [...prev, ...newPreviews])
  }

  function handleImageRemove(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleGetLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      return
    }
    setLocating(true)
    setLocationStatus('idle')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setValue('pickup_latitude', latitude, { shouldDirty: true })
        setValue('pickup_longitude', longitude, { shouldDirty: true })
        try {
          const [arRes, enRes] = await Promise.all([
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`),
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`),
          ])
          const [arData, enData] = await Promise.all([arRes.json(), enRes.json()])
          if (arData.display_name) setValue('pickup_location_ar', arData.display_name, { shouldDirty: true, shouldValidate: true })
          if (enData.display_name) setValue('pickup_location_en', enData.display_name, { shouldDirty: true, shouldValidate: true })
          setLocationStatus('success')
        } catch {
          setLocationStatus('error')
        }
        setLocating(false)
      },
      () => {
        setLocationStatus('error')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  function toggleFeature(key: string) {
    const current = selectedFeatures || []
    const updated = current.includes(key)
      ? current.filter((f) => f !== key)
      : [...current, key]
    setValue('features', updated, { shouldDirty: true })
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        if (key === 'features') {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      })
      imageFiles.forEach((file) => {
        formData.append('images', file)
      })

      const res = await fetch('/api/cars', {
        method: 'POST',
        body: formData,
      })
      const result = await res.json()

      if (!res.ok) {
        toast({ title: resolveApiErrorMessage(result.error, te), variant: 'destructive' })
        return
      }

      toast({ title: tc('success'), variant: 'success' })
      router.push(`/${locale}/provider/cars`)
    } catch {
      toast({ title: tc('error'), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{isAr ? 'سيارة جديدة' : 'New Car'}</h1>

      <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-6">
        {/* Brand & Model */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{isAr ? 'الماركة والموديل' : 'Brand & Model'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'الماركة' : 'Brand'} ({isAr ? 'عربي' : 'Arabic'}) *
              </label>
              <input
                {...register('brand_ar')}
                dir="rtl"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.brand_ar && <p className="text-destructive text-sm mt-1">{errors.brand_ar.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'الماركة' : 'Brand'} ({isAr ? 'إنجليزي' : 'English'}) <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input {...register('brand_en')} dir="ltr" className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'الموديل' : 'Model'} ({isAr ? 'عربي' : 'Arabic'}) *
              </label>
              <input
                {...register('model_ar')}
                dir="rtl"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.model_ar && <p className="text-destructive text-sm mt-1">{errors.model_ar.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'الموديل' : 'Model'} ({isAr ? 'إنجليزي' : 'English'}) <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input {...register('model_en')} dir="ltr" className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Location & Year */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{isAr ? 'الموقع والسنة' : 'Location & Year'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'المدينة' : 'City'} ({isAr ? 'عربي' : 'Arabic'}) *</label>
              <input {...register('city_ar')} dir="rtl" className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              {errors.city_ar && <p className="text-destructive text-sm mt-1">{errors.city_ar.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'المدينة' : 'City'} ({isAr ? 'إنجليزي' : 'English'}) <span className="text-muted-foreground">({tc('optional')})</span></label>
              <input {...register('city_en')} dir="ltr" className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'سنة الصنع' : 'Year'} *</label>
              <input type="number" min={2000} max={2027} {...register('year', { valueAsNumber: true })} className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              {errors.year && <p className="text-destructive text-sm mt-1">{errors.year.message}</p>}
            </div>
          </div>
        </div>

        {/* Pickup Location */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {isAr ? 'موقع الاستلام' : 'Pickup Location'}
          </h2>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={locating}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed font-semibold text-sm transition-all',
              locationStatus === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : locationStatus === 'error'
                ? 'border-destructive/30 bg-destructive/5 text-destructive'
                : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
            )}
          >
            {locating ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{isAr ? 'جاري تحديد الموقع...' : 'Locating...'}</>
            ) : locationStatus === 'success' ? (
              <><Check className="h-4 w-4" />{isAr ? 'تم تحديد الموقع بنجاح' : 'Location detected successfully'}</>
            ) : (
              <><LocateFixed className="h-4 w-4" />{isAr ? 'تحديد موقعي الحالي' : 'Get Current Location'}</>
            )}
          </button>
          {locationStatus === 'error' && (
            <p className="text-destructive text-sm">{isAr ? 'تعذر تحديد الموقع' : 'Could not detect location'}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'موقع الاستلام' : 'Pickup Location'} ({isAr ? 'عربي' : 'Arabic'}) <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input {...register('pickup_location_ar')} dir="rtl" className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder={isAr ? 'مثال: مطار الملك خالد، مخرج 15' : 'e.g. King Khalid Airport, Exit 15'} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'موقع الاستلام' : 'Pickup Location'} ({isAr ? 'إنجليزي' : 'English'}) <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input {...register('pickup_location_en')} dir="ltr" className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. King Khalid Airport, Exit 15" />
            </div>
          </div>
          <input type="hidden" {...register('pickup_latitude', { valueAsNumber: true })} />
          <input type="hidden" {...register('pickup_longitude', { valueAsNumber: true })} />
        </div>

        {/* Pickup & Return Type */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            {isAr ? 'نوع الاستلام والإرجاع' : 'Pickup & Return Type'}
          </h2>

          {/* Pickup Type */}
          <div>
            <label className="text-sm font-medium block mb-2">{isAr ? 'نوع الاستلام' : 'Pickup Type'} *</label>
            <div className="grid grid-cols-2 gap-3">
              {(['airport', 'branch'] as const).map((type) => (
                <label
                  key={type}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    pickupType === type
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  )}
                >
                  <input
                    type="radio"
                    {...register('pickup_type')}
                    value={type}
                    className="sr-only"
                  />
                  {type === 'airport' ? <Plane className="h-5 w-5" /> : <Building className="h-5 w-5" />}
                  <span className="text-sm">{type === 'airport' ? (isAr ? 'توصيل للمطار' : 'Airport Delivery') : (isAr ? 'فرع الشركة' : 'Company Branch')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Branch name (if branch) */}
          {pickupType === 'branch' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">{isAr ? 'اسم الفرع' : 'Branch Name'} ({isAr ? 'عربي' : 'Arabic'})</label>
                <input {...register('pickup_branch_name_ar')} dir="rtl" className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder={isAr ? 'مثال: فرع الرياض - حي العليا' : 'e.g. Riyadh Branch - Olaya'} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{isAr ? 'اسم الفرع' : 'Branch Name'} ({isAr ? 'إنجليزي' : 'English'})</label>
                <input {...register('pickup_branch_name_en')} dir="ltr" className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. Riyadh Branch - Olaya" />
              </div>
            </div>
          )}

          {/* Return Type */}
          <div>
            <label className="text-sm font-medium block mb-2">{isAr ? 'نوع الإرجاع' : 'Return Type'}</label>
            <div className="grid grid-cols-3 gap-3">
              {(['same_location', 'airport', 'branch'] as const).map((type) => (
                <label
                  key={type}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm',
                    returnType === type
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  )}
                >
                  <input
                    type="radio"
                    {...register('return_type')}
                    value={type}
                    className="sr-only"
                  />
                  <span>{type === 'same_location' ? (isAr ? 'نفس الموقع' : 'Same Location') : type === 'airport' ? (isAr ? 'المطار' : 'Airport') : (isAr ? 'فرع مختلف' : 'Different Branch')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Return branch name (if different branch) */}
          {returnType === 'branch' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">{isAr ? 'اسم فرع الإرجاع' : 'Return Branch Name'} ({isAr ? 'عربي' : 'Arabic'})</label>
                <input {...register('return_branch_name_ar')} dir="rtl" className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{isAr ? 'اسم فرع الإرجاع' : 'Return Branch Name'} ({isAr ? 'إنجليزي' : 'English'})</label>
                <input {...register('return_branch_name_en')} dir="ltr" className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>
          )}
        </div>

        {/* Pickup & Return Hours */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {isAr ? 'ساعات الاستلام والإرجاع' : 'Pickup & Return Hours'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'الاستلام من' : 'Pickup From'}</label>
              <input type="time" {...register('pickup_hour_from')} className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'الاستلام حتى' : 'Pickup To'}</label>
              <input type="time" {...register('pickup_hour_to')} className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'الإرجاع من' : 'Return From'}</label>
              <input type="time" {...register('return_hour_from')} className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'الإرجاع حتى' : 'Return To'}</label>
              <input type="time" {...register('return_hour_to')} className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Category, Specs & Pricing */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{isAr ? 'المواصفات والسعر' : 'Specs & Pricing'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'الفئة' : 'Category'} *</label>
              <select {...register('category')} className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">{isAr ? 'اختر الفئة' : 'Select category'}</option>
                {Object.entries(CAR_CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>{isAr ? val.ar : val.en}</option>
                ))}
              </select>
              {errors.category && <p className="text-destructive text-sm mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'ناقل الحركة' : 'Transmission'} *</label>
              <select {...register('transmission')} className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                {Object.entries(TRANSMISSION_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{isAr ? val.ar : val.en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'نوع الوقود' : 'Fuel Type'} *</label>
              <select {...register('fuel_type')} className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                {Object.entries(FUEL_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{isAr ? val.ar : val.en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'عدد المقاعد' : 'Seats'} *</label>
              <input type="number" min={2} max={50} {...register('seats_count', { valueAsNumber: true })} className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              {errors.seats_count && <p className="text-destructive text-sm mt-1">{errors.seats_count.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{tc('currency')} *</label>
              <select {...register('currency')} className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="SAR">{tc('sar')} (SAR)</option>
                <option value="USD">{tc('usd')} (USD)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'السعر لكل يوم' : 'Price Per Day'} ({currency === 'USD' ? tc('usd') : tc('sar')}) *</label>
              <input type="number" min={1} max={999999} step={0.01} {...register('price_per_day', { valueAsNumber: true })} className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              {errors.price_per_day && <p className="text-destructive text-sm mt-1">{errors.price_per_day.message}</p>}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{isAr ? 'المميزات' : 'Features'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(CAR_FEATURES).map(([key, val]) => (
              <label
                key={key}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm',
                  selectedFeatures.includes(key)
                    ? 'border-primary bg-primary/5 text-primary font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(key)}
                  onChange={() => toggleFeature(key)}
                  className="sr-only"
                />
                <span>{isAr ? val.ar : val.en}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{isAr ? 'الحجز والتوفر' : 'Booking & Availability'}</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('instant_book')} className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary" />
            <div>
              <span className="font-medium text-sm">{isAr ? 'حجز فوري' : 'Instant Book'}</span>
              <p className="text-xs text-muted-foreground">{isAr ? 'السماح بالحجز بدون تحديد مواعيد' : 'Allow booking without specific date restrictions'}</p>
            </div>
          </label>

          {!instantBook && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-sm font-medium block mb-1.5">{isAr ? 'متاح من' : 'Available From'}</label>
                <input type="hidden" {...register('available_from')} />
                <Popover>
                  <PopoverTrigger className={cn('flex h-11 w-full items-center justify-between rounded-lg border bg-background px-4 text-sm transition-colors hover:bg-slate-50', availableFromDate && isValid(availableFromDate) ? 'text-slate-900' : 'text-slate-500')}>
                    {availableFromDate && isValid(availableFromDate) ? format(availableFromDate, 'PPP', { locale: isAr ? arSA : enUS }) : <span>{isAr ? 'اختر التاريخ' : 'Select date'}</span>}
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={availableFromDate && isValid(availableFromDate) ? availableFromDate : undefined} onSelect={(date) => setValue('available_from', date ? format(date, 'yyyy-MM-dd') : '', { shouldDirty: true, shouldValidate: true })} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{isAr ? 'متاح حتى' : 'Available To'}</label>
                <input type="hidden" {...register('available_to')} />
                <Popover>
                  <PopoverTrigger className={cn('flex h-11 w-full items-center justify-between rounded-lg border bg-background px-4 text-sm transition-colors hover:bg-slate-50', availableToDate && isValid(availableToDate) ? 'text-slate-900' : 'text-slate-500')}>
                    {availableToDate && isValid(availableToDate) ? format(availableToDate, 'PPP', { locale: isAr ? arSA : enUS }) : <span>{isAr ? 'اختر التاريخ' : 'Select date'}</span>}
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={availableToDate && isValid(availableToDate) ? availableToDate : undefined} onSelect={(date) => setValue('available_to', date ? format(date, 'yyyy-MM-dd') : '', { shouldDirty: true, shouldValidate: true })} disabled={(date) => Boolean(availableFromDate && isValid(availableFromDate) && date < availableFromDate)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        {/* Images */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {isAr ? 'صور السيارة' : 'Car Images'}{' '}
            <span className="text-muted-foreground text-sm font-normal">({isAr ? 'حتى 5 صور' : 'Up to 5 images'})</span>
          </h2>
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imagePreviews.map((url, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden bg-muted h-32">
                  <Image src={url} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" unoptimized />
                  <button type="button" onClick={() => handleImageRemove(i)} className="absolute top-2 end-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {imageFiles.length < 5 && (
            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{isAr ? 'اضغط لرفع صور' : 'Click to upload images'}</span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => handleImageAdd(e.target.files)} />
            </label>
          )}
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-1">
            <p className="text-destructive font-semibold text-sm">{isAr ? 'يرجى تصحيح الأخطاء التالية:' : 'Please fix the following errors:'}</p>
            {Object.entries(errors).map(([key, err]) => (
              <p key={key} className="text-destructive text-sm">• {(err as { message?: string })?.message || key}</p>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isAr ? 'نشر السيارة' : 'Post Car'}
        </button>
      </form>
    </div>
  )
}
