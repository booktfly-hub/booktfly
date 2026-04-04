'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { PACKAGE_CATEGORIES, CABIN_CLASSES, CAR_CATEGORIES } from '@/lib/constants'
import type { Trip, Room, Car } from '@/types'
import {
  Loader2,
  Plus,
  X,
  Plane,
  BedDouble,
  CarFront,
  ImageIcon,
  Package,
  MapPin,
  Calendar,
  DollarSign,
} from 'lucide-react'

export default function NewPackagePage() {
  const tc = useTranslations('common')
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const router = useRouter()

  const [submitting, setSubmitting] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

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
  const [totalPrice, setTotalPrice] = useState<number | ''>('')
  const [originalPrice, setOriginalPrice] = useState<number | ''>('')
  const [currency, setCurrency] = useState('SAR')
  const [maxBookings, setMaxBookings] = useState<number | ''>(10)

  // Dates
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetch('/api/trips/my-trips').then(r => r.json()).then(d => setMyTrips(d.trips || [])).catch(() => {})
    fetch('/api/rooms/my-rooms').then(r => r.json()).then(d => setMyRooms(d.rooms || [])).catch(() => {})
    fetch('/api/cars/my-cars').then(r => r.json()).then(d => setMyCars(d.cars || [])).catch(() => {})
  }, [])

  function handleImageAdd(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 5 - imageFiles.length)
    if (newFiles.length === 0) return
    setImageFiles(prev => [...prev, ...newFiles])
    setImagePreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))])
  }

  function handleImageRemove(index: number) {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const atLeastOneIncluded = includesFlight || includesHotel || includesCar

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameAr || !destinationCityAr || !totalPrice || !atLeastOneIncluded) {
      toast({ title: isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields', variant: 'destructive' })
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

      formData.append('total_price', String(totalPrice))
      if (originalPrice) formData.append('original_price', String(originalPrice))
      formData.append('currency', currency)
      if (maxBookings) formData.append('max_bookings', String(maxBookings))
      if (startDate) formData.append('start_date', startDate)
      if (endDate) formData.append('end_date', endDate)

      imageFiles.forEach(file => {
        formData.append('images', file)
      })

      const res = await fetch('/api/packages', {
        method: 'POST',
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

  const inputClass = 'w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
  const selectClass = inputClass

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{isAr ? 'باقة جديدة' : 'New Package'}</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            {isAr ? 'المعلومات الأساسية' : 'Basic Info'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'اسم الباقة' : 'Package Name'} ({isAr ? 'عربي' : 'Arabic'}) *
              </label>
              <input value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'اسم الباقة' : 'Package Name'} ({isAr ? 'إنجليزي' : 'English'}) <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input value={nameEn} onChange={e => setNameEn(e.target.value)} dir="ltr" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'مدينة الوجهة' : 'Destination City'} ({isAr ? 'عربي' : 'Arabic'}) *
              </label>
              <input value={destinationCityAr} onChange={e => setDestinationCityAr(e.target.value)} dir="rtl" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'مدينة الوجهة' : 'Destination City'} ({isAr ? 'إنجليزي' : 'English'}) <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input value={destinationCityEn} onChange={e => setDestinationCityEn(e.target.value)} dir="ltr" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'الوصف' : 'Description'} ({isAr ? 'عربي' : 'Arabic'}) <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} dir="rtl" rows={3} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'الوصف' : 'Description'} ({isAr ? 'إنجليزي' : 'English'}) <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <textarea value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} dir="ltr" rows={3} className={inputClass} />
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{isAr ? 'يشمل' : "What's Included"} *</h2>
          <p className="text-sm text-muted-foreground">{isAr ? 'اختر خدمة واحدة على الأقل' : 'Select at least one service'}</p>
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
              <span className="text-sm">{isAr ? 'طيران' : 'Flight'}</span>
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
              <span className="text-sm">{isAr ? 'فندق' : 'Hotel'}</span>
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
              <span className="text-sm">{isAr ? 'سيارة' : 'Car'}</span>
            </button>
          </div>
        </div>

        {/* Flight Section */}
        {includesFlight && (
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Plane className="h-4 w-4 text-sky-600" />
              {isAr ? 'تفاصيل الطيران' : 'Flight Details'}
            </h2>
            <div className="flex gap-3 mb-4">
              <button type="button" onClick={() => setFlightMode('existing')}
                className={cn('flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                  flightMode === 'existing' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                {isAr ? 'اختر رحلة موجودة' : 'Select existing trip'}
              </button>
              <button type="button" onClick={() => setFlightMode('manual')}
                className={cn('flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                  flightMode === 'manual' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                {isAr ? 'إدخال يدوي' : 'Enter manually'}
              </button>
            </div>

            {flightMode === 'existing' ? (
              <div>
                <label className="text-sm font-medium block mb-1.5">{isAr ? 'اختر الرحلة' : 'Select Trip'}</label>
                <select value={selectedTripId} onChange={e => setSelectedTripId(e.target.value)} className={selectClass}>
                  <option value="">{isAr ? 'اختر رحلة...' : 'Select a trip...'}</option>
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
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'شركة الطيران' : 'Airline'}</label>
                  <input value={flightAirline} onChange={e => setFlightAirline(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'رقم الرحلة' : 'Flight Number'}</label>
                  <input value={flightNumber} onChange={e => setFlightNumber(e.target.value)} dir="ltr" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'المغادرة' : 'Origin'} ({isAr ? 'عربي' : 'Arabic'})</label>
                  <input value={flightOriginAr} onChange={e => setFlightOriginAr(e.target.value)} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'المغادرة' : 'Origin'} ({isAr ? 'إنجليزي' : 'English'})</label>
                  <input value={flightOriginEn} onChange={e => setFlightOriginEn(e.target.value)} dir="ltr" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'رمز المغادرة' : 'Origin Code'}</label>
                  <input value={flightOriginCode} onChange={e => setFlightOriginCode(e.target.value)} dir="ltr" placeholder="e.g. RUH" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'الوجهة' : 'Destination'} ({isAr ? 'عربي' : 'Arabic'})</label>
                  <input value={flightDestinationAr} onChange={e => setFlightDestinationAr(e.target.value)} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'الوجهة' : 'Destination'} ({isAr ? 'إنجليزي' : 'English'})</label>
                  <input value={flightDestinationEn} onChange={e => setFlightDestinationEn(e.target.value)} dir="ltr" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'رمز الوجهة' : 'Destination Code'}</label>
                  <input value={flightDestinationCode} onChange={e => setFlightDestinationCode(e.target.value)} dir="ltr" placeholder="e.g. JED" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'تاريخ المغادرة' : 'Departure Date'}</label>
                  <input type="datetime-local" value={flightDepartureAt} onChange={e => setFlightDepartureAt(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'تاريخ العودة' : 'Return Date'}</label>
                  <input type="datetime-local" value={flightReturnAt} onChange={e => setFlightReturnAt(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'درجة الرحلة' : 'Cabin Class'}</label>
                  <select value={flightCabinClass} onChange={e => setFlightCabinClass(e.target.value)} className={selectClass}>
                    <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
                    {Object.entries(CABIN_CLASSES).map(([key, val]) => (
                      <option key={key} value={key}>{isAr ? val.ar : val.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'عدد المقاعد' : 'Seats Included'}</label>
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
              {isAr ? 'تفاصيل الفندق' : 'Hotel Details'}
            </h2>
            <div className="flex gap-3 mb-4">
              <button type="button" onClick={() => setHotelMode('existing')}
                className={cn('flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                  hotelMode === 'existing' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                {isAr ? 'اختر غرفة موجودة' : 'Select existing room'}
              </button>
              <button type="button" onClick={() => setHotelMode('manual')}
                className={cn('flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                  hotelMode === 'manual' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                {isAr ? 'إدخال يدوي' : 'Enter manually'}
              </button>
            </div>

            {hotelMode === 'existing' ? (
              <div>
                <label className="text-sm font-medium block mb-1.5">{isAr ? 'اختر الغرفة' : 'Select Room'}</label>
                <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} className={selectClass}>
                  <option value="">{isAr ? 'اختر غرفة...' : 'Select a room...'}</option>
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
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'اسم الفندق' : 'Hotel Name'} ({isAr ? 'عربي' : 'Arabic'})</label>
                  <input value={hotelNameAr} onChange={e => setHotelNameAr(e.target.value)} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'اسم الفندق' : 'Hotel Name'} ({isAr ? 'إنجليزي' : 'English'})</label>
                  <input value={hotelNameEn} onChange={e => setHotelNameEn(e.target.value)} dir="ltr" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'تصنيف الفندق' : 'Hotel Category'}</label>
                  <select value={hotelCategory} onChange={e => setHotelCategory(e.target.value)} className={selectClass}>
                    <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
                    <option value="3">{isAr ? '3 نجوم' : '3 Stars'}</option>
                    <option value="4">{isAr ? '4 نجوم' : '4 Stars'}</option>
                    <option value="5">{isAr ? '5 نجوم' : '5 Stars'}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'عدد الليالي' : 'Number of Nights'}</label>
                  <input type="number" min={1} value={hotelNights} onChange={e => setHotelNights(e.target.value ? Number(e.target.value) : '')} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'المدينة' : 'City'} ({isAr ? 'عربي' : 'Arabic'})</label>
                  <input value={hotelCityAr} onChange={e => setHotelCityAr(e.target.value)} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'المدينة' : 'City'} ({isAr ? 'إنجليزي' : 'English'})</label>
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
              {isAr ? 'تفاصيل السيارة' : 'Car Details'}
            </h2>
            <div className="flex gap-3 mb-4">
              <button type="button" onClick={() => setCarMode('existing')}
                className={cn('flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                  carMode === 'existing' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                {isAr ? 'اختر سيارة موجودة' : 'Select existing car'}
              </button>
              <button type="button" onClick={() => setCarMode('manual')}
                className={cn('flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all',
                  carMode === 'manual' ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                {isAr ? 'إدخال يدوي' : 'Enter manually'}
              </button>
            </div>

            {carMode === 'existing' ? (
              <div>
                <label className="text-sm font-medium block mb-1.5">{isAr ? 'اختر السيارة' : 'Select Car'}</label>
                <select value={selectedCarId} onChange={e => setSelectedCarId(e.target.value)} className={selectClass}>
                  <option value="">{isAr ? 'اختر سيارة...' : 'Select a car...'}</option>
                  {myCars.map(car => (
                    <option key={car.id} value={car.id}>
                      {isAr ? `${car.brand_ar} ${car.model_ar}` : `${car.brand_en || car.brand_ar} ${car.model_en || car.model_ar}`} ({car.year})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'الماركة' : 'Brand'} ({isAr ? 'عربي' : 'Arabic'})</label>
                  <input value={carBrandAr} onChange={e => setCarBrandAr(e.target.value)} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'الماركة' : 'Brand'} ({isAr ? 'إنجليزي' : 'English'})</label>
                  <input value={carBrandEn} onChange={e => setCarBrandEn(e.target.value)} dir="ltr" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'الموديل' : 'Model'} ({isAr ? 'عربي' : 'Arabic'})</label>
                  <input value={carModelAr} onChange={e => setCarModelAr(e.target.value)} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'الموديل' : 'Model'} ({isAr ? 'إنجليزي' : 'English'})</label>
                  <input value={carModelEn} onChange={e => setCarModelEn(e.target.value)} dir="ltr" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'الفئة' : 'Category'}</label>
                  <select value={carCategory} onChange={e => setCarCategory(e.target.value)} className={selectClass}>
                    <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
                    {Object.entries(CAR_CATEGORIES).map(([key, val]) => (
                      <option key={key} value={key}>{isAr ? val.ar : val.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{isAr ? 'عدد أيام الإيجار' : 'Rental Days'}</label>
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
            {isAr ? 'التسعير' : 'Pricing'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'السعر الإجمالي' : 'Total Price'} *</label>
              <input type="number" min={1} step={0.01} value={totalPrice} onChange={e => setTotalPrice(e.target.value ? Number(e.target.value) : '')} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {isAr ? 'السعر الأصلي' : 'Original Price'} <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input type="number" min={1} step={0.01} value={originalPrice} onChange={e => setOriginalPrice(e.target.value ? Number(e.target.value) : '')} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{tc('currency')} *</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className={selectClass}>
                <option value="SAR">{tc('sar')} (SAR)</option>
                <option value="USD">{tc('usd')} (USD)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'الحد الأقصى للحجوزات' : 'Max Bookings'} *</label>
              <input type="number" min={1} value={maxBookings} onChange={e => setMaxBookings(e.target.value ? Number(e.target.value) : '')} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {isAr ? 'التواريخ' : 'Dates'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'تاريخ البداية' : 'Start Date'}</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{isAr ? 'تاريخ النهاية' : 'End Date'}</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {isAr ? 'صور الباقة' : 'Package Images'}{' '}
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
              <input type="file" accept="image/*" multiple className="sr-only" onChange={e => handleImageAdd(e.target.files)} />
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !atLeastOneIncluded}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isAr ? 'نشر الباقة' : 'Post Package'}
        </button>
      </form>
    </div>
  )
}
