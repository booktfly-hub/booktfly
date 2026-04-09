import { getTranslations } from 'next-intl/server'
import { HelpPageClient } from './help-client'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'help' })
  return { title: t('title') }
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <HelpPageClient locale={locale} />
}
