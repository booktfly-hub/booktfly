'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { RefreshCcw, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StaleSearchModalProps {
  /** milliseconds of inactivity that triggers the prompt — default 10 min */
  idleMs?: number
  onRefresh: () => void
  onNewSearch?: () => void
}

export function StaleSearchModal({ idleMs = 10 * 60 * 1000, onRefresh, onNewSearch }: StaleSearchModalProps) {
  const t = useTranslations('stale_search')
  const [open, setOpen] = useState(false)
  const lastActivityRef = useRef<number>(Date.now())

  useEffect(() => {
    function bump() {
      lastActivityRef.current = Date.now()
    }
    const events: Array<keyof DocumentEventMap> = ['mousemove', 'keydown', 'scroll', 'touchstart', 'visibilitychange']
    events.forEach((e) => document.addEventListener(e, bump))
    return () => events.forEach((e) => document.removeEventListener(e, bump))
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current
      if (idle >= idleMs) setOpen(true)
    }, 30 * 1000)
    return () => clearInterval(id)
  }, [idleMs])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-surface p-6 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
          <Clock className="h-6 w-6 text-warning" />
        </div>
        <h3 className="text-lg font-bold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
        <div className="mt-5 space-y-2">
          <Button
            className="w-full"
            onClick={() => {
              setOpen(false)
              lastActivityRef.current = Date.now()
              onRefresh()
            }}
          >
            <RefreshCcw className="h-4 w-4 me-1.5" />
            {t('refresh')}
          </Button>
          {onNewSearch && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setOpen(false)
                onNewSearch()
              }}
            >
              {t('new_search')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
