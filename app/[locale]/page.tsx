import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { HeroSection } from '@/components/home/hero-section'
import { LastMinuteDeals } from '@/components/home/last-minute-deals'
import { FeaturedTrips } from '@/components/home/featured-trips'
import { HowItWorks } from '@/components/home/how-it-works'
import { BecomeProviderCTA } from '@/components/home/become-provider-cta'
import { ValueProposition } from '@/components/home/value-proposition'
import { Testimonials } from '@/components/home/testimonials'
import { FlightRequestSection } from '@/components/home/flight-request-section'

export default async function HomePage() {
  const locale = await getLocale()
  const supabase = await createClient()

  const lastMinuteCutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const [
    { data: featuredTrips },
    { data: lastMinuteTrips },
    { data: lastMinuteRooms },
    { data: lastMinuteCars },
  ] = await Promise.all([
    supabase
      .from('trips')
      .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('trips')
      .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
      .eq('status', 'active')
      .gt('departure_at', now)
      .lte('departure_at', lastMinuteCutoff)
      .order('departure_at', { ascending: true })
      .limit(6),
    supabase
      .from('rooms')
      .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
      .eq('status', 'active')
      .eq('is_last_minute', true)
      .limit(6),
    supabase
      .from('cars')
      .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
      .eq('status', 'active')
      .eq('is_last_minute', true)
      .limit(6),
  ])

  return (
    <main className="overflow-x-hidden bg-[linear-gradient(180deg,#fffaf5_0%,#ffffff_26%,#f7fbff_58%,#fff8ef_100%)]">
      <HeroSection locale={locale} />

      <FlightRequestSection />

      {(lastMinuteTrips?.length || lastMinuteRooms?.length || lastMinuteCars?.length) ? (
        <LastMinuteDeals
          trips={lastMinuteTrips || []}
          rooms={lastMinuteRooms || []}
          cars={lastMinuteCars || []}
          locale={locale}
        />
      ) : null}

      <FeaturedTrips
        trips={featuredTrips || []}
        locale={locale}
      />

      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-orange-100/40 blur-[110px]" />
        <ValueProposition locale={locale} />
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute right-0 top-10 h-80 w-80 rounded-full bg-sky-100/50 blur-[120px]" />
        <HowItWorks />
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
        <Testimonials locale={locale} />
      </div>

      <BecomeProviderCTA locale={locale} />
    </main>
  )
}
