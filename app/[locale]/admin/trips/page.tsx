'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toaster'
import { TRIP_STATUS_COLORS } from '@/lib/constants'
import type { Trip } from '@/types'
import { Trash2 } from 'lucide-react'

export default function AdminTrips() {
  const t = useTranslations()
  const locale = useLocale()
  const supabase = createClient()
  const [trips, setTrips] = useState<(Trip & { provider: { company_name_ar: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [removeReason, setRemoveReason] = useState('')

  useEffect(() => {
    async function fetch() {
      let query = supabase
        .from('trips')
        .select('*, provider:providers(company_name_ar)')
        .order('created_at', { ascending: false })

      if (statusFilter) query = query.eq('status', statusFilter)

      const { data } = await query
      setTrips((data as any) || [])
      setLoading(false)
    }
    fetch()
  }, [statusFilter])

  const handleRemove = async (tripId: string) => {
    if (!removeReason.trim()) return
    const res = await fetch(`/api/admin/trips/${tripId}/remove`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: removeReason }),
    })
    if (res.ok) {
      toast({ title: t('common.success'), variant: 'success' })
      setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, status: 'removed' as const } : t)))
      setRemoveId(null)
      setRemoveReason('')
    }
  }

  const statuses = ['', 'active', 'sold_out', 'expired', 'removed', 'deactivated']

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.trips')}</h1>

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
                <th className="text-start p-3 font-medium">{locale === 'ar' ? 'المسار' : 'Route'}</th>
                <th className="text-start p-3 font-medium">{t('admin.providers')}</th>
                <th className="text-start p-3 font-medium">{t('common.date')}</th>
                <th className="text-start p-3 font-medium">{t('common.seats')}</th>
                <th className="text-start p-3 font-medium">{t('common.price')}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t('common.loading')}</td></tr>
              ) : trips.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t('common.no_results')}</td></tr>
              ) : (
                trips.map((trip) => (
                  <tr key={trip.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">
                      {trip.origin_city_ar} → {trip.destination_city_ar}
                    </td>
                    <td className="p-3">{(trip.provider as any)?.company_name_ar}</td>
                    <td className="p-3">{new Date(trip.departure_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                    <td className="p-3">{trip.booked_seats}/{trip.total_seats}</td>
                    <td className="p-3">{trip.price_per_seat} {locale === 'ar' ? 'ر.س' : 'SAR'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${TRIP_STATUS_COLORS[trip.status]}`}>
                        {t(`status.${trip.status}`)}
                      </span>
                    </td>
                    <td className="p-3">
                      {trip.status === 'active' && (
                        <>
                          {removeId === trip.id ? (
                            <div className="flex gap-2">
                              <input
                                value={removeReason}
                                onChange={(e) => setRemoveReason(e.target.value)}
                                placeholder={t('admin.remove_reason')}
                                className="p-1.5 text-xs border rounded w-32"
                              />
                              <button onClick={() => handleRemove(trip.id)} className="text-xs text-destructive hover:underline">
                                {t('common.confirm')}
                              </button>
                              <button onClick={() => setRemoveId(null)} className="text-xs hover:underline">
                                {t('common.cancel')}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRemoveId(trip.id)}
                              className="inline-flex items-center gap-1 text-destructive hover:underline text-xs"
                            >
                              <Trash2 className="h-3 w-3" />
                              {t('admin.remove_trip')}
                            </button>
                          )}
                        </>
                      )}
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
