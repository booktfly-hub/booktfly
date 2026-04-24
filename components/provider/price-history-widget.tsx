'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Row = { id: string; old_price: number | null; new_price: number; changed_at: string }

export function PriceHistoryWidget({ tripId }: { tripId: string }) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/trips/${tripId}/price-history`)
      .then((r) => r.json())
      .then((d) => setRows(d.data || []))
      .finally(() => setLoading(false))
  }, [tripId])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
      </div>
    )
  }

  if (rows.length < 2) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm">{pick(locale, 'تاريخ تغيّر السعر', 'Price change history', 'Fiyat değişim geçmişi')}</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {pick(locale, 'لم يتغيّر السعر بعد. سيظهر التاريخ هنا عند أي تعديل على السعر.', 'No price changes yet. History will appear here after any price edit.', 'Henüz fiyat değişikliği yok. Geçmiş, herhangi bir fiyat düzenlemesinden sonra burada görünecek.')}
        </p>
      </div>
    )
  }

  const ordered = [...rows].reverse() // oldest → newest
  const values = ordered.map((r) => Number(r.new_price))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 240
  const H = 56
  const xStep = values.length > 1 ? W / (values.length - 1) : 0
  const points = values.map((v, i) => {
    const x = i * xStep
    const y = H - ((v - min) / range) * H
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const first = values[0]
  const last = values[values.length - 1]
  const delta = last - first
  const pctChange = first !== 0 ? ((last - first) / first) * 100 : 0
  const Trend = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const color = delta > 0 ? 'text-rose-600' : delta < 0 ? 'text-emerald-600' : 'text-slate-500'
  const stroke = delta > 0 ? '#e11d48' : delta < 0 ? '#059669' : '#64748b'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm">{pick(locale, 'تاريخ تغيّر السعر', 'Price change history', 'Fiyat değişim geçmişi')}</h3>
        </div>
        <div className={`inline-flex items-center gap-1 text-xs font-bold ${color}`}>
          <Trend className="h-3.5 w-3.5" />
          {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="rounded-lg bg-slate-50 p-2" preserveAspectRatio="none">
        <polyline fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
        {values.map((v, i) => {
          const x = i * xStep
          const y = H - ((v - min) / range) * H
          return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={2.5} fill={stroke} />
        })}
      </svg>

      <ul className="max-h-40 space-y-1.5 overflow-y-auto text-xs">
        {rows.slice(0, 10).map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
            <span className="text-muted-foreground">
              {new Date(r.changed_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                dateStyle: 'short', timeStyle: 'short',
              })}
            </span>
            <span className="font-mono font-bold">
              {r.old_price != null ? Number(r.old_price).toFixed(2) : '—'} → {Number(r.new_price).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
