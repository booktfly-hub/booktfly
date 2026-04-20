'use client'

import { useTranslations } from 'next-intl'
import { Briefcase, Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LuggageAddonPanelProps {
  cabinKg: number
  checkedKg?: number | null
  /** price per extra checked bag (in currency units) */
  extraBagPrice?: number
  /** current number of extra bags purchased */
  extraBags: number
  currency?: string
  maxExtraBags?: number
  onChange: (bags: number) => void
  className?: string
}

export function LuggageAddonPanel({
  cabinKg,
  checkedKg,
  extraBagPrice = 75,
  extraBags,
  currency = 'SAR',
  maxExtraBags = 3,
  onChange,
  className,
}: LuggageAddonPanelProps) {
  const t = useTranslations('luggage')
  const hasChecked = (checkedKg ?? 0) > 0

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">{t('title')}</h3>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">{t('description')}</p>

      {/* Included items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-medium">{t('cabin_bag', { kg: cabinKg })}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">{t('included')}</span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            {hasChecked ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <X className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className={cn('font-medium', !hasChecked && 'text-muted-foreground')}>
              {hasChecked ? t('checked_bag', { kg: checkedKg ?? 0 }) : t('checked_bag_not_included')}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {hasChecked ? t('included') : t('not_included')}
          </span>
        </div>
      </div>

      {/* Extra bag upsell */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{t('add_extra')}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t('per_bag', { amount: extraBagPrice, currency })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="decrease extra bags"
              disabled={extraBags <= 0}
              onClick={() => onChange(Math.max(0, extraBags - 1))}
              className="h-7 w-7 rounded-full border border-input flex items-center justify-center disabled:opacity-40 hover:bg-muted"
            >
              <X className="h-3 w-3 rotate-45" />
            </button>
            <span className="w-5 text-center text-sm font-semibold tabular-nums">{extraBags}</span>
            <button
              type="button"
              aria-label="increase extra bags"
              disabled={extraBags >= maxExtraBags}
              onClick={() => onChange(Math.min(maxExtraBags, extraBags + 1))}
              className="h-7 w-7 rounded-full border border-input flex items-center justify-center disabled:opacity-40 hover:bg-muted"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
        {extraBags > 0 && (
          <p className="mt-2 text-xs text-primary font-semibold">
            {t('subtotal', { amount: extraBags * extraBagPrice, currency })}
          </p>
        )}
      </div>
    </div>
  )
}
