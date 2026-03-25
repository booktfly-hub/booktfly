'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { MapPin, LocateFixed, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type City = { ar: string; en: string; code: string }

let cachedCities: City[] | null = null

async function fetchCities(): Promise<City[]> {
  if (cachedCities) return cachedCities
  try {
    const res = await fetch('/api/trips/cities')
    const data = await res.json()
    cachedCities = data.cities || []
    return cachedCities!
  } catch {
    return []
  }
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

type Props = {
  value: string
  onChange: (value: string) => void
  onSelect?: (value: string) => void
  placeholder: string
  className?: string
  showLocateButton?: boolean
}

export function CityAutocomplete({ value, onChange, onSelect, placeholder, className, showLocateButton }: Props) {
  const locale = useLocale()
  const t = useTranslations('common')
  const isAr = locale === 'ar'
  const [cities, setCities] = useState<City[]>([])
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState<City[]>([])
  const [locating, setLocating] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCities().then(setCities)
  }, [])

  useEffect(() => {
    if (!value.trim()) {
      setFiltered(cities)
      return
    }
    const q = value.toLowerCase()
    setFiltered(
      cities.filter(
        (c) =>
          c.ar.includes(q) ||
          c.en.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
      )
    )
  }, [value, cities])

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
        let nearest: City | null = null
        let minDist = Infinity

        for (const city of cities) {
          const coords = AIRPORT_COORDS[city.code.toUpperCase()]
          if (!coords) continue
          const dist = haversineDistance(latitude, longitude, coords[0], coords[1])
          if (dist < minDist) {
            minDist = dist
            nearest = city
          }
        }

        if (nearest) {
          const val = isAr ? nearest.ar : nearest.en
          onChange(val)
          onSelect?.(val)
        }
        setLocating(false)
      },
      () => {
        setLocating(false)
      },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }, [cities, isAr, onChange, onSelect])

  return (
    <div ref={wrapperRef} className="relative w-full sm:flex-1 group/input">
      <div className="absolute inset-y-0 start-0 pl-5 md:pl-6 flex items-center pointer-events-none">
        <MapPin className="h-4 w-4 md:h-5 md:w-5 text-slate-400 group-focus-within/input:text-primary transition-colors" />
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
          title={t('my_location')}
          className="absolute inset-y-0 end-0 pe-3 md:pe-4 flex items-center text-slate-400 hover:text-primary transition-colors disabled:opacity-50"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </button>
      )}
      {open && filtered.length > 0 && (
        <div className="absolute top-full start-0 end-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-48 overflow-y-auto">
          {filtered.map((city) => (
            <button
              key={city.code}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const val = isAr ? city.ar : city.en
                onChange(val)
                onSelect?.(val)
                setOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-start hover:bg-slate-50 transition-colors"
            >
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-900">
                  {isAr ? city.ar : city.en}
                </span>
                <span className="text-xs text-slate-400 ms-2">{city.code}</span>
              </div>
              {!isAr && (
                <span className="text-xs text-slate-400 shrink-0">{city.ar}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
