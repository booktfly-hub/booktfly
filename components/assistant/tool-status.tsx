'use client'

import { useTranslations } from 'next-intl'
import { Plane, BedDouble, Globe, Scale, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToolPhase = 'input-streaming' | 'input-available' | 'output-available' | 'output-error'

export function ToolStatus({
  toolName,
  phase,
  query,
}: {
  toolName: string
  phase: ToolPhase
  query?: Record<string, unknown>
}) {
  const t = useTranslations('assistant.tool')

  const meta = (() => {
    switch (toolName) {
      case 'searchFlights':
        return { Icon: Plane, key: 'flights' as const }
      case 'searchHotels':
        return { Icon: BedDouble, key: 'hotels' as const }
      case 'compareHotels':
        return { Icon: Scale, key: 'compare' as const }
      case 'webSearch':
        return { Icon: Globe, key: 'web' as const }
      default:
        return { Icon: Loader2, key: 'generic' as const }
    }
  })()

  const labelKey =
    phase === 'input-streaming'
      ? `${meta.key}.preparing`
      : phase === 'input-available'
        ? `${meta.key}.running`
        : phase === 'output-error'
          ? `${meta.key}.error`
          : `${meta.key}.done`

  const isWorking = phase === 'input-streaming' || phase === 'input-available'

  // Build a short context line from the query
  const ctx = (() => {
    if (!query) return null
    if (toolName === 'searchFlights' && query.origin && query.destination) {
      return `${query.origin} → ${query.destination}`
    }
    if (toolName === 'searchHotels' && (query.city || query.destination_iata)) {
      return String(query.city || query.destination_iata)
    }
    if (toolName === 'webSearch' && query.query) {
      return String(query.query)
    }
    return null
  })()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
        isWorking
          ? 'border-primary/30 bg-primary/5 text-primary'
          : phase === 'output-error'
            ? 'border-destructive/30 bg-destructive/5 text-destructive'
            : 'border-success/40 bg-success/10 text-success'
      )}
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <meta.Icon className="h-3.5 w-3.5" />
        {isWorking && (
          <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-primary/30" />
        )}
      </span>
      <span className="inline-flex items-baseline gap-1">
        {t(labelKey)}
        {isWorking && <DotPulse />}
        {ctx && (
          <span className="ms-1 font-medium opacity-70">— {ctx}</span>
        )}
      </span>
    </div>
  )
}

function DotPulse() {
  return (
    <span className="inline-flex">
      <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
      <span className="mx-0.5 h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
    </span>
  )
}

export function MessageSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
    </div>
  )
}
