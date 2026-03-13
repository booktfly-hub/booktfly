import { getTranslations, getLocale } from 'next-intl/server'
import { getProvider } from '@/lib/supabase/provider'
import { formatPrice, cn, shortId } from '@/lib/utils'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import type { Booking, BookingStatus } from '@/types'
import { BookOpen } from 'lucide-react'
import BookingsStatusFilter from '@/components/provider/bookings-status-filter'

const validStatuses: BookingStatus[] = [
  'confirmed',
  'payment_processing',
  'payment_failed',
  'refunded',
  'cancelled',
]

type Props = {
  searchParams: Promise<{ status?: string }>
}

export default async function ProviderBookingsPage({ searchParams }: Props) {
  const { status } = await searchParams
  const locale = await getLocale()
  const t = await getTranslations('provider')
  const ts = await getTranslations('status')
  const tc = await getTranslations('common')

  const { supabase, provider } = await getProvider(locale)

  const statusFilter = status && validStatuses.includes(status as BookingStatus)
    ? (status as BookingStatus)
    : 'all'

  let query = supabase
    .from('bookings')
    .select('*, trip:trips(*), buyer:profiles!bookings_buyer_id_fkey(*)')
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data } = await query
  const bookings = (data as Booking[]) ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('bookings')}</h1>

      <BookingsStatusFilter current={statusFilter} />

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
