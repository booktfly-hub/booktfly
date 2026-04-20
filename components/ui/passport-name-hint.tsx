'use client'

import { useTranslations } from 'next-intl'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PassportNameHintProps {
  /** compact = single line, expanded = multi-line with example */
  variant?: 'compact' | 'expanded'
  className?: string
}

export function PassportNameHint({ variant = 'compact', className }: PassportNameHintProps) {
  const t = useTranslations('passport_hint')

  if (variant === 'expanded') {
    return (
      <div
        className={cn(
          'rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900',
          className,
        )}
      >
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{t('title')}</p>
            <p className="text-amber-800">{t('description')}</p>
            <p className="text-[11px] text-amber-700 italic">
              {t('example')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <p
      className={cn(
        'flex items-center gap-1.5 text-[11px] text-amber-800',
        className,
      )}
    >
      <Info className="h-3 w-3" />
      {t('compact')}
    </p>
  )
}
