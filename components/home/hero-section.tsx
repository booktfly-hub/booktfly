import { getTranslations } from 'next-intl/server'
import { HeroSectionClient } from './hero-section-client'

interface HeroSectionProps {
  locale: string
}

export async function HeroSection({ locale }: HeroSectionProps) {
  const t = await getTranslations('homepage')
  const navT = await getTranslations('nav')
  const tripsT = await getTranslations('trips')
  const marketeerT = await getTranslations('become_marketeer')

  return (
    <HeroSectionClient
      locale={locale}
      heroTitle={t('hero_title')}
      heroSubtitle={t('hero_subtitle')}
      searchButton={t('search_button')}
      providerCta={navT('become_provider')}
      markeeteerCta={marketeerT('apply_now')}
      departureFromLabel={tripsT('departure_from')}
      arrivalToLabel={tripsT('arrival_to')}
      roundTripLabel={tripsT('round_trip')}
      oneWayLabel={tripsT('one_way')}
      departureDateLabel={tripsT('departure_date')}
      returnDateLabel={tripsT('return_date_filter')}
    />
  )
}
