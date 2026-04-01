'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toaster'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import { ArrowRight, RotateCcw, XCircle, Check, X } from 'lucide-react'
import { shortId } from '@/lib/utils'

export default function AdminBookingDetail() {
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
    async function fetch() {
      const { data } = await supabase
        .from('bookings')
        .select('*, trip:trips(*), provider:providers(company_name_ar, company_name_en)')
        .eq('id', id)
        .single()
      setBooking(data)
      setLoading(false)
    }
    fetch()
  }, [id])

  const handleRefund = async () => {
    setSubmitting(true)
    const res = await fetch(`/api/admin/bookings/${id}/refund`, { method: 'PATCH' })
    if (res.ok) {
      toast({ title: t('common.success'), variant: 'success' })
      setBooking((prev: any) => ({ ...prev, status: 'refunded' }))
    } else {
      toast({ title: t('errors.generic'), variant: 'destructive' })
    }
    setSubmitting(false)
  }

  const handleCancel = async () => {
    setSubmitting(true)
    const res = await fetch(`/api/admin/bookings/${id}/cancel`, { method: 'PATCH' })
    if (res.ok) {
      toast({ title: t('common.success'), variant: 'success' })
      setBooking((prev: any) => ({ ...prev, status: 'cancelled' }))
    } else {
      toast({ title: t('errors.generic'), variant: 'destructive' })
    }
    setSubmitting(false)
  }

  if (loading) return <div className="animate-pulse p-8">{t('common.loading')}</div>
  if (!booking) return <div className="p-8 text-muted-foreground">{t('errors.not_found')}</div>

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
              <h1 className="text-xl font-bold">{t('admin.booking_detail')}</h1>
              <p className="text-sm text-muted-foreground">#{shortId(booking.id)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}>
              {t(`status.${booking.status}`)}
            </span>
          </div>
        </div>

        {/* Trip info */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{t('booking.trip_details')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">{locale === 'ar' ? 'المسار' : 'Route'}</p><p className="font-medium">{booking.trip?.origin_city_ar} → {booking.trip?.destination_city_ar}</p></div>
            <div><p className="text-muted-foreground">{t('trips.airline')}</p><p className="font-medium">{booking.trip?.airline}</p></div>
            <div><p className="text-muted-foreground">{t('trips.departure')}</p><p className="font-medium">{new Date(booking.trip?.departure_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}</p></div>
            <div><p className="text-muted-foreground">{t('admin.providers')}</p><p className="font-medium">{booking.provider?.company_name_ar}</p></div>
          </div>
        </div>

        {/* Passenger */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{t('booking.passenger_details')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">{t('booking.passenger_name')}</p><p className="font-medium">{booking.passenger_name}</p></div>
            <div><p className="text-muted-foreground">{t('booking.passenger_phone')}</p><p className="font-medium" dir="ltr">{booking.passenger_phone}</p></div>
            <div><p className="text-muted-foreground">{t('booking.passenger_email')}</p><p className="font-medium">{booking.passenger_email}</p></div>
            {booking.passenger_id_number && <div><p className="text-muted-foreground">{t('booking.passenger_id')}</p><p className="font-medium">{booking.passenger_id_number}</p></div>}
          </div>
        </div>

        {/* Passengers */}
        {booking.passengers && booking.passengers.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-3">{t('booking.passenger_info')}</h3>
            <div className="space-y-4">
              {booking.passengers.map((p: any, i: number) => (
                <div key={i} className={`grid grid-cols-2 md:grid-cols-3 gap-3 text-sm ${i > 0 ? 'pt-4 border-t' : ''}`}>
                  <div className="col-span-2 md:col-span-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">
                      {t('booking.passenger_number', { number: i + 1 })}
                    </span>
                  </div>
                  <div><p className="text-muted-foreground">{locale === 'ar' ? 'الاسم الأول' : 'First Name'}</p><p className="font-medium">{p.first_name}</p></div>
                  <div><p className="text-muted-foreground">{locale === 'ar' ? 'الاسم الأخير' : 'Last Name'}</p><p className="font-medium">{p.last_name}</p></div>
                  <div><p className="text-muted-foreground">{locale === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</p><p className="font-medium" dir="ltr">{p.date_of_birth}</p></div>
                  <div><p className="text-muted-foreground">{locale === 'ar' ? 'رقم الجواز أو البطاقة' : 'Passport / ID'}</p><p className="font-medium" dir="ltr">{p.id_number}</p></div>
                  <div><p className="text-muted-foreground">{locale === 'ar' ? 'تاريخ انتهاء الإثبات' : 'ID Expiry'}</p><p className="font-medium" dir="ltr">{p.id_expiry_date}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{t('booking.payment_details')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">{t('common.seats')}</p><p className="font-medium">{booking.seats_count}</p></div>
            <div><p className="text-muted-foreground">{t('trips.price_per_seat')}</p><p className="font-medium">{booking.price_per_seat} {locale === 'ar' ? 'ر.س' : 'SAR'}</p></div>
            <div><p className="text-muted-foreground">{t('booking.total_amount')}</p><p className="font-bold text-lg">{booking.total_amount} {locale === 'ar' ? 'ر.س' : 'SAR'}</p></div>
            <div><p className="text-muted-foreground">{t('admin.commissions')}</p><p className="font-medium">{booking.commission_amount} {locale === 'ar' ? 'ر.س' : 'SAR'} ({booking.commission_rate}%)</p></div>
            <div><p className="text-muted-foreground">{t('admin.payouts')}</p><p className="font-medium">{booking.provider_payout} {locale === 'ar' ? 'ر.س' : 'SAR'}</p></div>
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
                    const res = await fetch(`/api/admin/bookings/${id}/approve-payment`, {
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
                    const res = await fetch(`/api/admin/bookings/${id}/approve-payment`, {
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

        {/* Actions */}
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
            <button
              onClick={handleCancel}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              {t('admin.cancel_booking')}
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
                  const res = await fetch(`/api/admin/bookings/${id}/approve-cancel`, {
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
                  const res = await fetch(`/api/admin/bookings/${id}/approve-cancel`, {
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
      </div>
    </div>
  )
}
