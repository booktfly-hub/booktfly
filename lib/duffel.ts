import 'server-only'
import { Duffel } from '@duffel/api'

const token = process.env.DUFFEL_ACCESS_TOKEN

if (!token) {
  throw new Error('DUFFEL_ACCESS_TOKEN is not set')
}

export const duffel = new Duffel({ token })

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first'

export interface SearchPassengers {
  adults: number
  children?: number
  infants?: number
}

export interface SearchSlice {
  origin: string
  destination: string
  departure_date: string
}
