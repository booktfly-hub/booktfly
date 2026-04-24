'use client'

import { pick } from '@/lib/i18n-helpers'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { TripCard } from '@/components/trips/trip-card'
import { RoomCard } from '@/components/rooms/room-card'
import { CarCard } from '@/components/cars/car-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CategoryHero } from '@/components/shared/category-hero'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { ShareButton } from '@/components/shared/share-button'
import { cn } from '@/lib/utils'
import type { Trip, Room, Car } from '@/types'
import { Loader2, Flame, Users, ArrowLeftRight, CheckCircle2, Zap } from 'lucide-react'

const PAGE_SIZE = 12
const PREFS_KEY = 'bkf_prefs'

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return JSON.parse(raw) as { tripType?: string; passengers?: number }
  } catch {}
  return {}
}

function savePrefs(patch: { tripType?: string; passengers?: number }) {
  try {
    const current = loadPrefs()
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...patch }))
  } catch {}
}

interface LastMinuteContentProps {
  initialTrips: Trip[]
  initialHasMore: boolean
  initialRooms: any[]
  initialRoomsHasMore: boolean
  initialCars: any[]
  initialCarsHasMore: boolean
}

function getInitialPrefs() {
  const fallback = { passengers: 1, tripType: 'round_trip' as const, prefsConfirmed: false }

  if (typeof window === 'undefined') return fallback

  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return fallback

    const prefs = JSON.parse(raw) as { tripType?: string; passengers?: number }
    const tripType = prefs.tripType === 'one_way' || prefs.tripType === 'round_trip' ? prefs.tripType : fallback.tripType
    const passengers = typeof prefs.passengers === 'number' && prefs.passengers >= 1 ? prefs.passengers : fallback.passengers

    return {
      passengers,
      tripType,
      prefsConfirmed: Boolean(prefs.passengers || prefs.tripType),
    }
  } catch {
    return fallback
  }
}

