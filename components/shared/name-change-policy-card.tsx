'use client'

import { useTranslations, useLocale } from 'next-intl'
import { UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  allowed: boolean
  onAllowedChange: (v: boolean) => void
  fee: number | ''
  onFeeChange: (v: number | '') => void
  refundable: boolean
  onRefundableChange: (v: boolean) => void
  title?: string
}

const inp = 'w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary'

export function NameChangePolicyCard(props: Props) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserCog className="h-4 w-4" />
        </div>
        <h3 className="font-bold">{props.title || (isAr ? 'سياسة تغيير اسم المستفيد' : 'Name change policy')}</h3>
      </header>

      <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 cursor-pointer">
        <input
          type="checkbox"
          checked={props.allowed}
          onChange={(e) => props.onAllowedChange(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <span className="text-sm font-medium">{t('name_change.allow_toggle')}</span>
      </label>

      <div
        className={cn(
          'grid gap-3 md:grid-cols-2 transition-opacity',
          !props.allowed && 'opacity-40 pointer-events-none'
        )}
      >
        <div>
          <label className="text-xs font-bold block mb-1">{t('name_change.fee_input')}</label>
          <input
            type="number"
            min={0}
            step={1}
            value={props.fee}
            onChange={(e) => props.onFeeChange(e.target.value === '' ? '' : Number(e.target.value))}
            className={inp}
            placeholder="25"
          />
        </div>
        <label className="flex items-center gap-3 pt-5 cursor-pointer">
          <input
            type="checkbox"
            checked={props.refundable}
            onChange={(e) => props.onRefundableChange(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm font-medium">{t('name_change.refundable_toggle')}</span>
        </label>
      </div>
    </div>
  )
}
