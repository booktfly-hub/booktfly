import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Plane, Search, CreditCard, MapPin, ArrowLeft, ArrowRight, Building2, Users, Globe } from 'lucide-react'

export default async function HomePage() {
  const t = await getTranslations('homepage')
  const tc = await getTranslations('common')
  const tn = await getTranslations('nav')
  const locale = await getLocale()
  const supabase = await createClient()

  // Fetch featured trips
  const { data: featuredTrips } = await supabase
    .from('trips')
    .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6)

  // Fetch stats
  const [tripsCount, providersCount, bookingsCount] = await Promise.all([
    supabase.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
  ])

  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-accent/80 text-primary-foreground py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Image src="/booktfly-logo-symbol.png" alt="BooktFly" width={24} height={24} className="h-6 w-auto brightness-0 invert" />
            <span className="text-sm font-medium">BooktFly</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight">
            {t('hero_title')}
          </h1>
          <p className="text-lg lg:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            {t('hero_subtitle')}
          </p>

          {/* Search bar */}
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-4 shadow-xl">
            <form action={`/${locale}/trips`} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  name="origin"
                  placeholder={t('search_from')}
                  className="w-full ps-10 pe-4 py-3 rounded-xl border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  name="destination"
                  placeholder={t('search_to')}
                  className="w-full ps-10 pe-4 py-3 rounded-xl border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
              >
                <Search className="h-5 w-5" />
                {t('search_button')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Featured Trips */}
      {featuredTrips && featuredTrips.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">{t('featured_trips')}</h2>
            <Link
              href={`/${locale}/trips`}
              className="flex items-center gap-1 text-accent hover:underline text-sm font-medium"
            >
              {tc('view_all')}
              <Arrow className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/${locale}/trips/${trip.id}`}
                className="bg-white rounded-xl border hover:shadow-lg transition-shadow p-5 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-accent">{trip.airline}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {trip.trip_type === 'one_way'
                      ? locale === 'ar' ? 'ذهاب فقط' : 'One Way'
                      : locale === 'ar' ? 'ذهاب وعودة' : 'Round Trip'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-bold text-lg">
                    {locale === 'ar' ? trip.origin_city_ar : trip.origin_city_en || trip.origin_city_ar}
                  </span>
                  <Arrow className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold text-lg">
                    {locale === 'ar' ? trip.destination_city_ar : trip.destination_city_en || trip.destination_city_ar}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {new Date(trip.departure_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-primary">{trip.price_per_seat}</span>
                    <span className="text-sm text-muted-foreground ms-1">
                      {locale === 'ar' ? 'ر.س' : 'SAR'}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {trip.total_seats - trip.booked_seats} {locale === 'ar' ? 'مقعد متبقي' : 'seats left'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-12">{t('how_it_works')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: t('step1_title'), desc: t('step1_desc'), num: '1' },
              { icon: CreditCard, title: t('step2_title'), desc: t('step2_desc'), num: '2' },
              { icon: Plane, title: t('step3_title'), desc: t('step3_desc'), num: '3' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-accent/10 text-accent mb-4">
                  <step.icon className="h-8 w-8" />
                </div>
                <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-accent text-accent-foreground text-sm font-bold mb-3">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 lg:p-12 text-primary-foreground text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl lg:text-3xl font-bold mb-3">{t('for_providers_title')}</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">{t('for_providers_desc')}</p>
            <Link
              href={`/${locale}/become-provider`}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-primary font-bold hover:bg-white/90 transition-colors"
            >
              {t('for_providers_cta')}
              <Arrow className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Plane, value: tripsCount.count || 0, label: t('stats_trips') },
              { icon: Building2, value: providersCount.count || 0, label: t('stats_providers') },
              { icon: Users, value: bookingsCount.count || 0, label: t('stats_travelers') },
            ].map((stat) => (
              <div key={stat.label}>
                <stat.icon className="h-8 w-8 mx-auto text-accent mb-2" />
                <p className="text-4xl font-bold text-primary">{stat.value}+</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
