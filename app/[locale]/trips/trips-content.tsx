'use client'

import { pick } from '@/lib/i18n-helpers'
import dynamic from 'next/dynamic'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Loader2,
  ArrowLeftRight,
  ArrowRight,
  Route,
  CalendarIcon,
  Plane,
  Hotel,
  Pencil,
  MapPin,
  CalendarRange,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TripCard } from '@/components/trips/trip-card'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { CityAutocomplete } from '@/components/shared/city-autocomplete'
import { PassengerPicker, type PassengerCounts, type CabinClassValue } from '@/components/shared/passenger-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SortTabs, type SortKey } from '@/components/trips/sort-tabs'
import { StopsFilter, type StopValue } from '@/components/trips/stops-filter'
import { AirlineFilter, type AirlineEntry } from '@/components/trips/airline-filter'
import { StickySearchSummary } from '@/components/trips/sticky-search-summary'
import {
  DepartureTimeFilter,
  type TimeBucket,
  timeBucketFromIso,
} from '@/components/trips/departure-time-filter'
import { DurationFilter } from '@/components/trips/duration-filter'
import { ShareSearchButton } from '@/components/trips/share-search-button'
import { TrackRouteButton } from '@/components/trips/track-route-button'
import { MapViewToggle } from '@/components/trips/map-view-toggle'

const HotelMapView = dynamic(
  () => import('@/components/trips/hotel-map-view').then((m) => m.HotelMapView),
  { ssr: false },
)
import { RecentSearches, saveRecentSearch, type RecentSearch } from '@/components/trips/recent-searches'
import { useFilterUrlSync } from '@/lib/use-filter-url-sync'
import { computePriceTiers, priceMedian } from '@/lib/price-tier'
import { PriceStrip } from '@/components/trips/price-strip'
import { computeRibbons } from '@/components/ui/ribbon-badge'
import { StaleSearchModal } from '@/components/ui/stale-search-modal'
import { CategoryHero } from '@/components/shared/category-hero'
import type { Trip } from '@/types'
import type { LiveOffer } from '@/lib/travelpayouts-server'
import { LiveTripCard } from '@/components/trips/live-trip-card'
import { HotelCard } from '@/components/trips/hotel-card'
import { LiveOfferModal } from '@/components/trips/live-offer-modal'
import { HotelOfferModal } from '@/components/trips/hotel-offer-modal'
import type { HotelOffer } from '@/lib/booking-hotels'
import { getDisplayCurrency } from '@/components/shared/currency-switcher'
import { useMemo } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { enUS } from 'date-fns/locale'

type Filters = {
  origin: string
  destination: string
  date_from: string
  date_to: string
  price_min: string
  price_max: string
  trip_type: string
  cabin_class: string
  sort: string
  adults: number
  children: number
  infants: number
  include_nearby: boolean
  flex_days: number
}

const emptyFilters: Filters = {
  origin: '',
  destination: '',
  date_from: '',
  date_to: '',
  price_min: '',
  price_max: '',
  trip_type: 'one_way',
  cabin_class: '',
  sort: 'newest',
  adults: 1,
  children: 0,
  infants: 0,
  include_nearby: false,
  flex_days: 0,
}

