import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { BedDouble, MapPin, Users, ArrowRight, ArrowLeft, Building2 } from 'lucide-react'
import { cn, formatPrice, formatPriceEN } from '@/lib/utils'
import { ROOM_CATEGORIES } from '@/lib/constants'
import { RoomStatusBadge } from './room-status-badge'
import { RoomAmenities } from './room-amenities'
import { RoomAvailabilityBadge } from './room-availability-badge'
import { LastMinuteBadge } from '@/components/ui/last-minute-badge'
import { FavoriteButton } from '@/components/shared/favorite-button'
import { BnplBadge } from '@/components/ui/bnpl-badge'
import { RibbonBadge, type RibbonKind } from '@/components/ui/ribbon-badge'
import type { Room } from '@/types'

type RoomCardProps = {
  room: Room
  className?: string
  ribbon?: RibbonKind
}

export function RoomCard({ room, className, ribbon }: RoomCardProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  const name = isAr ? room.name_ar : (room.name_en || room.name_ar)
  const city = isAr ? room.city_ar : (room.city_en || room.city_ar)
  const categoryLabel = ROOM_CATEGORIES[room.category as keyof typeof ROOM_CATEGORIES]
  const categoryText = categoryLabel ? (isAr ? categoryLabel.ar : categoryLabel.en) : room.category
  const formattedPrice = isAr ? formatPrice(room.price_per_night, room.currency) : formatPriceEN(room.price_per_night, room.currency)
  const hasDiscount = room.discount_percentage > 0 && room.original_price
  const originalFormatted = hasDiscount
    ? (isAr ? formatPrice(room.original_price!, room.currency) : formatPriceEN(room.original_price!, room.currency))
    : null

  const Arrow = isAr ? ArrowLeft : ArrowRight

  const providerName = room.provider
    ? isAr
      ? room.provider.company_name_ar
      : (room.provider.company_name_en || room.provider.company_name_ar)
    : null

  const firstImage = room.images?.[0]

  return (
    <Link href={`/${locale}/rooms/${room.id}`} className="block group h-full focus:outline-none">
      <div
        className={cn(
          'relative h-full flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-[border-color,box-shadow,transform] duration-200',
          'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
          className
        )}
      >
        {/* Image */}
        <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden">
          {firstImage ? (
            <Image src={firstImage} alt={name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BedDouble className="h-12 w-12 text-slate-300" />
            </div>
          )}
          <div className="absolute top-3 start-3 flex items-center gap-2">
            {ribbon && <RibbonBadge kind={ribbon} />}
            <RoomStatusBadge status={room.status} />
            {room.is_last_minute && <LastMinuteBadge discount={room.discount_percentage} />}
          </div>
          <div className="absolute top-3 end-3">
            <span className="inline-flex items-center rounded-md border border-border bg-surface/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-foreground shadow-sm backdrop-blur-sm">
              {categoryText}
            </span>
          </div>
          <div className="absolute bottom-3 end-3 z-10">
            <FavoriteButton itemType="room" itemId={room.id} />
          </div>
        </div>

        <div className="flex flex-col h-full p-6">
          {/* Name & City */}
          <div className="mb-4">
            <h3 className="truncate text-lg font-black leading-tight text-foreground">{name}</h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">{city}</span>
            </div>
          </div>

          {/* Meta Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold">{room.max_capacity} {t('rooms.guests')}</span>
            </div>
            <RoomAvailabilityBadge
              instantBook={room.instant_book}
              availableFrom={room.available_from}
              availableTo={room.available_to}
            />
            {providerName && (
              <div className="ml-auto flex min-w-0 max-w-[40%] items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-muted-foreground rtl:ml-0 rtl:mr-auto">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-xs font-semibold truncate">{providerName}</span>
              </div>
            )}
          </div>

          {/* Amenities (compact) */}
          {room.amenities && room.amenities.length > 0 && (
            <div className="mb-4">
              <RoomAmenities amenities={room.amenities.slice(0, 6)} compact />
            </div>
          )}

          <div className="mt-auto">
            {/* Footer Price & CTA */}
            <div className="flex items-end justify-between border-t border-border pt-5">
              <div className="flex flex-col">
                <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('rooms.per_night')}</span>
                {hasDiscount && (
                  <span className="mb-0.5 text-sm font-bold leading-none text-muted-foreground line-through">{originalFormatted}</span>
                )}
                <span className={cn('text-2xl font-black leading-none', hasDiscount ? 'text-accent' : 'text-foreground')}>{formattedPrice}</span>
                <BnplBadge price={room.price_per_night} currency={room.currency} className="mt-1.5" />
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground shadow-sm transition-[background-color,color,transform] duration-200 group-hover:bg-primary group-hover:text-primary-foreground ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                <Arrow className="h-4 w-4 rtl:rotate-180" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
