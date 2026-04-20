'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PriceFreezeButtonProps {
  tripId?: string
  roomId?: string
  carId?: string
  packageId?: string
  price: number
  currency?: string
  className?: string
}

export function PriceFreezeButton({
  tripId, roomId, carId, packageId, price, currency = 'SAR', className,
}: PriceFreezeButtonProps) {
  const t = useTranslations('price_freeze')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ fee: number; expires_at: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const estimatedFee = Math.max(25, Math.round(price * 0.03))

  async function freeze() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/price-freeze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripId, room_id: roomId, car_id: carId, package_id: packageId,
          frozen_price: price, currency,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'error')
        setLoading(false)
        return
      }
      setResult({ fee: data.fee, expires_at: data.freeze.expires_at })
    } catch {
      setError('error')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className={cn('rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800', className)}>
        <Lock className="inline h-3 w-3 me-1" />
        {t('held_until', { date: new Date(result.expires_at).toLocaleString() })}
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card p-3', className)}>
      <div className="flex items-start gap-2">
        <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{t('title')}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{t('description')}</p>
        </div>
      </div>
      <Button type="button" variant="outline" className="w-full mt-3" onClick={freeze} disabled={loading}>
        {loading ? '...' : t('cta', { fee: estimatedFee, currency })}
      </Button>
      {error && <p className="mt-2 text-[11px] text-rose-600">{error}</p>}
    </div>
  )
}
