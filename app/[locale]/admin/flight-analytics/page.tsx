'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Plane,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Filter,
  Calendar,
  CalendarDays,
  ChevronDown,
  Users,
  DollarSign,
  Armchair,
  Flame,
  Clock,
  PartyPopper,
} from 'lucide-react'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, parseISO, isValid } from 'date-fns'

type Trip = {
  id: string
  provider_id: string
  airline: string
  flight_number: string
  origin_city_ar: string
  origin_city_en: string
  origin_code: string
  destination_city_ar: string
  destination_city_en: string
  destination_code: string
  departure_at: string
  total_seats: number
  booked_seats: number
  price_per_seat: number
  status: string
  trip_type: string
  cabin_class: string
  listing_type: string
  created_at: string
  provider?: { company_name_ar: string; company_name_en: string }
}

type Booking = {
  id: string
  trip_id: string
  buyer_id: string
  seats_count: number
  total_amount: number
  commission_amount: number
  status: string
  created_at: string
}

type TripWithStats = Trip & {
  available_seats: number
  occupancy: number
  revenue: number
  bookings: Booking[]
}

type SortKey = 'occupancy' | 'revenue' | 'departure' | 'available'
type StatusFilter = 'all_active' | 'active' | 'sold_out' | 'expired'

const PAGE_SIZE = 20

