'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { BookingStatus } from '@/types'
import { Filter } from 'lucide-react'

const statusOptions: (BookingStatus | 'all')[] = [
  'all',
  'confirmed',
  'payment_processing',
  'payment_failed',
  'refunded',
  'cancelled',
]

export default function BookingsStatusFilter({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const ts = useTranslations('status')
  const tc = useTranslations('common')

  function handleFilter(status: string) {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
      {statusOptions.map((status) => (
        <button
          key={status}
          onClick={() => handleFilter(status)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
            current === status
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {status === 'all' ? tc('view_all') : ts(status)}
        </button>
      ))}
    </div>
  )
}
