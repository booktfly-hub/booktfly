import { getTranslations, getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getProvider } from '@/lib/supabase/provider'
import { formatPrice, cn } from '@/lib/utils'
import { TRIP_STATUS_COLORS } from '@/lib/constants'
import type { Trip, TripStatus } from '@/types'
import TripsStatusFilter from '@/components/provider/trips-status-filter'
import {
  Plus,
  Plane,
  Eye,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'

const VALID_STATUSES: TripStatus[] = ['active', 'sold_out', 'expired', 'deactivated', 'removed']

type Props = {
  searchParams: Promise<{ status?: string }>
}

export default async function ProviderTripsPage({ searchParams }: Props) {
  const { status } = await searchParams
  const locale = await getLocale()
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const t = await getTranslations('provider')
  const tt = await getTranslations('trips')
  const ts = await getTranslations('status')
  const tc = await getTranslations('common')

  const { supabase, provider } = await getProvider(locale)

  const statusFilter = VALID_STATUSES.includes(status as TripStatus) ? (status as TripStatus) : 'all'

  let query = supabase
    .from('trips')
    .select('*')
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data } = await query
  const trips = (data as Trip[]) ?? []

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('trip_list')}</h1>
           <p className="text-slate-500 font-medium">{isAr ? 'إدارة جميع رحلاتك وحالاتها' : 'Manage all your trips and their statuses'}</p>
        </div>
        <Link
          href={`/${locale}/provider/trips/new`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-base font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          {t('new_trip')}
        </Link>
      </div>

      <TripsStatusFilter current={statusFilter} />

      {trips.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center flex flex-col items-center shadow-sm">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
             <Plane className="h-10 w-10 text-slate-300" />
          </div>
          <p className="text-xl font-bold text-slate-900 mb-2">{t('no_trips_yet')}</p>
          <p className="text-slate-500 mb-8">{isAr ? 'قم بإضافة رحلتك الأولى للبدء في تلقي الحجوزات' : 'Add your first trip to start receiving bookings'}</p>
          <Link
            href={`/${locale}/provider/trips/new`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-base font-bold hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            {t('post_first_trip')}
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{tc('from')} &middot; {tc('to')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{tc('date')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{tc('seats')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{tc('price')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{tc('status')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs text-end">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((trip) => {
                  const seatPercent =
                    trip.total_seats > 0
                      ? Math.round((trip.booked_seats / trip.total_seats) * 100)
                      : 0

                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <Plane className="h-4 w-4 -rotate-45" />
                           </div>
                           <div>
                                <p className="font-bold text-slate-900 text-base mb-0.5 flex items-center gap-2">
                                {locale === 'ar' ? trip.origin_city_ar : trip.origin_city_en || trip.origin_city_ar}
                                <Arrow className="h-3 w-3 text-slate-400" />
                                {locale === 'ar' ? trip.destination_city_ar : trip.destination_city_en || trip.destination_city_ar}
                                </p>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {trip.airline} {trip.flight_number && `• ${trip.flight_number}`}
                                </p>
                           </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="inline-flex px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 font-medium text-slate-700">
                            {new Date(trip.departure_at).toLocaleDateString(
                                locale === 'ar' ? 'ar-SA' : 'en-US',
                                { month: 'short', day: 'numeric', year: 'numeric' }
                            )}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="space-y-2 max-w-[120px]">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                             <span>{trip.booked_seats} {isAr ? 'محجوز' : 'booked'}</span>
                             <span className="text-slate-400">{trip.total_seats}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${seatPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="font-black text-slate-900 text-base">
                            {formatPrice(trip.price_per_seat)}
                        </span>
                      </td>
                      <td className="p-5">
                        <span
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest',
                            TRIP_STATUS_COLORS[trip.status] || 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {ts(trip.status)}
                        </span>
                      </td>
                      <td className="p-5 text-end">
                        <Link
                          href={`/${locale}/provider/trips/${trip.id}`}
                          className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
