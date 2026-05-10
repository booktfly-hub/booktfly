'use client'

import { useEffect, useRef } from 'react'

type FilterValues = Record<string, string | number | undefined | null>

/**
 * Sync a filter state object to the URL query string without triggering a
 * Next.js RSC re-fetch.
 *
 * - Debounced (default 300ms) so rapid typing/sliding doesn't spam history.
 * - Uses `history.replaceState` so the URL stays shareable but the server
 *   component is not re-invoked on every keystroke.
 * - Drops empty / 0 / "false" values so the URL stays tidy.
 */
export function useFilterUrlSync(
  values: FilterValues,
  options: { debounceMs?: number } = {},
) {
  const { debounceMs = 300 } = options
  const lastQueryRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams()
    Object.entries(values).forEach(([key, raw]) => {
      const v = raw === undefined || raw === null ? '' : String(raw)
      if (!v || v === '0' || v === 'false') return
      params.set(key, v)
    })
    const next = params.toString()
    if (lastQueryRef.current === null) {
      lastQueryRef.current = window.location.search.replace(/^\?/, '')
    }
    if (next === lastQueryRef.current) return

    const handle = window.setTimeout(() => {
      lastQueryRef.current = next
      const url = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`
      window.history.replaceState(window.history.state, '', url)
    }, debounceMs)

    return () => window.clearTimeout(handle)
  }, [values, debounceMs])
}
