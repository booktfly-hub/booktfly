import { getTranslations } from 'next-intl/server'
import { AlertsPageClient } from './alerts-client'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'price_alerts' })
  return { title: t('title') }
}

export default async function AlertsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <AlertsPageClient locale={locale} />
}
