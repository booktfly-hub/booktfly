import { createClient } from '@/lib/supabase/server'
import { ProviderProfileContent } from './provider-profile-content'
import type { Provider, Trip } from '@/types'

type Props = {
  params: Promise<{ id: string; locale: string }>
}

export default async function ProviderProfilePage({ params }: Props) {
  const { id: providerId } = await params
  const supabase = await createClient()

  const { data: trips } = await supabase
    .from('trips')
    .select('*, provider:providers(*)')
    .eq('provider_id', providerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)

  const provider = trips && trips.length > 0 && trips[0].provider
    ? trips[0].provider as Provider
    : null

  return (
    <ProviderProfileContent
      provider={provider}
      trips={(trips as Trip[]) || []}
    />
  )
}
