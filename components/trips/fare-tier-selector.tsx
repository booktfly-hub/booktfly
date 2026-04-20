'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Check, X, Briefcase, RefreshCcw, Ticket, Star } from 'lucide-react'
import { cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { BnplBadge } from '@/components/ui/bnpl-badge'

export interface FareTier {
  code: string // e.g. 'basic', 'flex', 'plus'
  name_ar: string
  name_en: string
  price: number
  cabin_kg?: number | null
  checked_kg?: number | null
  refundable?: boolean
  changeable?: boolean
  seat_selection?: boolean
  badge_ar?: string | null
  badge_en?: string | null
  description_ar?: string | null
  description_en?: string | null
}

interface FareTierSelectorProps {
  tiers: FareTier[]
  value: string | null
  onChange: (code: string) => void
  currency?: string
  className?: string
}

export function FareTierSelector({
  tiers,
  value,
  onChange,
  currency = 'SAR',
  className,
}: FareTierSelectorProps) {
  const t = useTranslations('fare_tier')
  const locale = useLocale()
  const isAr = locale === 'ar'

  if (!tiers || tiers.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <h3 className="font-bold text-sm">{t('title')}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tiers.map((tier) => {
          const selected = value === tier.code
          const priceLabel = isAr
            ? formatPrice(tier.price, currency)
            : formatPriceEN(tier.price, currency)
          const name = isAr ? tier.name_ar : (tier.name_en || tier.name_ar)
          const desc = isAr ? tier.description_ar : (tier.description_en || tier.description_ar)
          const badge = isAr ? tier.badge_ar : (tier.badge_en || tier.badge_ar)

          return (
            <button
              key={tier.code}
              type="button"
              onClick={() => onChange(tier.code)}
              aria-pressed={selected}
              className={cn(
                'relative flex flex-col rounded-xl border p-3 text-start transition-all',
                selected
                  ? 'border-primary ring-2 ring-primary/30 bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40',
              )}
            >
              {badge && (
                <span className="absolute top-2 end-2 inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                  <Star className="h-2.5 w-2.5" />
                  {badge}
                </span>
              )}

              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tier.code}</p>
              <p className="font-black text-base mt-0.5">{name}</p>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-black text-foreground">{priceLabel}</span>
              </div>
              <BnplBadge price={tier.price} currency={currency} className="mt-1" />

              <ul className="mt-3 space-y-1.5 text-[11px]">
                <FeatureRow
                  yes={(tier.cabin_kg ?? 0) > 0}
                  label={tier.cabin_kg ? t('cabin_kg', { kg: tier.cabin_kg }) : t('no_cabin')}
                  Icon={Briefcase}
                />
                <FeatureRow
                  yes={(tier.checked_kg ?? 0) > 0}
                  label={tier.checked_kg ? t('checked_kg', { kg: tier.checked_kg }) : t('no_checked')}
                  Icon={Briefcase}
                />
                <FeatureRow
                  yes={!!tier.changeable}
                  label={tier.changeable ? t('changeable') : t('no_change')}
                  Icon={RefreshCcw}
                />
                <FeatureRow
                  yes={!!tier.refundable}
                  label={tier.refundable ? t('refundable') : t('no_refund')}
                  Icon={Ticket}
                />
                <FeatureRow
                  yes={!!tier.seat_selection}
                  label={tier.seat_selection ? t('seat_selection') : t('no_seat_selection')}
                  Icon={Check}
                />
              </ul>

              {desc && (
                <p className="mt-3 text-[11px] text-muted-foreground">{desc}</p>
              )}

              <div
                className={cn(
                  'mt-3 rounded-md py-1.5 text-center text-xs font-bold transition-colors',
                  selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {selected ? t('selected') : t('select')}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FeatureRow({
  yes,
  label,
  Icon,
}: {
  yes: boolean
  label: string
  Icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <li className="flex items-center gap-1.5">
      {yes ? (
        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
      ) : (
        <X className="h-3 w-3 text-rose-400 shrink-0" />
      )}
      <span className="flex items-center gap-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className={cn(yes ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
      </span>
    </li>
  )
}
