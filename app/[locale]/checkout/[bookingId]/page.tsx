'use client'

import Image from 'next/image'
import { useEffect, useState, use } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Landmark,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  X,
  Clock,
  Upload,
} from 'lucide-react'
import { formatPrice, formatPriceEN, shortId } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { CheckoutPageSkeleton } from '@/components/shared/loading-skeleton'
import type { Booking, RoomBooking, CarBooking, PackageBooking } from '@/types'

type CheckoutState = 'transfer' | 'uploading' | 'submitted' | 'confirmed' | 'failed'

type BankInfo = {
  bank_name_ar: string | null
  bank_name_en: string | null
  bank_iban: string | null
  bank_account_holder_ar: string | null
  bank_account_holder_en: string | null
}

export default function CheckoutPage({ params }: { params: Promise<{ bookingId: string; locale: string }> }) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const searchParams = useSearchParams()
  const { bookingId } = use(params)
  const bookingType = searchParams.get('type')
  const isRoomBooking = bookingType === 'room'
  const isCarBooking = bookingType === 'car'
  const isPackageBooking = bookingType === 'package'

  const [booking, setBooking] = useState<Booking | null>(null)
  const [roomBooking, setRoomBooking] = useState<RoomBooking | null>(null)
  const [carBooking, setCarBooking] = useState<CarBooking | null>(null)
  const [packageBooking, setPackageBooking] = useState<PackageBooking | null>(null)
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<CheckoutState>('transfer')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  const Back = isAr ? ChevronRight : ChevronLeft
  const currency = packageBooking?.package?.currency || carBooking?.car?.currency || roomBooking?.room?.currency || booking?.trip?.currency || 'SAR'
  const fmt = (amount: number) => isAr ? formatPrice(amount, currency) : formatPriceEN(amount, currency)
  const detailHref = isPackageBooking ? `/${locale}/my-bookings/packages/${bookingId}` : isCarBooking ? `/${locale}/my-bookings/cars/${bookingId}` : isRoomBooking ? `/${locale}/my-bookings/rooms/${bookingId}` : `/${locale}/my-bookings/${bookingId}`
  const browseHref = isPackageBooking ? `/${locale}/packages` : isCarBooking ? `/${locale}/cars` : isRoomBooking ? `/${locale}/rooms` : `/${locale}/trips`
  const backHref = isPackageBooking ? `/${locale}/packages` : isCarBooking ? `/${locale}/cars` : isRoomBooking ? `/${locale}/rooms` : `/${locale}/my-bookings/${bookingId}`
  const bookingRecord = isPackageBooking ? packageBooking : isCarBooking ? carBooking : isRoomBooking ? roomBooking : booking

  useEffect(() => {
    async function fetchData() {
      try {
        const apiPath = isPackageBooking ? `/api/package-bookings/${bookingId}` : isCarBooking ? `/api/car-bookings/${bookingId}` : isRoomBooking ? `/api/room-bookings/${bookingId}` : `/api/bookings/${bookingId}`
        const [bookingRes, bankRes] = await Promise.all([
          fetch(apiPath),
          fetch('/api/bank-info'),
        ])
        const bookingData = await bookingRes.json()
        const bankData = await bankRes.json()

        if (bookingData.booking) {
          if (isPackageBooking) {
            setPackageBooking(bookingData.booking)
          } else if (isCarBooking) {
            setCarBooking(bookingData.booking)
          } else if (isRoomBooking) {
            setRoomBooking(bookingData.booking)
          } else {
            setBooking(bookingData.booking)
          }
          if (bookingData.booking.status === 'confirmed') {
            setState('confirmed')
          } else if (bookingData.booking.transfer_confirmed_at) {
            setState('submitted')
          }
        }
        if (bankData.bank_iban) {
          setBankInfo(bankData)
        }
      } catch {
        // handled
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [bookingId, isRoomBooking, isCarBooking])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleReceiptChange = (file: File | null) => {
    setReceiptFile(file)
    setReceiptPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleConfirmTransfer = async () => {
    setState('uploading')
    try {
      let receiptUrl: string | undefined

      // Upload receipt if provided
      if (receiptFile) {
        const formData = new FormData()
        formData.append('receipt', receiptFile)
        const uploadPath = isPackageBooking ? `/api/package-bookings/${bookingId}/upload-receipt` : isCarBooking ? `/api/car-bookings/${bookingId}/upload-receipt` : isRoomBooking ? `/api/room-bookings/${bookingId}/upload-receipt` : `/api/bookings/${bookingId}/upload-receipt`
        const uploadRes = await fetch(uploadPath, {
          method: 'POST',
          body: formData,
        })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          receiptUrl = uploadData.url
        }
      }

      // Confirm transfer
      const confirmPath = isPackageBooking ? `/api/package-bookings/${bookingId}/confirm` : isCarBooking ? `/api/car-bookings/${bookingId}/confirm` : isRoomBooking ? `/api/room-bookings/${bookingId}/confirm` : `/api/bookings/${bookingId}/confirm`
      const res = await fetch(confirmPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transfer_receipt_url: receiptUrl }),
      })

      if (res.ok) {
        setState('submitted')
      } else {
        setState('transfer')
        toast({ title: t('common.error'), variant: 'destructive' })
      }
    } catch {
      setState('transfer')
      toast({ title: t('common.error'), variant: 'destructive' })
    }
  }

  if (loading) return <CheckoutPageSkeleton />

  if (!bookingRecord) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">{t('errors.not_found')}</h2>
        <button
          onClick={() => router.push(browseHref)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors mt-2"
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  // Confirmed state
  if (state === 'confirmed') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 md:py-24 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-emerald-50 border-[6px] border-emerald-100 mb-6 md:mb-8 relative">
          <div className="absolute inset-0 rounded-full animate-ping bg-emerald-100 opacity-50" />
          <CheckCircle2 className="h-10 w-10 md:h-12 md:w-12 text-emerald-500 relative z-10" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 md:mb-3">{t('booking.booking_confirmed')}</h2>
        <p className="text-base md:text-lg text-slate-500 font-medium mb-6 md:mb-8">
          {t('booking.booking_reference')}: <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{shortId(bookingId)}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          <Link href={detailHref} className="inline-flex items-center justify-center px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-primary text-white text-sm md:text-base font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            {t('booking.view_booking')}
          </Link>
          <Link href={browseHref} className="inline-flex items-center justify-center px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 text-slate-700 border border-slate-200 text-sm md:text-base font-bold hover:bg-slate-100 transition-all">
            {isAr ? (isPackageBooking ? 'تصفح الباقات' : isCarBooking ? 'تصفح السيارات' : isRoomBooking ? 'تصفح الغرف' : 'تصفح الرحلات') : (isPackageBooking ? 'Browse Packages' : isCarBooking ? 'Browse Cars' : isRoomBooking ? 'Browse Rooms' : 'Browse Trips')}
          </Link>
        </div>
      </div>
    )
  }

  // Submitted / pending review state
  if (state === 'submitted') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 md:py-24 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-amber-50 border-[6px] border-amber-100 mb-6 md:mb-8">
          <Clock className="h-10 w-10 md:h-12 md:w-12 text-amber-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 md:mb-3">
          {isAr ? 'تم استلام تأكيد التحويل' : 'Transfer Confirmation Received'}
        </h2>
        <p className="text-base md:text-lg text-slate-500 font-medium mb-6 md:mb-8">
          {isAr ? 'سيتم مراجعة التحويل من قبل الإدارة وتأكيد حجزك في أقرب وقت' : 'Your transfer is being reviewed by our team. Your booking will be confirmed shortly.'}
        </p>
        <p className="text-sm text-slate-400 mb-8">
          {t('booking.booking_reference')}: <span className="font-mono font-bold text-slate-700">{shortId(bookingId)}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={detailHref} className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            {t('booking.view_booking')}
          </Link>
          <Link href={browseHref} className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold hover:bg-slate-100 transition-all">
            {isAr ? (isPackageBooking ? 'تصفح الباقات' : isCarBooking ? 'تصفح السيارات' : isRoomBooking ? 'تصفح الغرف' : 'تصفح الرحلات') : (isPackageBooking ? 'Browse Packages' : isCarBooking ? 'Browse Cars' : isRoomBooking ? 'Browse Rooms' : 'Browse Trips')}
          </Link>
        </div>
      </div>
    )
  }

  // Bank transfer form
  const bankName = isAr ? bankInfo?.bank_name_ar : bankInfo?.bank_name_en
  const accountHolder = isAr ? bankInfo?.bank_account_holder_ar : bankInfo?.bank_account_holder_en

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-24 pb-12 md:pt-32 lg:pt-36 animate-fade-in-up">
      <button
        onClick={() => router.push(backHref)}
        className="group inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 md:mb-8 transition-colors"
      >
        <div className="p-1.5 md:p-2 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
          <Back className="h-3 w-3 md:h-4 md:w-4 rtl:rotate-180" />
        </div>
        {t('common.back')}
      </button>

      <div className="mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{isAr ? 'الدفع عبر التحويل البنكي' : 'Bank Transfer Payment'}</h1>
        <p className="text-sm md:text-base text-slate-500 font-medium">{isAr ? 'حوّل المبلغ المطلوب إلى الحساب التالي' : 'Transfer the required amount to the following account'}</p>
      </div>

      {/* Order summary */}
      <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-5 md:p-6 mb-6 md:mb-8 shadow-sm">
        <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 md:mb-6">{t('booking.price_summary')}</h3>
        <div className="flex justify-between items-center text-sm md:text-base font-semibold text-slate-700 mb-4 md:mb-6">
          <span>
            {isPackageBooking && packageBooking
              ? `${fmt(packageBooking.total_amount / packageBooking.number_of_people)} × ${packageBooking.number_of_people} ${isAr ? 'أشخاص' : 'people'}`
              : isCarBooking && carBooking
                ? `${fmt(carBooking.price_per_day)} × ${carBooking.number_of_days} ${isAr ? 'يوم' : 'days'}`
                : isRoomBooking && roomBooking
                  ? `${fmt(roomBooking.price_per_night)} × ${roomBooking.number_of_days} ${isAr ? 'ليالٍ' : 'nights'} × ${roomBooking.rooms_count} ${isAr ? 'غرف' : 'rooms'}`
                  : `${fmt(booking!.price_per_seat)} × ${booking!.seats_count} ${t('common.seats')}`}
          </span>
          <span className="text-slate-900 bg-slate-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-slate-100">{fmt(bookingRecord.total_amount)}</span>
        </div>
        <div className="border-t border-slate-100 pt-4 md:pt-6 flex justify-between items-end">
          <span className="text-sm md:text-base font-bold text-slate-900">{t('booking.total_amount')}</span>
          <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter">{fmt(bookingRecord.total_amount)}</span>
        </div>
      </div>

      {/* Bank details */}
      {bankInfo?.bank_iban && (
        <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-200/50 mb-6">
          <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Landmark className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">{isAr ? 'بيانات الحساب البنكي' : 'Bank Account Details'}</h3>
          </div>

          <div className="space-y-4">
            {/* IBAN */}
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">IBAN</p>
                <p className="text-sm md:text-base font-mono font-bold text-slate-900 break-all" dir="ltr">{bankInfo.bank_iban}</p>
              </div>
              <button
                onClick={() => copyToClipboard(bankInfo.bank_iban!, 'iban')}
                className="shrink-0 p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                {copiedField === 'iban' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-slate-500" />}
              </button>
            </div>

            {/* Bank Name */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{isAr ? 'اسم البنك' : 'Bank Name'}</p>
              <p className="text-sm md:text-base font-bold text-slate-900">{bankName}</p>
            </div>

            {/* Account Holder */}
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{isAr ? 'اسم صاحب الحساب' : 'Account Holder'}</p>
                <p className="text-sm md:text-base font-bold text-slate-900">{accountHolder}</p>
              </div>
              <button
                onClick={() => copyToClipboard(accountHolder || '', 'holder')}
                className="shrink-0 p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                {copiedField === 'holder' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-slate-500" />}
              </button>
            </div>

            {/* Amount to transfer */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">{isAr ? 'المبلغ المطلوب تحويله' : 'Amount to Transfer'}</p>
                <p className="text-xl md:text-2xl font-black text-primary">{fmt(bookingRecord.total_amount)}</p>
              </div>
              <button
                onClick={() => copyToClipboard(String(bookingRecord.total_amount), 'amount')}
                className="shrink-0 p-2.5 rounded-xl bg-white border border-primary/20 hover:bg-primary/5 transition-colors"
              >
                {copiedField === 'amount' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-primary" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Upload */}
      <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm mb-6">
        <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1">{isAr ? 'إيصال التحويل' : 'Transfer Receipt'}</h3>
        <p className="text-xs text-muted-foreground mb-4">{isAr ? 'اختياري - يساعد في تسريع المراجعة' : 'Optional - helps speed up the review process'}</p>

        {receiptPreview ? (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-muted">
            <Image src={receiptPreview} alt="Receipt" fill sizes="100vw" className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => handleReceiptChange(null)}
              className="absolute top-2 end-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{isAr ? 'اضغط لرفع صورة الإيصال' : 'Click to upload receipt image'}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleReceiptChange(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      {/* Confirm transfer button */}
      <button
        onClick={handleConfirmTransfer}
        disabled={state === 'uploading'}
        className="group w-full h-14 md:h-16 rounded-xl md:rounded-2xl bg-slate-900 text-white font-bold text-base md:text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] lg:hover:-translate-y-1 disabled:opacity-70"
      >
        {state === 'uploading' ? (
          <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
        ) : (
          <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-emerald-400" />
        )}
        {state === 'uploading'
          ? (isAr ? 'جارٍ الإرسال...' : 'Submitting...')
          : (isAr ? 'تأكيد إتمام التحويل' : 'Confirm Transfer Completed')}
      </button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        {isAr ? 'سيتم مراجعة التحويل وتأكيد الحجز خلال ساعات العمل' : 'Your transfer will be reviewed and booking confirmed during business hours'}
      </p>
    </div>
  )
}
