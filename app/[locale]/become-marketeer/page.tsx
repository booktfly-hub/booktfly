import { getTranslations, setRequestLocale } from 'next-intl/server'
import { BecomeMarketeerPageClient } from './page-client'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function BecomeMarketeerPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('become_marketeer')

  const steps = [
    t('step_1'),
    t('step_2'),
    t('step_3'),
    t('step_4'),
  ]

  return (
    <BecomeMarketeerPageClient
      locale={locale}
      title={t('title')}
      subtitle={t('subtitle')}
      applyNow={t('apply_now')}
      howItWorks={t('how_it_works')}
      steps={steps}
    />
  )
}
