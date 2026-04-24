import { pick } from '@/lib/i18n-helpers'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { capitalizeFirst } from '@/lib/utils'
import TripDetailClient from './trip-detail-client'

type Props = {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params
  const isAr = locale === 'ar'

  const { data: trip } = await supabaseAdmin
    .from('trips')
    .select('origin_city_ar, origin_city_en, origin_code, destination_city_ar, destination_city_en, destination_code, airline, price_per_seat, departure_at, cabin_class, trip_type, image_url')
    .eq('id', id)
    .single()

  if (!trip) {
    return { title: pick(locale, 'رحلة غير موجودة', 'Trip Not Found', 'Gezi Bulunamadı') }
  }

  const origin = isAr ? trip.origin_city_ar : capitalizeFirst(trip.origin_city_en || trip.origin_city_ar)
  const dest = isAr ? trip.destination_city_ar : capitalizeFirst(trip.destination_city_en || trip.destination_city_ar)
  const price = trip.price_per_seat
  const date = new Date(trip.departure_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const title = pick(locale, `${origin} → ${dest} | ${trip.airline}`, `${origin} → ${dest} | ${trip.airline}`)

  const description = pick(locale, `رحلة ${trip.airline} من ${origin} إلى ${dest} بتاريخ ${date} - ابتداءً من ${price} ر.س للمقعد`, `${trip.airline} flight from ${origin} to ${dest} on ${date} - Starting from ${price} SAR per seat`)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(trip.image_url && { images: [{ url: trip.image_url }] }),
    },
  }
}

export default function TripDetailPage({ params }: Props) {
  return <TripDetailClient params={params} />
}
