import { getProvider } from '@/lib/supabase/provider'
import { getTranslations, getLocale } from 'next-intl/server'
import { ProviderProfileForm } from '@/components/provider/provider-profile-form'

export default async function ProviderProfilePage() {
  const locale = await getLocale()
  const t = await getTranslations('provider')
  const { provider } = await getProvider(locale)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('profile')}</h1>
      <ProviderProfileForm provider={provider} />
    </div>
  )
}
