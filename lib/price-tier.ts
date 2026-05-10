export type PriceTier = 'good_deal' | 'typical' | 'high'

export type PriceTierEntry = { id: string; price: number }

/**
 * Bucket items by how their price compares to the set's median.
 *
 * - `good_deal`: bottom 25% of prices (≤ Q1)
 * - `high`: top 25% of prices (≥ Q3)
 * - `typical`: everything else
 *
 * Returns an empty map if there aren't enough items (< 4) for the buckets
 * to be meaningful.
 */
export function computePriceTiers<T extends PriceTierEntry>(items: T[]): Map<string, PriceTier> {
  const out = new Map<string, PriceTier>()
  const valid = items.filter((i) => Number.isFinite(i.price) && i.price > 0)
  if (valid.length < 4) return out

  const sorted = [...valid].map((i) => i.price).sort((a, b) => a - b)
  const q = (p: number) => {
    const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p)))
    return sorted[idx]
  }
  const q1 = q(0.25)
  const q3 = q(0.75)

  // Avoid degenerate cases where all prices collapse to one number.
  if (q1 >= q3) return out

  for (const item of valid) {
    if (item.price <= q1) out.set(item.id, 'good_deal')
    else if (item.price >= q3) out.set(item.id, 'high')
    else out.set(item.id, 'typical')
  }
  return out
}

/** Median of a set of items — handy for "vs. average" tooltips. */
export function priceMedian<T extends PriceTierEntry>(items: T[]): number | null {
  const valid = items.filter((i) => Number.isFinite(i.price) && i.price > 0)
  if (valid.length === 0) return null
  const sorted = [...valid].map((i) => i.price).sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}
