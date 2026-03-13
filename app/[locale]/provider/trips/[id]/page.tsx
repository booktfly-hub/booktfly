import { getProvider } from '@/lib/supabase/provider'
import { getTranslations, getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { TripDetailForm } from '@/components/provider/trip-detail-form'
import type { Trip, Booking } from '@/types'

type Props = {
  params: Promise<{ id: string }>
}

export default async function TripDetailPage({ params }: Props) {
  const { id: tripId } = await params
  const locale = await getLocale()
  const { supabase, provider } = await getProvider(locale)

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('provider_id', provider.id)
    .single()

  if (!trip) redirect(`/${locale}/provider/trips`)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, buyer:profiles!bookings_buyer_id_fkey(*)')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  return <TripDetailForm trip={trip as Trip} bookings={(bookings as Booking[]) ?? []} />
}
