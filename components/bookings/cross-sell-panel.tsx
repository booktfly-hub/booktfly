'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, ArrowLeft, BedDouble, Car as CarIcon, Plane, Package as PackageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CrossSellKind = 'room' | 'car' | 'package' | 'trip'

interface CrossSellCard {
  kind: CrossSellKind
  title: string
  description: string
  href: string
}

interface CrossSellPanelProps {
  /** Bookings already made — decides which to suggest */
  city?: string
  destinationCode?: string
  className?: string
  /** if user just booked a flight, suggest room + car; if room, suggest flight + car; etc. */
  currentKind: CrossSellKind
}

export function CrossSellPanel({ city, destinationCode, className, currentKind }: CrossSellPanelProps) {
  const t = useTranslations('cross_sell')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const q = new URLSearchParams()
  if (city) q.set('city', city)
  if (destinationCode) q.set('destination', destinationCode)
  const qs = q.toString() ? `?${q.toString()}` : ''

  const ALL: Record<CrossSellKind, CrossSellCard> = {
    trip: {
      kind: 'trip',
      title: t('trip_title'),
      description: t('trip_desc'),
      href: `/${locale}/trips${qs}`,
    },
    room: {
      kind: 'room',
      title: t('room_title'),
      description: t('room_desc'),
      href: `/${locale}/rooms${qs}`,
    },
    car: {
      kind: 'car',
      title: t('car_title'),
      description: t('car_desc'),
      href: `/${locale}/cars${qs}`,
    },
    package: {
      kind: 'package',
      title: t('package_title'),
      description: t('package_desc'),
      href: `/${locale}/packages${qs}`,
    },
  }

  const order: Record<CrossSellKind, CrossSellKind[]> = {
    trip: ['room', 'car', 'package'],
    room: ['trip', 'car', 'package'],
    car: ['trip', 'room', 'package'],
    package: ['trip', 'room', 'car'],
  }

  const suggestions = order[currentKind].map((k) => ALL[k])

  const iconFor: Record<CrossSellKind, React.ComponentType<{ className?: string }>> = {
    trip: Plane,
    room: BedDouble,
    car: CarIcon,
    package: PackageIcon,
  }

  return (
    <section className={cn('space-y-3', className)}>
      <div>
        <h3 className="text-sm font-bold">{t('title')}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{t('subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {suggestions.map((card) => {
          const Icon = iconFor[card.kind]
          return (
            <Link
              key={card.kind}
              href={card.href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10">
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{card.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{card.description}</p>
              </div>
              <Arrow className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
