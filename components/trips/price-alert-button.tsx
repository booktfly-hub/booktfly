'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PriceAlertButtonProps {
  originCode: string
  destinationCode: string
  originNameAr?: string
  originNameEn?: string
  destinationNameAr?: string
  destinationNameEn?: string
  currentPrice?: number
  className?: string
}

export function PriceAlertButton({
  originCode,
  destinationCode,
  originNameAr,
  originNameEn,
  destinationNameAr,
  destinationNameEn,
  currentPrice,
  className,
}: PriceAlertButtonProps) {
  const t = useTranslations('price_alerts')
  const [isSet, setIsSet] = useState(false)
  const [loading, setLoading] = useState(false)

  async function toggleAlert() {
    setLoading(true)
    try {
      if (isSet) {
        // Would need alert ID - simplified version
        setIsSet(false)
      } else {
        const res = await fetch('/api/price-alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin_code: originCode,
            destination_code: destinationCode,
            origin_name_ar: originNameAr,
            origin_name_en: originNameEn,
            destination_name_ar: destinationNameAr,
            destination_name_en: destinationNameEn,
            target_price: currentPrice,
          }),
        })

        if (res.ok) {
          setIsSet(true)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleAlert}
      disabled={loading}
      className={cn('gap-1.5', className)}
      aria-label={isSet ? t('alert_removed') : t('set_alert')}
    >
      {isSet ? (
        <BellOff className="h-4 w-4 text-amber-500" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      <span className="text-xs">{isSet ? t('active') : t('set_alert')}</span>
    </Button>
  )
}
