import { getTranslations, getLocale } from 'next-intl/server'
import { getProvider } from '@/lib/supabase/provider'
import { formatPrice } from '@/lib/utils'
import type { Trip } from '@/types'
import { DollarSign, TrendingUp, Wallet } from 'lucide-react'

type TripRevenue = {
  trip: Trip
  gross: number
  commission: number
  net: number
  bookingCount: number
}

export default async function ProviderRevenuePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { supabase, provider } = await getProvider(locale)
  const t = await getTranslations('provider')
  const tc = await getTranslations('common')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, trip:trips(*)')
    .eq('provider_id', provider.id)
    .eq('status', 'confirmed')

  let grossRevenue = 0
  let totalCommission = 0
  let netPayout = 0
  const tripMap = new Map<string, TripRevenue>()

  if (bookings && bookings.length > 0) {
    for (const booking of bookings) {
      grossRevenue += booking.total_amount
      totalCommission += booking.commission_amount
      netPayout += booking.provider_payout

      const tripId = booking.trip_id
      if (!tripMap.has(tripId)) {
        tripMap.set(tripId, {
          trip: booking.trip as Trip,
          gross: 0,
          commission: 0,
          net: 0,
          bookingCount: 0,
        })
      }

      const entry = tripMap.get(tripId)!
      entry.gross += booking.total_amount
      entry.commission += booking.commission_amount
      entry.net += booking.provider_payout
      entry.bookingCount += 1
    }
  }

  const perTrip = Array.from(tripMap.values()).sort((a, b) => b.net - a.net)

  const cards = [
    {
      label: t('gross_revenue'),
      value: formatPrice(grossRevenue),
      icon: DollarSign,
    },
    {
      label: t('platform_commission'),
      value: formatPrice(totalCommission),
      icon: TrendingUp,
    },
    {
      label: t('net_payout'),
      value: formatPrice(netPayout),
      icon: Wallet,
    },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{t('revenue')}</h1>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-card border rounded-xl p-6 space-y-2"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <card.icon className="h-4 w-4" />
              <span className="text-sm">{card.label}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Per-Trip Breakdown */}
      <div className="bg-card border rounded-xl">
        <div className="p-5 border-b">
          <h2 className="font-semibold">
            {locale === 'ar' ? 'تفاصيل الإيرادات حسب الرحلة' : 'Revenue per Trip'}
          </h2>
        </div>
        {perTrip.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {tc('no_results')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-start p-3 font-medium">
                    {locale === 'ar' ? 'الرحلة' : 'Trip'}
                  </th>
                  <th className="text-start p-3 font-medium">
                    {tc('bookings')}
                  </th>
                  <th className="text-start p-3 font-medium">
                    {t('gross_revenue')}
                  </th>
                  <th className="text-start p-3 font-medium">
                    {t('platform_commission')}
                  </th>
                  <th className="text-start p-3 font-medium">
                    {t('net_payout')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {perTrip.map((row) => (
                  <tr key={row.trip.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <p className="font-medium">
                        {locale === 'ar'
                          ? `${row.trip.origin_city_ar} → ${row.trip.destination_city_ar}`
                          : `${row.trip.origin_city_en || row.trip.origin_city_ar} → ${row.trip.destination_city_en || row.trip.destination_city_ar}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.trip.airline}
                        {row.trip.flight_number && ` - ${row.trip.flight_number}`}
                      </p>
                    </td>
                    <td className="p-3">{row.bookingCount}</td>
                    <td className="p-3 font-medium">
                      {formatPrice(row.gross)}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatPrice(row.commission)}
                    </td>
                    <td className="p-3 font-bold text-success">
                      {formatPrice(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
