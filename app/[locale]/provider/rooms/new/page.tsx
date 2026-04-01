'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { getRoomSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { ROOM_CATEGORIES, ROOM_AMENITIES } from '@/lib/constants'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, isValid, parseISO } from 'date-fns'
import { arSA, enUS } from 'date-fns/locale'
import {
  Loader2,
  ImageIcon,
  X,
  CalendarIcon,
} from 'lucide-react'

type FormData = z.infer<ReturnType<typeof getRoomSchema>>

export default function NewRoomPage() {
  const t = useTranslations('provider')
  const tc = useTranslations('common')
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(getRoomSchema(locale)),
    defaultValues: {
      currency: 'SAR',
      max_capacity: 1,
      price_per_night: 0,
      instant_book: true,
      amenities: [],
      category: '',
    },
  })

  const currency = watch('currency')
  const instantBook = watch('instant_book')
  const availableFrom = watch('available_from')
  const availableTo = watch('available_to')
  const selectedAmenities = watch('amenities') || []

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

  function toggleAmenity(key: string) {
    const current = selectedAmenities || []
    const updated = current.includes(key)
      ? current.filter((a) => a !== key)
      : [...current, key]
    setValue('amenities', updated, { shouldDirty: true })
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const formData = new FormData()

      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        if (key === 'amenities') {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      })

      imageFiles.forEach((file) => {
        formData.append('images', file)
      })

      const res = await fetch('/api/rooms', {
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
      router.push(`/${locale}/provider/rooms`)
    } catch {
      toast({ title: tc('error'), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{isAr ? 'غرفة جديدة' : 'New Room'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Room Name */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{isAr ? 'اسم الغرفة' : 'Room Name'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'الاسم' : 'Name'} ({isAr ? 'عربي' : 'Arabic'}) *
              </label>
              <input
                {...register('name_ar')}
                dir="rtl"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.name_ar && (
                <p className="text-destructive text-sm mt-1">{errors.name_ar.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'الاسم' : 'Name'} ({isAr ? 'إنجليزي' : 'English'}){' '}
                <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input
                {...register('name_en')}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{isAr ? 'الموقع' : 'Location'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'المدينة' : 'City'} ({isAr ? 'عربي' : 'Arabic'}) *
              </label>
              <input
                {...register('city_ar')}
                dir="rtl"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.city_ar && (
                <p className="text-destructive text-sm mt-1">{errors.city_ar.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'المدينة' : 'City'} ({isAr ? 'إنجليزي' : 'English'}){' '}
                <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input
                {...register('city_en')}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'العنوان' : 'Address'} ({isAr ? 'عربي' : 'Arabic'}){' '}
                <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input
                {...register('address_ar')}
                dir="rtl"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'العنوان' : 'Address'} ({isAr ? 'إنجليزي' : 'English'}){' '}
                <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input
                {...register('address_en')}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Category & Pricing */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{isAr ? 'التصنيف والسعر' : 'Category & Pricing'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'التصنيف' : 'Category'} *
              </label>
              <select
                {...register('category')}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">{isAr ? 'اختر التصنيف' : 'Select category'}</option>
                {Object.entries(ROOM_CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {isAr ? val.ar : val.en}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-destructive text-sm mt-1">{errors.category.message}</p>
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
                {isAr ? 'السعر لكل ليلة' : 'Price Per Night'} ({currency === 'USD' ? tc('usd') : tc('sar')}) *
              </label>
              <input
                type="number"
                min={1}
                step={0.01}
                {...register('price_per_night', { valueAsNumber: true })}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.price_per_night && (
                <p className="text-destructive text-sm mt-1">{errors.price_per_night.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'السعة القصوى' : 'Max Capacity'} *
              </label>
              <input
                type="number"
                min={1}
                {...register('max_capacity', { valueAsNumber: true })}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.max_capacity && (
                <p className="text-destructive text-sm mt-1">{errors.max_capacity.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{isAr ? 'المرافق' : 'Amenities'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(ROOM_AMENITIES).map(([key, val]) => (
              <label
                key={key}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm',
                  selectedAmenities.includes(key)
                    ? 'border-primary bg-primary/5 text-primary font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(key)}
                  onChange={() => toggleAmenity(key)}
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
            <input
              type="checkbox"
              {...register('instant_book')}
              className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="font-medium text-sm">
                {isAr ? 'حجز فوري' : 'Instant Book'}
              </span>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'السماح للضيوف بالحجز بدون تحديد مواعيد' : 'Allow guests to book without specific date restrictions'}
              </p>
            </div>
          </label>

          {!instantBook && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  {isAr ? 'متاح من' : 'Available From'}
                </label>
                <input type="hidden" {...register('available_from')} />
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      'flex h-11 w-full items-center justify-between rounded-lg border bg-background px-4 text-sm transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:outline-none',
                      availableFromDate && isValid(availableFromDate) ? 'text-slate-900' : 'text-slate-500'
                    )}
                  >
                    {availableFromDate && isValid(availableFromDate)
                      ? format(availableFromDate, 'PPP', { locale: isAr ? arSA : enUS })
                      : <span>{isAr ? 'اختر التاريخ' : 'Select date'}</span>}
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={availableFromDate && isValid(availableFromDate) ? availableFromDate : undefined}
                      onSelect={(date) =>
                        setValue('available_from', date ? format(date, 'yyyy-MM-dd') : '', {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  {isAr ? 'متاح حتى' : 'Available To'}
                </label>
                <input type="hidden" {...register('available_to')} />
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      'flex h-11 w-full items-center justify-between rounded-lg border bg-background px-4 text-sm transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:outline-none',
                      availableToDate && isValid(availableToDate) ? 'text-slate-900' : 'text-slate-500'
                    )}
                  >
                    {availableToDate && isValid(availableToDate)
                      ? format(availableToDate, 'PPP', { locale: isAr ? arSA : enUS })
                      : <span>{isAr ? 'اختر التاريخ' : 'Select date'}</span>}
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={availableToDate && isValid(availableToDate) ? availableToDate : undefined}
                      onSelect={(date) =>
                        setValue('available_to', date ? format(date, 'yyyy-MM-dd') : '', {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      disabled={(date) =>
                        Boolean(availableFromDate && isValid(availableFromDate) && date < availableFromDate)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{tc('description')}</h2>
          <div>
            <label className="text-sm font-medium block mb-1.5">
              {tc('description')} ({isAr ? 'عربي' : 'Arabic'}){' '}
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
              {tc('description')} ({isAr ? 'إنجليزي' : 'English'}){' '}
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

        {/* Images */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {isAr ? 'صور الغرفة' : 'Room Images'}{' '}
            <span className="text-muted-foreground text-sm font-normal">
              ({isAr ? 'حتى 5 صور' : 'Up to 5 images'})
            </span>
          </h2>
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imagePreviews.map((url, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden bg-muted h-32">
                  <Image src={url} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(i)}
                    className="absolute top-2 end-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {imageFiles.length < 5 && (
            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isAr ? 'اضغط لرفع صور' : 'Click to upload images'}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => handleImageAdd(e.target.files)}
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
          {isAr ? 'نشر الغرفة' : 'Post Room'}
        </button>
      </form>
    </div>
  )
}
