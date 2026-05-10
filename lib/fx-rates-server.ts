import 'server-only'

/**
 * Daily FX rates from open.er-api.com (free, no API key, no rate limit).
 * Cached in-process for 24h. SAR/AED come back at their pegged values
 * (3.75 and 3.6725 to USD respectively), so conversions across the
 * GCC stay stable even when the upstream cache is briefly unreachable.
 */

const SOURCE = 'https://open.er-api.com/v6/latest/USD'
const TTL = 24 * 60 * 60 * 1000

// Hard-coded peg fallbacks used if the upstream call fails.
const FALLBACK_USD_RATES: Record<string, number> = {
  USD: 1,
  SAR: 3.75,
  AED: 3.6725,
  EUR: 0.92,
  GBP: 0.79,
  EGP: 49,
}

let cache: { at: number; rates: Record<string, number> } | null = null

async function refresh(): Promise<Record<string, number>> {
  try {
    const res = await fetch(SOURCE, { next: { revalidate: 86_400 } })
    if (!res.ok) throw new Error(`fx upstream ${res.status}`)
    const json = (await res.json()) as { result?: string; rates?: Record<string, number> }
    if (json.result !== 'success' || !json.rates) throw new Error('fx bad payload')
    return json.rates
  } catch (err) {
    console.warn('[fx] using fallback pegs:', err)
    return FALLBACK_USD_RATES
  }
}

/** USD-base rate map. Cached for 24 hours. */
export async function getUsdRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.at < TTL) return cache.rates
  const rates = await refresh()
  cache = { at: Date.now(), rates }
  return rates
}

/**
 * Convert an amount between two currencies. Returns the original amount
 * (untouched) when the codes are equal or any rate is missing — the caller
 * should still display the price rather than a confusing zero.
 */
export async function convertAmount(amount: number, from: string, to: string): Promise<number> {
  const a = (from || '').toUpperCase()
  const b = (to || '').toUpperCase()
  if (!a || !b || a === b) return amount
  if (!Number.isFinite(amount)) return amount
  const rates = await getUsdRates()
  const fromRate = rates[a]
  const toRate = rates[b]
  if (!fromRate || !toRate) return amount
  // amount in `from` → USD → `to`
  const usd = amount / fromRate
  return usd * toRate
}

/** Synchronous variant when the caller already has rates in hand. */
export function convertWithRates(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  const a = (from || '').toUpperCase()
  const b = (to || '').toUpperCase()
  if (!a || !b || a === b) return amount
  if (!Number.isFinite(amount)) return amount
  const fromRate = rates[a]
  const toRate = rates[b]
  if (!fromRate || !toRate) return amount
  return (amount / fromRate) * toRate
}
