'use client'

import { pick } from '@/lib/i18n-helpers'
import Image from 'next/image'
import { useEffect, useRef, useState, use } from 'react'
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
  Shield,
  Apple,
} from 'lucide-react'
import { formatPrice, formatPriceEN, shortId } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { CheckoutPageSkeleton } from '@/components/shared/loading-skeleton'
import { ClientContractStep } from '@/components/checkout/client-contract-step'
import { ProgressStepper } from '@/components/bookings/progress-stepper'
import { CrossSellPanel } from '@/components/bookings/cross-sell-panel'
import type { Booking, RoomBooking, CarBooking, PackageBooking } from '@/types'

type CheckoutState = 'transfer' | 'uploading' | 'submitted' | 'confirmed' | 'failed'
type PayMethod = 'mada' | 'apple_pay' | 'bank'

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
  const [payMethod, setPayMethod] = useState<PayMethod>('bank')
  const [dummyPaying, setDummyPaying] = useState(false)
  const fetchedForRef = useRef<string | null>(null)

  const Back = isAr ? ChevronRight : ChevronLeft
  const currency = packageBooking?.package?.currency || carBooking?.car?.currency || roomBooking?.room?.currency || booking?.trip?.currency || 'SAR'
  const fmt = (amount: number) => isAr ? formatPrice(amount, currency) : formatPriceEN(amount, currency)
  const detailHref = isPackageBooking ? `/${locale}/my-bookings/packages/${bookingId}` : isCarBooking ? `/${locale}/my-bookings/cars/${bookingId}` : isRoomBooking ? `/${locale}/my-bookings/rooms/${bookingId}` : `/${locale}/my-bookings/${bookingId}`
  const browseHref = isPackageBooking ? `/${locale}/packages` : isCarBooking ? `/${locale}/cars` : isRoomBooking ? `/${locale}/rooms` : `/${locale}/trips`
  const backHref = isPackageBooking ? `/${locale}/packages` : isCarBooking ? `/${locale}/cars` : isRoomBooking ? `/${locale}/rooms` : `/${locale}/my-bookings/${bookingId}`
  const bookingRecord = isPackageBooking ? packageBooking : isCarBooking ? carBooking : isRoomBooking ? roomBooking : booking

  useEffect(() => {
    const key = `${bookingId}:${isPackageBooking ? 'package' : isCarBooking ? 'car' : isRoomBooking ? 'room' : 'flight'}`
    if (fetchedForRef.current === key) return
    fetchedForRef.current = key
    const controller = new AbortController()
    ;(async () => {
      try {
        const apiPath = isPackageBooking ? `/api/package-bookings/${bookingId}` : isCarBooking ? `/api/car-bookings/${bookingId}` : isRoomBooking ? `/api/room-bookings/${bookingId}` : `/api/bookings/${bookingId}`
        const [bookingRes, bankRes] = await Promise.all([
          fetch(apiPath, { signal: controller.signal }),
          fetch('/api/bank-info', { signal: controller.signal }),
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
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return
      } finally {
        setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [bookingId, isRoomBooking, isCarBooking, isPackageBooking])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleReceiptChange = (file: File | null) => {
    setReceiptFile(file)
    setReceiptPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleDummyPay = async () => {
    setDummyPaying(true)
    try {
      // Simulate processing to match the "charge flow" UX.
      await new Promise((r) => setTimeout(r, 1500))
      const dummyPath = isPackageBooking
        ? `/api/package-bookings/${bookingId}/dummy-pay`
        : isCarBooking
          ? `/api/car-bookings/${bookingId}/dummy-pay`
          : isRoomBooking
            ? `/api/room-bookings/${bookingId}/dummy-pay`
            : `/api/bookings/${bookingId}/dummy-pay`
      const res = await fetch(dummyPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: payMethod === 'apple_pay' ? 'apple_pay' : 'mada',
          guest_token: searchParams.get('guest_token') || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'payment failed')
      }
      setState('confirmed')
    } catch {
      setDummyPaying(false)
      toast({ title: pick(locale, 'تعذّر إتمام الدفع، حاول مرة أخرى', 'Payment failed, please try again', 'Ödeme başarısız, lütfen tekrar deneyin'), variant: 'destructive' })
    }
  }

  const handleConfirmTransfer = async () => {
    if (!receiptFile) {
      toast({
        title: pick(locale, 'يجب رفع صورة الإيصال', 'Receipt image is required', 'Makbuz görseli gereklidir'),
        variant: 'destructive',
      })
      return
    }
    setState('uploading')
    try {
      let receiptUrl: string | undefined

      const formData = new FormData()
      formData.append('receipt', receiptFile)
      const uploadPath = isPackageBooking ? `/api/package-bookings/${bookingId}/upload-receipt` : isCarBooking ? `/api/car-bookings/${bookingId}/upload-receipt` : isRoomBooking ? `/api/room-bookings/${bookingId}/upload-receipt` : `/api/bookings/${bookingId}/upload-receipt`
      const uploadRes = await fetch(uploadPath, {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) {
        setState('transfer')
        toast({
          title: pick(locale, 'فشل رفع الإيصال، حاول مرة أخرى', 'Failed to upload receipt, please try again', 'Makbuz yüklenemedi, lütfen tekrar deneyin'),
          variant: 'destructive',
        })
        return
      }
      const uploadData = await uploadRes.json()
      receiptUrl = uploadData.url

      // Confirm transfer
      const confirmPath = isPackageBooking ? `/api/package-bookings/${bookingId}/confirm` : isCarBooking ? `/api/car-bookings/${bookingId}/confirm` : isRoomBooking ? `/api/room-bookings/${bookingId}/confirm` : `/api/bookings/${bookingId}/confirm`
      const res = await fetch(confirmPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transfer_receipt_url: receiptUrl,
          guest_token: searchParams.get('guest_token') || undefined,
        }),
      })

      if (res.ok) {
        setState('submitted')
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
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
    const crossKind: 'trip' | 'room' | 'car' | 'package' = isPackageBooking ? 'package' : isCarBooking ? 'car' : isRoomBooking ? 'room' : 'trip'
    const destCity = isPackageBooking && packageBooking
      ? (isAr ? packageBooking.package?.destination_city_ar : packageBooking.package?.destination_city_en) ?? undefined
      : !isPackageBooking && !isCarBooking && !isRoomBooking && booking
        ? (isAr ? booking.trip?.destination_city_ar : booking.trip?.destination_city_en) ?? undefined
        : undefined

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 md:py-24 animate-fade-in-up">
        <div className="text-center">
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
            {/* Itinerary PDF download (P1-20) */}
            {!isPackageBooking && !isCarBooking && !isRoomBooking && (
              <a
                href={`/api/bookings/${bookingId}/itinerary`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-slate-900 text-white text-sm md:text-base font-bold hover:bg-slate-800 transition-all"
              >
                {pick(locale, 'تحميل خط السير', 'Download itinerary', 'Güzergahı indir')}
              </a>
            )}
            <Link href={browseHref} className="inline-flex items-center justify-center px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 text-slate-700 border border-slate-200 text-sm md:text-base font-bold hover:bg-slate-100 transition-all">
              {isAr ? (isPackageBooking ? 'تصفح الباقات' : isCarBooking ? 'تصفح السيارات' : isRoomBooking ? 'تصفح الغرف' : 'تصفح الرحلات') : (isPackageBooking ? 'Browse Packages' : isCarBooking ? 'Browse Cars' : isRoomBooking ? 'Browse Rooms' : 'Browse Trips')}
            </Link>
          </div>
        </div>

        {/* Cross-sell on success page (P2-21) */}
        <div className="mt-12">
          <CrossSellPanel currentKind={crossKind} city={destCity} />
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
          {pick(locale, 'تم استلام تأكيد التحويل', 'Transfer Confirmation Received', 'Transfer Onayı Alındı')}
        </h2>
        <p className="text-base md:text-lg text-slate-500 font-medium mb-6 md:mb-8">
          {pick(locale, 'سيتم مراجعة التحويل من قبل الإدارة وتأكيد حجزك في أقرب وقت', 'Your transfer is being reviewed by our team. Your booking will be confirmed shortly.', 'Transferiniz ekibimiz tarafından inceleniyor. Rezervasyonunuz kısa süre içinde onaylanacak.')}
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

  // Signature gate: every booking type signs the client contract before payment
  const activeRecord = isPackageBooking ? packageBooking : isCarBooking ? carBooking : isRoomBooking ? roomBooking : booking
  type SignableRecord = { contract_signed_at?: string | null }
  const activeSigned = (activeRecord as SignableRecord | null)?.contract_signed_at
  const signTargetType: 'booking' | 'room_booking' | 'car_booking' | 'package_booking' =
    isPackageBooking ? 'package_booking' : isCarBooking ? 'car_booking' : isRoomBooking ? 'room_booking' : 'booking'
  const apiPath = isPackageBooking ? `/api/package-bookings/${bookingId}`
    : isCarBooking ? `/api/car-bookings/${bookingId}`
    : isRoomBooking ? `/api/room-bookings/${bookingId}`
    : `/api/bookings/${bookingId}`
  if (activeRecord && !activeSigned) {
    return (
      <ClientContractStep
        bookingId={bookingId}
        guestToken={searchParams.get('guest_token')}
        targetType={signTargetType}
        onSigned={() => {
          fetch(apiPath).then(r => r.json()).then(d => {
            if (isPackageBooking && d.booking) setPackageBooking(d.booking)
            else if (isCarBooking && d.booking) setCarBooking(d.booking)
            else if (isRoomBooking && d.booking) setRoomBooking(d.booking)
            else if (d.booking) setBooking(d.booking)
          })
        }}
      />
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 md:pt-24 lg:pt-28 pb-12 animate-fade-in-up">
      <button
        onClick={() => router.push(backHref)}
        className="group inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 mb-5 md:mb-8 transition-colors"
      >
        <div className="p-1.5 md:p-2 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
          <Back className="h-3 w-3 md:h-4 md:w-4 rtl:rotate-180" />
        </div>
        {t('common.back')}
      </button>

      <div className="mb-6 md:mb-8">
        {/* Labelled checkout stepper (P0-11) — on payment step */}
        <ProgressStepper currentStep={3} className="mb-6" />
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{pick(locale, 'إتمام الدفع', 'Complete payment', 'Ödemeyi tamamla')}</h1>
        <p className="text-sm md:text-base text-slate-500 font-medium">{pick(locale, 'اختر طريقة الدفع المناسبة لك', 'Choose a payment method to continue', 'Devam etmek için bir ödeme yöntemi seçin')}</p>
      </div>

      {/* Payment method selector — main actor of this page */}
      <div className="mb-6 md:mb-8" role="radiogroup" aria-label={pick(locale, 'طرق الدفع', 'Payment methods', 'Ödeme yöntemleri')}>
        <div className="grid grid-cols-3 gap-2 md:gap-3 p-1.5 bg-slate-100 rounded-2xl">
          {([
            { id: 'mada', label: 'mada', sub: pick(locale, 'بطاقة بنكية', 'Debit card', 'Banka kartı') },
            { id: 'apple_pay', label: 'Apple Pay', sub: pick(locale, 'بلمسة واحدة', 'One tap', 'Tek dokunuş') },
            { id: 'bank', label: pick(locale, 'تحويل بنكي', 'Bank transfer', 'Banka havalesi'), sub: pick(locale, 'تأكيد يدوي', 'Manual review', 'Manuel inceleme') },
          ] as const).map((m) => {
            const active = payMethod === m.id
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPayMethod(m.id)}
                className={
                  'rounded-xl px-3 py-3 md:py-4 text-center transition-all ' +
                  (active
                    ? 'bg-white shadow-sm ring-1 ring-slate-900/10 text-slate-900'
                    : 'bg-transparent text-slate-500 hover:text-slate-800')
                }
              >
                <span className="flex items-center justify-center gap-1.5 font-black text-sm md:text-base">
                  {m.id === 'apple_pay' && <Apple className="h-4 w-4" />}
                  {m.label}
                </span>
                <span className="block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{m.sub}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Order summary */}
      <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-5 md:p-6 mb-6 md:mb-8 shadow-sm">
        <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 md:mb-6">{t('booking.price_summary')}</h3>
        <div className="flex justify-between items-center text-sm md:text-base font-semibold text-slate-700 mb-4 md:mb-6">
          <span>
            {isPackageBooking && packageBooking
              ? `${fmt(packageBooking.total_amount / packageBooking.number_of_people)} × ${packageBooking.number_of_people} ${pick(locale, 'أشخاص', 'people', 'kişi')}`
              : isCarBooking && carBooking
                ? `${fmt(carBooking.price_per_day)} × ${carBooking.number_of_days} ${pick(locale, 'يوم', 'days', 'gün')}`
                : isRoomBooking && roomBooking
                  ? `${fmt(roomBooking.price_per_night)} × ${roomBooking.number_of_days} ${pick(locale, 'ليالٍ', 'nights', 'gece')} × ${roomBooking.rooms_count} ${pick(locale, 'غرف', 'rooms', 'oda')}`
                  : `${fmt(booking!.price_per_seat)} × ${booking!.seats_count} ${t('common.seats')}`}
          </span>
          <span className="text-slate-900 bg-slate-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-slate-100">{fmt(bookingRecord.total_amount)}</span>
        </div>
        <div className="border-t border-slate-100 pt-4 md:pt-6 flex justify-between items-end">
          <span className="text-sm md:text-base font-bold text-slate-900">{t('booking.total_amount')}</span>
          <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter">{fmt(bookingRecord.total_amount)}</span>
        </div>
      </div>

      {/* Mada / Apple Pay — dummy gateway */}
      {payMethod !== 'bank' && (
        <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm mb-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              {payMethod === 'apple_pay' ? <Apple className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-bold text-slate-900">
                {payMethod === 'apple_pay'
                  ? (pick(locale, 'الدفع بـ Apple Pay', 'Pay with Apple Pay', 'Apple Pay ile Öde'))
                  : (pick(locale, 'الدفع بواسطة mada', 'Pay with mada', 'mada ile Öde'))}
              </h3>
              <p className="text-sm text-slate-500">
                {payMethod === 'apple_pay'
                  ? (pick(locale, 'أكّد الدفع بلمسة واحدة، وسيتم تأكيد حجزك فوراً.', 'Confirm with one tap. Booking confirmed instantly.', 'Tek dokunuşla onaylayın. Rezervasyon anında onaylanır.'))
                  : (pick(locale, 'سيتم خصم المبلغ من بطاقتك وتأكيد الحجز مباشرةً.', 'You’ll be charged instantly and your booking confirmed.', 'Anında ücretlendirilecek ve rezervasyonunuz onaylanacaktır.'))}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-5">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{pick(locale, 'المبلغ', 'Amount', 'Tutar')}</span>
            <span className="text-xl md:text-2xl font-black text-primary tracking-tight">{fmt(bookingRecord.total_amount)}</span>
          </div>

          <button
            onClick={handleDummyPay}
            disabled={dummyPaying}
            aria-busy={dummyPaying}
            className={
              'w-full h-14 md:h-16 rounded-xl md:rounded-2xl font-bold text-base md:text-lg transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-[0.98] disabled:opacity-70 ' +
              (payMethod === 'apple_pay'
                ? 'bg-black text-white hover:bg-black/90'
                : 'bg-primary text-white hover:bg-primary/90')
            }
          >
            {dummyPaying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {pick(locale, 'جارٍ معالجة الدفع...', 'Processing payment...', 'Ödeme işleniyor...')}
              </>
            ) : payMethod === 'apple_pay' ? (
              <>
                <Apple className="h-5 w-5" />
                {pick(locale, 'ادفع بـ Apple Pay', 'Pay with Apple Pay', 'Apple Pay ile Öde')}
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                {pick(locale, `ادفع ${fmt(bookingRecord.total_amount)}`, `Pay ${fmt(bookingRecord.total_amount)}`)}
              </>
            )}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium mt-4">
            <Shield className="h-3.5 w-3.5" />
            {pick(locale, 'اتصال آمن ومشفّر بالكامل', 'Secure, encrypted connection', 'Güvenli, şifrelenmiş bağlantı')}
          </p>
        </div>
      )}

      {/* Bank details */}
      {payMethod === 'bank' && bankInfo?.bank_iban && (
        <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-xl shadow-slate-200/50 mb-6">
          <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Landmark className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">{pick(locale, 'بيانات الحساب البنكي', 'Bank Account Details', 'Banka Hesap Bilgileri')}</h3>
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
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{pick(locale, 'اسم البنك', 'Bank Name', 'Banka Adı')}</p>
              <p className="text-sm md:text-base font-bold text-slate-900">{bankName}</p>
            </div>

            {/* Account Holder */}
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{pick(locale, 'اسم صاحب الحساب', 'Account Holder', 'Hesap Sahibi')}</p>
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
                <p className="text-[10px] md:text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">{pick(locale, 'المبلغ المطلوب تحويله', 'Amount to Transfer', 'Transfer Edilecek Tutar')}</p>
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
      {payMethod === 'bank' && (
      <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-sm mb-6">
        <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1">
          {pick(locale, 'إيصال التحويل', 'Transfer Receipt', 'Transfer Makbuzu')}
          <span className="text-destructive ms-1">*</span>
        </h3>
        <p className="text-xs text-muted-foreground mb-4">{pick(locale, 'مطلوب - يجب رفع صورة الإيصال لتأكيد التحويل', 'Required - upload the receipt image to confirm your transfer', 'Gerekli - transferinizi onaylamak için makbuz görselini yükleyin')}</p>

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
            <span className="text-sm text-muted-foreground">{pick(locale, 'اضغط لرفع صورة الإيصال', 'Click to upload receipt image', 'Makbuz görselini yüklemek için tıklayın')}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleReceiptChange(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>
      )}

      {/* Confirm transfer button */}
      {payMethod === 'bank' && (
      <>
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
          ? (pick(locale, 'جارٍ الإرسال...', 'Submitting...', 'Gönderiliyor...'))
          : (pick(locale, 'تأكيد إتمام التحويل', 'Confirm Transfer Completed', 'Transferin Tamamlandığını Onayla'))}
      </button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        {pick(locale, 'سيتم مراجعة التحويل وتأكيد الحجز خلال ساعات العمل', 'Your transfer will be reviewed and booking confirmed during business hours', 'Transferiniz çalışma saatlerinde incelenecek ve rezervasyon onaylanacak')}
      </p>
      </>
      )}
    </div>
  )
}
