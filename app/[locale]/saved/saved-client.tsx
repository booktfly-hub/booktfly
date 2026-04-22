'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plane, Building, CarFront, Package, HeartOff } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { TripCard } from '@/components/trips/trip-card'
import { RoomCard } from '@/components/rooms/room-card'
import { CarCard } from '@/components/cars/car-card'
import { PackageCard } from '@/components/packages/package-card'
import { cn } from '@/lib/utils'
import type { Trip, Room, Car, Package as PackageType } from '@/types'

type Tab = 'trip' | 'room' | 'car' | 'package'

interface SavedData {
  trips: Trip[]
  rooms: Room[]
  cars: Car[]
  packages: PackageType[]
}

export function SavedPageClient() {
  const t = useTranslations('saved')
  const [tab, setTab] = useState<Tab>('trip')
  const [data, setData] = useState<SavedData>({ trips: [], rooms: [], cars: [], packages: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/saved-items?include_data=true&item_type=${tab}`)
        if (res.ok) {
          const json = await res.json()
          setData(prev => ({
            ...prev,
            trips: tab === 'trip' ? (json.trips || []) : prev.trips,
            rooms: tab === 'room' ? (json.rooms || []) : prev.rooms,
            cars: tab === 'car' ? (json.cars || []) : prev.cars,
            packages: tab === 'package' ? (json.packages || []) : prev.packages,
          }))
        }
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [tab])

  const tabs: { key: Tab; label: string; icon: typeof Plane }[] = [
    { key: 'trip', label: t('saved_trips'), icon: Plane },
    { key: 'room', label: t('saved_rooms'), icon: Building },
    { key: 'car', label: t('saved_cars'), icon: CarFront },
    { key: 'package', label: t('saved_packages'), icon: Package },
  ]

  const currentItems =
    tab === 'trip' ? data.trips :
    tab === 'room' ? data.rooms :
    tab === 'car' ? data.cars :
    data.packages

  return (
    <div className="container max-w-5xl pt-6 pb-8 md:pt-8 lg:pt-10 px-4 mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <div className="mb-8 -mx-1 overflow-x-auto border-b border-border pb-3 px-1 scrollbar-hide">
        <div className="flex min-w-max gap-2">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm',
              tab === tabItem.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <tabItem.icon className="h-4 w-4" />
            {tabItem.label}
          </button>
        ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-[2rem] bg-muted" />
          ))}
        </div>
      ) : currentItems.length === 0 ? (
        <EmptyState icon={HeartOff} message={t('no_saved')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tab === 'trip' && data.trips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
          {tab === 'room' && data.rooms.map(room => (
            <RoomCard key={room.id} room={room} />
          ))}
          {tab === 'car' && data.cars.map(car => (
            <CarCard key={car.id} car={car} />
          ))}
          {tab === 'package' && data.packages.map(pkg => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </div>
  )
}
