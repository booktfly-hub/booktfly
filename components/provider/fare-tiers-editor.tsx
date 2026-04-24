'use client'

import { pick } from '@/lib/i18n-helpers'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { FareTier } from '@/types/database'

interface FareTiersEditorProps {
  value: FareTier[]
  onChange: (tiers: FareTier[]) => void
  currency?: string
  className?: string
}

const EMPTY_TIER = (): FareTier => ({
  code: '',
  name_ar: '',
  name_en: '',
  price: 0,
  cabin_kg: 7,
  checked_kg: 0,
  refundable: false,
  changeable: false,
  seat_selection: false,
  badge_ar: null,
  badge_en: null,
  description_ar: null,
  description_en: null,
})

export function FareTiersEditor({ value, onChange, currency = 'SAR', className }: FareTiersEditorProps) {
  const t = useTranslations('fare_tier')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [tiers, setTiers] = useState<FareTier[]>(value.length ? value : [])

  function patch(index: number, patchObj: Partial<FareTier>) {
    const next = tiers.map((tier, i) => (i === index ? { ...tier, ...patchObj } : tier))
    setTiers(next)
    onChange(next)
  }

  function add() {
    const next = [...tiers, EMPTY_TIER()]
    setTiers(next)
    onChange(next)
  }

  function remove(index: number) {
    const next = tiers.filter((_, i) => i !== index)
    setTiers(next)
    onChange(next)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">{pick(locale, 'فئات التذاكر (اختياري)', 'Fare tiers (optional)', 'Ücret kademeleri (isteğe bağlı)')}</h3>
          <p className="text-[11px] text-muted-foreground">
            {pick(locale, 'أضف حتى 4 فئات سعرية مختلفة لهذه الرحلة', 'Offer up to 4 pricing tiers with different baggage/refund rules', 'Farklı bagaj/iade kurallarıyla 4 adede kadar fiyat kademesi sunun')}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={add} disabled={tiers.length >= 4}>
          <Plus className="h-3.5 w-3.5 me-1" /> {pick(locale, 'إضافة فئة', 'Add tier', 'Kademe ekle')}
        </Button>
      </div>

      {tiers.map((tier, i) => (
        <div key={i} className="rounded-xl border border-border p-3 bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {pick(locale, `فئة ${i + 1}`, `Tier ${i + 1}`)}
            </span>
            <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)}>
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Input
              placeholder="code (e.g. basic)"
              value={tier.code}
              onChange={(e) => patch(i, { code: e.target.value })}
            />
            <Input
              placeholder={pick(locale, 'الاسم (عربي)', 'Name (Arabic)', 'Ad (Arapça)')}
              value={tier.name_ar}
              onChange={(e) => patch(i, { name_ar: e.target.value })}
            />
            <Input
              placeholder={pick(locale, 'الاسم (إنجليزي)', 'Name (English)', 'Ad (İngilizce)')}
              value={tier.name_en}
              onChange={(e) => patch(i, { name_en: e.target.value })}
            />
            <Input
              type="number"
              placeholder={`${pick(locale, 'السعر', 'Price', 'Fiyat')} (${currency})`}
              value={tier.price || ''}
              onChange={(e) => patch(i, { price: Number(e.target.value) })}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center text-xs">
            <Input
              type="number"
              placeholder={pick(locale, 'حقيبة يد (كجم)', 'Cabin kg', 'Kabin kg')}
              value={tier.cabin_kg ?? ''}
              onChange={(e) => patch(i, { cabin_kg: e.target.value ? Number(e.target.value) : null })}
            />
            <Input
              type="number"
              placeholder={pick(locale, 'حقيبة سفر (كجم)', 'Checked kg', 'Valiz kg')}
              value={tier.checked_kg ?? ''}
              onChange={(e) => patch(i, { checked_kg: e.target.value ? Number(e.target.value) : null })}
            />
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={!!tier.refundable} onChange={(e) => patch(i, { refundable: e.target.checked })} />
              {pick(locale, 'قابل للاسترداد', 'Refundable', 'İade edilebilir')}
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={!!tier.changeable} onChange={(e) => patch(i, { changeable: e.target.checked })} />
              {pick(locale, 'تعديل مجاني', 'Free changes', 'Ücretsiz değişiklik')}
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={!!tier.seat_selection} onChange={(e) => patch(i, { seat_selection: e.target.checked })} />
              {pick(locale, 'اختيار مقعد', 'Seat choice', 'Koltuk seçimi')}
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              placeholder={pick(locale, 'شارة (عربي) مثل: الأكثر شعبية', 'Badge (Arabic)', 'Rozet (Arapça)')}
              value={tier.badge_ar ?? ''}
              onChange={(e) => patch(i, { badge_ar: e.target.value || null })}
            />
            <Input
              placeholder={pick(locale, 'شارة (إنجليزي) مثل: Most popular', 'Badge (English)', 'Rozet (İngilizce)')}
              value={tier.badge_en ?? ''}
              onChange={(e) => patch(i, { badge_en: e.target.value || null })}
            />
          </div>
        </div>
      ))}

      {tiers.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          {pick(locale, 'لا توجد فئات مخصصة. ستستخدم السعر الأساسي فقط.', 'No tiers configured. The trip will use its single base price.', 'Kademe yapılandırılmadı. Gezi tek temel fiyatını kullanacak.')}
        </p>
      )}
    </div>
  )
}
