'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { UserCircle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SavedPassenger } from '@/types/database'

interface SavedPassengersPickerProps {
  /** Called when the user picks a saved traveler. */
  onSelect: (p: SavedPassenger) => void
  className?: string
}

/**
 * Lets signed-in users autofill a passenger form from their saved travelers.
 * Silently renders nothing for signed-out users or when API returns empty.
 */
export function SavedPassengersPicker({ onSelect, className }: SavedPassengersPickerProps) {
  const t = useTranslations('saved_passengers')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [passengers, setPassengers] = useState<SavedPassenger[] | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/saved-passengers', { credentials: 'same-origin' })
        if (!res.ok) { if (!cancelled) setPassengers([]); return }
        const data = await res.json()
        if (!cancelled) setPassengers(data.passengers ?? [])
      } catch {
        if (!cancelled) setPassengers([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (!passengers || passengers.length === 0) return null

  return (
    <div className={cn('rounded-xl border border-border bg-card p-3', className)}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-semibold">{t('title')}</p>
          <p className="text-[10px] text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {passengers.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
            className="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-2.5 py-1 text-xs hover:bg-muted"
          >
            <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">
              {p.label || `${p.first_name} ${p.last_name}`}
            </span>
            {p.is_self && (
              <span className="text-[9px] text-primary font-bold uppercase">
                {pick(locale, 'أنا', 'me', 'ben')}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
