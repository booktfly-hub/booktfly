'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { TripCard } from '@/components/trips/trip-card'
import { EmptyState } from '@/components/shared/empty-state'
import type { Trip } from '@/types'
import { Loader2, Flame, Users, ArrowLeftRight, CheckCircle2 } from 'lucide-react'

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
}

export function LastMinuteContent({ initialTrips, initialHasMore }: LastMinuteContentProps) {
  const t = useTranslations('lastMinute')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)

  const [passengers, setPassengers] = useState(1)
  const [tripType, setTripType] = useState<'round_trip' | 'one_way'>('round_trip')
  const [prefsConfirmed, setPrefsConfirmed] = useState(false)

  useEffect(() => {
    const prefs = loadPrefs()
    if (prefs.passengers) setPassengers(prefs.passengers)
    if (prefs.tripType === 'one_way' || prefs.tripType === 'round_trip') setTripType(prefs.tripType)
    if (prefs.passengers || prefs.tripType) setPrefsConfirmed(true)
  }, [])

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
    } catch { /* silently */ } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-bold text-orange-700">{t('badge')}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{t('title')}</h1>
        <p className="text-slate-500 text-lg max-w-md mx-auto">{t('subtitle')}</p>
      </div>

      {/* Preferences prompt */}
      <div className="max-w-xl mx-auto rounded-2xl border border-orange-100 bg-orange-50/60 p-5 space-y-4">
        <p className="text-sm font-bold text-orange-700 flex items-center gap-2">
          {prefsConfirmed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Flame className="h-4 w-4" />}
          {isAr ? 'اختر تفضيلات رحلتك' : 'Set your trip preferences'}
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
              placeholder={isAr ? 'عدد المسافرين' : 'Passengers'}
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
              {isAr ? 'ذهاب وعودة' : 'Round trip'}
            </button>
            <button
              type="button"
              onClick={() => { setTripType('one_way'); savePrefs({ tripType: 'one_way' }) }}
              className={`flex items-center gap-1.5 px-3 h-full rounded-lg text-xs font-bold transition-all ${tripType === 'one_way' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {isAr ? 'ذهاب فقط' : 'One way'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="h-12 px-5 rounded-xl bg-primary text-white text-sm font-bold hover:brightness-95 transition-all shrink-0"
          >
            {isAr ? 'حفظ' : 'Save'}
          </button>
        </div>
        {prefsConfirmed && (
          <p className="text-xs text-slate-500">
            {isAr
              ? `${passengers} ${passengers === 1 ? 'مسافر' : 'مسافرين'} · ${tripType === 'round_trip' ? 'ذهاب وعودة' : 'ذهاب فقط'}`
              : `${passengers} ${passengers === 1 ? 'passenger' : 'passengers'} · ${tripType === 'round_trip' ? 'Round trip' : 'One way'}`}
          </p>
        )}
      </div>

      {trips.length === 0 ? (
        <EmptyState icon={Flame} message={t('no_deals')} description={t('check_back')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
        </div>
      )}

      {hasMore && trips.length > 0 && (
        <div className="flex justify-center pt-2 pb-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-card border rounded-xl text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            {isAr ? 'تحميل المزيد' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
