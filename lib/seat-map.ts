import type { SeatTier, TripSeatMapConfig } from '@/types/database'

export type DerivedSeat = {
  id: string
  row: number
  column: string
  tier: SeatTier
  blocked: boolean
}

export const DEFAULT_SEAT_MAP_CONFIG: TripSeatMapConfig = {
  rows: 30,
  left_columns: ['A', 'B', 'C'],
  right_columns: ['D', 'E', 'F'],
  blocked_seats: [],
  up_front_rows: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  extra_legroom_rows: [11, 12],
}

export function normalizeSeatNumber(seat: string) {
  return seat.trim().toUpperCase()
}

export function parseSeatRowList(input: string) {
  return Array.from(
    new Set(
      input
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  ).sort((a, b) => a - b)
}

export function getSeatTier(config: TripSeatMapConfig, row: number): SeatTier {
  if (config.up_front_rows.includes(row)) return 'up_front'
  if (config.extra_legroom_rows.includes(row)) return 'extra_legroom'
  return 'standard'
}

export function buildSeatMap(config: TripSeatMapConfig): DerivedSeat[] {
  const blockedSeats = new Set(config.blocked_seats.map(normalizeSeatNumber))
  const columns = [...config.left_columns, ...config.right_columns]
  const seats: DerivedSeat[] = []

  for (let row = 1; row <= config.rows; row += 1) {
    for (const column of columns) {
      const id = `${row}${column}`
      seats.push({
        id,
        row,
        column,
        tier: getSeatTier(config, row),
        blocked: blockedSeats.has(id),
      })
    }
  }

  return seats
}

export function countSeatMapCapacity(config: TripSeatMapConfig) {
  return buildSeatMap(config).filter((seat) => !seat.blocked).length
}

export function isSeatSelectable(
  config: TripSeatMapConfig,
  seatNumber: string,
  unavailableSeats: string[] = []
) {
  const normalizedSeat = normalizeSeatNumber(seatNumber)
  const unavailable = new Set(unavailableSeats.map(normalizeSeatNumber))
  const seat = buildSeatMap(config).find((entry) => entry.id === normalizedSeat)
  return Boolean(seat && !seat.blocked && !unavailable.has(normalizedSeat))
}
