import { ImageResponse } from 'next/og'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { capitalizeFirst } from '@/lib/utils'

export const runtime = 'nodejs'
export const alt = 'BookitFly trip'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = {
  params: { id: string; locale: string }
}

export default async function Image({ params }: Props) {
  const { id, locale } = params
  const isAr = locale === 'ar'

  const { data: trip } = await supabaseAdmin
    .from('trips')
    .select('origin_city_ar, origin_city_en, origin_code, destination_city_ar, destination_city_en, destination_code, airline, price_per_seat, currency, departure_at, total_seats, booked_seats, discount_percentage')
    .eq('id', id)
    .single()

  if (!trip) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', fontSize: 48, fontWeight: 800 }}>
          BookitFly
        </div>
      ),
      size
    )
  }

  const origin = isAr ? trip.origin_city_ar : capitalizeFirst(trip.origin_city_en || trip.origin_city_ar)
  const dest = isAr ? trip.destination_city_ar : capitalizeFirst(trip.destination_city_en || trip.destination_city_ar)
  const remaining = (trip.total_seats ?? 0) - (trip.booked_seats ?? 0)
  const dateLabel = new Date(trip.departure_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const currency = trip.currency || 'SAR'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 45%, #e0f2fe 100%)',
          padding: '60px 72px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 28, fontWeight: 900 }}>B</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>BookitFly</div>
          </div>
          {trip.discount_percentage > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#dc2626', color: 'white', borderRadius: 999, fontSize: 22, fontWeight: 800 }}>
              🔥 -{trip.discount_percentage}%
            </div>
          )}
        </div>

        {/* Route */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 80, gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#94a3b8', letterSpacing: 4 }}>FROM</div>
            <div style={{ fontSize: 72, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{origin}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#64748b', marginTop: 8 }}>{trip.origin_code?.toUpperCase()}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 60, color: '#f97316' }}>→</div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'flex-end' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#94a3b8', letterSpacing: 4 }}>TO</div>
            <div style={{ fontSize: 72, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{dest}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#64748b', marginTop: 8 }}>{trip.destination_code?.toUpperCase()}</div>
          </div>
        </div>

        {/* Footer meta */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#94a3b8', letterSpacing: 3 }}>DEPARTURE</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>{dateLabel}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#475569', marginTop: 4 }}>{trip.airline}</div>
            {remaining > 0 && remaining <= 5 && (
              <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', marginTop: 6 }}>Only {remaining} seats left!</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#94a3b8', letterSpacing: 3 }}>FROM</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontSize: 76, fontWeight: 900, color: '#f97316', lineHeight: 1 }}>{trip.price_per_seat}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{currency}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#64748b' }}>per seat</div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