export function LastMinuteContent({
  initialTrips,
  initialHasMore,
  initialRooms,
  initialRoomsHasMore,
  initialCars,
  initialCarsHasMore,
}: LastMinuteContentProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [activeTab, setActiveTab] = useState<'trips' | 'rooms' | 'cars'>('trips')
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [rooms, setRooms] = useState<any[]>(initialRooms)
  const [roomsHasMore, setRoomsHasMore] = useState(initialRoomsHasMore)
  const [cars, setCars] = useState<any[]>(initialCars)
  const [carsHasMore, setCarsHasMore] = useState(initialCarsHasMore)
  const [prefs, setPrefs] = useState(getInitialPrefs)
  const { passengers, tripType, prefsConfirmed } = prefs

  const setPassengers = (nextPassengers: number) =>
    setPrefs((current) => ({ ...current, passengers: nextPassengers }))

  const setTripType = (nextTripType: 'round_trip' | 'one_way') =>
    setPrefs((current) => ({ ...current, tripType: nextTripType }))

  const setPrefsConfirmed = (nextConfirmed: boolean) =>
    setPrefs((current) => ({ ...current, prefsConfirmed: nextConfirmed }))

  function handleConfirm() {
    savePrefs({ passengers, tripType })
    setPrefsConfirmed(true)
  }

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const supabase = createClient()
      const now = new Date().toISOString()
      const cutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      if (activeTab === 'trips') {
        const offset = trips.length
        const { data } = await supabase
          .from('trips')
          .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
          .eq('status', 'active')
          .gt('departure_at', now)
          .lte('departure_at', cutoff)
          .order('departure_at', { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1)

        if (data) {
          setTrips((prev) => [...prev, ...(data as Trip[])])
          setHasMore(data.length === PAGE_SIZE)
        }
      } else if (activeTab === 'rooms') {
        const offset = rooms.length
        const { data } = await supabase
          .from('rooms')
          .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
          .eq('status', 'active')
          .eq('is_last_minute', true)
          .lte('available_from', cutoff)
          .gte('available_to', now)
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)

        if (data) {
          setRooms((prev) => [...prev, ...data])
          setRoomsHasMore(data.length === PAGE_SIZE)
        }
      } else if (activeTab === 'cars') {
        const offset = cars.length
        const { data } = await supabase
          .from('cars')
          .select('*, provider:providers(company_name_ar, company_name_en, provider_type)')
          .eq('status', 'active')
          .eq('is_last_minute', true)
          .lte('available_from', cutoff)
          .gte('available_to', now)
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)

        if (data) {
          setCars((prev) => [...prev, ...data])
          setCarsHasMore(data.length === PAGE_SIZE)
        }
      }
    } catch { /* silently */ } finally {
      setLoadingMore(false)
    }
  }

  const activeItems = activeTab === 'trips' ? trips : activeTab === 'rooms' ? rooms : cars
  const activeHasMore = activeTab === 'trips' ? hasMore : activeTab === 'rooms' ? roomsHasMore : carsHasMore

  const flashTarget =
    activeTab === 'trips'
      ? trips[0]?.departure_at
      : activeTab === 'rooms'
      ? rooms[0]?.available_from
      : cars[0]?.available_from

  return (
    <>
      <CategoryHero
        eyebrow={t('category_heroes.last_minute.eyebrow')}
        title={t('category_heroes.last_minute.title')}
        description={t('category_heroes.last_minute.description')}
        image="https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=2400&q=85"
      />
      <div className="min-h-screen -mt-20 pt-0 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 relative z-20">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-bold text-orange-700">{t('lastMinute.badge')}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border border-border bg-surface p-1">
            {(['trips', 'rooms', 'cars'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-lg px-5 py-2.5 text-sm font-bold transition-colors',
                  activeTab === tab ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab === 'trips' ? (pick(locale, 'رحلات', 'Trips', 'Geziler')) : tab === 'rooms' ? (pick(locale, 'فنادق', 'Hotels', 'Oteller')) : (pick(locale, 'سيارات', 'Cars', 'Araçlar'))}
              </button>
            ))}
          </div>
        </div>

        {/* Flash deals banner */}
        {activeItems.length > 0 && flashTarget && (
          <div className="mx-auto max-w-3xl rounded-2xl border border-destructive/20 bg-gradient-to-r from-destructive/5 via-orange-50 to-destructive/5 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-destructive">
                    {pick(locale, 'عروض سريعة', 'Flash Deals', 'Flaş Fırsatlar')}
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {pick(locale, `${activeItems.length}+ عرض ينتهي قريباً`, `${activeItems.length}+ deals ending soon`)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CountdownTimer targetDate={flashTarget} />
                <ShareButton
                  variant="pill"
                  url={`/${locale}/last-minute`}
                  title={pick(locale, 'عروض اللحظة الأخيرة على BookitFly', 'Last-minute deals on BookitFly', 'BookitFly\'da son dakika fırsatları')}
                  text={pick(locale, 'اكتشف عروض سفر اللحظة الأخيرة على BookitFly 🔥', "Don't miss these last-minute travel deals on BookitFly 🔥", "BookitFly'daki bu son dakika seyahat fırsatlarını kaçırmayın 🔥")}
                />
              </div>
            </div>
          </div>
        )}

        {/* Preferences prompt — trips tab only */}
        {activeTab === 'trips' && (
          <div className="max-w-xl mx-auto rounded-2xl border border-orange-100 bg-orange-50/60 p-5 space-y-4">
            <p className="text-sm font-bold text-orange-700 flex items-center gap-2">
              {prefsConfirmed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Flame className="h-4 w-4" />}
              {pick(locale, 'اختر تفضيلات رحلتك', 'Set your trip preferences', 'Gezi tercihlerinizi ayarlayın')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Passengers */}
              <div className="flex items-center gap-2 flex-1 bg-white border border-slate-200 rounded-xl px-4 h-12">
                <Users className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={passengers}
                  onChange={e => {
                    const v = Math.max(1, Number(e.target.value))
                    setPassengers(v)
                    savePrefs({ passengers: v })
                  }}
                  className="w-full text-sm font-semibold bg-transparent outline-none"
                  placeholder={pick(locale, 'عدد المسافرين', 'Passengers', 'Yolcular')}
                />
              </div>

              {/* Trip type */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 h-12">
                <button
                  type="button"
                  onClick={() => { setTripType('round_trip'); savePrefs({ tripType: 'round_trip' }) }}
                  className={`flex items-center gap-1.5 px-3 h-full rounded-lg text-xs font-bold transition-all ${tripType === 'round_trip' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  {pick(locale, 'ذهاب وعودة', 'Round trip', 'Gidiş-dönüş')}
                </button>
                <button
                  type="button"
                  onClick={() => { setTripType('one_way'); savePrefs({ tripType: 'one_way' }) }}
                  className={`flex items-center gap-1.5 px-3 h-full rounded-lg text-xs font-bold transition-all ${tripType === 'one_way' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {pick(locale, 'ذهاب فقط', 'One way', 'Tek yön')}
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                className="h-12 px-5 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-95 transition-all shrink-0"
              >
                {pick(locale, 'حفظ', 'Save', 'Kaydet')}
              </button>
            </div>
            {prefsConfirmed && (
              <p className="text-xs text-slate-500">
                {pick(locale, `${passengers} ${passengers === 1 ? 'مسافر' : 'مسافرين'} · ${tripType === 'round_trip' ? 'ذهاب وعودة' : 'ذهاب فقط'}`, `${passengers} ${passengers === 1 ? 'passenger' : 'passengers'} · ${tripType === 'round_trip' ? 'Round trip' : 'One way'}`)}
              </p>
            )}
          </div>
        )}

        {activeTab === 'trips' && (
          trips.length === 0 ? (
            <EmptyState icon={Flame} message={t('no_deals')} description={t('check_back')} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
            </div>
          )
        )}

        {activeTab === 'rooms' && (
          rooms.length === 0 ? (
            <EmptyState icon={Flame} message={t('no_deals')} description={t('check_back')} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => <RoomCard key={room.id} room={room as Room} />)}
            </div>
          )
        )}

        {activeTab === 'cars' && (
          cars.length === 0 ? (
            <EmptyState icon={Flame} message={t('no_deals')} description={t('check_back')} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => <CarCard key={car.id} car={car as Car} />)}
            </div>
          )
        )}

        {activeHasMore && activeItems.length > 0 && (
          <div className="flex justify-center pt-2 pb-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-6 py-3 bg-card border rounded-xl text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
              {pick(locale, 'تحميل المزيد', 'Load More', 'Daha Fazla Yükle')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
