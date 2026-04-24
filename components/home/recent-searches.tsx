'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Plane, Clock } from 'lucide-react'
import type { RecentSearch } from '@/types'

export function RecentSearches() {
  const locale = useLocale()
  const t = useTranslations('recent_searches')
  const router = useRouter()
  const isAr = locale === 'ar'
  const [searches, setSearches] = useState<RecentSearch[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/recent-searches')
        if (res.ok) {
          const data = await res.json()
          setSearches(data.searches)
        }
      } catch {}
    }
    load()
  }, [])

  if (searches.length === 0) return null

  function handleClick(search: RecentSearch) {
    const params = new URLSearchParams()
    if (search.origin_code) params.set('origin', search.origin_code)
    if (search.destination_code) params.set('destination', search.destination_code)
    if (search.departure_date) params.set('departure', search.departure_date)
    if (search.return_date) params.set('return', search.return_date)
    if (search.trip_type) params.set('type', search.trip_type)
    if (search.passengers) params.set('passengers', String(search.passengers))
    router.push(`/${locale}/trips?${params}`)
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">{t('title')}</h3>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {searches.map((search) => {
          const origin = isAr ? search.origin_name_ar : search.origin_name_en
          const dest = isAr ? search.destination_name_ar : search.destination_name_en
          return (
            <button
              key={search.id}
              onClick={() => handleClick(search)}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/30 hover:bg-primary/5 transition-colors whitespace-nowrap shrink-0"
            >
              <Plane className="h-3 w-3 text-primary" />
              <span>{origin || search.origin_code}</span>
              <span className="text-muted-foreground">{pick(locale, '←', '→', '→')}</span>
              <span>{dest || search.destination_code}</span>
              {search.departure_date && (
                <span className="text-muted-foreground">
                  {new Date(search.departure_date).toLocaleDateString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'), { month: 'short', day: 'numeric' })}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
