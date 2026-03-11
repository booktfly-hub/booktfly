'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import {
  Building2,
  Shield,
  Mail,
  Phone,
  Plane,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROVIDER_TYPES } from '@/lib/constants'
import { TripCard } from '@/components/trips/trip-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton, Skeleton } from '@/components/shared/loading-skeleton'
import type { Provider, Trip } from '@/types'

export default function ProviderProfilePage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const providerId = params.id as string

  const [provider, setProvider] = useState<Provider | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [tripsLoading, setTripsLoading] = useState(true)

  const Back = isAr ? ChevronRight : ChevronLeft

  useEffect(() => {
    async function fetchProvider() {
      try {
        const res = await fetch(`/api/trips?provider_id=${providerId}&limit=50`)
        const data = await res.json()
        setTrips(data.trips || [])

        // Extract provider from the first trip if available
        if (data.trips && data.trips.length > 0 && data.trips[0].provider) {
          setProvider(data.trips[0].provider)
        } else {
          // If no trips, we can't get provider info this way
          // Still attempt to show the page but with minimal info
          setProvider(null)
        }
      } catch {
        // Error handled
      } finally {
        setLoading(false)
        setTripsLoading(false)
      }
    }
    fetchProvider()
  }, [providerId])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl border bg-card p-8 mb-8">
          <div className="flex items-start gap-6">
            <Skeleton className="h-20 w-20 rounded-xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!provider && trips.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('errors.not_found')}</h2>
        <button
          onClick={() => router.back()}
          className="text-accent hover:underline text-sm mt-2"
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  const companyName = provider
    ? isAr
      ? provider.company_name_ar
      : (provider.company_name_en || provider.company_name_ar)
    : ''

  const companyDesc = provider
    ? isAr
      ? provider.company_description_ar
      : (provider.company_description_en || provider.company_description_ar)
    : null

  const providerType = provider
    ? PROVIDER_TYPES[provider.provider_type]
    : null

  const documentBadges = provider
    ? [
        { key: 'commercial_reg', active: provider.has_commercial_reg, labelAr: 'سجل تجاري', labelEn: 'Commercial Reg.' },
        { key: 'iata', active: provider.has_iata_permit, labelAr: 'تصريح IATA', labelEn: 'IATA Certified' },
        { key: 'hajj', active: provider.has_hajj_permit, labelAr: 'تصريح حج وعمرة', labelEn: 'Hajj Permit' },
        { key: 'tourism', active: provider.has_tourism_permit, labelAr: 'ترخيص سياحة', labelEn: 'Tourism License' },
        { key: 'civil_aviation', active: provider.has_civil_aviation, labelAr: 'ترخيص طيران مدني', labelEn: 'Civil Aviation' },
      ].filter((b) => b.active)
    : []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <Back className="h-4 w-4" />
        {t('common.back')}
      </button>

      {/* Provider header card */}
      {provider && (
        <div className="rounded-xl border bg-card p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo */}
            <div className="h-20 w-20 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              {provider.logo_url ? (
                <img
                  src={provider.logo_url}
                  alt={companyName}
                  className="h-20 w-20 rounded-xl object-cover"
                />
              ) : (
                <Building2 className="h-10 w-10 text-accent" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{companyName}</h1>
                  {providerType && (
                    <span className="inline-flex items-center px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-sm font-medium mt-2">
                      {isAr ? providerType.ar : providerType.en}
                    </span>
                  )}
                </div>
              </div>

              {companyDesc && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">
                  {companyDesc}
                </p>
              )}

              {/* Document badges */}
              {documentBadges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {documentBadges.map((badge) => (
                    <span
                      key={badge.key}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      {isAr ? badge.labelAr : badge.labelEn}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Provider's active trips */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <Plane className="h-5 w-5 text-accent" />
          {t('provider.active_trips')}
          <span className="text-sm font-normal text-muted-foreground">
            ({trips.length})
          </span>
        </h2>

        {tripsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={Plane}
            message={t('provider.no_trips_yet')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
