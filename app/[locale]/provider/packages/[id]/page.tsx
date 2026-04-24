'use client'

import { pick } from '@/lib/i18n-helpers'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { CABIN_CLASSES, CAR_CATEGORIES } from '@/lib/constants'
import { NameChangePolicyCard } from '@/components/shared/name-change-policy-card'
import type { Package, Trip, Room, Car } from '@/types'
import {
  Loader2,
  X,
  Plane,
  BedDouble,
  CarFront,
  ImageIcon,
  Package as PackageIcon,
  DollarSign,
  Calendar,
  Power,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
} from 'lucide-react'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, parseISO, isValid } from 'date-fns'

export default function EditPackagePage() {
  const tc = useTranslations('common')
  const locale = useLocale() as 'ar' | 'en' | 'tr'
  const isAr = locale === 'ar'
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [pkg, setPkg] = useState<Package | null>(null)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])

  // Basic info
  const [nameAr, setNameAr] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [destinationCityAr, setDestinationCityAr] = useState('')
  const [destinationCityEn, setDestinationCityEn] = useState('')

  // What's included
  const [includesFlight, setIncludesFlight] = useState(false)
  const [includesHotel, setIncludesHotel] = useState(false)
  const [includesCar, setIncludesCar] = useState(false)

  // Name-change policy
  const [nameChangeAllowed, setNameChangeAllowed] = useState(false)
  const [nameChangeFee, setNameChangeFee] = useState<number | ''>(0)
  const [nameChangeRefundable, setNameChangeRefundable] = useState(true)

  // Flight
  const [flightMode, setFlightMode] = useState<'existing' | 'manual'>('existing')
  const [myTrips, setMyTrips] = useState<Trip[]>([])
  const [selectedTripId, setSelectedTripId] = useState('')
  const [flightAirline, setFlightAirline] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  const [flightOriginAr, setFlightOriginAr] = useState('')
  const [flightOriginEn, setFlightOriginEn] = useState('')
  const [flightOriginCode, setFlightOriginCode] = useState('')
  const [flightDestinationAr, setFlightDestinationAr] = useState('')
  const [flightDestinationEn, setFlightDestinationEn] = useState('')
  const [flightDestinationCode, setFlightDestinationCode] = useState('')
  const [flightDepartureAt, setFlightDepartureAt] = useState('')
  const [flightReturnAt, setFlightReturnAt] = useState('')
  const [flightCabinClass, setFlightCabinClass] = useState('')
  const [flightSeatsIncluded, setFlightSeatsIncluded] = useState<number | ''>('')

  // Hotel
  const [hotelMode, setHotelMode] = useState<'existing' | 'manual'>('existing')
  const [myRooms, setMyRooms] = useState<Room[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [hotelNameAr, setHotelNameAr] = useState('')
  const [hotelNameEn, setHotelNameEn] = useState('')
  const [hotelCategory, setHotelCategory] = useState('')
  const [hotelNights, setHotelNights] = useState<number | ''>('')
  const [hotelCityAr, setHotelCityAr] = useState('')
  const [hotelCityEn, setHotelCityEn] = useState('')

  // Car
  const [carMode, setCarMode] = useState<'existing' | 'manual'>('existing')
  const [myCars, setMyCars] = useState<Car[]>([])
  const [selectedCarId, setSelectedCarId] = useState('')
  const [carBrandAr, setCarBrandAr] = useState('')
  const [carBrandEn, setCarBrandEn] = useState('')
  const [carModelAr, setCarModelAr] = useState('')
  const [carModelEn, setCarModelEn] = useState('')
  const [carCategory, setCarCategory] = useState('')
  const [carRentalDays, setCarRentalDays] = useState<number | ''>('')

  // Pricing
  const [tripPrice, setTripPrice] = useState<number | ''>('')
  const [carPrice, setCarPrice] = useState<number | ''>('')
  const [hotelPrice, setHotelPrice] = useState<number | ''>('')
  const [offerPrice, setOfferPrice] = useState<number | ''>('')
  const [currency, setCurrency] = useState('SAR')
  const [maxBookings, setMaxBookings] = useState<number | ''>(10)

  // Dates
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const totalImages = existingImages.length + newImageFiles.length

  useEffect(() => {
    fetch('/api/trips/my-trips').then(r => r.json()).then(d => setMyTrips(d.trips || [])).catch(() => {})
    fetch('/api/rooms/my-rooms').then(r => r.json()).then(d => setMyRooms(d.rooms || [])).catch(() => {})
    fetch('/api/cars/my-cars').then(r => r.json()).then(d => setMyCars(d.cars || [])).catch(() => {})
  }, [])

  useEffect(() => {
    async function fetchPackage() {
      try {
        const res = await fetch(`/api/packages/${id}`)
        if (!res.ok) {
          toast({ title: pick(locale, 'الباقة غير موجودة', 'Package not found', 'Paket bulunamadı'), variant: 'destructive' })
          router.push(`/${locale}/provider/packages`)
          return
        }
        const data = await res.json()
        const p: Package = data.package || data
        setPkg(p)
        setExistingImages(p.images || [])

        setNameAr(p.name_ar)
        setNameEn(p.name_en || '')
        setDescriptionAr(p.description_ar || '')
        setDescriptionEn(p.description_en || '')
        setDestinationCityAr(p.destination_city_ar)
        setDestinationCityEn(p.destination_city_en || '')

        setIncludesFlight(p.includes_flight)
        setIncludesHotel(p.includes_hotel)
        setIncludesCar(p.includes_car)

        setNameChangeAllowed(p.name_change_allowed ?? false)
        setNameChangeFee(p.name_change_fee ?? 0)
        setNameChangeRefundable(p.name_change_is_refundable ?? true)

        if (p.trip_id) {
          setFlightMode('existing')
          setSelectedTripId(p.trip_id)
        } else if (p.flight_airline || p.flight_number) {
          setFlightMode('manual')
        }
        setFlightAirline(p.flight_airline || '')
        setFlightNumber(p.flight_number || '')
        setFlightOriginAr(p.flight_origin_ar || '')
        setFlightOriginEn(p.flight_origin_en || '')
        setFlightOriginCode(p.flight_origin_code || '')
        setFlightDestinationAr(p.flight_destination_ar || '')
        setFlightDestinationEn(p.flight_destination_en || '')
        setFlightDestinationCode(p.flight_destination_code || '')
        setFlightDepartureAt(p.flight_departure_at || '')
        setFlightReturnAt(p.flight_return_at || '')
        setFlightCabinClass(p.flight_cabin_class || '')
        setFlightSeatsIncluded(p.flight_seats_included || '')

        if (p.room_id) {
          setHotelMode('existing')
          setSelectedRoomId(p.room_id)
        } else if (p.hotel_name_ar) {
          setHotelMode('manual')
        }
        setHotelNameAr(p.hotel_name_ar || '')
        setHotelNameEn(p.hotel_name_en || '')
        setHotelCategory(p.hotel_category || '')
        setHotelNights(p.hotel_nights || '')
        setHotelCityAr(p.hotel_city_ar || '')
        setHotelCityEn(p.hotel_city_en || '')

        if (p.car_id) {
          setCarMode('existing')
          setSelectedCarId(p.car_id)
        } else if (p.car_brand_ar) {
          setCarMode('manual')
        }
        setCarBrandAr(p.car_brand_ar || '')
        setCarBrandEn(p.car_brand_en || '')
        setCarModelAr(p.car_model_ar || '')
        setCarModelEn(p.car_model_en || '')
        setCarCategory(p.car_category || '')
        setCarRentalDays(p.car_rental_days || '')

        setTripPrice(p.trip_price || '')
        setCarPrice(p.car_price || '')
        setHotelPrice(p.hotel_price || '')
        setOfferPrice(p.original_price != null && p.original_price > p.total_price ? p.total_price : '')
        setCurrency(p.currency)
        setMaxBookings(p.max_bookings)
        setStartDate(p.start_date || '')
        setEndDate(p.end_date || '')
      } catch {
        toast({ title: tc('error'), variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchPackage()
  }, [id])

  function handleImageAdd(files: FileList | null) {
    if (!files) return
    const maxNew = 5 - totalImages
    const added = Array.from(files).slice(0, maxNew)
    if (added.length === 0) return
    setNewImageFiles(prev => [...prev, ...added])
    setNewImagePreviews(prev => [...prev, ...added.map(f => URL.createObjectURL(f))])
  }

  function handleRemoveExisting(index: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  function handleRemoveNew(index: number) {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleToggleStatus() {
    if (!pkg || (pkg.status !== 'active' && pkg.status !== 'deactivated')) return
    setToggling(true)
    try {
      const res = await fetch(`/api/packages/${id}/deactivate`, { method: 'PATCH' })
      if (res.ok) {
        const newStatus = pkg.status === 'active' ? 'deactivated' : 'active'
        setPkg({ ...pkg, status: newStatus })
        toast({ title: tc('success'), variant: 'success' })
      }
    } catch {
      toast({ title: tc('error'), variant: 'destructive' })
    } finally {
      setToggling(false)
    }
  }

  const atLeastOneIncluded = includesFlight || includesHotel || includesCar

  const componentSum =
    (includesFlight && tripPrice ? Number(tripPrice) : 0) +
    (includesCar && carPrice ? Number(carPrice) : 0) +
    (includesHotel && hotelPrice ? Number(hotelPrice) : 0)

  const computedTotal = componentSum > 0 ? componentSum : (pkg?.total_price ?? 0)

  const savings = offerPrice && computedTotal > Number(offerPrice) ? computedTotal - Number(offerPrice) : 0

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameAr || !destinationCityAr || !atLeastOneIncluded || computedTotal <= 0) {
      toast({ title: pick(locale, 'يرجى ملء جميع الحقول المطلوبة', 'Please fill all required fields', 'Lütfen tüm gerekli alanları doldurun'), variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name_ar', nameAr)
      if (nameEn) formData.append('name_en', nameEn)
      if (descriptionAr) formData.append('description_ar', descriptionAr)
      if (descriptionEn) formData.append('description_en', descriptionEn)
      formData.append('destination_city_ar', destinationCityAr)
      if (destinationCityEn) formData.append('destination_city_en', destinationCityEn)

      formData.append('includes_flight', String(includesFlight))
      formData.append('includes_hotel', String(includesHotel))
      formData.append('includes_car', String(includesCar))

      if (includesFlight) {
        if (flightMode === 'existing' && selectedTripId) {
          formData.append('trip_id', selectedTripId)
        } else if (flightMode === 'manual') {
          if (flightAirline) formData.append('flight_airline', flightAirline)
          if (flightNumber) formData.append('flight_number', flightNumber)
          if (flightOriginAr) formData.append('flight_origin_ar', flightOriginAr)
          if (flightOriginEn) formData.append('flight_origin_en', flightOriginEn)
          if (flightOriginCode) formData.append('flight_origin_code', flightOriginCode)
          if (flightDestinationAr) formData.append('flight_destination_ar', flightDestinationAr)
          if (flightDestinationEn) formData.append('flight_destination_en', flightDestinationEn)
          if (flightDestinationCode) formData.append('flight_destination_code', flightDestinationCode)
          if (flightDepartureAt) formData.append('flight_departure_at', flightDepartureAt)
          if (flightReturnAt) formData.append('flight_return_at', flightReturnAt)
          if (flightCabinClass) formData.append('flight_cabin_class', flightCabinClass)
          if (flightSeatsIncluded) formData.append('flight_seats_included', String(flightSeatsIncluded))
        }
      }

      if (includesHotel) {
        if (hotelMode === 'existing' && selectedRoomId) {
          formData.append('room_id', selectedRoomId)
        } else if (hotelMode === 'manual') {
          if (hotelNameAr) formData.append('hotel_name_ar', hotelNameAr)
          if (hotelNameEn) formData.append('hotel_name_en', hotelNameEn)
          if (hotelCategory) formData.append('hotel_category', hotelCategory)
          if (hotelNights) formData.append('hotel_nights', String(hotelNights))
          if (hotelCityAr) formData.append('hotel_city_ar', hotelCityAr)
          if (hotelCityEn) formData.append('hotel_city_en', hotelCityEn)
        }
      }

      if (includesCar) {
        if (carMode === 'existing' && selectedCarId) {
          formData.append('car_id', selectedCarId)
        } else if (carMode === 'manual') {
          if (carBrandAr) formData.append('car_brand_ar', carBrandAr)
          if (carBrandEn) formData.append('car_brand_en', carBrandEn)
          if (carModelAr) formData.append('car_model_ar', carModelAr)
          if (carModelEn) formData.append('car_model_en', carModelEn)
          if (carCategory) formData.append('car_category', carCategory)
          if (carRentalDays) formData.append('car_rental_days', String(carRentalDays))
        }
      }

      if (includesFlight && tripPrice) formData.append('trip_price', String(tripPrice))
      if (includesCar && carPrice) formData.append('car_price', String(carPrice))
      if (includesHotel && hotelPrice) formData.append('hotel_price', String(hotelPrice))
      if (offerPrice) formData.append('offer_price', String(offerPrice))
      formData.append('total_price', String(computedTotal))
      formData.append('currency', currency)
      if (maxBookings) formData.append('max_bookings', String(maxBookings))
      if (startDate) formData.append('start_date', startDate)
      if (endDate) formData.append('end_date', endDate)
      formData.append('name_change_allowed', String(nameChangeAllowed))
      formData.append('name_change_fee', String(nameChangeFee === '' ? 0 : nameChangeFee))
      formData.append('name_change_is_refundable', String(nameChangeRefundable))

      formData.append('existing_images', JSON.stringify(existingImages))
      newImageFiles.forEach(file => {
        formData.append('images', file)
      })

      const res = await fetch(`/api/packages/${id}`, {
        method: 'PUT',
        body: formData,
      })
      const result = await res.json()

      if (!res.ok) {
        toast({ title: result.error || tc('error'), variant: 'destructive' })
        return
      }

      toast({ title: tc('success'), variant: 'success' })
      router.push(`/${locale}/provider/packages`)
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

  if (!pkg) return null

  const BackArrow = isAr ? ArrowRight : ArrowLeft
  const inputClass = 'w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
  const selectClass = inputClass

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <BackArrow className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">{pick(locale, 'تعديل الباقة', 'Edit Package', 'Paketi Düzenle')}</h1>
        </div>
        {(pkg.status === 'active' || pkg.status === 'deactivated') && (
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={toggling}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              pkg.status === 'active'
                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            )}
          >
            {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
            {pkg.status === 'active'
              ? (pick(locale, 'تعطيل', 'Deactivate', 'Devre Dışı Bırak'))
              : (pick(locale, 'تفعيل', 'Reactivate', 'Yeniden Etkinleştir'))}
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <PackageIcon className="h-4 w-4 text-primary" />
            {pick(locale, 'المعلومات الأساسية', 'Basic Info', 'Temel Bilgiler')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {pick(locale, 'اسم الباقة', 'Package Name', 'Paket Adı')} ({pick(locale, 'عربي', 'Arabic', 'Arapça')}) *
              </label>
              <input value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {pick(locale, 'اسم الباقة', 'Package Name', 'Paket Adı')} ({pick(locale, 'إنجليزي', 'English', 'İngilizce')}) <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input value={nameEn} onChange={e => setNameEn(e.target.value)} dir="ltr" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {pick(locale, 'مدينة الوجهة', 'Destination City', 'Varış Şehri')} ({pick(locale, 'عربي', 'Arabic', 'Arapça')}) *
              </label>
              <input value={destinationCityAr} onChange={e => setDestinationCityAr(e.target.value)} dir="rtl" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {pick(locale, 'مدينة الوجهة', 'Destination City', 'Varış Şehri')} ({pick(locale, 'إنجليزي', 'English', 'İngilizce')}) <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input value={destinationCityEn} onChange={e => setDestinationCityEn(e.target.value)} dir="ltr" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1.5">
                {pick(locale, 'الوصف', 'Description', 'Açıklama')} ({pick(locale, 'عربي', 'Arabic', 'Arapça')}) <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} dir="rtl" rows={3} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1.5">
                {pick(locale, 'الوصف', 'Description', 'Açıklama')} ({pick(locale, 'إنجليزي', 'English', 'İngilizce')}) <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <textarea value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} dir="ltr" rows={3} className={inputClass} />
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{pick(locale, 'يشمل', "What's Included", "Neler Dahil")} *</h2>
          <p className="text-sm text-muted-foreground">{pick(locale, 'اختر خدمة واحدة على الأقل', 'Select at least one service', 'En az bir hizmet seçin')}</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setIncludesFlight(!includesFlight)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                includesFlight
                  ? 'border-sky-500 bg-sky-50 text-sky-700 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              )}
            >
              <Plane className="h-6 w-6" />
              <span className="text-sm">{pick(locale, 'طيران', 'Flight', 'Uçuş')}</span>
            </button>
            <button
              type="button"
              onClick={() => setIncludesHotel(!includesHotel)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                includesHotel
                  ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              )}
            >
              <BedDouble className="h-6 w-6" />
              <span className="text-sm">{pick(locale, 'فندق', 'Hotel', 'Otel')}</span>
            </button>
            <button
              type="button"
              onClick={() => setIncludesCar(!includesCar)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                includesCar
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              )}
            >
              <CarFront className="h-6 w-6" />
              <span className="text-sm">{pick(locale, 'سيارة', 'Car', 'Araç')}</span>
            </button>
          </div>
        </div>

        {/* Flight Section */}
        {includesFlight && (
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Plane className="h-4 w-4 text-sky-600" />
              {pick(locale, 'تفاصيل الطيران', 'Flight Details', 'Uçuş Ayrıntıları')}
            </h2>
            <div className="flex gap-3 mb-4">
              <button type="button" onClick={() => setFlightMode('existing')}
                className={cn('flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                  flightMode === 'existing' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                {pick(locale, 'اختر رحلة موجودة', 'Select existing trip', 'Mevcut geziyi seç')}
              </button>
              <button type="button" onClick={() => setFlightMode('manual')}
                className={cn('flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                  flightMode === 'manual' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                {pick(locale, 'إدخال يدوي', 'Enter manually', 'Manuel gir')}
              </button>
            </div>

            {flightMode === 'existing' ? (
              <div>
                <label className="text-sm font-medium block mb-1.5">{pick(locale, 'اختر الرحلة', 'Select Trip', 'Gezi Seç')}</label>
                <select value={selectedTripId} onChange={e => setSelectedTripId(e.target.value)} className={selectClass}>
                  <option value="">{pick(locale, 'اختر رحلة...', 'Select a trip...', 'Bir gezi seçin...')}</option>
                  {myTrips.map(trip => (
                    <option key={trip.id} value={trip.id}>
                      {trip.airline} - {isAr ? trip.origin_city_ar : (trip.origin_city_en || trip.origin_city_ar)} → {isAr ? trip.destination_city_ar : (trip.destination_city_en || trip.destination_city_ar)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'شركة الطيران', 'Airline', 'Havayolu')}</label>
                  <input value={flightAirline} onChange={e => setFlightAirline(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'رقم الرحلة', 'Flight Number', 'Uçuş Numarası')}</label>
                  <input value={flightNumber} onChange={e => setFlightNumber(e.target.value)} dir="ltr" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'المغادرة', 'Origin', 'Çıkış')} ({pick(locale, 'عربي', 'Arabic', 'Arapça')})</label>
                  <input value={flightOriginAr} onChange={e => setFlightOriginAr(e.target.value)} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'المغادرة', 'Origin', 'Çıkış')} ({pick(locale, 'إنجليزي', 'English', 'İngilizce')})</label>
                  <input value={flightOriginEn} onChange={e => setFlightOriginEn(e.target.value)} dir="ltr" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'رمز المغادرة', 'Origin Code', 'Çıkış Kodu')}</label>
                  <input value={flightOriginCode} onChange={e => setFlightOriginCode(e.target.value)} dir="ltr" placeholder="e.g. RUH" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'الوجهة', 'Destination', 'Varış')} ({pick(locale, 'عربي', 'Arabic', 'Arapça')})</label>
                  <input value={flightDestinationAr} onChange={e => setFlightDestinationAr(e.target.value)} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'الوجهة', 'Destination', 'Varış')} ({pick(locale, 'إنجليزي', 'English', 'İngilizce')})</label>
                  <input value={flightDestinationEn} onChange={e => setFlightDestinationEn(e.target.value)} dir="ltr" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'رمز الوجهة', 'Destination Code', 'Varış Kodu')}</label>
                  <input value={flightDestinationCode} onChange={e => setFlightDestinationCode(e.target.value)} dir="ltr" placeholder="e.g. JED" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'تاريخ المغادرة', 'Departure Date', 'Kalkış Tarihi')}</label>
                  <input type="datetime-local" value={flightDepartureAt} onChange={e => setFlightDepartureAt(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'تاريخ العودة', 'Return Date', 'Dönüş Tarihi')}</label>
                  <input type="datetime-local" value={flightReturnAt} onChange={e => setFlightReturnAt(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'درجة الرحلة', 'Cabin Class', 'Kabin Sınıfı')}</label>
                  <select value={flightCabinClass} onChange={e => setFlightCabinClass(e.target.value)} className={selectClass}>
                    <option value="">{pick(locale, 'اختر...', 'Select...', 'Seç...')}</option>
                    {Object.entries(CABIN_CLASSES).map(([key, val]) => (
                      <option key={key} value={key}>{isAr ? val.ar : val.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'عدد المقاعد', 'Seats Included', 'Koltuklar Dahil')}</label>
                  <input type="number" min={1} value={flightSeatsIncluded} onChange={e => setFlightSeatsIncluded(e.target.value ? Number(e.target.value) : '')} className={inputClass} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hotel Section */}
        {includesHotel && (
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-amber-600" />
              {pick(locale, 'تفاصيل الفندق', 'Hotel Details', 'Otel Ayrıntıları')}
            </h2>
            <div className="flex gap-3 mb-4">
              <button type="button" onClick={() => setHotelMode('existing')}
                className={cn('flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                  hotelMode === 'existing' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                {pick(locale, 'اختر غرفة موجودة', 'Select existing room', 'Mevcut odayı seç')}
              </button>
              <button type="button" onClick={() => setHotelMode('manual')}
                className={cn('flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                  hotelMode === 'manual' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                {pick(locale, 'إدخال يدوي', 'Enter manually', 'Manuel gir')}
              </button>
            </div>

            {hotelMode === 'existing' ? (
              <div>
                <label className="text-sm font-medium block mb-1.5">{pick(locale, 'اختر الغرفة', 'Select Room', 'Oda Seç')}</label>
                <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} className={selectClass}>
                  <option value="">{pick(locale, 'اختر غرفة...', 'Select a room...', 'Bir oda seçin...')}</option>
                  {myRooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {isAr ? room.name_ar : (room.name_en || room.name_ar)} - {isAr ? room.city_ar : (room.city_en || room.city_ar)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'اسم الفندق', 'Hotel Name', 'Otel Adı')} ({pick(locale, 'عربي', 'Arabic', 'Arapça')})</label>
                  <input value={hotelNameAr} onChange={e => setHotelNameAr(e.target.value)} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'اسم الفندق', 'Hotel Name', 'Otel Adı')} ({pick(locale, 'إنجليزي', 'English', 'İngilizce')})</label>
                  <input value={hotelNameEn} onChange={e => setHotelNameEn(e.target.value)} dir="ltr" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'تصنيف الفندق', 'Hotel Category', 'Otel Kategorisi')}</label>
                  <select value={hotelCategory} onChange={e => setHotelCategory(e.target.value)} className={selectClass}>
                    <option value="">{pick(locale, 'اختر...', 'Select...', 'Seç...')}</option>
                    <option value="3">{pick(locale, '3 نجوم', '3 Stars', '3 Yıldız')}</option>
                    <option value="4">{pick(locale, '4 نجوم', '4 Stars', '4 Yıldız')}</option>
                    <option value="5">{pick(locale, '5 نجوم', '5 Stars', '5 Yıldız')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'عدد الليالي', 'Number of Nights', 'Gece Sayısı')}</label>
                  <input type="number" min={1} value={hotelNights} onChange={e => setHotelNights(e.target.value ? Number(e.target.value) : '')} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'المدينة', 'City', 'Şehir')} ({pick(locale, 'عربي', 'Arabic', 'Arapça')})</label>
                  <input value={hotelCityAr} onChange={e => setHotelCityAr(e.target.value)} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'المدينة', 'City', 'Şehir')} ({pick(locale, 'إنجليزي', 'English', 'İngilizce')})</label>
                  <input value={hotelCityEn} onChange={e => setHotelCityEn(e.target.value)} dir="ltr" className={inputClass} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Car Section */}
        {includesCar && (
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <CarFront className="h-4 w-4 text-emerald-600" />
              {pick(locale, 'تفاصيل السيارة', 'Car Details', 'Araç Ayrıntıları')}
            </h2>
            <div className="flex gap-3 mb-4">
              <button type="button" onClick={() => setCarMode('existing')}
                className={cn('flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                  carMode === 'existing' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                {pick(locale, 'اختر سيارة موجودة', 'Select existing car', 'Mevcut aracı seç')}
              </button>
              <button type="button" onClick={() => setCarMode('manual')}
                className={cn('flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                  carMode === 'manual' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                {pick(locale, 'إدخال يدوي', 'Enter manually', 'Manuel gir')}
              </button>
            </div>

            {carMode === 'existing' ? (
              <div>
                <label className="text-sm font-medium block mb-1.5">{pick(locale, 'اختر السيارة', 'Select Car', 'Araç Seç')}</label>
                <select value={selectedCarId} onChange={e => setSelectedCarId(e.target.value)} className={selectClass}>
                  <option value="">{pick(locale, 'اختر سيارة...', 'Select a car...', 'Bir araç seçin...')}</option>
                  {myCars.map(car => (
                    <option key={car.id} value={car.id}>
                      {pick(locale, `${car.brand_ar} ${car.model_ar}`, `${car.brand_en || car.brand_ar} ${car.model_en || car.model_ar}`)} ({car.year})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'الماركة', 'Brand', 'Marka')} ({pick(locale, 'عربي', 'Arabic', 'Arapça')})</label>
                  <input value={carBrandAr} onChange={e => setCarBrandAr(e.target.value)} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'الماركة', 'Brand', 'Marka')} ({pick(locale, 'إنجليزي', 'English', 'İngilizce')})</label>
                  <input value={carBrandEn} onChange={e => setCarBrandEn(e.target.value)} dir="ltr" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'الموديل', 'Model', 'Model')} ({pick(locale, 'عربي', 'Arabic', 'Arapça')})</label>
                  <input value={carModelAr} onChange={e => setCarModelAr(e.target.value)} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'الموديل', 'Model', 'Model')} ({pick(locale, 'إنجليزي', 'English', 'İngilizce')})</label>
                  <input value={carModelEn} onChange={e => setCarModelEn(e.target.value)} dir="ltr" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'الفئة', 'Category', 'Kategori')}</label>
                  <select value={carCategory} onChange={e => setCarCategory(e.target.value)} className={selectClass}>
                    <option value="">{pick(locale, 'اختر...', 'Select...', 'Seç...')}</option>
                    {Object.entries(CAR_CATEGORIES).map(([key, val]) => (
                      <option key={key} value={key}>{isAr ? val.ar : val.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{pick(locale, 'عدد أيام الإيجار', 'Rental Days', 'Kiralama Günleri')}</label>
                  <input type="number" min={1} value={carRentalDays} onChange={e => setCarRentalDays(e.target.value ? Number(e.target.value) : '')} className={inputClass} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            {pick(locale, 'التسعير', 'Pricing', 'Fiyatlandırma')}
          </h2>

          {/* Component prices */}
          <div className="space-y-3">
            {includesFlight && (
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  {pick(locale, 'سعر الرحلة', 'Flight Price', 'Uçuş Fiyatı')} *
                </label>
                <input
                  type="number" min={0} step={0.01}
                  value={tripPrice}
                  onChange={e => setTripPrice(e.target.value ? Number(e.target.value) : '')}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
            )}
            {includesHotel && (
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  {pick(locale, 'سعر الفندق', 'Hotel Price', 'Otel Fiyatı')} *
                </label>
                <input
                  type="number" min={0} step={0.01}
                  value={hotelPrice}
                  onChange={e => setHotelPrice(e.target.value ? Number(e.target.value) : '')}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
            )}
            {includesCar && (
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  {pick(locale, 'سعر السيارة', 'Car Price', 'Araç Fiyatı')} *
                </label>
                <input
                  type="number" min={0} step={0.01}
                  value={carPrice}
                  onChange={e => setCarPrice(e.target.value ? Number(e.target.value) : '')}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          {/* Auto total */}
          {atLeastOneIncluded && (
            <div className="rounded-lg bg-slate-50 border px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                {pick(locale, 'الإجمالي', 'Total', 'Toplam')}
              </span>
              <span className="text-lg font-black text-slate-900">
                {computedTotal.toLocaleString(pick(locale, 'ar-SA', 'en-SA', 'tr-TR'))} {currency}
              </span>
            </div>
          )}

          {/* Offer price */}
          <div>
            <label className="text-sm font-medium block mb-1.5">
              {pick(locale, 'سعر العرض (الباقة)', 'Package Offer Price', 'Paket Teklif Fiyatı')}{' '}
              <span className="text-muted-foreground text-xs">({tc('optional')})</span>
            </label>
            <input
              type="number" min={0} step={0.01}
              value={offerPrice}
              onChange={e => setOfferPrice(e.target.value ? Number(e.target.value) : '')}
              className={inputClass}
              placeholder={pick(locale, 'أدخل سعراً مخفضاً للباقة...', 'Enter a discounted package price...', 'İndirimli paket fiyatı girin...')}
            />
            {savings > 0 && (
              <p className="mt-1.5 text-sm font-semibold text-emerald-600">
                {pick(locale, `وفر ${savings.toLocaleString('ar-SA')} ر.س مع الباقة`, `Save ${savings.toLocaleString('en-SA')} ${currency} with the package`)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{tc('currency')} *</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className={selectClass}>
                <option value="SAR">{tc('sar')} (SAR)</option>
                <option value="USD">{tc('usd')} (USD)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{pick(locale, 'الحد الأقصى للحجوزات', 'Max Bookings', 'Maks Rezervasyon')} *</label>
              <input type="number" min={1} value={maxBookings} onChange={e => setMaxBookings(e.target.value ? Number(e.target.value) : '')} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {pick(locale, 'التواريخ', 'Dates', 'Tarihler')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{pick(locale, 'تاريخ البداية', 'Start Date', 'Başlangıç Tarihi')}</label>
              <Popover>
                <PopoverTrigger className={cn(
                  `${inputClass} flex items-center justify-between`,
                  startDate ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {startDate && isValid(parseISO(startDate)) ? format(parseISO(startDate), 'd MMM yyyy') : (pick(locale, 'اختر التاريخ', 'Pick date', 'Tarih seç'))}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI
                    mode="single"
                    selected={startDate && isValid(parseISO(startDate)) ? parseISO(startDate) : undefined}
                    onSelect={(date) => setStartDate(date ? format(date, 'yyyy-MM-dd') : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{pick(locale, 'تاريخ النهاية', 'End Date', 'Bitiş Tarihi')}</label>
              <Popover>
                <PopoverTrigger className={cn(
                  `${inputClass} flex items-center justify-between`,
                  endDate ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {endDate && isValid(parseISO(endDate)) ? format(parseISO(endDate), 'd MMM yyyy') : (pick(locale, 'اختر التاريخ', 'Pick date', 'Tarih seç'))}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI
                    mode="single"
                    selected={endDate && isValid(parseISO(endDate)) ? parseISO(endDate) : undefined}
                    onSelect={(date) => setEndDate(date ? format(date, 'yyyy-MM-dd') : '')}
                    disabled={(date) => startDate && isValid(parseISO(startDate)) ? date < parseISO(startDate) : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {pick(locale, 'صور الباقة', 'Package Images', 'Paket Görselleri')}{' '}
            <span className="text-muted-foreground text-sm font-normal">({pick(locale, 'حتى 5 صور', 'Up to 5 images', '5 görsele kadar')})</span>
          </h2>
          {(existingImages.length > 0 || newImagePreviews.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {existingImages.map((url, i) => (
                <div key={`existing-${i}`} className="relative rounded-lg overflow-hidden bg-muted h-32">
                  <Image src={url} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" />
                  <button type="button" onClick={() => handleRemoveExisting(i)} className="absolute top-2 end-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {newImagePreviews.map((url, i) => (
                <div key={`new-${i}`} className="relative rounded-lg overflow-hidden bg-muted h-32">
                  <Image src={url} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" unoptimized />
                  <button type="button" onClick={() => handleRemoveNew(i)} className="absolute top-2 end-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {totalImages < 5 && (
            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{pick(locale, 'اضغط لرفع صور', 'Click to upload images', 'Görselleri yüklemek için tıklayın')}</span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={e => handleImageAdd(e.target.files)} />
            </label>
          )}
        </div>

        <NameChangePolicyCard
          allowed={nameChangeAllowed}
          onAllowedChange={setNameChangeAllowed}
          fee={nameChangeFee}
          onFeeChange={setNameChangeFee}
          refundable={nameChangeRefundable}
          onRefundableChange={setNameChangeRefundable}
          title={pick(locale, 'سياسة تغيير اسم المسافر الرئيسي', 'Lead traveler name change policy', 'Lider yolcu adı değişiklik politikası')}
        />

        <button
          type="submit"
          disabled={submitting || !atLeastOneIncluded}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {pick(locale, 'حفظ التعديلات', 'Save Changes', 'Değişiklikleri Kaydet')}
        </button>
      </form>
    </div>
  )
}
