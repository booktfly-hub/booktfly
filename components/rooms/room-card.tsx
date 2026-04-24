import { pick } from '@/lib/i18n-helpers'
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
          'relative h-full flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white transition-[border-color,box-shadow,transform] duration-200',
          'hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/70',
          className
        )}
      >
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100">
          {firstImage ? (
            <Image src={firstImage} alt={name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BedDouble className="h-12 w-12 text-slate-300" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/12 via-slate-950/4 to-transparent" />
          <div className="absolute top-3 start-3 flex items-center gap-2">
            {ribbon && <RibbonBadge kind={ribbon} />}
            <RoomStatusBadge status={room.status} />
            {room.is_last_minute && <LastMinuteBadge discount={room.discount_percentage} />}
          </div>
          <div className="absolute top-3 end-3">
            <span className="inline-flex items-center rounded-full border border-white/80 bg-white/92 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-700 shadow-sm backdrop-blur-sm">
              {categoryText}
            </span>
          </div>
          <div className="absolute bottom-3 end-3 z-10">
            <FavoriteButton itemType="room" itemId={room.id} />
          </div>
        </div>

        <div className="flex h-full flex-col p-5 md:p-6">
          <div className="mb-4 space-y-2">
            <h3 className="line-clamp-2 text-[1.35rem] font-black leading-tight tracking-[-0.02em] text-slate-900">
              {name}
            </h3>
            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="text-sm font-semibold">{city}</span>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-semibold">{room.max_capacity} {t('rooms.guests')}</span>
            </div>
            <RoomAvailabilityBadge
              instantBook={room.instant_book}
              availableFrom={room.available_from}
              availableTo={room.available_to}
            />
          </div>

          {providerName && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-slate-600">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <Building2 className="h-4 w-4 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {pick(locale, 'المزوّد', 'Provider', 'Tedarikçi')}
                </p>
                <p className="truncate text-sm font-semibold text-slate-700">{providerName}</p>
              </div>
            </div>
          )}

          {room.amenities && room.amenities.length > 0 && (
            <div className="mb-5 border-t border-dashed border-slate-200 pt-4">
              <RoomAmenities amenities={room.amenities.slice(0, 6)} compact />
            </div>
          )}

          <div className="mt-auto">
            <div className="flex items-end justify-between border-t border-slate-200 pt-5">
              <div className="flex flex-col">
                <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{t('rooms.per_night')}</span>
                {hasDiscount && (
                  <span className="mb-1 text-sm font-bold leading-none text-slate-400 line-through">{originalFormatted}</span>
                )}
                <span className={cn('text-[2rem] font-black leading-none tracking-[-0.03em]', hasDiscount ? 'text-accent' : 'text-slate-900')}>
                  {formattedPrice}
                </span>
                <BnplBadge price={room.price_per_night} currency={room.currency} className="mt-2" />
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition-[background-color,border-color,color,transform] duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                <Arrow className="h-4 w-4 rtl:rotate-180" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
