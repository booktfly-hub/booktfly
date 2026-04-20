'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import { Eye, FileSignature, Printer } from 'lucide-react'

type RoomBookingRow = {
  id: string
  guest_name: string
  rooms_count: number
  total_amount: number
  commission_amount: number
  provider_payout: number
  status: string
  created_at: string
  contract_signed_at: string | null
  room: { name_ar: string; name_en: string | null } | null
  provider: { company_name_ar: string } | null
}

export default function AdminRoomBookings() {
  const t = useTranslations()
  const locale = useLocale()
  const supabase = createClient()
  const [bookings, setBookings] = useState<RoomBookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [contractFilter, setContractFilter] = useState<'all' | 'signed' | 'unsigned'>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const perPage = 20

  useEffect(() => {
    async function fetchBookings() {
      let query = supabase
        .from('room_bookings')
        .select('id, guest_name, rooms_count, total_amount, commission_amount, provider_payout, status, created_at, contract_signed_at, room:rooms(name_ar, name_en), provider:providers(company_name_ar)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1)

      if (statusFilter) query = query.eq('status', statusFilter)
      if (contractFilter === 'signed') query = query.not('contract_signed_at', 'is', null)
      else if (contractFilter === 'unsigned') query = query.is('contract_signed_at', null)

      const { data, count } = await query
      setBookings((data as unknown as RoomBookingRow[]) || [])
      setTotal(count || 0)
      setLoading(false)
    }
    fetchBookings()
  }, [statusFilter, contractFilter, page])

  const statuses = ['', 'payment_processing', 'confirmed', 'payment_failed', 'refunded', 'cancelled', 'cancellation_pending']
  const totalPages = Math.ceil(total / perPage)
  const unsignedCount = bookings.filter(b => !b.contract_signed_at).length

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{locale === 'ar' ? 'حجوزات الغرف' : 'Room Bookings'}</h1>

      <div className="flex gap-2 mb-3 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === s ? 'bg-accent text-accent-foreground border-accent' : 'bg-white hover:bg-muted border-border'
            }`}
          >
            {s ? t(`status.${s}`) : locale === 'ar' ? 'الكل' : 'All'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {locale === 'ar' ? 'العقد:' : 'Contract:'}
        </span>
        {(['all', 'signed', 'unsigned'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setContractFilter(f); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors inline-flex items-center gap-1.5 ${
              contractFilter === f ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-muted border-border'
            }`}
          >
            {f === 'all' ? (locale === 'ar' ? 'الكل' : 'All') : f === 'signed' ? (locale === 'ar' ? 'موقّع' : 'Signed') : (locale === 'ar' ? 'غير موقّع' : 'Unsigned')}
          </button>
        ))}
        {unsignedCount > 0 && contractFilter !== 'signed' && (
          <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
            {unsignedCount} {locale === 'ar' ? 'غير موقّعة' : 'unsigned'}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{locale === 'ar' ? 'اسم الضيف' : 'Guest Name'}</th>
                <th className="text-start p-3 font-medium">{locale === 'ar' ? 'الغرفة' : 'Room'}</th>
                <th className="text-start p-3 font-medium">{t('admin.providers')}</th>
                <th className="text-start p-3 font-medium">{locale === 'ar' ? 'عدد الغرف' : 'Rooms'}</th>
                <th className="text-start p-3 font-medium">{t('common.total')}</th>
                <th className="text-start p-3 font-medium">{t('admin.commissions')}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{locale === 'ar' ? 'العقد' : 'Contract'}</th>
                <th className="text-start p-3 font-medium">{t('common.date')}</th>
                <th className="text-start p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">{t('common.loading')}</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">{t('common.no_results')}</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{b.guest_name}</td>
                    <td className="p-3">{locale === 'ar' ? b.room?.name_ar : (b.room?.name_en || b.room?.name_ar)}</td>
                    <td className="p-3">{b.provider?.company_name_ar}</td>
                    <td className="p-3">{b.rooms_count}</td>
                    <td className="p-3">{b.total_amount} {locale === 'ar' ? 'ر.س' : 'SAR'}</td>
                    <td className="p-3">{b.commission_amount} {locale === 'ar' ? 'ر.س' : 'SAR'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${BOOKING_STATUS_COLORS[b.status]}`}>
                        {t(`status.${b.status}`)}
                      </span>
                    </td>
                    <td className="p-3">
                      {b.contract_signed_at ? (
                        <Link
                          href={`/${locale}/contracts/print/room_booking/${b.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                        >
                          <FileSignature className="h-3 w-3" />
                          {locale === 'ar' ? 'موقّع' : 'Signed'}
                          <Printer className="h-3 w-3 opacity-70" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-500 border border-slate-200">
                          {locale === 'ar' ? 'غير موقّع' : 'Unsigned'}
                        </span>
                      )}
                    </td>
                    <td className="p-3">{new Date(b.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                    <td className="p-3">
                      <Link
                        href={`/${locale}/admin/room-bookings/${b.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 font-medium text-primary transition-colors hover:bg-muted"
                      >
                        <Eye className="h-4 w-4" />
                        {locale === 'ar' ? 'تفاصيل' : 'Details'}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm border bg-white hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {locale === 'ar' ? 'السابق' : 'Previous'}
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm border bg-white hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {locale === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}
