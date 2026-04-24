'use client'

import { pick } from '@/lib/i18n-helpers'
import { useTranslations, useLocale } from 'next-intl'
import { Percent, UserCog, Baby, TicketPercent, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  // Name change
  nameChangeAllowed: boolean
  onNameChangeAllowedChange: (v: boolean) => void
  nameChangeFee: number | ''
  onNameChangeFeeChange: (v: number | '') => void
  nameChangeRefundable: boolean
  onNameChangeRefundableChange: (v: boolean) => void

  // Discounts
  childDiscountPct: number | ''
  onChildDiscountChange: (v: number | '') => void
  infantDiscountPct: number | ''
  onInfantDiscountChange: (v: number | '') => void
  specialDiscountPct: number | ''
  onSpecialDiscountChange: (v: number | '') => void
  specialDiscountLabelAr: string
  onSpecialDiscountLabelArChange: (v: string) => void
  specialDiscountLabelEn: string
  onSpecialDiscountLabelEnChange: (v: string) => void

  // Commission override (admin only)
  isAdmin?: boolean
  commissionOverride: number | ''
  onCommissionOverrideChange: (v: number | '') => void
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:border-primary'

export function TripPricingPolicyCard(props: Props) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Name change policy */}
      <section className="space-y-3">
        <header className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserCog className="h-4 w-4" />
          </div>
          <h3 className="font-bold">{pick(locale, 'سياسة تغيير اسم المسافر', 'Name change policy', 'Ad değişiklik politikası')}</h3>
        </header>

        <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={props.nameChangeAllowed}
            onChange={(e) => props.onNameChangeAllowedChange(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm font-medium">{t('name_change.allow_toggle')}</span>
        </label>

        <div
          className={cn(
            'grid gap-3 md:grid-cols-2 transition-opacity',
            !props.nameChangeAllowed && 'opacity-40 pointer-events-none'
          )}
        >
          <div>
            <label className="text-xs font-bold block mb-1">{t('name_change.fee_input')}</label>
            <input
              type="number"
              min={0}
              step={1}
              value={props.nameChangeFee}
              onChange={(e) => props.onNameChangeFeeChange(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputClass}
              placeholder="50"
            />
          </div>
          <label className="flex items-center gap-3 pt-5 cursor-pointer">
            <input
              type="checkbox"
              checked={props.nameChangeRefundable}
              onChange={(e) => props.onNameChangeRefundableChange(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium">{t('name_change.refundable_toggle')}</span>
          </label>
        </div>
      </section>

      <div className="h-px bg-slate-100" />

      {/* Age-based discounts */}
      <section className="space-y-3">
        <header className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Baby className="h-4 w-4" />
          </div>
          <h3 className="font-bold">{pick(locale, 'خصومات حسب العمر', 'Age-based discounts', 'Yaşa göre indirimler')}</h3>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-bold block mb-1">
              {t('discount.child_discount')} (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={props.childDiscountPct}
              onChange={(e) => props.onChildDiscountChange(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputClass}
              placeholder="50"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">{t('discount.child')}</p>
          </div>
          <div>
            <label className="text-xs font-bold block mb-1">
              {t('discount.infant_discount')} (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={props.infantDiscountPct}
              onChange={(e) => props.onInfantDiscountChange(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputClass}
              placeholder="90"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">{t('discount.infant')}</p>
          </div>
        </div>
      </section>

      <div className="h-px bg-slate-100" />

      {/* Special discount */}
      <section className="space-y-3">
        <header className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="font-bold">{t('discount.special_discount')}</h3>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-bold block mb-1">{t('discount.percentage')} (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={props.specialDiscountPct}
              onChange={(e) => props.onSpecialDiscountChange(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputClass}
              placeholder="10"
            />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1">{t('discount.special_label_ar')}</label>
            <input
              type="text"
              value={props.specialDiscountLabelAr}
              onChange={(e) => props.onSpecialDiscountLabelArChange(e.target.value)}
              className={inputClass}
              dir="rtl"
              placeholder={pick(locale, 'عرض خاص', '', '')}
            />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1">{t('discount.special_label_en')}</label>
            <input
              type="text"
              value={props.specialDiscountLabelEn}
              onChange={(e) => props.onSpecialDiscountLabelEnChange(e.target.value)}
              className={inputClass}
              dir="ltr"
              placeholder={!isAr ? 'Special Deal' : ''}
            />
          </div>
        </div>
      </section>

      {/* Admin-only commission override */}
      {props.isAdmin && (
        <>
          <div className="h-px bg-slate-100" />
          <section className="space-y-3">
            <header className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Percent className="h-4 w-4" />
              </div>
              <h3 className="font-bold">
                {pick(locale, 'عمولة خاصة بهذه الرحلة (أدمن)', 'Per-trip commission override (admin)', 'Gezi başına komisyon geçersiz kılma (yönetici)')}
              </h3>
            </header>
            <div>
              <label className="text-xs font-bold block mb-1">
                {pick(locale, 'النسبة (%) — اتركه فارغاً لاستخدام عمولة المزود', 'Rate (%) — leave blank to use provider default', 'Oran (%) — tedarikçi varsayılanını kullanmak için boş bırakın')}
              </label>
              <input
                type="number"
                min={0}
                max={50}
                step={0.1}
                value={props.commissionOverride}
                onChange={(e) =>
                  props.onCommissionOverrideChange(e.target.value === '' ? '' : Number(e.target.value))
                }
                className={inputClass}
                placeholder="10"
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

/**
 * Public-facing badges for a trip's name-change policy.
 */
export function NameChangeBadge({
  allowed,
  fee,
  refundable,
  currency = 'SAR',
}: {
  allowed: boolean
  fee: number
  refundable: boolean
  currency?: string
}) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  if (!allowed) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-100">
        <TicketPercent className="h-3 w-3" />
        {t('name_change.not_allowed')}
      </div>
    )
  }
  const feeStr = fee > 0
    ? ` — ${fee} ${currency}${refundable ? ` (${t('name_change.refundable')})` : ` (${t('name_change.non_refundable')})`}`
    : ` — ${t('name_change.free')}`
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
      <TicketPercent className="h-3 w-3" />
      {t('name_change.allowed')}{feeStr}
      {!isAr && null}
    </div>
  )
}
