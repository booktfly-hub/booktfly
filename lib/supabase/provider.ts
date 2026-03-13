import { createClient } from './server'
import { redirect } from 'next/navigation'
import type { Provider } from '@/types'

export async function getProvider(locale: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: provider } = await supabase
    .from('providers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!provider) redirect(`/${locale}`)

  if (provider.status === 'suspended') redirect(`/${locale}/provider/suspended`)

  return { supabase, user, provider: provider as Provider }
}
