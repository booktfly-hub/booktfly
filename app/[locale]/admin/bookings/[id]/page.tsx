'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toaster'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import { ArrowRight, RotateCcw, XCircle } from 'lucide-react'
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
      </div>
    </div>
  )
}
