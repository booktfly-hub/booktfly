'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { z } from 'zod'
import { resolveApiErrorMessage } from '@/lib/api-error'
import { getRoomSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { ROOM_CATEGORIES, ROOM_AMENITIES } from '@/lib/constants'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, isValid, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale'
import type { Room } from '@/types'
import { NameChangePolicyCard } from '@/components/shared/name-change-policy-card'
import {
  Loader2,
  ImageIcon,
  X,
  CalendarIcon,
} from 'lucide-react'

type FormData = z.infer<ReturnType<typeof getRoomSchema>>

export default function EditRoomPage() {
  const t = useTranslations('provider')
  const tc = useTranslations('common')
  const te = useTranslations('errors')
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const router = useRouter()
  const params = useParams()
  const roomId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [room, setRoom] = useState<Room | null>(null)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(getRoomSchema(locale)),
    defaultValues: {
      currency: 'SAR',
      max_capacity: 1,
      price_per_night: 0,
      instant_book: true,
      amenities: [],
      category: '',
      name_change_allowed: false,
      name_change_fee: 0,
      name_change_is_refundable: true,
    },
  })

  const currency = watch('currency')
  const instantBook = watch('instant_book')
  const availableFrom = watch('available_from')
  const availableTo = watch('available_to')
  const selectedAmenities = watch('amenities') || []

  const availableFromDate = availableFrom ? parseISO(availableFrom) : undefined
  const availableToDate = availableTo ? parseISO(availableTo) : undefined

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`/api/rooms/${roomId}`)
        if (!res.ok) {
          router.push(`/${locale}/provider/rooms`)
          return
        }
        const data = await res.json()
        const r = data.room as Room
        setRoom(r)
        setExistingImages(r.images || [])

        reset({
          name_ar: r.name_ar,
          name_en: r.name_en || '',
          description_ar: r.description_ar || '',
          description_en: r.description_en || '',
          city_ar: r.city_ar,
          city_en: r.city_en || '',
          address_ar: r.address_ar || '',
          address_en: r.address_en || '',
          category: r.category,
          price_per_night: r.price_per_night,
          currency: r.currency,
          max_capacity: r.max_capacity,
          amenities: r.amenities || [],
          instant_book: r.instant_book,
          available_from: r.available_from || '',
          available_to: r.available_to || '',
          name_change_allowed: r.name_change_allowed ?? false,
          name_change_fee: r.name_change_fee ?? 0,
          name_change_is_refundable: r.name_change_is_refundable ?? true,
        })
      } catch {
        router.push(`/${locale}/provider/rooms`)
      } finally {
        setLoading(false)
      }
    }
    fetchRoom()
  }, [roomId])

  function handleNewImageAdd(files: FileList | null) {
    if (!files) return
    const totalImages = existingImages.length + newImageFiles.length
    const allowed = Math.max(0, 5 - totalImages)
    const added = Array.from(files).slice(0, allowed)
    if (added.length === 0) return

    setNewImageFiles((prev) => [...prev, ...added])
    const previews = added.map((f) => URL.createObjectURL(f))
    setNewImagePreviews((prev) => [...prev, ...previews])
  }

  function handleExistingImageRemove(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  function handleNewImageRemove(index: number) {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index))
    setNewImagePreviews((prev) => {
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

      newImageFiles.forEach((file) => {
        formData.append('images', file)
      })

      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        toast({
          title: resolveApiErrorMessage(result.error, te),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!room) return null

  const totalImagesCount = existingImages.length + newImageFiles.length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{isAr ? 'تعديل الغرفة' : 'Edit Room'}</h1>

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
                      ? format(availableFromDate, 'd MMM yyyy', { locale: enUS })
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
                      ? format(availableToDate, 'd MMM yyyy', { locale: enUS })
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

          {existingImages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">
                {isAr ? 'الصور الحالية' : 'Current Images'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {existingImages.map((url, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden bg-muted h-32">
                    <Image src={url} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => handleExistingImageRemove(i)}
                      className="absolute top-2 end-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newImagePreviews.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">
                {isAr ? 'صور جديدة' : 'New Images'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {newImagePreviews.map((url, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden bg-muted h-32">
                    <Image src={url} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => handleNewImageRemove(i)}
                      className="absolute top-2 end-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalImagesCount < 5 && (
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
                onChange={(e) => handleNewImageAdd(e.target.files)}
              />
            </label>
          )}
        </div>

        {/* Name change policy */}
        <NameChangePolicyCard
          allowed={!!watch('name_change_allowed')}
          onAllowedChange={(v) => setValue('name_change_allowed', v, { shouldDirty: true })}
          fee={watch('name_change_fee') ?? 0}
          onFeeChange={(v) => setValue('name_change_fee', v === '' ? 0 : v, { shouldDirty: true })}
          refundable={watch('name_change_is_refundable') ?? true}
          onRefundableChange={(v) => setValue('name_change_is_refundable', v, { shouldDirty: true })}
          title={isAr ? 'سياسة تغيير اسم الضيف' : 'Guest name change policy'}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isAr ? 'حفظ التعديلات' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
