'use client'

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, MapPin } from 'lucide-react'

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

type LatLng = { lat: number; lng: number }

type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type?: string
}

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

type LocationPickerProps = {
  latitude?: number | null
  longitude?: number | null
  onChange: (lat: number, lng: number) => void
  height?: number
  defaultCenter?: [number, number]
  defaultZoom?: number
  isAr?: boolean
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  height = 320,
  defaultCenter = [24.7136, 46.6753],
  defaultZoom = 6,
  isAr = true,
}: LocationPickerProps) {
  const [marker, setMarker] = useState<LatLng | null>(
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null
  )
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setMarker({ lat: latitude, lng: longitude })
    }
  }, [latitude, longitude])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function handlePick(p: LatLng) {
    setMarker(p)
    onChange(p.lat, p.lng)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim() || value.trim().length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(value)}`,
          { headers: { 'Accept-Language': isAr ? 'ar' : 'en' } }
        )
        const data = await res.json() as NominatimResult[]
        setSuggestions(data)
        setShowDropdown(true)
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  function selectSuggestion(s: NominatimResult) {
    const lat = Number(s.lat)
    const lng = Number(s.lon)
    handlePick({ lat, lng })
    setSearch(s.display_name)
    setShowDropdown(false)
  }

  const center: [number, number] = marker ? [marker.lat, marker.lng] : defaultCenter
  const zoom = marker ? 15 : defaultZoom

  return (
    <div className="space-y-2">
      <div className="relative" ref={wrapperRef}>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
            placeholder={isAr ? 'ابحث عن عنوان أو اسم المكان…' : 'Search address or place name…'}
            className="w-full rounded-lg border border-input bg-surface ps-9 pe-10 py-2 text-sm outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
          />
          {searching && (
            <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute inset-x-0 top-full mt-1 z-[1000] rounded-lg border bg-white shadow-lg max-h-64 overflow-y-auto">
            {suggestions.map(s => (
              <button
                key={s.place_id}
                type="button"
                onClick={() => selectSuggestion(s)}
                className="flex items-start gap-2 w-full px-3 py-2.5 text-start text-sm hover:bg-muted/40 border-b last:border-b-0 transition-colors"
              >
                <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span className="line-clamp-2">{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
        {showDropdown && !searching && search.trim().length >= 3 && suggestions.length === 0 && (
          <div className="absolute inset-x-0 top-full mt-1 z-[1000] rounded-lg border bg-white shadow-lg px-3 py-2 text-sm text-muted-foreground">
            {isAr ? 'لا توجد نتائج' : 'No results'}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {isAr ? 'ابحث أعلاه أو اضغط على الخريطة لتحديد الموقع بدقة' : 'Search above or click the map to pin the exact location'}
      </p>

      <div className="rounded-lg overflow-hidden border" style={{ height }}>
        <MapContainer
          key={marker ? `${marker.lat}-${marker.lng}` : 'empty'}
          center={center}
          zoom={zoom}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          {marker && <Marker position={[marker.lat, marker.lng]} icon={icon} />}
        </MapContainer>
      </div>

      {marker && (
        <p className="text-xs text-muted-foreground font-mono" dir="ltr">
          📍 {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
        </p>
      )}
    </div>
  )
}
