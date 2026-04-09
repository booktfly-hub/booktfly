'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/components/shared/bottom-sheet'
import { cn } from '@/lib/utils'

export type TripFilters = {
  maxDuration?: number
  stops?: ('direct' | '1' | '2+')[]
  departureTime?: ('morning' | 'afternoon' | 'evening')[]
  providers?: string[]
  priceMin?: number
  priceMax?: number
  cabinClass?: string
}

interface FilterPanelProps {
  filters: TripFilters
  onChange: (filters: TripFilters) => void
  availableProviders?: { id: string; name: string }[]
  className?: string
}

export function FilterPanel({ filters, onChange, availableProviders = [], className }: FilterPanelProps) {
  const t = useTranslations('filters')
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<TripFilters>(filters)

  function toggleArrayFilter<K extends keyof TripFilters>(
    key: K,
    value: string
  ) {
    const current = (draft[key] as string[] | undefined) || []
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setDraft({ ...draft, [key]: next })
  }

  function apply() {
    onChange(draft)
    setOpen(false)
  }

  function clear() {
    const empty: TripFilters = {}
    setDraft(empty)
    onChange(empty)
    setOpen(false)
  }

  const activeCount = Object.values(filters).filter(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  ).length

  return (
    <>
      {/* Desktop filter */}
      <div className={cn('hidden md:block', className)}>
        <div className="space-y-5 rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            {t('all_filters')}
          </h3>

          {/* Stops */}
          <FilterSection title={t('stops')}>
            {[
              { value: 'direct', label: t('direct') },
              { value: '1', label: t('one_stop') },
              { value: '2+', label: t('two_plus_stops') },
            ].map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                active={(draft.stops || []).includes(opt.value as 'direct' | '1' | '2+')}
                onClick={() => toggleArrayFilter('stops', opt.value)}
              />
            ))}
          </FilterSection>

          {/* Departure Time */}
          <FilterSection title={t('departure_time')}>
            {[
              { value: 'morning', label: t('morning') },
              { value: 'afternoon', label: t('afternoon') },
              { value: 'evening', label: t('evening') },
            ].map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                active={(draft.departureTime || []).includes(opt.value as 'morning' | 'afternoon' | 'evening')}
                onClick={() => toggleArrayFilter('departureTime', opt.value)}
              />
            ))}
          </FilterSection>

          {/* Duration slider */}
          <FilterSection title={t('max_duration')}>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={24}
                value={draft.maxDuration || 24}
                onChange={(e) => setDraft({ ...draft, maxDuration: Number(e.target.value) })}
                className="flex-1 accent-primary"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {draft.maxDuration || 24} {t('hours')}
              </span>
            </div>
          </FilterSection>

          {/* Provider filter */}
          {availableProviders.length > 0 && (
            <FilterSection title={t('provider_filter')}>
              {availableProviders.map((p) => (
                <FilterChip
                  key={p.id}
                  label={p.name}
                  active={(draft.providers || []).includes(p.id)}
                  onClick={() => toggleArrayFilter('providers', p.id)}
                />
              ))}
            </FilterSection>
          )}

          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={apply} className="flex-1">
              {t('apply_filters')}
            </Button>
            <Button size="sm" variant="outline" onClick={clear}>
              {t('clear_filters')}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile filter button + bottom sheet */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setDraft(filters); setOpen(true) }}
          className="gap-1.5"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t('all_filters')}
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>

        <BottomSheet open={open} onClose={() => setOpen(false)} title={t('all_filters')}>
          <div className="space-y-5 pb-20">
            <FilterSection title={t('stops')}>
              {[
                { value: 'direct', label: t('direct') },
                { value: '1', label: t('one_stop') },
                { value: '2+', label: t('two_plus_stops') },
              ].map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  active={(draft.stops || []).includes(opt.value as 'direct' | '1' | '2+')}
                  onClick={() => toggleArrayFilter('stops', opt.value)}
                />
              ))}
            </FilterSection>

            <FilterSection title={t('departure_time')}>
              {[
                { value: 'morning', label: t('morning') },
                { value: 'afternoon', label: t('afternoon') },
                { value: 'evening', label: t('evening') },
              ].map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  active={(draft.departureTime || []).includes(opt.value as 'morning' | 'afternoon' | 'evening')}
                  onClick={() => toggleArrayFilter('departureTime', opt.value)}
                />
              ))}
            </FilterSection>

            <FilterSection title={t('max_duration')}>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={24}
                  value={draft.maxDuration || 24}
                  onChange={(e) => setDraft({ ...draft, maxDuration: Number(e.target.value) })}
                  className="flex-1 accent-primary h-8"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {draft.maxDuration || 24} {t('hours')}
                </span>
              </div>
            </FilterSection>

            <div className="fixed bottom-0 inset-x-0 p-4 bg-background border-t border-border flex gap-2">
              <Button size="lg" onClick={apply} className="flex-1">
                {t('apply_filters')}
              </Button>
              <Button size="lg" variant="outline" onClick={clear}>
                {t('clear_filters')}
              </Button>
            </div>
          </div>
        </BottomSheet>
      </div>
    </>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-background text-foreground hover:border-primary/30'
      )}
    >
      {label}
    </button>
  )
}
