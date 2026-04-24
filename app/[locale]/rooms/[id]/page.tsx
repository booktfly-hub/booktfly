import { pick } from '@/lib/i18n-helpers'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import RoomDetailClient from './room-detail-client'

type Props = {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params
  const isAr = locale === 'ar'

  const { data: room } = await supabaseAdmin
    .from('rooms')
    .select('name_ar, name_en, city_ar, city_en, category, price_per_night, images')
    .eq('id', id)
    .single()

  if (!room) {
    return { title: pick(locale, 'غرفة غير موجودة', 'Room Not Found', 'Oda Bulunamadı') }
  }

  const name = isAr ? room.name_ar : (room.name_en || room.name_ar)
  const city = isAr ? room.city_ar : (room.city_en || room.city_ar)
  const price = room.price_per_night

  const title = pick(locale, `${name} | ${city}`, `${name} | ${city}`)

  const description = pick(locale, `${name} في ${city} - ابتداءً من ${price} ر.س لكل ليلة`, `${name} in ${city} - Starting from ${price} SAR per night`)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(room.images?.[0] && { images: [{ url: room.images[0] }] }),
    },
  }
}

export default function RoomDetailPage({ params }: Props) {
  return <RoomDetailClient params={params} />
}