const parseDateValue = (value: string) => {
  if (!value) return undefined
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

interface TripsContentProps {
  initialTrips: Trip[]
  initialTotalPages: number
  initialFilters: Filters
  liveOffers?: LiveOffer[]
  hotelOffers?: HotelOffer[]
}

export function TripsContent({
  initialTrips,
  initialTotalPages,
  initialFilters,
  liveOffers = [],
  hotelOffers: initialHotelOffers = [],
}: TripsContentProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [partnerOffers, setPartnerOffers] = useState<LiveOffer[]>(liveOffers)
  const [hotelOffers, setHotelOffers] = useState<HotelOffer[]>(initialHotelOffers)
  const [selectedLiveOffer, setSelectedLiveOffer] = useState<LiveOffer | null>(null)
  const [selectedHotelOffer, setSelectedHotelOffer] = useState<HotelOffer | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)

  // Compute ribbon badges (best-value / cheapest / fastest) from the currently rendered set
  const tripRibbons = useMemo(
    () =>
      computeRibbons(
        trips.map((tr) => ({
          id: tr.id,
          price: tr.price_per_seat,
          duration_minutes: tr.duration_minutes ?? null,
        })),
      ),
    [trips],
  )

  // Compute price tiers across the merged set (platform trips + partner offers)
  // so "good deal" / "high price" reflects the user's full visible market.
  const priceTierData = useMemo(() => {
    const merged = [
      ...trips.map((tr) => ({ id: `t:${tr.id}`, price: tr.price_per_seat })),
      ...partnerOffers.map((o) => ({ id: `o:${o.id}`, price: o.price_amount })),
    ]
    return {
      tiers: computePriceTiers(merged),
      median: priceMedian(merged),
    }
  }, [trips, partnerOffers])

  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, ...initialFilters })
  const [showFilters, setShowFilters] = useState(false)
  const [stopsFilter, setStopsFilter] = useState<StopValue[]>([])
  const [airlinesFilter, setAirlinesFilter] = useState<string[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeBucket[]>([])
  const [maxDurationHours, setMaxDurationHours] = useState<number | null>(null)
  const [recentRefreshKey, setRecentRefreshKey] = useState(0)
  const [hotelView, setHotelView] = useState<'list' | 'map'>('list')
  const searchCardRef = useRef<HTMLDivElement | null>(null)

  // Sync filters → URL (server-rendered initial values come from the same params).
  useFilterUrlSync({
    origin: filters.origin,
    destination: filters.destination,
    date_from: filters.date_from,
    date_to: filters.date_to,
    trip_type: filters.trip_type,
    cabin_class: filters.cabin_class,
    price_min: filters.price_min,
    price_max: filters.price_max,
    sort: filters.sort === 'newest' ? '' : filters.sort,
    adults: filters.adults > 1 ? filters.adults : '',
    children: filters.children || '',
    infants: filters.infants || '',
    include_nearby: filters.include_nearby ? '1' : '',
    flex_days: filters.flex_days || '',
  })

  const handleEditSearch = useCallback(() => {
    const el = searchCardRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])
  const [searchOrigin, setSearchOrigin] = useState(initialFilters.origin)
  const [searchDestination, setSearchDestination] = useState(initialFilters.destination)
  const departureDate = parseDateValue(filters.date_from)
  const returnDate = parseDateValue(filters.date_to)

  const tripStopBucket = (tr: Trip): StopValue => (tr.is_direct ? 'direct' : '1')
  const offerStopBucket = (o: LiveOffer): StopValue => {
    const t = o.transfers ?? 0
    if (t <= 0) return 'direct'
    if (t === 1) return '1'
    return '2+'
  }

  // Airline normalization: IATA codes when possible, else a name-keyed bucket.
  const tripAirlineKey = (tr: Trip): string => {
    const raw = (tr.airline || '').trim()
    if (!raw) return ''
    if (/^[A-Z0-9]{2,3}$/i.test(raw)) return raw.toUpperCase()
    return `name:${raw.toLowerCase()}`
  }
  const offerAirlineKey = (o: LiveOffer): string =>
    (o.airline_iata || '').toUpperCase()

  const tripTimeBucket = (tr: Trip) => timeBucketFromIso(tr.departure_at)
  const offerTimeBucket = (o: LiveOffer) => timeBucketFromIso(o.departing_at)
  const tripDurationHours = (tr: Trip): number | null =>
    tr.duration_minutes && tr.duration_minutes > 0 ? tr.duration_minutes / 60 : null
  const offerDurationHours = (o: LiveOffer): number | null =>
    o.duration_minutes && o.duration_minutes > 0 ? o.duration_minutes / 60 : null

  const stopsCounts = useMemo(() => {
    const c: Record<StopValue, number> = { direct: 0, '1': 0, '2+': 0 }
    trips.forEach((tr) => { c[tripStopBucket(tr)] += 1 })
    partnerOffers.forEach((o) => { c[offerStopBucket(o)] += 1 })
    return c
  }, [trips, partnerOffers])

  const stopsMinPrices = useMemo(() => {
    const m: Partial<Record<StopValue, { price: number; currency?: string }>> = {}
    const consider = (bucket: StopValue, price: number, currency?: string) => {
      if (!Number.isFinite(price) || price <= 0) return
      const cur = m[bucket]
      if (!cur || price < cur.price) m[bucket] = { price, currency }
    }
    trips.forEach((tr) => consider(tripStopBucket(tr), tr.price_per_seat, tr.currency))
    partnerOffers.forEach((o) => consider(offerStopBucket(o), o.price_amount, o.price_currency))
    return m
  }, [trips, partnerOffers])

  const filteredTrips = useMemo(() => {
    return trips.filter((tr) => {
      if (stopsFilter.length > 0 && !stopsFilter.includes(tripStopBucket(tr))) return false
      if (airlinesFilter.length > 0) {
        const k = tripAirlineKey(tr)
        if (!k || !airlinesFilter.includes(k)) return false
      }
      if (timeFilter.length > 0) {
        const b = tripTimeBucket(tr)
        if (!b || !timeFilter.includes(b)) return false
      }
      if (maxDurationHours !== null) {
        const d = tripDurationHours(tr)
        if (d !== null && d > maxDurationHours) return false
      }
      return true
    })
  }, [trips, stopsFilter, airlinesFilter, timeFilter, maxDurationHours])

  const filteredPartnerOffers = useMemo(() => {
    return partnerOffers.filter((o) => {
      if (stopsFilter.length > 0 && !stopsFilter.includes(offerStopBucket(o))) return false
      if (airlinesFilter.length > 0) {
        const k = offerAirlineKey(o)
        if (!k || !airlinesFilter.includes(k)) return false
      }
      if (timeFilter.length > 0) {
        const b = offerTimeBucket(o)
        if (!b || !timeFilter.includes(b)) return false
      }
      if (maxDurationHours !== null) {
        const d = offerDurationHours(o)
        if (d !== null && d > maxDurationHours) return false
      }
      return true
    })
  }, [partnerOffers, stopsFilter, airlinesFilter, timeFilter, maxDurationHours])

  const timeBucketCounts = useMemo(() => {
    const c: Record<TimeBucket, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 }
    trips.forEach((tr) => {
      const b = tripTimeBucket(tr)
      if (b) c[b] += 1
    })
    partnerOffers.forEach((o) => {
      const b = offerTimeBucket(o)
      if (b) c[b] += 1
    })
    return c
  }, [trips, partnerOffers])

  const durationBounds = useMemo(() => {
    let min = Infinity
    let max = 0
    const consider = (h: number | null) => {
      if (h === null) return
      if (h < min) min = h
      if (h > max) max = h
    }
    trips.forEach((tr) => consider(tripDurationHours(tr)))
    partnerOffers.forEach((o) => consider(offerDurationHours(o)))
    if (!Number.isFinite(min) || max <= 0) return null
    return { min: Math.max(1, Math.floor(min)), max: Math.max(2, Math.ceil(max)) }
  }, [trips, partnerOffers])

  // Aggregate airlines from the unfiltered base sets so chips don't disappear
  // as they get selected. Counts/min-prices respect the *other* filter (stops)
  // so each chip reflects how many results it would yield given current state.
  const airlineEntries = useMemo<AirlineEntry[]>(() => {
    const map = new Map<string, AirlineEntry>()
    const upsert = (
      key: string,
      name: string,
      price: number,
      currency?: string,
      logoUrl?: string,
    ) => {
      if (!key) return
      if (!Number.isFinite(price) || price <= 0) return
      const existing = map.get(key)
      if (!existing) {
        map.set(key, { code: key, name, count: 1, minPrice: price, currency, logoUrl })
      } else {
        existing.count += 1
        if (price < existing.minPrice) {
          existing.minPrice = price
          existing.currency = currency || existing.currency
        }
        if (!existing.logoUrl && logoUrl) existing.logoUrl = logoUrl
      }
    }
    trips.forEach((tr) => {
      if (stopsFilter.length > 0 && !stopsFilter.includes(tripStopBucket(tr))) return
      const key = tripAirlineKey(tr)
      const display = (tr.airline || '').trim() || key
      const isIata = /^[A-Z0-9]{2,3}$/i.test(key)
      upsert(
        key,
        display,
        tr.price_per_seat,
        tr.currency,
        isIata ? `https://pics.avs.io/64/64/${key}.png` : undefined,
      )
    })
    partnerOffers.forEach((o) => {
      if (stopsFilter.length > 0 && !stopsFilter.includes(offerStopBucket(o))) return
      const key = offerAirlineKey(o)
      upsert(
        key,
        o.airline_name || key,
        o.price_amount,
        o.price_currency,
        key ? `https://pics.avs.io/64/64/${key}.png` : undefined,
      )
    })
    return Array.from(map.values())
  }, [trips, partnerOffers, stopsFilter])

  const liveOfferCounts = useMemo(() => {
    return filteredPartnerOffers.reduce(
      (acc, offer) => {
        if (offer.source === 'duffel') acc.duffel += 1
        else acc.travelpayouts += 1
        return acc
      },
      { travelpayouts: 0, duffel: 0 }
    )
  }, [filteredPartnerOffers])

  const totalResultsCount = filteredTrips.length + filteredPartnerOffers.length + hotelOffers.length

  useEffect(() => {
    setPartnerOffers(liveOffers)
  }, [liveOffers])

  useEffect(() => {
    setHotelOffers(initialHotelOffers)
  }, [initialHotelOffers])

  // Refetch everything (trips + partner offers + hotels) when display currency changes.
  useEffect(() => {
    const handler = () => {
      fetchTripsRef.current?.(1, false)
    }
    window.addEventListener('bookitfly:currency-change', handler)
    return () => window.removeEventListener('bookitfly:currency-change', handler)
  }, [])

  const fetchTrips = useCallback(
    async (
      pageNum: number,
      append = false,
      overrideOrigin?: string,
      overrideDestination?: string,
      overrideFilters?: Partial<Filters>
    ) => {
      if (!append) setLoading(true)
      else setLoadingMore(true)

      const origin = overrideOrigin ?? searchOrigin
      const destination = overrideDestination ?? searchDestination
      const activeFilters = { ...filters, ...overrideFilters }

      try {
        const params = new URLSearchParams()
        params.set('page', String(pageNum))
        params.set('limit', '12')
        if (origin) params.set('origin', origin)
        if (destination) params.set('destination', destination)
        if (activeFilters.date_from) params.set('date_from', activeFilters.date_from)
        if (activeFilters.trip_type !== 'one_way' && activeFilters.date_to) params.set('date_to', activeFilters.date_to)
        if (activeFilters.price_min) params.set('price_min', activeFilters.price_min)
        if (activeFilters.price_max) params.set('price_max', activeFilters.price_max)
        if (activeFilters.trip_type) params.set('trip_type', activeFilters.trip_type)
        if (activeFilters.cabin_class) params.set('cabin_class', activeFilters.cabin_class)
        if (activeFilters.sort) params.set('sort', activeFilters.sort)
        if (activeFilters.adults) params.set('adults', String(activeFilters.adults))
        if (activeFilters.children) params.set('children', String(activeFilters.children))
        if (activeFilters.infants) params.set('infants', String(activeFilters.infants))
        if (activeFilters.include_nearby) params.set('include_nearby', '1')
        if (activeFilters.flex_days) params.set('flex_days', String(activeFilters.flex_days))

        const userCurrency = getDisplayCurrency()
        if (userCurrency) params.set('currency', userCurrency)

        const tripsPromise = fetch(`/api/trips?${params.toString()}`).then((res) => res.json())
        const partnerOffersPromise = append
          ? Promise.resolve<{ offers: LiveOffer[] } | null>(null)
          : fetch(`/api/trips/live-offers?${params.toString()}`).then((res) => res.json())
        const hotelOffersPromise = append
          ? Promise.resolve<{ offers: HotelOffer[] } | null>(null)
          : fetch(`/api/trips/hotel-offers?${params.toString()}`).then((res) => res.json())

        const [data, liveData, hotelData] = await Promise.all([tripsPromise, partnerOffersPromise, hotelOffersPromise])

        if (append) {
          setTrips((prev) => [...prev, ...(data.trips || [])])
        } else {
          setTrips(data.trips || [])
          setPartnerOffers(liveData?.offers || [])
          setHotelOffers(hotelData?.offers || [])
        }
        setTotalPages(data.totalPages || 1)
      } catch {
        // Error handled silently
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [searchOrigin, searchDestination, filters.date_from, filters.date_to, filters.price_min, filters.price_max, filters.trip_type, filters.cabin_class, filters.sort, filters.adults, filters.children, filters.infants, filters.include_nearby, filters.flex_days]
  )

  const fetchTripsRef = useRef(fetchTrips)
  useEffect(() => {
    fetchTripsRef.current = fetchTrips
  }, [fetchTrips])

  const handleSearch = useCallback(() => {
    setSearchOrigin(filters.origin)
    setSearchDestination(filters.destination)
    setPage(1)
    fetchTrips(1, false, filters.origin, filters.destination)
    if (filters.origin && filters.destination) {
      saveRecentSearch({
        origin: filters.origin,
        destination: filters.destination,
        date_from: filters.date_from,
        date_to: filters.date_to,
        trip_type: filters.trip_type,
        cabin_class: filters.cabin_class,
        adults: filters.adults,
        children: filters.children,
        infants: filters.infants,
      })
      setRecentRefreshKey((k) => k + 1)
    }
  }, [filters, fetchTrips])

  const handleRecentSelect = useCallback(
    (entry: RecentSearch) => {
      setFilters((prev) => ({
        ...prev,
        origin: entry.origin,
        destination: entry.destination,
        date_from: entry.date_from || '',
        date_to: entry.date_to || '',
        trip_type: entry.trip_type || prev.trip_type,
        cabin_class: entry.cabin_class || prev.cabin_class,
        adults: entry.adults ?? prev.adults,
        children: entry.children ?? prev.children,
        infants: entry.infants ?? prev.infants,
      }))
      setSearchOrigin(entry.origin)
      setSearchDestination(entry.destination)
      setPage(1)
      fetchTrips(1, false, entry.origin, entry.destination, {
        date_from: entry.date_from || '',
        date_to: entry.date_to || '',
        trip_type: entry.trip_type,
        cabin_class: entry.cabin_class,
        adults: entry.adults,
        children: entry.children,
        infants: entry.infants,
      })
    },
    [fetchTrips],
  )

  const handleCitySelect = useCallback((field: 'origin' | 'destination', value: string) => {
    const newOrigin = field === 'origin' ? value : filters.origin
    const newDestination = field === 'destination' ? value : filters.destination
    setSearchOrigin(newOrigin)
    setSearchDestination(newDestination)
    updateFilter(field, value)
    setPage(1)
    fetchTrips(1, false, newOrigin, newDestination)
  }, [filters.origin, filters.destination, fetchTrips])

  const handleSwapLocations = () => {
    const newOrigin = filters.destination
    const newDestination = filters.origin
    setFilters((prev) => ({ ...prev, origin: newOrigin, destination: newDestination }))
    setSearchOrigin(newOrigin)
    setSearchDestination(newDestination)
    setPage(1)
    fetchTrips(1, false, newOrigin, newDestination)
  }

  const filterDepsRef = useRef({
    date_from: initialFilters.date_from,
    date_to: initialFilters.date_to,
    price_min: initialFilters.price_min,
    price_max: initialFilters.price_max,
    trip_type: initialFilters.trip_type,
    cabin_class: initialFilters.cabin_class,
    sort: initialFilters.sort,
    adults: initialFilters.adults ?? 1,
    children: initialFilters.children ?? 0,
    infants: initialFilters.infants ?? 0,
    include_nearby: initialFilters.include_nearby ?? false,
    flex_days: initialFilters.flex_days ?? 0,
  })

  useEffect(() => {
    const prev = filterDepsRef.current
    const changed =
      prev.date_from !== filters.date_from ||
      prev.date_to !== filters.date_to ||
      prev.price_min !== filters.price_min ||
      prev.price_max !== filters.price_max ||
      prev.trip_type !== filters.trip_type ||
      prev.cabin_class !== filters.cabin_class ||
      prev.sort !== filters.sort ||
      prev.adults !== filters.adults ||
      prev.children !== filters.children ||
      prev.infants !== filters.infants ||
      prev.include_nearby !== filters.include_nearby ||
      prev.flex_days !== filters.flex_days
    if (changed) {
      filterDepsRef.current = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        price_min: filters.price_min,
        price_max: filters.price_max,
        trip_type: filters.trip_type,
        cabin_class: filters.cabin_class,
        sort: filters.sort,
        adults: filters.adults,
        children: filters.children,
        infants: filters.infants,
        include_nearby: filters.include_nearby,
        flex_days: filters.flex_days,
      }
      setPage(1)
      fetchTrips(1)
    }
  }, [filters.date_from, filters.date_to, filters.price_min, filters.price_max, filters.trip_type, filters.cabin_class, filters.sort, filters.adults, filters.children, filters.infants, filters.include_nearby, filters.flex_days, fetchTrips])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchTrips(nextPage, true)
  }

  const updateFilter = (key: keyof Filters, value: string | boolean | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const passengerValue: PassengerCounts = {
    adults: filters.adults,
    children: filters.children,
    infants: filters.infants,
    childAges: Array.from({ length: filters.children }, () => 5),
  }

  const handlePassengersChange = (next: PassengerCounts) => {
    setFilters((prev) => ({
      ...prev,
      adults: next.adults,
      children: next.children,
      infants: next.infants,
    }))
  }

  const handleTripTypeChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      trip_type: value,
      date_to: value === 'one_way' ? '' : prev.date_to,
    }))
  }

  const handleDepartureDateSelect = (date?: Date) => {
    const nextValue = date ? format(date, 'yyyy-MM-dd') : ''
    setFilters((prev) => ({
      ...prev,
      date_from: nextValue,
      date_to:
        prev.trip_type === 'one_way'
          ? ''
          : prev.date_to && date && parseISO(prev.date_to) < date
            ? ''
            : prev.date_to,
    }))
  }

  const handleReturnDateSelect = (date?: Date) => {
    updateFilter('date_to', date ? format(date, 'yyyy-MM-dd') : '')
  }

  const clearFilters = () => {
    setFilters(emptyFilters)
    setSearchOrigin('')
    setSearchDestination('')
    setStopsFilter([])
    setAirlinesFilter([])
    setTimeFilter([])
    setMaxDurationHours(null)
    setPage(1)
    fetchTrips(1, false, '', '', emptyFilters)
  }

  const hasActiveFilters =
    !!filters.origin ||
    !!filters.destination ||
    !!filters.date_from ||
    !!filters.date_to ||
    !!filters.price_min ||
    !!filters.price_max ||
    !!filters.cabin_class ||
    filters.trip_type !== 'one_way' ||
    filters.adults > 1 ||
    filters.children > 0 ||
    filters.infants > 0 ||
    filters.include_nearby ||
    filters.flex_days > 0 ||
    stopsFilter.length > 0 ||
    airlinesFilter.length > 0 ||
    timeFilter.length > 0 ||
    maxDurationHours !== null

  const inputClass =
    'w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-50 border-none text-slate-700 text-sm md:text-base font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-colors hover:bg-slate-100'

  return (
    <>
      <StickySearchSummary
        watchRef={searchCardRef}
        origin={filters.origin}
        destination={filters.destination}
        dateFrom={filters.date_from}
        dateTo={filters.date_to}
        tripType={filters.trip_type}
        cabinClass={filters.cabin_class}
        adults={filters.adults}
        children={filters.children}
        infants={filters.infants}
        onEdit={handleEditSearch}
        onSearch={handleSearch}
      />
      <CategoryHero
        eyebrow={t('category_heroes.trips.eyebrow')}
        title={t('category_heroes.trips.title')}
        description={t('category_heroes.trips.description')}
        image="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2400&q=85"
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-12 sm:-mt-14 pt-0 pb-8 md:pb-16 lg:pb-20 animate-fade-in-up">
        {/* Main Search Bar */}
        <div ref={searchCardRef} className="bg-white rounded-3xl md:rounded-[2rem] p-4 md:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-4 relative z-20">

        {/* Row 1: Origin & Destination */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
          <CityAutocomplete
            locale={locale}
            value={filters.origin}
            onChange={(val) => updateFilter('origin', val)}
            onSelect={(val) => handleCitySelect('origin', val)}
            placeholder={t('trips.departure_from')}
            className="rounded-2xl h-14"
            showLocateButton
            myLocationLabel={t('common.my_location')}
          />

          <button
            type="button"
            onClick={handleSwapLocations}
            className="hidden sm:flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label={pick(locale, 'تبديل الوجهتين', 'Swap origin and destination', 'Çıkış ve varışı değiştir')}
          >
            <ArrowLeftRight className="h-4 w-4 text-slate-400" />
          </button>
          <div className="sm:hidden w-full h-px bg-slate-100 my-1" />

          <CityAutocomplete
            locale={locale}
            value={filters.destination}
            onChange={(val) => updateFilter('destination', val)}
            onSelect={(val) => handleCitySelect('destination', val)}
            placeholder={t('trips.arrival_to')}
            className="rounded-2xl h-14"
            myLocationLabel={t('common.my_location')}
          />
        </div>

        {/* Trip type pills */}
        <div className="mb-3 flex flex-wrap gap-2">
          {([
            { value: 'round_trip', label: t('trips.round_trip'), icon: <ArrowLeftRight className="h-4 w-4" /> },
            { value: 'one_way', label: t('trips.one_way'), icon: <ArrowRight className={cn('h-4 w-4', isAr && 'rotate-180')} /> },
            { value: 'multi_city', label: t('trips.multi_city'), icon: <Route className="h-4 w-4" /> },
          ] as const).map((opt) => {
            const active = filters.trip_type === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTripTypeChange(opt.value)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-primary/40 hover:text-slate-900'
                )}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>

        {/* Row 2: Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {/* Departure Date */}
          <Popover>
            <PopoverTrigger
              className={cn(
                'w-full h-12 md:h-14 px-3 sm:px-4 rounded-2xl bg-slate-50 border-none text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none hover:bg-slate-100 transition-colors flex items-center justify-between gap-2 min-w-0',
                departureDate ? 'text-slate-700' : 'text-slate-400'
              )}
            >
              <span className="truncate">{departureDate ? format(departureDate, 'd MMM yyyy', { locale: enUS }) : t('trips.departure_date')}</span>
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={departureDate} onSelect={handleDepartureDateSelect} initialFocus />
            </PopoverContent>
          </Popover>

          {/* Return Date */}
          <Popover>
            <PopoverTrigger
              disabled={filters.trip_type === 'one_way'}
              className={cn(
                'w-full h-12 md:h-14 px-3 sm:px-4 rounded-2xl bg-slate-50 border-none text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none hover:bg-slate-100 transition-colors flex items-center justify-between gap-2 min-w-0 disabled:opacity-40 disabled:cursor-not-allowed',
                returnDate ? 'text-slate-700' : 'text-slate-400'
              )}
            >
              <span className="truncate">{returnDate ? format(returnDate, 'd MMM yyyy', { locale: enUS }) : t('trips.return_date_filter')}</span>
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={returnDate}
                onSelect={handleReturnDateSelect}
                disabled={(date) => Boolean(departureDate && date < departureDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Search-nearby toggles (Wego pattern) */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateFilter('include_nearby', !filters.include_nearby)}
            aria-pressed={filters.include_nearby}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs md:text-sm font-bold transition-colors',
              filters.include_nearby
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-slate-900',
            )}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>{pick(locale, 'مطارات قريبة', 'Nearby airports', 'Yakındaki havalimanları')}</span>
          </button>
          <button
            type="button"
            onClick={() => updateFilter('flex_days', filters.flex_days > 0 ? 0 : 3)}
            aria-pressed={filters.flex_days > 0}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs md:text-sm font-bold transition-colors',
              filters.flex_days > 0
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-slate-900',
            )}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            <span>
              {pick(locale, 'تواريخ مرنة', 'Flexible dates', 'Esnek tarihler')}
              {filters.flex_days > 0 ? ` ±${filters.flex_days}` : ''}
            </span>
          </button>
        </div>

        {/* Passenger + Cabin picker */}
        <div className="mt-3">
          <PassengerPicker
            locale={locale}
            value={passengerValue}
            onChange={handlePassengersChange}
            cabinClass={(filters.cabin_class || 'economy') as CabinClassValue}
            onCabinChange={(c) => updateFilter('cabin_class', c)}
          />
        </div>

        <div className="w-full mt-2">
          <button
            onClick={handleSearch}
            className="w-full flex items-center justify-center gap-2 h-12 md:h-14 px-6 rounded-2xl bg-primary text-white font-bold transition-all shadow-sm shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Search className="h-5 w-5" />
            <span>{t('common.search')}</span>
          </button>
        </div>

        {/* Row 3: Sort & More Filters */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="appearance-none w-40 md:w-48 h-10 px-4 pe-10 rounded-xl bg-slate-50 border-none text-slate-700 font-semibold text-xs md:text-sm focus:ring-2 focus:ring-primary focus:outline-none hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <option value="best">{pick(locale, 'الأفضل', 'Best', 'En İyi')}</option>
                <option value="newest">{t('trips.sort_newest')}</option>
                <option value="price_asc">{t('trips.sort_price_asc')}</option>
                <option value="price_desc">{t('trips.sort_price_desc')}</option>
                <option value="date">{t('trips.sort_date')}</option>
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 h-10 px-4 rounded-xl font-bold text-xs md:text-sm transition-all',
                showFilters ? 'bg-accent text-white hover:bg-accent/90' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('common.filter')}
            </button>

            <ShareSearchButton />

            <TrackRouteButton
              originCode={filters.origin}
              destinationCode={filters.destination}
              cabinClass={filters.cabin_class || 'economy'}
              targetPrice={priceTierData.median ?? undefined}
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-semibold text-destructive bg-destructive/10 px-3 py-1.5 rounded-full hover:bg-destructive/20 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              {t('common.cancel')}
            </button>
          )}
        </div>
      </div>

      {/* Recent searches strip */}
      <div className="mb-6">
        <RecentSearches onSelect={handleRecentSelect} refreshKey={recentRefreshKey} />
      </div>

      {/* Extra Filter panel */}
      {showFilters && (
        <div className="rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 bg-white p-5 md:p-8 mb-8 md:mb-12 shadow-xl shadow-slate-200/40 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-base md:text-lg font-bold text-slate-900 mb-5 md:mb-6">{t('common.filter')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1.5 md:space-y-2">
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('trips.filter_price')} ({t('common.from')})
              </label>
              <input
                type="number"
                min="0"
                value={filters.price_min}
                onChange={(e) => updateFilter('price_min', e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t('trips.filter_price')} ({t('common.to')})
              </label>
              <input
                type="number"
                min="0"
                value={filters.price_max}
                onChange={(e) => updateFilter('price_max', e.target.value)}
                placeholder="10000"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* 7-day price strip under search (P0-2) */}
      {filters.origin && filters.destination && (
        <div className="mb-4">
          <PriceStrip
            originCode={filters.origin}
            destinationCode={filters.destination}
            cabinClass={filters.cabin_class || undefined}
            selectedDate={departureDate}
            onDateSelect={(d) => {
              updateFilter('date_from', format(d, 'yyyy-MM-dd'))
            }}
          />
        </div>
      )}

      {(filters.origin || filters.destination) && !(filters.origin && filters.destination) && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {pick(
            locale,
            'حدّد مدينة المغادرة والوصول معًا لعرض مقارنة الأسعار والعروض المباشرة.',
            'Select both departure and destination to show live offers and price comparison.',
            'Canli teklifler ve fiyat karşılaştırmasını görmek için kalkış ve varışı birlikte seçin.'
          )}
        </div>
      )}

      {/* Stops filter chips (Wego pattern) */}
      {!loading && (trips.length > 0 || partnerOffers.length > 0) && (
        <div className="mb-4">
          <StopsFilter
            value={stopsFilter}
            onChange={setStopsFilter}
            counts={stopsCounts}
            minPrices={stopsMinPrices}
          />
        </div>
      )}

      {/* Airline filter chips (Wego pattern) */}
      {!loading && airlineEntries.length > 0 && (
        <div className="mb-4">
          <AirlineFilter
            airlines={airlineEntries}
            value={airlinesFilter}
            onChange={setAirlinesFilter}
          />
        </div>
      )}

      {/* Departure-time + Duration (Wego patterns) */}
      {!loading && (trips.length > 0 || partnerOffers.length > 0) && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <DepartureTimeFilter
            value={timeFilter}
            onChange={setTimeFilter}
            counts={timeBucketCounts}
          />
          {durationBounds && durationBounds.max > durationBounds.min && (
            <DurationFilter
              value={maxDurationHours}
              onChange={setMaxDurationHours}
              min={durationBounds.min}
              max={durationBounds.max}
            />
          )}
        </div>
      )}

      {/* Sort tabs (P1-17) */}
      {!loading && trips.length > 0 && (
        <div className="mb-4">
          <SortTabs
            value={(filters.sort as SortKey) || 'newest'}
            onChange={(k) => updateFilter('sort', k)}
            previews={{
              price_asc: {
                price: trips.reduce((min, tr) => Math.min(min, tr.price_per_seat), trips[0]?.price_per_seat ?? 0),
                currency: trips[0]?.currency,
              },
              fastest: (() => {
                const withDur = trips.filter((tr) => tr.duration_minutes && tr.duration_minutes > 0)
                if (!withDur.length) return undefined
                return { durationMin: withDur.reduce((min, tr) => Math.min(min, tr.duration_minutes!), withDur[0].duration_minutes!) }
              })(),
              rating: (() => {
                const rated = trips.filter((tr) => tr.provider?.avg_rating && tr.provider.avg_rating > 0)
                if (!rated.length) return undefined
                const top = rated.reduce((a, b) => ((a.provider!.avg_rating || 0) >= (b.provider!.avg_rating || 0) ? a : b))
                return { rating: top.provider?.avg_rating ?? 0 }
              })(),
            }}
          />
        </div>
      )}

      {/* Stale-search modal (P2-26) */}
      <StaleSearchModal
        onRefresh={() => fetchTrips(1)}
        onNewSearch={() => clearFilters()}
      />

      {/* Results Count */}
      {!loading && totalResultsCount > 0 && (
        <div className="mb-4" role="status" aria-live="polite">
          <span className="text-sm font-medium text-muted-foreground">
            {totalResultsCount}{' '}
            {pick(locale, 'نتيجة وُجدت', 'results found', 'sonuç bulundu')}
          </span>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredTrips.length === 0 && filteredPartnerOffers.length === 0 && hotelOffers.length === 0 ? (
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <EmptyState
            icon={Plane}
            message={t('trips.no_trips')}
            actionLabel={hasActiveFilters ? t('common.cancel') : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        </div>
      ) : (
        <>
          {/* Partner flight offers — first */}
          {filteredPartnerOffers.length > 0 && (
            <div>
              <div className="mb-5 md:mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-slate-900">
                    {pick(
                      locale,
                      'خيارات إضافية من شركاء السفر',
                      'More travel options',
                      'Daha fazla seyahat seçeneği'
                    )}
                  </h2>
                  <p className="mt-1 text-xs md:text-sm text-slate-500">
                    {pick(
                      locale,
                      'عروض رحلات من مزودي خدمات سفر موثوقين خارج منصتنا',
                      'Flight offers from trusted travel providers outside our platform',
                      'Platformumuz dışındaki güvenilir sağlayıcılardan uçuş teklifleri'
                    )}
                  </p>
                </div>
                <span className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                  {filteredPartnerOffers.length}{' '}
                  {pick(locale, 'عرض', 'offers', 'teklif')}
                </span>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {liveOfferCounts.travelpayouts > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                    Travelpayouts: {liveOfferCounts.travelpayouts}
                  </span>
                )}
                {liveOfferCounts.duffel > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                    Duffel: {liveOfferCounts.duffel}
                  </span>
                )}
                {hotelOffers.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                    <Hotel className="h-3 w-3" />
                    {pick(locale, 'فنادق', 'Hotels', 'Oteller')}: {hotelOffers.length}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredPartnerOffers.map((offer, idx) => (
                  <div
                    key={offer.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${(idx % 6) * 100}ms` }}
                  >
                    <LiveTripCard
                      offer={offer}
                      onViewDetails={() => setSelectedLiveOffer(offer)}
                      priceTier={priceTierData.tiers.get(`o:${offer.id}`)}
                      priceMedian={priceTierData.median}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hotel offers — second */}
          {hotelOffers.length > 0 && filters.destination && (
            <div className={filteredPartnerOffers.length > 0 ? 'mt-12 md:mt-16' : ''}>
              <div className="mb-5 md:mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Hotel className="h-5 w-5 text-blue-600" />
                    {pick(locale,
                      `أكمل رحلتك — فنادق في ${hotelOffers[0]?.city ?? filters.destination}`,
                      `Complete your trip — Hotels in ${hotelOffers[0]?.city ?? filters.destination}`,
                      `Seyahatinizi tamamlayın — ${hotelOffers[0]?.city ?? filters.destination} Otelleri`
                    )}
                  </h2>
                  <p className="mt-1 text-xs md:text-sm text-slate-500">
                    {pick(
                      locale,
                      'احجز إقامتك عبر Booking.com — أكثر من 28 مليون خيار، اختر ما يناسبك',
                      'Book your stay via Booking.com — 28M+ options, pick what suits you',
                      'Booking.com üzerinden konaklamanızı rezerve edin — 28 milyondan fazla seçenek'
                    )}
                  </p>
                </div>
                <MapViewToggle value={hotelView} onChange={setHotelView} />
              </div>
              {hotelView === 'map' ? (
                <HotelMapView offers={hotelOffers} height={460} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {hotelOffers.map((offer, idx) => (
                    <div
                      key={offer.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <HotelCard offer={offer} onViewDetails={() => setSelectedHotelOffer(offer)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Platform trips — last */}
          {filteredTrips.length > 0 && (
            <div className={filteredPartnerOffers.length > 0 || hotelOffers.length > 0 ? 'mt-12 md:mt-16' : ''}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredTrips.map((trip, idx) => (
                  <div
                    key={trip.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${(idx % 6) * 100}ms` }}
                  >
                    <TripCard
                      trip={trip}
                      ribbon={tripRibbons.get(trip.id)}
                      priceTier={priceTierData.tiers.get(`t:${trip.id}`)}
                      priceMedian={priceTierData.median}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {page < totalPages && (
            <div className="flex justify-center mt-12 md:mt-16">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="group inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm md:text-base font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 hover:shadow-md hover:-translate-y-0.5"
              >
                {loadingMore && <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-primary" />}
                {loadingMore ? t('common.loading') : t('common.view_all')}
              </button>
            </div>
          )}
        </>
      )}
    </div>

    {selectedLiveOffer && (
      <LiveOfferModal offer={selectedLiveOffer} onClose={() => setSelectedLiveOffer(null)} />
    )}
    {selectedHotelOffer && (
      <HotelOfferModal offer={selectedHotelOffer} onClose={() => setSelectedHotelOffer(null)} />
    )}
    </>
  )
}
