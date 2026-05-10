'use client'

import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ExternalLink, Hotel, Star } from 'lucide-react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/i18n-helpers'
import { getCityCoords } from '@/lib/city-coordinates'
import type { HotelOffer } from '@/lib/booking-hotels'

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface HotelMapViewProps {
  offers: HotelOffer[]
  height?: number
  className?: string
}

type CityCluster = {
  iata: string
  city: string
  city_ar: string
  position: [number, number]
  offers: HotelOffer[]
}

export function HotelMapView({ offers, height = 460, className }: HotelMapViewProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const clusters = useMemo<CityCluster[]>(() => {
    const map = new Map<string, CityCluster>()
    for (const o of offers) {
      const coords = getCityCoords(o.city_iata)
      if (!coords) continue
      const key = o.city_iata.toUpperCase()
      const existing = map.get(key)
      if (existing) {
        existing.offers.push(o)
      } else {
        map.set(key, {
          iata: key,
          city: o.city,
          city_ar: o.city_ar,
          position: coords,
          offers: [o],
        })
      }
    }
    return Array.from(map.values())
  }, [offers])

  // Pick map center: cluster of all positions (just average), fall back to a
  // sensible MENA region center if there's nothing to plot.
  const center = useMemo<[number, number]>(() => {
    if (clusters.length === 0) return [25, 45]
    const sum = clusters.reduce(
      (acc, c) => [acc[0] + c.position[0], acc[1] + c.position[1]],
      [0, 0],
    )
    return [sum[0] / clusters.length, sum[1] / clusters.length]
  }, [clusters])

  if (clusters.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500',
          className,
        )}
        style={{ height }}
      >
        <Hotel className="h-8 w-8 mb-2 text-slate-400" />
        <p className="text-sm font-semibold">
          {pick(
            locale,
            'لا توجد إحداثيات معروفة لهذه المدن بعد',
            'No coordinates known for these cities yet',
            'Bu şehirler için koordinat henüz yok',
          )}
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn('rounded-2xl overflow-hidden border border-slate-200 shadow-sm', className)}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={clusters.length === 1 ? 11 : 5}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {clusters.map((c) => {
          const cityLabel = isAr ? c.city_ar : c.city
          const cheapest = [...c.offers].sort((a, b) => a.price_from - b.price_from)[0]
          return (
            <Marker key={c.iata} position={c.position} icon={defaultIcon}>
              <Popup>
                <div className="min-w-56">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <div className="font-bold text-slate-900">{cityLabel}</div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400">{c.iata}</div>
                  </div>
                  <div className="space-y-1.5">
                    {c.offers.map((o) => {
                      const tierLabel = isAr ? o.tier_label_ar : o.tier_label_en
                      return (
                        <a
                          key={o.id}
                          href={o.affiliate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-white px-2 py-1.5 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                              {Array.from({ length: o.star_rating }).map((_, i) => (
                                <Star key={i} className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                              ))}
                            </span>
                            <span className="text-xs font-bold text-slate-700">{tierLabel}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">
                            {o.price_from} {o.price_currency}
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        </a>
                      )
                    })}
                  </div>
                  {cheapest && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      {pick(
                        locale,
                        `يبدأ من ${cheapest.price_from} ${cheapest.price_currency}`,
                        `From ${cheapest.price_from} ${cheapest.price_currency}`,
                        `${cheapest.price_from} ${cheapest.price_currency} itibaren`,
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
