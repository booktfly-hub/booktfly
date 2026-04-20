'use client'

import { useTranslations } from 'next-intl'
import { Compass } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlexibleDestinationOptionProps {
  onSelect: () => void
  selected?: boolean
  className?: string
}

/**
 * "Anywhere" option for the destination autocomplete.
 * Clicking it sets destination to the special sentinel value 'ANY'.
 */
export function FlexibleDestinationOption({ onSelect, selected, className }: FlexibleDestinationOptionProps) {
  const t = useTranslations('flex_destination')
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl border p-3 text-start transition-colors',
        selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/40',
        className,
      )}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Compass className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold">{t('title')}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{t('subtitle')}</p>
      </div>
    </button>
  )
}
