import { pick } from '@/lib/i18n-helpers'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import CarDetailClient from './car-detail-client'

type Props = {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params
  const isAr = locale === 'ar'

  const { data: car } = await supabaseAdmin
    .from('cars')
    .select('brand_ar, brand_en, model_ar, model_en, city_ar, city_en, price_per_day, images')
    .eq('id', id)
    .single()

  if (!car) {
    return { title: pick(locale, 'سيارة غير موجودة', 'Car Not Found', 'Araç Bulunamadı') }
  }

  const brand = isAr ? car.brand_ar : (car.brand_en || car.brand_ar)
  const model = isAr ? car.model_ar : (car.model_en || car.model_ar)
  const city = isAr ? car.city_ar : (car.city_en || car.city_ar)
  const price = car.price_per_day

  const title = pick(locale, `${brand} ${model} | ${city}`, `${brand} ${model} | ${city}`)

  const description = pick(locale, `${brand} ${model} في ${city} - ابتداءً من ${price} ر.س لكل يوم`, `${brand} ${model} in ${city} - Starting from ${price} SAR per day`)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(car.images?.[0] && { images: [{ url: car.images[0] }] }),
    },
  }
}

export default function CarDetailPage({ params }: Props) {
  return <CarDetailClient params={params} />
}
