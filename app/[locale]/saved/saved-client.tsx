'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plane, Building, CarFront, Heart, HeartOff } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils'
import type { SavedItem } from '@/types'

interface SavedPageClientProps {
  locale: string
}

type Tab = 'trip' | 'room' | 'car'

export function SavedPageClient({ locale }: SavedPageClientProps) {
  const t = useTranslations('saved')
  const [tab, setTab] = useState<Tab>('trip')
  const [items, setItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/saved-items?item_type=${tab}`)
        if (res.ok) {
          const data = await res.json()
          setItems(data.items)
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
  }, [tab])

  const tabs: { key: Tab; label: string; icon: typeof Plane }[] = [
    { key: 'trip', label: t('saved_trips'), icon: Plane },
    { key: 'room', label: t('saved_rooms'), icon: Building },
    { key: 'car', label: t('saved_cars'), icon: CarFront },
  ]

  async function removeSaved(itemId: string) {
    await fetch(`/api/saved-items?item_type=${tab}&item_id=${itemId}`, { method: 'DELETE' })
    setItems(items.filter((i) => i.item_id !== itemId))
    localStorage.removeItem(`saved_${tab}_${itemId}`)
  }

  return (
    <div className="container max-w-4xl py-8 px-4 mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-3">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
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

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={HeartOff}
          message={t('no_saved')}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {tab === 'trip' ? 'Trip' : tab === 'room' ? 'Room' : 'Car'}: {item.item_id.slice(0, 8)}...
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
              </div>
              <button
                onClick={() => removeSaved(item.item_id)}
                className="text-red-500 hover:text-red-600 p-1.5"
                aria-label={t('unsave')}
              >
                <Heart className="h-5 w-5 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
