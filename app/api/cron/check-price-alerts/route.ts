import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active price alerts
    const { data: alerts } = await supabaseAdmin
      .from('price_alerts')
      .select('*')
      .eq('is_active', true)

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ message: 'No active alerts', processed: 0 })
    }

    let notified = 0

    for (const alert of alerts) {
      // Find cheapest trip for this route
      const { data: cheapestTrip } = await supabaseAdmin
        .from('trips')
        .select('price_per_seat')
        .eq('origin_code', alert.origin_code)
        .eq('destination_code', alert.destination_code)
        .eq('status', 'active')
        .gte('departure_at', new Date().toISOString())
        .order('price_per_seat', { ascending: true })
        .limit(1)
        .single()

      if (!cheapestTrip) continue

      const shouldNotify = alert.target_price
        ? cheapestTrip.price_per_seat <= alert.target_price
        : true // If no target, notify about any available flight

      // Don't re-notify within 24 hours
      if (alert.last_notified_at) {
        const lastNotified = new Date(alert.last_notified_at)
        const hoursSince = (Date.now() - lastNotified.getTime()) / (1000 * 60 * 60)
        if (hoursSince < 24) continue
      }

      if (shouldNotify) {
        const originAr = alert.origin_name_ar || alert.origin_code
        const originEn = alert.origin_name_en || alert.origin_code
        const destAr = alert.destination_name_ar || alert.destination_code
        const destEn = alert.destination_name_en || alert.destination_code

        await notify({
          userId: alert.user_id,
          type: 'price_alert_triggered',
          titleAr: 'تنبيه انخفاض السعر!',
          titleEn: 'Price Drop Alert!',
          bodyAr: `الرحلة من ${originAr} إلى ${destAr} متاحة الآن بسعر ${cheapestTrip.price_per_seat} ر.س`,
          bodyEn: `Flight from ${originEn} to ${destEn} now available at ${cheapestTrip.price_per_seat} SAR`,
          data: {
            origin_code: alert.origin_code,
            destination_code: alert.destination_code,
            price: String(cheapestTrip.price_per_seat),
          },
        })

        await supabaseAdmin
          .from('price_alerts')
          .update({ last_notified_at: new Date().toISOString() })
          .eq('id', alert.id)

        notified++
      }
    }

    return NextResponse.json({ message: 'Price alerts checked', processed: alerts.length, notified })
  } catch (error) {
    console.error('Price alert cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
