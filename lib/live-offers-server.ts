import 'server-only'

import { searchDuffelFlights } from './duffel-server'
import {
  fetchLiveFlights,
  fetchLiveFlightsByName,
  resolveIata,
  type LiveOffer,
} from './travelpayouts-server'

export async function fetchPartnerLiveOffers(opts: {
  origin?: string
  destination?: string
  departure_date?: string
  return_date?: string
  trip_type?: string
  adults?: number
  children?: number
  infants?: number
  cabin_class?: 'Y' | 'C'
}): Promise<LiveOffer[]> {
  const origin = opts.origin?.trim() || ''
  const destination = opts.destination?.trim() || ''
  const adults = Math.max(1, Math.min(9, opts.adults ?? 1))
  const children = Math.max(0, Math.min(9, opts.children ?? 0))
  const infants = Math.max(0, Math.min(9, opts.infants ?? 0))
  const cabin: 'Y' | 'C' = opts.cabin_class || 'Y'

  if (origin && destination) {
    const [originIata, destinationIata] = await Promise.all([
      resolveIata(origin),
      resolveIata(destination),
    ])

    const [tpOffers, duffelOffers] = await Promise.all([
      fetchLiveFlightsByName({
        origin,
        destination,
        departure_date: opts.departure_date || undefined,
        return_date:
          opts.trip_type !== 'one_way' && opts.return_date
            ? opts.return_date
            : undefined,
        limit: 10,
        adults,
        children,
        infants,
        cabin_class: cabin,
      }),
      originIata && destinationIata
        ? searchDuffelFlights({
            origin: originIata,
            destination: destinationIata,
            departure_date: opts.departure_date || undefined,
            limit: 8,
          })
        : Promise.resolve([]),
    ])

    return [...tpOffers, ...duffelOffers].sort(
      (a, b) => a.price_amount - b.price_amount
    )
  }

  // Avoid showing unrelated fallback routes while the user has only filled one side
  // of the search. That looked like "the same results every time" in the UI.
  if (origin || destination) {
    return []
  }

  return (
    await Promise.all([
      fetchLiveFlights({ origin: 'RUH', destination: 'DXB', limit: 2 }),
      fetchLiveFlights({ origin: 'JED', destination: 'CAI', limit: 2 }),
      fetchLiveFlights({ origin: 'JED', destination: 'IST', limit: 2 }),
      fetchLiveFlights({ origin: 'RUH', destination: 'IST', limit: 2 }),
      fetchLiveFlights({ origin: 'RUH', destination: 'DOH', limit: 2 }),
      fetchLiveFlights({ origin: 'JED', destination: 'KWI', limit: 2 }),
      fetchLiveFlights({ origin: 'RUH', destination: 'AMM', limit: 2 }),
      fetchLiveFlights({ origin: 'JED', destination: 'MCT', limit: 2 }),
    ])
  ).flat()
}
