'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, LocateFixed, Loader2, Plane, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Suggestion = {
  code: string
  name_ar: string
  name_en: string
  city_ar: string
  city_en: string
  country_ar?: string
  country_en?: string
  type: 'city' | 'airport'
  has_trips: boolean
  score: number
}

const AIRPORT_COORDS: Record<string, [number, number]> = {
  JED: [21.6796, 39.1565],
  RUH: [24.9576, 46.6988],
  DMM: [26.4712, 49.7979],
  MED: [24.5534, 39.7051],
  DXB: [25.2532, 55.3657],
  IST: [41.2753, 28.7519],
  CAI: [30.1219, 31.4056],
  LHR: [51.4700, -0.4543],
  KUL: [2.7456, 101.7099],
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Module-level cache so siblings (origin/destination) share results.
const queryCache = new Map<string, { at: number; results: Suggestion[] }>()
const CACHE_TTL = 5 * 60 * 1000

async function searchAirports(q: string, locale: string): Promise<Suggestion[]> {
  const key = `${locale}:${q.toLowerCase()}`
  const hit = queryCache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.results
  try {
    const res = await fetch(
      `/api/airports/search?q=${encodeURIComponent(q)}&locale=${locale}`
    )
    if (!res.ok) return []
    const data = await res.json()
    const results = (data.results || []) as Suggestion[]
    queryCache.set(key, { at: Date.now(), results })
    return results
  } catch {
    return []
  }
}

type Props = {
  locale: string
  value: string
  onChange: (value: string) => void
  onSelect?: (value: string) => void
  placeholder: string
  className?: string
  showLocateButton?: boolean
  myLocationLabel?: string
}

export function CityAutocomplete({
  locale,
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  showLocateButton,
  myLocationLabel,
}: Props) {
  const isAr = locale === 'ar'
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reqIdRef = useRef(0)

  // Initial load: fetch DB cities (empty query path).
  useEffect(() => {
    let cancelled = false
    searchAirports('', locale).then((r) => {
      if (!cancelled) setResults(r)
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  // Debounced search as user types.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    // Empty input: re-show DB cities.
    if (!trimmed) {
      searchAirports('', locale).then((r) => setResults(r))
      setLoading(false)
      return
    }
    // Skip search if input matches a previously-selected suggestion exactly.
    const matchesSelection = results.some(
      (s) => (isAr ? s.name_ar : s.name_en) === trimmed || s.code === trimmed.toUpperCase()
    )
    if (matchesSelection && trimmed.length > 2) return

    setLoading(true)
    const myReq = ++reqIdRef.current
    debounceRef.current = setTimeout(async () => {
      const r = await searchAirports(trimmed, locale)
      if (myReq !== reqIdRef.current) return // stale
      setResults(r)
      setLoading(false)
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, locale, isAr, results])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        let nearest: Suggestion | null = null
        let minDist = Infinity

        for (const s of results) {
          const coords = AIRPORT_COORDS[s.code.toUpperCase()]
          if (!coords) continue
          const dist = haversineDistance(latitude, longitude, coords[0], coords[1])
          if (dist < minDist) {
            minDist = dist
            nearest = s
          }
        }

        if (nearest) {
          const val = isAr ? nearest.name_ar : nearest.name_en
          onChange(val)
          onSelect?.(val)
        }
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }, [results, isAr, onChange, onSelect])

  const dbResults = results.filter((r) => r.has_trips)
  const otherResults = results.filter((r) => !r.has_trips)

  return (
    <div ref={wrapperRef} className="relative w-full sm:flex-1 group/input">
      <div className="absolute inset-y-0 start-0 flex items-center ps-5 md:ps-6 pointer-events-none">
        <MapPin className="h-4 w-4 text-primary transition-colors md:h-5 md:w-5" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={cn(
          'w-full h-12 md:h-14 ps-12 md:ps-14 bg-slate-50 sm:bg-transparent border-none text-slate-900 text-sm md:text-base font-semibold focus:ring-0 focus:outline-none placeholder:text-slate-400 placeholder:font-medium hover:bg-slate-50 transition-colors',
          showLocateButton ? 'pe-11 md:pe-12' : 'pe-4',
          className
        )}
        autoComplete="off"
      />
      {showLocateButton && (
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          title={myLocationLabel ?? pick(locale, 'موقعي الحالي', 'My location', 'Konumum')}
          className="absolute inset-y-0 end-0 flex items-center pe-3 text-primary transition-colors disabled:opacity-50 md:pe-4"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </button>
      )}
      {open && (results.length > 0 || loading) && (
        <div className="absolute top-full start-0 end-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{pick(locale, 'جاري البحث...', 'Searching...', 'Aranıyor...')}</span>
            </div>
          )}

          {dbResults.length > 0 && (
            <div>
              {value.trim() && (
                <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  {pick(locale, 'متوفر على المنصة', 'Available on platform', 'Platformda mevcut')}
                </div>
              )}
              {dbResults.map((s) => (
                <SuggestionRow
                  key={s.code}
                  s={s}
                  isAr={isAr}
                  onPick={(val) => {
                    onChange(val)
                    onSelect?.(val)
                    setOpen(false)
                  }}
                />
              ))}
            </div>
          )}

          {otherResults.length > 0 && (
            <div className={dbResults.length > 0 ? 'border-t border-slate-100' : ''}>
              {dbResults.length > 0 && (
                <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>{pick(locale, 'مطارات أخرى', 'Other airports', 'Diğer havalimanları')}</span>
                </div>
              )}
              {otherResults.map((s) => (
                <SuggestionRow
                  key={s.code}
                  s={s}
                  isAr={isAr}
                  onPick={(val) => {
                    onChange(val)
                    onSelect?.(val)
                    setOpen(false)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SuggestionRow({
  s,
  isAr,
  onPick,
}: {
  s: Suggestion
  isAr: boolean
  onPick: (val: string) => void
}) {
  const primary = isAr ? s.name_ar : s.name_en
  const secondary = isAr ? s.name_en : s.name_ar
  const country = isAr ? s.country_ar : s.country_en

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onPick(primary)}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-start hover:bg-slate-50 transition-colors"
    >
      {s.type === 'airport' ? (
        <Plane className="h-4 w-4 shrink-0 text-slate-400" />
      ) : (
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 truncate">{primary}</span>
          <span className="text-xs text-slate-400 shrink-0">{s.code}</span>
        </div>
        {country && (
          <div className="text-[11px] text-slate-400 truncate">{country}</div>
        )}
      </div>
      {secondary !== primary && (
        <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">{secondary}</span>
      )}
    </button>
  )
}
