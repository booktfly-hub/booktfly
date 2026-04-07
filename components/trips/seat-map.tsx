'use client'

import { cn } from '@/lib/utils'
import { buildSeatMap, getSeatTier, normalizeSeatNumber } from '@/lib/seat-map'
import type { SeatTier, TripSeatMapConfig } from '@/types/database'

type SeatMapProps = {
  config: TripSeatMapConfig
  selectedSeats?: string[]
  unavailableSeats?: string[]
  blockedSeatsEditable?: boolean
  onSeatClick?: (seatNumber: string) => void
  className?: string
}

const TIER_LABELS: Record<SeatTier, { ar: string; en: string }> = {
  up_front: { ar: 'مقدمة الطائرة', en: 'Up Front' },
  extra_legroom: { ar: 'مساحة إضافية', en: 'Extra Legroom' },
  standard: { ar: 'قياسي', en: 'Standard' },
}

const TIER_STYLES: Record<SeatTier, string> = {
  up_front: 'bg-slate-600 border-slate-600 text-white',
  extra_legroom: 'bg-slate-300 border-slate-300 text-slate-900',
  standard: 'bg-white border-slate-300 text-slate-500',
}

export function SeatMap({
  config,
  selectedSeats = [],
  unavailableSeats = [],
  blockedSeatsEditable = false,
  onSeatClick,
  className,
}: SeatMapProps) {
  const seats = buildSeatMap(config)
  const selected = new Set(selectedSeats.map(normalizeSeatNumber))
  const unavailable = new Set(unavailableSeats.map(normalizeSeatNumber))
  const rows = Array.from({ length: config.rows }, (_, index) => index + 1)

  return (
    <div className={cn('rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        {Object.entries(TIER_LABELS).map(([tier, labels]) => (
          <span key={tier} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className={cn('inline-block h-3 w-3 rounded-sm border', TIER_STYLES[tier as SeatTier])} />
            <span>{labels.en}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-emerald-500 bg-emerald-500" />
          <span>Selected</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-rose-300 bg-rose-200" />
          <span>Unavailable</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="mx-auto min-w-[310px] max-w-[420px] rounded-[2rem] border-x-2 border-dashed border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-5">
          <div className="mb-3 grid grid-cols-[repeat(3,minmax(0,1fr))_24px_repeat(3,minmax(0,1fr))] gap-2 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            {config.left_columns.map((column) => <span key={column}>{column}</span>)}
            <span />
            {config.right_columns.map((column) => <span key={column}>{column}</span>)}
          </div>

          <div className="space-y-2">
            {rows.map((row) => {
              const tier = getSeatTier(config, row)
              return (
                <div key={row} className="grid grid-cols-[repeat(3,minmax(0,1fr))_24px_repeat(3,minmax(0,1fr))] items-center gap-2">
                  {config.left_columns.map((column) => {
                    const seatNumber = `${row}${column}`
                    const seat = seats.find((entry) => entry.id === seatNumber)
                    const isBlocked = Boolean(seat?.blocked)
                    const isUnavailable = unavailable.has(seatNumber)
                    const isSelected = selected.has(seatNumber)
                    const disabled = isUnavailable || (isBlocked && !blockedSeatsEditable)

                    return (
                      <button
                        key={seatNumber}
                        type="button"
                        disabled={disabled && !blockedSeatsEditable}
                        onClick={() => onSeatClick?.(seatNumber)}
                        className={cn(
                          'flex aspect-square items-center justify-center rounded-md border text-[10px] font-bold transition-all',
                          TIER_STYLES[tier],
                          isSelected && 'border-emerald-500 bg-emerald-500 text-white shadow-sm',
                          isUnavailable && 'cursor-not-allowed border-rose-300 bg-rose-200 text-rose-700 opacity-80',
                          isBlocked && blockedSeatsEditable && 'border-slate-900 bg-slate-900 text-white',
                          disabled && 'opacity-50'
                        )}
                        aria-label={`Seat ${seatNumber}`}
                      >
                        {column}
                      </button>
                    )
                  })}
                  <div className="flex items-center justify-center text-[11px] font-bold text-slate-400">
                    {row}
                  </div>
                  {config.right_columns.map((column) => {
                    const seatNumber = `${row}${column}`
                    const seat = seats.find((entry) => entry.id === seatNumber)
                    const isBlocked = Boolean(seat?.blocked)
                    const isUnavailable = unavailable.has(seatNumber)
                    const isSelected = selected.has(seatNumber)
                    const disabled = isUnavailable || (isBlocked && !blockedSeatsEditable)

                    return (
                      <button
                        key={seatNumber}
                        type="button"
                        disabled={disabled && !blockedSeatsEditable}
                        onClick={() => onSeatClick?.(seatNumber)}
                        className={cn(
                          'flex aspect-square items-center justify-center rounded-md border text-[10px] font-bold transition-all',
                          TIER_STYLES[tier],
                          isSelected && 'border-emerald-500 bg-emerald-500 text-white shadow-sm',
                          isUnavailable && 'cursor-not-allowed border-rose-300 bg-rose-200 text-rose-700 opacity-80',
                          isBlocked && blockedSeatsEditable && 'border-slate-900 bg-slate-900 text-white',
                          disabled && 'opacity-50'
                        )}
                        aria-label={`Seat ${seatNumber}`}
                      >
                        {column}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
