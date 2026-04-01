'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toaster'
import { BOOKING_STATUS_COLORS, CAR_CATEGORIES } from '@/lib/constants'
import { ArrowRight, RotateCcw, XCircle, Check, X, Clock } from 'lucide-react'
import { shortId } from '@/lib/utils'

export default function AdminCarBookingDetail() {
  const { id } = useParams<{ id: string }>()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const isAr = locale === 'ar'

  useEffect(() => {
    async function fetchBooking() {
      const { data } = await supabase
        .from('car_bookings')
        .select('*, car:cars(*), provider:providers(company_name_ar, company_name_en)')
        .eq('id', id)
        .single()
      setBooking(data)
      setLoading(false)
    }
    fetchBooking()
  }, [id])

  if (loading) return <div className="animate-pulse p-8">{t('common.loading')}</div>
  if (!booking) return <div className="p-8 text-muted-foreground">{t('errors.not_found')}</div>

  const carName = booking.car
    ? isAr
      ? `${booking.car.brand_ar} ${booking.car.model_ar}`
      : `${booking.car.brand_en || booking.car.brand_ar} ${booking.car.model_en || booking.car.model_ar}`
    : '-'

  const statusTimeline = [
    { key: 'created_at', label: isAr ? 'تاريخ الحجز' : 'Booking Date', value: booking.created_at },
    { key: 'paid_at', label: isAr ? 'تاريخ الدفع' : 'Paid At', value: booking.paid_at },
    { key: 'transfer_confirmed_at', label: isAr ? 'تأكيد التحويل' : 'Transfer Confirmed', value: booking.transfer_confirmed_at },
    { key: 'payment_reviewed_at', label: isAr ? 'مراجعة الدفع' : 'Payment Reviewed', value: booking.payment_reviewed_at },
    { key: 'refunded_at', label: isAr ? 'تاريخ الاسترداد' : 'Refunded At', value: booking.refunded_at },
    { key: 'cancelled_at', label: isAr ? 'تاريخ الإلغاء' : 'Cancelled At', value: booking.cancelled_at },
  ].filter((item) => item.value)

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {t('common.back')}
      </button>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">{isAr ? 'تفاصيل حجز السيارة' : 'Car Booking Detail'}</h1>
              <p className="text-sm text-muted-foreground">#{shortId(booking.id)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}>
              {t(`status.${booking.status}`)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{isAr ? 'معلومات السيارة' : 'Car Info'}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{isAr ? 'السيارة' : 'Car'}</p>
              <p className="font-medium">{carName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{isAr ? 'المدينة' : 'City'}</p>
              <p className="font-medium">{isAr ? booking.car?.city_ar : (booking.car?.city_en || booking.car?.city_ar)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{isAr ? 'الفئة' : 'Category'}</p>
              <p className="font-medium">{CAR_CATEGORIES[booking.car?.category as keyof typeof CAR_CATEGORIES]?.[isAr ? 'ar' : 'en'] || booking.car?.category}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('admin.providers')}</p>
              <p className="font-medium">{isAr ? booking.provider?.company_name_ar : (booking.provider?.company_name_en || booking.provider?.company_name_ar)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{isAr ? 'معلومات الضيف' : 'Guest Info'}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{isAr ? 'اسم الضيف' : 'Guest Name'}</p>
              <p className="font-medium">{booking.guest_name}</p>
            </div>
            {booking.guest_phone && (
              <div>
                <p className="text-muted-foreground">{isAr ? 'رقم الهاتف' : 'Phone'}</p>
                <p className="font-medium" dir="ltr">{booking.guest_phone}</p>
              </div>
            )}
            {booking.guest_email && (
              <div>
                <p className="text-muted-foreground">{isAr ? 'البريد الإلكتروني' : 'Email'}</p>
                <p className="font-medium">{booking.guest_email}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{isAr ? 'تفاصيل الحجز' : 'Booking Details'}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{isAr ? 'تاريخ الاستلام' : 'Pickup Date'}</p>
              <p className="font-medium">{new Date(booking.pickup_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{isAr ? 'تاريخ الإرجاع' : 'Return Date'}</p>
              <p className="font-medium">{new Date(booking.return_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{isAr ? 'عدد الأيام' : 'Number of Days'}</p>
              <p className="font-medium">{booking.number_of_days}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{isAr ? 'تفاصيل الدفع' : 'Payment Details'}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{isAr ? 'سعر اليوم' : 'Price Per Day'}</p>
              <p className="font-medium">{booking.price_per_day} {isAr ? 'ر.س' : 'SAR'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('booking.total_amount')}</p>
              <p className="font-bold text-lg">{booking.total_amount} {isAr ? 'ر.س' : 'SAR'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('admin.commissions')}</p>
              <p className="font-medium">{booking.commission_amount} {isAr ? 'ر.س' : 'SAR'} ({booking.commission_rate}%)</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('admin.payouts')}</p>
              <p className="font-medium">{booking.provider_payout} {isAr ? 'ر.س' : 'SAR'}</p>
            </div>
          </div>
        </div>

        {booking.transfer_receipt_url && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-3">{isAr ? 'إيصال التحويل' : 'Transfer Receipt'}</h3>
            <div className="relative w-full h-80">
              <Image src={booking.transfer_receipt_url} alt="Transfer receipt" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain rounded-lg border" />
            </div>
            {booking.transfer_confirmed_at && (
              <p className="text-xs text-muted-foreground mt-2">
                {isAr ? 'تم التأكيد بتاريخ: ' : 'Confirmed at: '}
                {new Date(booking.transfer_confirmed_at).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
              </p>
            )}
          </div>
        )}

        {booking.status === 'payment_processing' && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-warning">
              {isAr ? 'مراجعة التحويل البنكي' : 'Review Bank Transfer'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {booking.transfer_confirmed_at
                ? (isAr ? 'المستخدم أكد إتمام التحويل. يرجى التحقق والموافقة.' : 'User confirmed the transfer. Please verify and approve.')
                : (isAr ? 'بانتظار تأكيد التحويل من المستخدم' : 'Waiting for user to confirm transfer')}
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setSubmitting(true)
                    const res = await fetch(`/api/admin/car-bookings/${id}/approve-payment`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'approve' }),
                    })
                    if (res.ok) {
                      toast({ title: t('common.success'), variant: 'success' })
                      setBooking((prev: any) => ({ ...prev, status: 'confirmed' }))
                    } else {
                      toast({ title: t('errors.generic'), variant: 'destructive' })
                    }
                    setSubmitting(false)
                  }}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success text-white text-sm font-medium hover:bg-success/90 disabled:opacity-50 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  {isAr ? 'تأكيد الدفع' : 'Approve Payment'}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={isAr ? 'سبب الرفض...' : 'Rejection reason...'}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={async () => {
                    setSubmitting(true)
                    const res = await fetch(`/api/admin/car-bookings/${id}/approve-payment`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'reject', reason: rejectionReason }),
                    })
                    if (res.ok) {
                      toast({ title: t('common.success'), variant: 'success' })
                      setBooking((prev: any) => ({ ...prev, status: 'payment_failed' }))
                    } else {
                      toast({ title: t('errors.generic'), variant: 'destructive' })
                    }
                    setSubmitting(false)
                  }}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  {isAr ? 'رفض الدفع' : 'Reject Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {booking.payment_rejection_reason && (
          <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-4">
            <p className="text-xs text-muted-foreground mb-1">{isAr ? 'سبب رفض الدفع' : 'Payment Rejection Reason'}</p>
            <p className="text-sm font-medium text-destructive">{booking.payment_rejection_reason}</p>
          </div>
        )}

        {booking.status === 'cancellation_pending' && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-warning">
              <XCircle className="h-5 w-5" />
              {isAr ? 'طلب إلغاء من المستخدم' : 'User Cancellation Request'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isAr ? 'المستخدم يطلب إلغاء هذا الحجز. يرجى الموافقة أو الرفض.' : 'The user has requested to cancel this booking. Please approve or reject.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setSubmitting(true)
                  const res = await fetch(`/api/admin/car-bookings/${id}/approve-cancel`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'approve' }),
                  })
                  if (res.ok) {
                    toast({ title: t('common.success'), variant: 'success' })
                    setBooking((prev: any) => ({ ...prev, status: 'cancelled' }))
                  } else {
                    toast({ title: t('errors.generic'), variant: 'destructive' })
                  }
                  setSubmitting(false)
                }}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success text-white text-sm font-medium hover:bg-success/90 disabled:opacity-50 transition-colors"
              >
                <Check className="h-4 w-4" />
                {t('admin.approve')}
              </button>
              <button
                onClick={async () => {
                  setSubmitting(true)
                  const res = await fetch(`/api/admin/car-bookings/${id}/approve-cancel`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'reject' }),
                  })
                  if (res.ok) {
                    toast({ title: t('common.success'), variant: 'success' })
                    setBooking((prev: any) => ({ ...prev, status: 'confirmed' }))
                  } else {
                    toast({ title: t('errors.generic'), variant: 'destructive' })
                  }
                  setSubmitting(false)
                }}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
              >
                <X className="h-4 w-4" />
                {t('admin.reject')}
              </button>
            </div>
          </div>
        )}

        {booking.status === 'confirmed' && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              {isAr ? 'استرداد الحجز' : 'Refund Booking'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isAr ? 'سيتم استرداد المبلغ وخصمه من محفظة مزود الخدمة' : 'The amount will be refunded and deducted from the provider wallet'}
            </p>
            <button
              onClick={async () => {
                setSubmitting(true)
                const res = await fetch(`/api/admin/car-bookings/${id}/refund`, { method: 'PATCH' })
                if (res.ok) {
                  toast({ title: t('common.success'), variant: 'success' })
                  setBooking((prev: any) => ({ ...prev, status: 'refunded' }))
                } else {
                  toast({ title: t('errors.generic'), variant: 'destructive' })
                }
                setSubmitting(false)
              }}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              {t('admin.refund')}
            </button>
          </div>
        )}

        {statusTimeline.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {isAr ? 'سجل الحالة' : 'Status Timeline'}
            </h3>
            <div className="space-y-3">
              {statusTimeline.map((item) => (
                <div key={item.key} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground w-32">{item.label}</span>
                  <span className="font-medium">{new Date(item.value).toLocaleString(isAr ? 'ar-SA' : 'en-US')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {booking.admin_notes && (
          <div className="bg-muted/30 rounded-xl border p-6">
            <h3 className="font-semibold mb-2">{isAr ? 'ملاحظات الإدارة' : 'Admin Notes'}</h3>
            <p className="text-sm text-muted-foreground">{booking.admin_notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