export default function FlightAnalyticsPage() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const supabase = createClient()
  const isAr = locale === 'ar'
  const cur = isAr ? 'ر.س' : 'SAR'

  const [trips, setTrips] = useState<TripWithStats[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [providers, setProviders] = useState<{ id: string; company_name_ar: string; company_name_en: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all_active')
  const [providerFilter, setProviderFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('occupancy')
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)

    const { data: tripsData } = await supabase
      .from('trips')
      .select('*, provider:providers(company_name_ar, company_name_en)')
      .in('status', ['active', 'sold_out', 'expired'])

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('id, trip_id, buyer_id, seats_count, total_amount, commission_amount, status, created_at')

    const { data: providersData } = await supabase
      .from('providers')
      .select('id, company_name_ar, company_name_en')

    if (providersData) setProviders(providersData)
    if (bookingsData) setAllBookings(bookingsData)

    if (tripsData && bookingsData) {
      const enriched: TripWithStats[] = tripsData.map((trip: any) => {
        const tripBookings = bookingsData.filter((b) => b.trip_id === trip.id)
        const confirmedBookings = tripBookings.filter((b) => b.status === 'confirmed')
        const revenue = confirmedBookings.reduce((sum, b) => sum + Number(b.commission_amount), 0)
        const available = trip.total_seats - trip.booked_seats
        const occupancy = trip.total_seats > 0 ? (trip.booked_seats / trip.total_seats) * 100 : 0

        return {
          ...trip,
          available_seats: available,
          occupancy,
          revenue,
          bookings: tripBookings,
        }
      })
      setTrips(enriched)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = useMemo(() => {
    let result = [...trips]

    if (statusFilter === 'all_active') {
      result = result.filter((t) => t.status === 'active' || t.status === 'sold_out')
    } else {
      result = result.filter((t) => t.status === statusFilter)
    }

    if (providerFilter !== 'all') {
      result = result.filter((t) => t.provider_id === providerFilter)
    }

    if (dateFrom) {
      result = result.filter((t) => t.departure_at >= dateFrom)
    }
    if (dateTo) {
      result = result.filter((t) => t.departure_at <= dateTo + 'T23:59:59')
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'occupancy':
          return b.occupancy - a.occupancy
        case 'revenue':
          return b.revenue - a.revenue
        case 'departure':
          return new Date(a.departure_at).getTime() - new Date(b.departure_at).getTime()
        case 'available':
          return b.available_seats - a.available_seats
        default:
          return 0
      }
    })

    return result
  }, [trips, statusFilter, providerFilter, dateFrom, dateTo, sortBy])

  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, providerFilter, dateFrom, dateTo, sortBy])

  const activeTrips = trips.filter((t) => t.status === 'active' || t.status === 'sold_out')

  const summary = useMemo(() => {
    const active = trips.filter((t) => t.status === 'active')
    const soldOut = trips.filter((t) => t.status === 'sold_out')
    const totalSeats = active.reduce((s, t) => s + t.total_seats, 0)
    const bookedSeats = active.reduce((s, t) => s + t.booked_seats, 0)
    const avgOccupancy = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0
    const confirmedBookings = allBookings.filter((b) => b.status === 'confirmed')
    const totalRevenue = confirmedBookings.reduce((s, b) => s + Number(b.commission_amount), 0)

    return {
      totalAvailable: totalSeats - bookedSeats,
      totalBooked: bookedSeats,
      avgOccupancy,
      activeFlights: active.length,
      revenue: totalRevenue,
      soldOutCount: soldOut.length,
    }
  }, [trips, allBookings])

  const alerts = useMemo(() => {
    const now = new Date()
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const almostSoldOut = trips.filter(
      (t) => t.status === 'active' && t.occupancy > 90
    )
    const lowBooking = trips.filter(
      (t) =>
        t.status === 'active' &&
        new Date(t.departure_at) <= in48h &&
        new Date(t.departure_at) > now &&
        t.occupancy < 30
    )
    const recentlySoldOut = trips.filter(
      (t) => t.status === 'sold_out'
    )

    return { almostSoldOut, lowBooking, recentlySoldOut }
  }, [trips])

  const chartTrips = useMemo(() => {
    return activeTrips
      .sort((a, b) => b.occupancy - a.occupancy)
      .slice(0, 15)
  }, [activeTrips])

  const routeLabel = (trip: TripWithStats) => {
    const origin = isAr ? trip.origin_city_ar : trip.origin_city_en
    const dest = isAr ? trip.destination_city_ar : trip.destination_city_en
    return `${origin} (${trip.origin_code}) → ${dest} (${trip.destination_code})`
  }

  const routeShort = (trip: TripWithStats) => {
    return `${trip.origin_code} → ${trip.destination_code}`
  }

  const providerName = (trip: TripWithStats) => {
    if (!trip.provider) return '-'
    return isAr ? trip.provider.company_name_ar : trip.provider.company_name_en
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const occupancyColor = (occ: number) => {
    if (occ >= 75) return 'bg-emerald-500'
    if (occ >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const occupancyTextColor = (occ: number) => {
    if (occ >= 75) return 'text-emerald-700'
    if (occ >= 50) return 'text-amber-700'
    return 'text-red-700'
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-800',
      sold_out: 'bg-purple-100 text-purple-800',
      expired: 'bg-gray-100 text-gray-800',
    }
    const labels: Record<string, string> = isAr
      ? { active: 'نشط', sold_out: 'مكتمل', expired: 'منتهي' }
      : { active: 'Active', sold_out: 'Sold Out', expired: 'Expired' }
    return (
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', styles[status] || 'bg-gray-100 text-gray-600')}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-5 space-y-3 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="h-5 w-5 bg-gray-200 rounded" />
              <div className="h-6 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border p-6 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border animate-pulse">
          <div className="h-10 bg-gray-100 rounded-t-xl" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 border-t bg-gray-50/50" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-1">
      <h1 className="text-2xl font-bold">{isAr ? 'تحليلات الرحلات' : 'Flight Analytics'}</h1>

      {(alerts.almostSoldOut.length > 0 || alerts.lowBooking.length > 0 || alerts.recentlySoldOut.length > 0) && (
        <div className="space-y-2">
          {alerts.almostSoldOut.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Flame className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">
                  {isAr ? 'رحلات قاربت على الامتلاء' : 'Almost Sold Out'}
                </p>
                <p className="text-amber-700 text-sm mt-0.5">
                  {alerts.almostSoldOut.map((t) => routeShort(t)).join(' , ')}
                  {' '}{isAr ? `(${alerts.almostSoldOut.length} رحلة بنسبة إشغال أكثر من 90%)` : `(${alerts.almostSoldOut.length} flights with >90% occupancy)`}
                </p>
              </div>
            </div>
          )}
          {alerts.lowBooking.length > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  {isAr ? 'حجوزات منخفضة - مغادرة خلال 48 ساعة' : 'Low Bookings - Departing Within 48h'}
                </p>
                <p className="text-red-700 text-sm mt-0.5">
                  {alerts.lowBooking.map((t) => `${routeShort(t)} (${Math.round(t.occupancy)}%)`).join(' , ')}
                </p>
              </div>
            </div>
          )}
          {alerts.recentlySoldOut.length > 0 && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <PartyPopper className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800 text-sm">
                  {isAr ? 'رحلات مكتملة الحجز' : 'Sold Out Flights'}
                </p>
                <p className="text-emerald-700 text-sm mt-0.5">
                  {alerts.recentlySoldOut.map((t) => routeShort(t)).join(' , ')}
                  {' '}{isAr ? `(${alerts.recentlySoldOut.length} رحلة)` : `(${alerts.recentlySoldOut.length} flights)`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          {
            label: isAr ? 'المقاعد المتاحة' : 'Available Seats',
            value: summary.totalAvailable.toLocaleString(),
            icon: Armchair,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: isAr ? 'المقاعد المحجوزة' : 'Booked Seats',
            value: summary.totalBooked.toLocaleString(),
            icon: Users,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: isAr ? 'متوسط الإشغال' : 'Avg Occupancy',
            value: `${summary.avgOccupancy.toFixed(1)}%`,
            icon: BarChart3,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
          {
            label: isAr ? 'الرحلات النشطة' : 'Active Flights',
            value: summary.activeFlights.toLocaleString(),
            icon: Plane,
            color: 'text-sky-600',
            bg: 'bg-sky-50',
          },
          {
            label: isAr ? 'إيرادات الرحلات' : 'Flight Revenue',
            value: `${summary.revenue.toLocaleString()} ${cur}`,
            icon: DollarSign,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: isAr ? 'رحلات مكتملة' : 'Sold Out',
            value: summary.soldOutCount.toLocaleString(),
            icon: CheckCircle2,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
        ].map((card, idx) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border p-5 transition-all hover:shadow-sm"
            style={{ animationDelay: `${idx * 80}ms`, animation: 'fadeInUp 0.4s ease-out both' }}
          >
            <div className={cn('inline-flex p-2 rounded-lg mb-3', card.bg)}>
              <card.icon className={cn('h-5 w-5', card.color)} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">{isAr ? 'توزيع المقاعد' : 'Seat Distribution'}</h2>
        {chartTrips.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            {isAr ? 'لا توجد رحلات' : 'No trips available'}
          </p>
        ) : (
          <div className="space-y-3">
            {chartTrips.map((trip) => (
              <div key={trip.id} className="flex items-center gap-3">
                <div className="w-36 text-sm font-medium truncate shrink-0" title={routeLabel(trip)}>
                  {routeShort(trip)}
                </div>
                <div className="flex-1 h-7 bg-slate-200 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(trip.occupancy, 100)}%` }}
                  />
                </div>
                <div className="w-14 text-sm font-semibold text-end shrink-0">
                  {Math.round(trip.occupancy)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all_active">{isAr ? 'نشط + مكتمل' : 'All Active'}</option>
            <option value="active">{isAr ? 'نشط' : 'Active'}</option>
            <option value="sold_out">{isAr ? 'مكتمل' : 'Sold Out'}</option>
            <option value="expired">{isAr ? 'منتهي' : 'Expired'}</option>
          </select>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">{isAr ? 'جميع المزودين' : 'All Providers'}</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {isAr ? p.company_name_ar : p.company_name_en}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger className={cn(
                'flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm transition-colors hover:bg-slate-50',
                dateFrom ? 'text-foreground' : 'text-muted-foreground'
              )}>
                <CalendarDays className="h-4 w-4 shrink-0" />
                {dateFrom && isValid(parseISO(dateFrom)) ? format(parseISO(dateFrom), 'd MMM yyyy') : (isAr ? 'من' : 'From')}
                <ChevronDown className="h-3.5 w-3.5" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarUI
                  mode="single"
                  selected={dateFrom && isValid(parseISO(dateFrom)) ? parseISO(dateFrom) : undefined}
                  onSelect={(date) => setDateFrom(date ? format(date, 'yyyy-MM-dd') : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground text-sm">{isAr ? 'إلى' : 'to'}</span>
            <Popover>
              <PopoverTrigger className={cn(
                'flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm transition-colors hover:bg-slate-50',
                dateTo ? 'text-foreground' : 'text-muted-foreground'
              )}>
                <CalendarDays className="h-4 w-4 shrink-0" />
                {dateTo && isValid(parseISO(dateTo)) ? format(parseISO(dateTo), 'd MMM yyyy') : (isAr ? 'إلى' : 'To')}
                <ChevronDown className="h-3.5 w-3.5" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarUI
                  mode="single"
                  selected={dateTo && isValid(parseISO(dateTo)) ? parseISO(dateTo) : undefined}
                  onSelect={(date) => setDateTo(date ? format(date, 'yyyy-MM-dd') : '')}
                  disabled={(date) => dateFrom && isValid(parseISO(dateFrom)) ? date < parseISO(dateFrom) : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="occupancy">{isAr ? 'نسبة الإشغال' : 'Occupancy %'}</option>
              <option value="revenue">{isAr ? 'الإيرادات' : 'Revenue'}</option>
              <option value="departure">{isAr ? 'تاريخ المغادرة' : 'Departure Date'}</option>
              <option value="available">{isAr ? 'المقاعد المتاحة' : 'Seats Available'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{isAr ? 'المسار' : 'Route'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'الناقل' : 'Airline'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'المغادرة' : 'Departure'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'الإجمالي' : 'Total'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'محجوز' : 'Booked'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'متاح' : 'Available'}</th>
                <th className="text-start p-3 font-medium min-w-[160px]">{isAr ? 'الإشغال' : 'Occupancy'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'الإيرادات' : 'Revenue'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'المزود' : 'Provider'}</th>
                <th className="p-3 w-8" />
              </tr>
            </thead>
            {paginatedTrips.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={11} className="p-12 text-center text-muted-foreground">
                    {isAr ? 'لا توجد رحلات مطابقة' : 'No matching flights'}
                  </td>
                </tr>
              </tbody>
            ) : (
              paginatedTrips.map((trip) => {
                const isExpanded = expandedTrip === trip.id
                const tripConfirmedBookings = trip.bookings.filter((b) => b.status === 'confirmed')

                return (
                  <tbody key={trip.id}>
                      <tr
                        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setExpandedTrip(isExpanded ? null : trip.id)}
                      >
                        <td className="p-3">
                          <div className="font-medium">{routeShort(trip)}</div>
                          <div className="text-xs text-muted-foreground">
                            {isAr ? trip.origin_city_ar : trip.origin_city_en} → {isAr ? trip.destination_city_ar : trip.destination_city_en}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>{trip.airline}</div>
                          <div className="text-xs text-muted-foreground">{trip.flight_number}</div>
                        </td>
                        <td className="p-3 whitespace-nowrap">{formatDate(trip.departure_at)}</td>
                        <td className="p-3 font-medium">{trip.total_seats}</td>
                        <td className="p-3 font-medium">{trip.booked_seats}</td>
                        <td className="p-3 font-medium">{trip.available_seats}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', occupancyColor(trip.occupancy))}
                                style={{ width: `${Math.min(trip.occupancy, 100)}%` }}
                              />
                            </div>
                            <span className={cn('text-xs font-semibold w-10 text-end', occupancyTextColor(trip.occupancy))}>
                              {Math.round(trip.occupancy)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-medium whitespace-nowrap">
                          {trip.revenue > 0 ? `${trip.revenue.toLocaleString()} ${cur}` : '-'}
                        </td>
                        <td className="p-3">{statusBadge(trip.status)}</td>
                        <td className="p-3 text-sm">{providerName(trip)}</td>
                        <td className="p-3">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-muted/20">
                          <td colSpan={11} className="p-0">
                            <div className="p-5 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg border p-4">
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {isAr ? 'إجمالي الحجوزات' : 'Total Bookings'}
                                  </p>
                                  <p className="text-2xl font-bold">{trip.bookings.length}</p>
                                </div>
                                <div className="bg-white rounded-lg border p-4">
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {isAr ? 'الحجوزات المؤكدة' : 'Confirmed Bookings'}
                                  </p>
                                  <p className="text-2xl font-bold text-emerald-600">{tripConfirmedBookings.length}</p>
                                </div>
                                <div className="bg-white rounded-lg border p-4">
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {isAr ? 'إجمالي المسافرين' : 'Total Passengers'}
                                  </p>
                                  <p className="text-2xl font-bold">
                                    {tripConfirmedBookings.reduce((s, b) => s + b.seats_count, 0)}
                                  </p>
                                </div>
                              </div>

                              {trip.bookings.length > 0 ? (
                                <div>
                                  <h4 className="font-medium text-sm mb-2">
                                    {isAr ? 'سجل الحجوزات' : 'Booking Timeline'}
                                  </h4>
                                  <div className="bg-white rounded-lg border overflow-hidden">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b bg-muted/30">
                                          <th className="text-start p-2.5 font-medium text-xs">
                                            {isAr ? 'التاريخ' : 'Date'}
                                          </th>
                                          <th className="text-start p-2.5 font-medium text-xs">
                                            {isAr ? 'المقاعد' : 'Seats'}
                                          </th>
                                          <th className="text-start p-2.5 font-medium text-xs">
                                            {isAr ? 'المبلغ' : 'Amount'}
                                          </th>
                                          <th className="text-start p-2.5 font-medium text-xs">
                                            {isAr ? 'العمولة' : 'Commission'}
                                          </th>
                                          <th className="text-start p-2.5 font-medium text-xs">
                                            {isAr ? 'الحالة' : 'Status'}
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {trip.bookings
                                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                          .map((booking) => {
                                            const bookingStatusStyles: Record<string, string> = {
                                              confirmed: 'bg-emerald-100 text-emerald-800',
                                              payment_processing: 'bg-blue-100 text-blue-800',
                                              cancelled: 'bg-gray-100 text-gray-800',
                                              refunded: 'bg-orange-100 text-orange-800',
                                              rejected: 'bg-red-100 text-red-800',
                                              payment_failed: 'bg-red-100 text-red-800',
                                            }
                                            const bookingStatusLabels: Record<string, string> = isAr
                                              ? {
                                                  confirmed: 'مؤكد',
                                                  payment_processing: 'قيد المعالجة',
                                                  cancelled: 'ملغي',
                                                  refunded: 'مسترد',
                                                  rejected: 'مرفوض',
                                                  payment_failed: 'فشل الدفع',
                                                }
                                              : {
                                                  confirmed: 'Confirmed',
                                                  payment_processing: 'Processing',
                                                  cancelled: 'Cancelled',
                                                  refunded: 'Refunded',
                                                  rejected: 'Rejected',
                                                  payment_failed: 'Failed',
                                                }

                                            return (
                                              <tr key={booking.id} className="border-b last:border-0 hover:bg-muted/20">
                                                <td className="p-2.5 text-xs whitespace-nowrap">
                                                  {formatDate(booking.created_at)}
                                                </td>
                                                <td className="p-2.5">{booking.seats_count}</td>
                                                <td className="p-2.5 whitespace-nowrap">
                                                  {Number(booking.total_amount).toLocaleString()} {cur}
                                                </td>
                                                <td className="p-2.5 whitespace-nowrap">
                                                  {Number(booking.commission_amount).toLocaleString()} {cur}
                                                </td>
                                                <td className="p-2.5">
                                                  <span
                                                    className={cn(
                                                      'px-2 py-0.5 rounded-full text-xs font-medium',
                                                      bookingStatusStyles[booking.status] || 'bg-gray-100 text-gray-600'
                                                    )}
                                                  >
                                                    {bookingStatusLabels[booking.status] || booking.status}
                                                  </span>
                                                </td>
                                              </tr>
                                            )
                                          })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  {isAr ? 'لا توجد حجوزات لهذه الرحلة' : 'No bookings for this flight'}
                                </p>
                              )}

                              {tripConfirmedBookings.length >= 2 && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2">
                                    {isAr ? 'اتجاه عدد المسافرين' : 'Passenger Count Trend'}
                                  </h4>
                                  <div className="bg-white rounded-lg border p-4">
                                    <div className="flex items-end gap-1 h-24">
                                      {tripConfirmedBookings
                                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                        .reduce<{ date: string; cumulative: number }[]>((acc, b) => {
                                          const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0
                                          acc.push({
                                            date: new Date(b.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                            }),
                                            cumulative: prev + b.seats_count,
                                          })
                                          return acc
                                        }, [])
                                        .map((point, idx, arr) => {
                                          const maxVal = arr[arr.length - 1]?.cumulative || 1
                                          const heightPct = (point.cumulative / maxVal) * 100
                                          return (
                                            <div
                                              key={idx}
                                              className="flex-1 flex flex-col items-center justify-end gap-1"
                                            >
                                              <span className="text-[10px] font-medium text-muted-foreground">
                                                {point.cumulative}
                                              </span>
                                              <div
                                                className="w-full max-w-[32px] bg-primary/80 rounded-t transition-all duration-500"
                                                style={{ height: `${Math.max(heightPct, 4)}%` }}
                                              />
                                              <span className="text-[9px] text-muted-foreground truncate max-w-full">
                                                {point.date}
                                              </span>
                                            </div>
                                          )
                                        })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                  </tbody>
                )
              })
            )}
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              {isAr
                ? `عرض ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filtered.length)} من ${filtered.length}`
                : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-muted/50 transition-colors"
              >
                {isAr ? 'السابق' : 'Previous'}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true
                  if (page === 1 || page === totalPages) return true
                  if (Math.abs(page - currentPage) <= 1) return true
                  return false
                })
                .reduce<(number | string)[]>((acc, page, idx, arr) => {
                  if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                    acc.push('...')
                  }
                  acc.push(page)
                  return acc
                }, [])
                .map((item, idx) =>
                  typeof item === 'string' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={cn(
                        'w-8 h-8 text-sm rounded-lg transition-colors',
                        currentPage === item ? 'bg-primary text-white' : 'hover:bg-muted/50'
                      )}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-muted/50 transition-colors"
              >
                {isAr ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
