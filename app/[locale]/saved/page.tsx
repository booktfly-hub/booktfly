import { getTranslations } from 'next-intl/server'
import { SavedPageClient } from './saved-client'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'saved' })
  return { title: t('title') }
}

export default async function SavedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <SavedPageClient locale={locale} />
}
