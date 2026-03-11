'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useProvider } from '@/hooks/use-provider'
import { formatPrice, cn } from '@/lib/utils'
import { TRIP_STATUS_COLORS } from '@/lib/constants'
import type { Trip, TripStatus } from '@/types'
import {
  Plus,
  Loader2,
  Plane,
  Eye,
  Filter,
} from 'lucide-react'

export default function ProviderTripsPage() {
  const t = useTranslations('provider')
  const tt = useTranslations('trips')
  const ts = useTranslations('status')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { user } = useUser()
  const { provider, loading: providerLoading } = useProvider(user?.id)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<TripStatus | 'all'>('all')

  useEffect(() => {
    if (!provider) return

    async function fetchTrips() {
      const supabase = createClient()
      let query = supabase
        .from('trips')
        .select('*')
        .eq('provider_id', provider!.id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      setTrips((data as Trip[]) ?? [])
      setLoading(false)
    }

    fetchTrips()
  }, [provider, statusFilter])

  if (providerLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const statusOptions: (TripStatus | 'all')[] = [
    'all',
    'active',
    'sold_out',
    'expired',
    'deactivated',
    'removed',
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('trip_list')}</h1>
        <Link
          href={`/${locale}/provider/trips/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('new_trip')}
        </Link>
      </div>

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
            {status === 'all' ? tc('filter') + ': ' + tc('view_all') : ts(status)}
          </button>
        ))}
      </div>

      {/* Trips Table */}
      {trips.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{t('no_trips_yet')}</p>
          <Link
            href={`/${locale}/provider/trips/new`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('post_first_trip')}
          </Link>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-start p-3 font-medium">{tc('from')} → {tc('to')}</th>
                  <th className="text-start p-3 font-medium">{tc('date')}</th>
                  <th className="text-start p-3 font-medium">{tc('seats')}</th>
                  <th className="text-start p-3 font-medium">{tc('price')}</th>
                  <th className="text-start p-3 font-medium">{tc('status')}</th>
                  <th className="text-start p-3 font-medium">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {trips.map((trip) => {
                  const seatPercent =
                    trip.total_seats > 0
                      ? Math.round((trip.booked_seats / trip.total_seats) * 100)
                      : 0

                  return (
                    <tr key={trip.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <p className="font-medium">
                          {locale === 'ar'
                            ? `${trip.origin_city_ar} → ${trip.destination_city_ar}`
                            : `${trip.origin_city_en || trip.origin_city_ar} → ${trip.destination_city_en || trip.destination_city_ar}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {trip.airline}
                          {trip.flight_number && ` - ${trip.flight_number}`}
                        </p>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(trip.departure_at).toLocaleDateString(
                          locale === 'ar' ? 'ar-SA' : 'en-US',
                          { month: 'short', day: 'numeric' }
                        )}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {trip.booked_seats}/{trip.total_seats}
                          </p>
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${seatPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        {formatPrice(trip.price_per_seat)}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            TRIP_STATUS_COLORS[trip.status] || ''
                          )}
                        >
                          {ts(trip.status)}
                        </span>
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/${locale}/provider/trips/${trip.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {tc('edit')}
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
