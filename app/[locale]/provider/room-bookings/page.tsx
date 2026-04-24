'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { cn, formatPrice, shortId } from '@/lib/utils'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge'
import { ContractPill } from '@/components/bookings/contract-pill'
import type { RoomBooking, BookingStatus } from '@/types'
import {
  BedDouble,
  Loader2,
  Filter,
} from 'lucide-react'

const VALID_STATUSES: BookingStatus[] = [
  'confirmed',
  'payment_processing',
  'payment_failed',
  'refunded',
  'cancelled',
  'rejected',
]

export default function ProviderRoomBookingsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const t = useTranslations('provider')
  const ts = useTranslations('status')
  const tc = useTranslations('common')

  const [bookings, setBookings] = useState<RoomBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')

  useEffect(() => {
    fetchBookings()
  }, [statusFilter])

  async function fetchBookings() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/room-bookings/provider?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const statusOptions: (BookingStatus | 'all')[] = ['all', ...VALID_STATUSES]

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          {pick(locale, 'حجوزات الغرف', 'Room Bookings', 'Oda Rezervasyonları')}
        </h1>
        <p className="text-slate-500 font-medium">
          {pick(locale, 'إدارة جميع حجوزات الغرف الواردة', 'Manage all incoming room bookings', 'Gelen tüm oda rezervasyonlarını yönetin')}
        </p>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
          <Filter className="h-4 w-4 text-slate-400" />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300',
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              {status === 'all' ? tc('view_all') : ts(status)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center flex flex-col items-center shadow-sm">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <BedDouble className="h-10 w-10 text-slate-300" />
          </div>
          <p className="text-xl font-bold text-slate-900 mb-2">
            {pick(locale, 'لا توجد حجوزات بعد', 'No bookings yet', 'Henüz rezervasyon yok')}
          </p>
          <p className="text-slate-500">
            {pick(locale, 'ستظهر حجوزات الغرف هنا عند استلامها', 'Room bookings will appear here when received', 'Oda rezervasyonları alındığında burada görünecek')}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'الضيف', 'Guest', 'Misafir')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'الغرفة', 'Room', 'Oda')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'تسجيل الدخول', 'Check-in', 'Giriş')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'المدة', 'Days', 'Gün')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'الغرف', 'Rooms', 'Odalar')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {tc('total')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {t('platform_commission')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {tc('status')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'العقد', 'Contract', 'Sözleşme')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {tc('date')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-slate-900">{booking.guest_name}</p>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {shortId(booking.id)}
                      </p>
                    </td>
                    <td className="p-5">
                      <span className="font-medium text-slate-700">
                        {booking.room
                          ? (isAr ? booking.room.name_ar : booking.room.name_en || booking.room.name_ar)
                          : '-'}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="inline-flex px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 font-medium text-slate-700">
                        {new Date(booking.check_in_date).toLocaleDateString(
                          pick(locale, 'ar-SA', 'en-US', 'tr-TR'),
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="font-bold text-slate-900">
                        {booking.number_of_days} {pick(locale, 'ليالي', 'nights', 'gece')}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className="font-medium text-slate-700">{booking.rooms_count}</span>
                    </td>
                    <td className="p-5">
                      <span className="font-black text-slate-900">
                        {formatPrice(booking.total_amount, booking.room?.currency)}
                      </span>
                    </td>
                    <td className="p-5 text-slate-500">
                      {formatPrice(booking.commission_amount, booking.room?.currency)}
                    </td>
                    <td className="p-5">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="p-5">
                      <ContractPill signedAt={booking.contract_signed_at} targetType="room_booking" bookingId={booking.id} />
                    </td>
                    <td className="p-5 text-slate-500 text-xs">
                      {new Date(booking.created_at).toLocaleDateString(
                        pick(locale, 'ar-SA', 'en-US', 'tr-TR')
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
