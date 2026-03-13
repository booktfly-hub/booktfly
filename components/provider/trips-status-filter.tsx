'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { TripStatus } from '@/types'
import { Filter } from 'lucide-react'

const statusOptions: (TripStatus | 'all')[] = [
  'all',
  'active',
  'sold_out',
  'expired',
  'deactivated',
  'removed',
]

export default function TripsStatusFilter({ current }: { current: string }) {
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
    <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
      <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
        <Filter className="h-4 w-4 text-slate-400" />
      </div>
      <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => handleFilter(status)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300',
              current === status
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            {status === 'all' ? tc('view_all') : ts(status)}
          </button>
        ))}
      </div>
    </div>
  )
}
