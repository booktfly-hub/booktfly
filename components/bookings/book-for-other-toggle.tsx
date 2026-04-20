'use client'

import { useTranslations } from 'next-intl'
import { UserCheck, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookForOtherToggleProps {
  value: boolean
  onChange: (next: boolean) => void
  className?: string
}

export function BookForOtherToggle({ value, onChange, className }: BookForOtherToggleProps) {
  const t = useTranslations('book_for_other')

  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={cn(
        'flex items-center justify-between w-full gap-3 rounded-lg border p-3 text-start transition-colors',
        value
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:bg-muted/40',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={cn(
            'h-9 w-9 rounded-full flex items-center justify-center shrink-0',
            value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {value ? <Users className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t('title')}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {value ? t('desc_on') : t('desc_off')}
          </p>
        </div>
      </div>
      <div
        className={cn(
          'h-5 w-9 rounded-full shrink-0 p-0.5 transition-colors',
          value ? 'bg-primary' : 'bg-muted',
        )}
      >
        <div
          className={cn(
            'h-4 w-4 rounded-full bg-white shadow transition-transform',
            value ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0',
          )}
        />
      </div>
    </button>
  )
}
