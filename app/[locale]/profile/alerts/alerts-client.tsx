'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, Trash2, Plane, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import type { PriceAlert } from '@/types'

interface AlertsPageClientProps {
  locale: string
}

export function AlertsPageClient({ locale }: AlertsPageClientProps) {
  const t = useTranslations('price_alerts')
  const isAr = locale === 'ar'
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/price-alerts')
        if (res.ok) {
          const data = await res.json()
          setAlerts(data.alerts)
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function deleteAlert(id: string) {
    await fetch(`/api/price-alerts?id=${id}`, { method: 'DELETE' })
    setAlerts(alerts.filter((a) => a.id !== id))
  }

  if (loading) {
    return (
      <div className="container max-w-2xl py-8 px-4 mx-auto">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8 px-4 mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      {alerts.length === 0 ? (
        <EmptyState icon={BellOff} message={t('no_alerts')} />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const origin = isAr ? alert.origin_name_ar : alert.origin_name_en
            const dest = isAr ? alert.destination_name_ar : alert.destination_name_en
            return (
              <div key={alert.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Plane className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {origin || alert.origin_code} {isAr ? '←' : '→'} {dest || alert.destination_code}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {alert.target_price && (
                        <span className="text-xs text-muted-foreground">
                          {t('target_price')}: {alert.target_price} {isAr ? 'ر.س' : 'SAR'}
                        </span>
                      )}
                      <span className={`text-xs font-medium ${alert.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                        {alert.is_active ? t('active') : t('paused')}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAlert(alert.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
