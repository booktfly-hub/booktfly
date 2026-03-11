'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useProvider } from '@/hooks/use-provider'
import { formatPrice, cn, shortId } from '@/lib/utils'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import type { Booking, BookingStatus } from '@/types'
import { Loader2, Filter, BookOpen } from 'lucide-react'

export default function ProviderBookingsPage() {
  const t = useTranslations('provider')
  const ts = useTranslations('status')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { user } = useUser()
  const { provider, loading: providerLoading } = useProvider(user?.id)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')

  useEffect(() => {
    if (!provider) return

    async function fetchBookings() {
      const supabase = createClient()
      let query = supabase
        .from('bookings')
        .select(
          '*, trip:trips(*), buyer:profiles!bookings_buyer_id_fkey(*)'
        )
        .eq('provider_id', provider!.id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      setBookings((data as Booking[]) ?? [])
      setLoading(false)
    }

    fetchBookings()
  }, [provider, statusFilter])

  if (providerLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const statusOptions: (BookingStatus | 'all')[] = [
    'all',
    'confirmed',
    'payment_processing',
    'payment_failed',
    'refunded',
    'cancelled',
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('bookings')}</h1>

      {/* Status Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              statusFilter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {status === 'all' ? tc('view_all') : ts(status)}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{tc('no_results')}</p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-start p-3 font-medium">
                    {locale === 'ar' ? 'المشتري' : 'Buyer'}
                  </th>
                  <th className="text-start p-3 font-medium">
                    {locale === 'ar' ? 'المسار' : 'Route'}
                  </th>
                  <th className="text-start p-3 font-medium">{tc('seats')}</th>
                  <th className="text-start p-3 font-medium">{tc('total')}</th>
                  <th className="text-start p-3 font-medium">
                    {t('platform_commission')}
                  </th>
                  <th className="text-start p-3 font-medium">{tc('status')}</th>
                  <th className="text-start p-3 font-medium">{tc('date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <p className="font-medium">{booking.passenger_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shortId(booking.id)}
                      </p>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {booking.trip
                        ? `${booking.trip.origin_city_ar} → ${booking.trip.destination_city_ar}`
                        : '-'}
                    </td>
                    <td className="p-3">{booking.seats_count}</td>
                    <td className="p-3 font-medium">
                      {formatPrice(booking.total_amount)}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatPrice(booking.commission_amount)}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          BOOKING_STATUS_COLORS[booking.status] || ''
                        )}
                      >
                        {ts(booking.status)}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {new Date(booking.created_at).toLocaleDateString(
                        locale === 'ar' ? 'ar-SA' : 'en-US'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
