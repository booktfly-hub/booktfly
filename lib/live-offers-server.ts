import 'server-only'

import { searchDuffelFlights } from './duffel-server'
import {
  fetchLiveFlights,
  fetchLiveFlightsByName,
  resolveIata,
  type LiveOffer,
} from './travelpayouts-server'
import { getUsdRates, convertWithRates } from './fx-rates-server'

async function applyDisplayCurrency(offers: LiveOffer[], target?: string): Promise<LiveOffer[]> {
  const to = (target || '').toUpperCase()
  if (!to) return offers
  if (offers.every((o) => (o.price_currency || '').toUpperCase() === to)) return offers
  const rates = await getUsdRates()
  return offers.map((o) => {
    const from = (o.price_currency || 'USD').toUpperCase()
    if (from === to) return o
    const converted = convertWithRates(o.price_amount, from, to, rates)
    return { ...o, price_amount: Math.round(converted), price_currency: to }
  })
}

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
  currency?: string
}): Promise<LiveOffer[]> {
  const origin = opts.origin?.trim() || ''
  const destination = opts.destination?.trim() || ''
  const adults = Math.max(1, Math.min(9, opts.adults ?? 1))
  const children = Math.max(0, Math.min(9, opts.children ?? 0))
  const infants = Math.max(0, Math.min(9, opts.infants ?? 0))
  const cabin: 'Y' | 'C' = opts.cabin_class || 'Y'
  const currency = opts.currency?.toUpperCase() || ''
  const tpCurrency = currency || 'USD' // Travelpayouts honours arbitrary codes

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
        currency: tpCurrency.toLowerCase(),
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

    const merged = [...tpOffers, ...duffelOffers].sort(
      (a, b) => a.price_amount - b.price_amount,
    )
    return applyDisplayCurrency(merged, currency)
  }

  // Avoid showing unrelated fallback routes while the user has only filled one side
  // of the search. That looked like "the same results every time" in the UI.
  if (origin || destination) {
    return []
  }

  const fallback = (
    await Promise.all([
      fetchLiveFlights({ origin: 'RUH', destination: 'DXB', limit: 2, currency: tpCurrency.toLowerCase() }),
      fetchLiveFlights({ origin: 'JED', destination: 'CAI', limit: 2, currency: tpCurrency.toLowerCase() }),
      fetchLiveFlights({ origin: 'JED', destination: 'IST', limit: 2, currency: tpCurrency.toLowerCase() }),
      fetchLiveFlights({ origin: 'RUH', destination: 'IST', limit: 2, currency: tpCurrency.toLowerCase() }),
      fetchLiveFlights({ origin: 'RUH', destination: 'DOH', limit: 2, currency: tpCurrency.toLowerCase() }),
      fetchLiveFlights({ origin: 'JED', destination: 'KWI', limit: 2, currency: tpCurrency.toLowerCase() }),
      fetchLiveFlights({ origin: 'RUH', destination: 'AMM', limit: 2, currency: tpCurrency.toLowerCase() }),
      fetchLiveFlights({ origin: 'JED', destination: 'MCT', limit: 2, currency: tpCurrency.toLowerCase() }),
    ])
  ).flat()
  return applyDisplayCurrency(fallback, currency)
}
