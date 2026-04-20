'use client'

import { useTranslations } from 'next-intl'
import { List, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MapViewToggleProps {
  value: 'list' | 'map'
  onChange: (next: 'list' | 'map') => void
  className?: string
}

export function MapViewToggle({ value, onChange, className }: MapViewToggleProps) {
  const t = useTranslations('map_view')
  return (
    <div className={cn('inline-flex items-center rounded-full border border-border bg-card p-0.5', className)}>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-colors',
          value === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <List className="h-3.5 w-3.5" />
        {t('list')}
      </button>
      <button
        type="button"
        onClick={() => onChange('map')}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-colors',
          value === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <MapPin className="h-3.5 w-3.5" />
        {t('map')}
      </button>
    </div>
  )
}
