'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toaster'
import { BOOKING_STATUS_COLORS, ROOM_CATEGORIES } from '@/lib/constants'
import { ArrowRight, RotateCcw, XCircle, Check, X, Clock } from 'lucide-react'
import { shortId } from '@/lib/utils'

export default function AdminRoomBookingDetail() {
  const { id } = useParams<{ id: string }>()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    async function fetchBooking() {
      const { data } = await supabase
        .from('room_bookings')
        .select('*, room:rooms(*), provider:providers(company_name_ar, company_name_en)')
        .eq('id', id)
        .single()
      setBooking(data)
      setLoading(false)
    }
    fetchBooking()
  }, [id])

  const handleRefund = async () => {
    setSubmitting(true)
    const res = await fetch(`/api/admin/room-bookings/${id}/refund`, { method: 'PATCH' })
    if (res.ok) {
      toast({ title: t('common.success'), variant: 'success' })
      setBooking((prev: any) => ({ ...prev, status: 'refunded' }))
    } else {
      toast({ title: t('errors.generic'), variant: 'destructive' })
    }
    setSubmitting(false)
  }

  if (loading) return <div className="animate-pulse p-8">{t('common.loading')}</div>
  if (!booking) return <div className="p-8 text-muted-foreground">{t('errors.not_found')}</div>

  const statusTimeline = [
    { key: 'created_at', label: locale === 'ar' ? 'تاريخ الحجز' : 'Booking Date', value: booking.created_at },
    { key: 'paid_at', label: locale === 'ar' ? 'تاريخ الدفع' : 'Paid At', value: booking.paid_at },
    { key: 'transfer_confirmed_at', label: locale === 'ar' ? 'تأكيد التحويل' : 'Transfer Confirmed', value: booking.transfer_confirmed_at },
    { key: 'payment_reviewed_at', label: locale === 'ar' ? 'مراجعة الدفع' : 'Payment Reviewed', value: booking.payment_reviewed_at },
    { key: 'refunded_at', label: locale === 'ar' ? 'تاريخ الاسترداد' : 'Refunded At', value: booking.refunded_at },
    { key: 'cancelled_at', label: locale === 'ar' ? 'تاريخ الإلغاء' : 'Cancelled At', value: booking.cancelled_at },
  ].filter((item) => item.value)

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {t('common.back')}
      </button>

      <div className="space-y-6">
        {/* Booking header */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">{locale === 'ar' ? 'تفاصيل حجز الغرفة' : 'Room Booking Detail'}</h1>
              <p className="text-sm text-muted-foreground">#{shortId(booking.id)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}>
              {t(`status.${booking.status}`)}
            </span>
          </div>
        </div>

        {/* Room info */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{locale === 'ar' ? 'معلومات الغرفة' : 'Room Info'}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{locale === 'ar' ? 'اسم الغرفة' : 'Room Name'}</p>
              <p className="font-medium">{locale === 'ar' ? booking.room?.name_ar : (booking.room?.name_en || booking.room?.name_ar)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{locale === 'ar' ? 'المدينة' : 'City'}</p>
              <p className="font-medium">{locale === 'ar' ? booking.room?.city_ar : (booking.room?.city_en || booking.room?.city_ar)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{locale === 'ar' ? 'التصنيف' : 'Category'}</p>
              <p className="font-medium">{ROOM_CATEGORIES[booking.room?.category as keyof typeof ROOM_CATEGORIES]?.[locale === 'ar' ? 'ar' : 'en'] || booking.room?.category}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('admin.providers')}</p>
              <p className="font-medium">{locale === 'ar' ? booking.provider?.company_name_ar : (booking.provider?.company_name_en || booking.provider?.company_name_ar)}</p>
            </div>
          </div>
        </div>

        {/* Guest info */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{locale === 'ar' ? 'معلومات الضيف' : 'Guest Info'}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{locale === 'ar' ? 'اسم الضيف' : 'Guest Name'}</p>
              <p className="font-medium">{booking.guest_name}</p>
            </div>
            {booking.guest_phone && (
              <div>
                <p className="text-muted-foreground">{locale === 'ar' ? 'رقم الهاتف' : 'Phone'}</p>
                <p className="font-medium" dir="ltr">{booking.guest_phone}</p>
              </div>
            )}
            {booking.guest_email && (
              <div>
                <p className="text-muted-foreground">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                <p className="font-medium">{booking.guest_email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Booking details */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{locale === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{locale === 'ar' ? 'تاريخ الدخول' : 'Check-in Date'}</p>
              <p className="font-medium">{new Date(booking.check_in_date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{locale === 'ar' ? 'عدد الليالي' : 'Number of Days'}</p>
              <p className="font-medium">{booking.number_of_days}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{locale === 'ar' ? 'عدد الأشخاص' : 'Number of People'}</p>
              <p className="font-medium">{booking.number_of_people}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{locale === 'ar' ? 'عدد الغرف' : 'Rooms Count'}</p>
              <p className="font-medium">{booking.rooms_count}</p>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{locale === 'ar' ? 'تفاصيل الدفع' : 'Payment Details'}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{locale === 'ar' ? 'سعر الليلة' : 'Price Per Night'}</p>
              <p className="font-medium">{booking.price_per_night} {locale === 'ar' ? 'ر.س' : 'SAR'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('booking.total_amount')}</p>
              <p className="font-bold text-lg">{booking.total_amount} {locale === 'ar' ? 'ر.س' : 'SAR'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('admin.commissions')}</p>
              <p className="font-medium">{booking.commission_amount} {locale === 'ar' ? 'ر.س' : 'SAR'} ({booking.commission_rate}%)</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('admin.payouts')}</p>
              <p className="font-medium">{booking.provider_payout} {locale === 'ar' ? 'ر.س' : 'SAR'}</p>
            </div>
          </div>
        </div>

        {/* Transfer Receipt */}
        {booking.transfer_receipt_url && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-3">{locale === 'ar' ? 'إيصال التحويل' : 'Transfer Receipt'}</h3>
            <div className="relative w-full h-80">
              <Image src={booking.transfer_receipt_url} alt="Transfer receipt" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain rounded-lg border" />
            </div>
            {booking.transfer_confirmed_at && (
              <p className="text-xs text-muted-foreground mt-2">
                {locale === 'ar' ? 'تم التأكيد بتاريخ: ' : 'Confirmed at: '}
                {new Date(booking.transfer_confirmed_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
              </p>
            )}
          </div>
        )}

        {/* Payment Approval (for bank transfer) */}
        {booking.status === 'payment_processing' && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-warning">
              {locale === 'ar' ? 'مراجعة التحويل البنكي' : 'Review Bank Transfer'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {booking.transfer_confirmed_at
                ? (locale === 'ar' ? 'المستخدم أكد إتمام التحويل. يرجى التحقق والموافقة.' : 'User confirmed the transfer. Please verify and approve.')
                : (locale === 'ar' ? 'بانتظار تأكيد التحويل من المستخدم' : 'Waiting for user to confirm transfer')}
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setSubmitting(true)
                    const res = await fetch(`/api/admin/room-bookings/${id}/approve-payment`, {
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
                  {locale === 'ar' ? 'تأكيد الدفع' : 'Approve Payment'}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={locale === 'ar' ? 'سبب الرفض...' : 'Rejection reason...'}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={async () => {
                    setSubmitting(true)
                    const res = await fetch(`/api/admin/room-bookings/${id}/approve-payment`, {
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
                  {locale === 'ar' ? 'رفض الدفع' : 'Reject Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Rejection Reason */}
        {booking.payment_rejection_reason && (
          <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-4">
            <p className="text-xs text-muted-foreground mb-1">{locale === 'ar' ? 'سبب رفض الدفع' : 'Payment Rejection Reason'}</p>
            <p className="text-sm font-medium text-destructive">{booking.payment_rejection_reason}</p>
          </div>
        )}

        {/* Actions for confirmed */}
        {booking.status === 'confirmed' && (
          <div className="bg-white rounded-xl border p-6 flex gap-3">
            <button
              onClick={handleRefund}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-warning text-white text-sm font-medium hover:bg-warning/90 disabled:opacity-50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              {t('admin.refund')}
            </button>
          </div>
        )}

        {/* Cancellation Pending Actions */}
        {booking.status === 'cancellation_pending' && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-warning">
              <XCircle className="h-5 w-5" />
              {locale === 'ar' ? 'طلب إلغاء من المستخدم' : 'User Cancellation Request'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {locale === 'ar' ? 'المستخدم يطلب إلغاء هذا الحجز. يرجى الموافقة أو الرفض.' : 'The user has requested to cancel this booking. Please approve or reject.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setSubmitting(true)
                  const res = await fetch(`/api/admin/room-bookings/${id}/approve-cancel`, {
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
                  const res = await fetch(`/api/admin/room-bookings/${id}/approve-cancel`, {
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

        {/* Status Timeline */}
        {statusTimeline.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {locale === 'ar' ? 'سجل الحالة' : 'Status Timeline'}
            </h3>
            <div className="space-y-3">
              {statusTimeline.map((item) => (
                <div key={item.key} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground w-32">{item.label}</span>
                  <span className="font-medium">{new Date(item.value).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Notes */}
        {booking.admin_notes && (
          <div className="bg-muted/30 rounded-xl border p-6">
            <h3 className="font-semibold mb-2">{locale === 'ar' ? 'ملاحظات الإدارة' : 'Admin Notes'}</h3>
            <p className="text-sm text-muted-foreground">{booking.admin_notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
