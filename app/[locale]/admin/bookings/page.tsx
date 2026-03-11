'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import { Eye } from 'lucide-react'

type BookingRow = {
  id: string
  passenger_name: string
  seats_count: number
  total_amount: number
  commission_amount: number
  provider_payout: number
  status: string
  created_at: string
  trip: { origin_city_ar: string; destination_city_ar: string; departure_at: string } | null
  provider: { company_name_ar: string } | null
}

export default function AdminBookings() {
  const t = useTranslations()
  const locale = useLocale()
  const supabase = createClient()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function fetch() {
      let query = supabase
        .from('bookings')
        .select('id, passenger_name, seats_count, total_amount, commission_amount, provider_payout, status, created_at, trip:trips(origin_city_ar, destination_city_ar, departure_at), provider:providers(company_name_ar)')
        .order('created_at', { ascending: false })

      if (statusFilter) query = query.eq('status', statusFilter)

      const { data } = await query
      setBookings((data as any) || [])
      setLoading(false)
    }
    fetch()
  }, [statusFilter])

  const statuses = ['', 'confirmed', 'payment_processing', 'payment_failed', 'refunded', 'cancelled']

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.bookings')}</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === s ? 'bg-accent text-accent-foreground border-accent' : 'bg-white hover:bg-muted border-border'
            }`}
          >
            {s ? t(`status.${s}`) : locale === 'ar' ? 'الكل' : 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{t('booking.passenger_name')}</th>
                <th className="text-start p-3 font-medium">{locale === 'ar' ? 'الرحلة' : 'Trip'}</th>
                <th className="text-start p-3 font-medium">{t('admin.providers')}</th>
                <th className="text-start p-3 font-medium">{t('common.seats')}</th>
                <th className="text-start p-3 font-medium">{t('common.total')}</th>
                <th className="text-start p-3 font-medium">{t('admin.commissions')}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{t('common.loading')}</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{t('common.no_results')}</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{b.passenger_name}</td>
                    <td className="p-3">{b.trip?.origin_city_ar} → {b.trip?.destination_city_ar}</td>
                    <td className="p-3">{b.provider?.company_name_ar}</td>
                    <td className="p-3">{b.seats_count}</td>
                    <td className="p-3">{b.total_amount} {locale === 'ar' ? 'ر.س' : 'SAR'}</td>
                    <td className="p-3">{b.commission_amount} {locale === 'ar' ? 'ر.س' : 'SAR'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${BOOKING_STATUS_COLORS[b.status]}`}>
                        {t(`status.${b.status}`)}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link href={`/${locale}/admin/bookings/${b.id}`} className="inline-flex items-center gap-1 text-accent hover:underline text-xs">
                        <Eye className="h-3 w-3" />
                        {locale === 'ar' ? 'تفاصيل' : 'Details'}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
