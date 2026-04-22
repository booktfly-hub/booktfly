'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import { Eye, FileSignature, Printer } from 'lucide-react'

type BookingRow = {
  id: string
  passenger_name: string
  seats_count: number
  total_amount: number
  commission_amount: number
  provider_payout: number
  status: string
  created_at: string
  contract_signed_at: string | null
  trip: { origin_city_ar: string; destination_city_ar: string; departure_at: string } | null
  provider: { company_name_ar: string } | null
}

export default function AdminBookings() {
  const t = useTranslations()
  const locale = useLocale()
  const supabase = createClient()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [contractFilter, setContractFilter] = useState<'all' | 'signed' | 'unsigned'>('all')

  useEffect(() => {
    async function fetch() {
      let query = supabase
        .from('bookings')
        .select('id, passenger_name, seats_count, total_amount, commission_amount, provider_payout, status, created_at, contract_signed_at, trip:trips(origin_city_ar, destination_city_ar, departure_at), provider:providers(company_name_ar)')
        .order('created_at', { ascending: false })

      if (statusFilter) query = query.eq('status', statusFilter)
      if (contractFilter === 'signed') query = query.not('contract_signed_at', 'is', null)
      else if (contractFilter === 'unsigned') query = query.is('contract_signed_at', null)

      const { data } = await query
      setBookings((data as unknown as BookingRow[]) || [])
      setLoading(false)
    }
    fetch()
  }, [statusFilter, contractFilter])

  const statuses = ['', 'confirmed', 'cancellation_pending', 'payment_processing', 'payment_failed', 'refunded', 'cancelled']
  const unsignedCount = bookings.filter(b => !b.contract_signed_at).length

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.bookings')}</h1>

      <div className="mb-3 overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex min-w-max gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === s ? 'bg-accent text-accent-foreground border-accent' : 'bg-white hover:bg-muted border-border'
              }`}
            >
              {s ? t(`status.${s}`) : locale === 'ar' ? 'الكل' : 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex min-w-max items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {locale === 'ar' ? 'العقد:' : 'Contract:'}
          </span>
          {(['all', 'signed', 'unsigned'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setContractFilter(f)}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors inline-flex items-center gap-1.5 ${
                contractFilter === f ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-muted border-border'
              }`}
            >
              {f === 'all' ? (locale === 'ar' ? 'الكل' : 'All') : f === 'signed' ? (locale === 'ar' ? 'موقّع' : 'Signed') : (locale === 'ar' ? 'غير موقّع' : 'Unsigned')}
            </button>
          ))}
          {unsignedCount > 0 && contractFilter !== 'signed' && (
            <span className="ml-2 shrink-0 whitespace-nowrap inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
              {unsignedCount} {locale === 'ar' ? 'غير موقّعة' : 'unsigned'}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="whitespace-nowrap text-start p-3 font-medium">{t('booking.passenger_name')}</th>
                <th className="whitespace-nowrap text-start p-3 font-medium">{locale === 'ar' ? 'الرحلة' : 'Trip'}</th>
                <th className="whitespace-nowrap text-start p-3 font-medium">{t('admin.providers')}</th>
                <th className="whitespace-nowrap text-start p-3 font-medium">{t('common.seats')}</th>
                <th className="whitespace-nowrap text-start p-3 font-medium">{t('common.total')}</th>
                <th className="whitespace-nowrap text-start p-3 font-medium">{t('admin.commissions')}</th>
                <th className="whitespace-nowrap text-start p-3 font-medium">{t('common.status')}</th>
                <th className="whitespace-nowrap text-start p-3 font-medium">{locale === 'ar' ? 'العقد' : 'Contract'}</th>
                <th className="whitespace-nowrap text-start p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{t('common.loading')}</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">{t('common.no_results')}</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="border-b hover:bg-muted/30">
                    <td className="whitespace-nowrap p-3 font-medium">{b.passenger_name}</td>
                    <td className="whitespace-nowrap p-3">{b.trip?.origin_city_ar} → {b.trip?.destination_city_ar}</td>
                    <td className="whitespace-nowrap p-3">{b.provider?.company_name_ar}</td>
                    <td className="whitespace-nowrap p-3">{b.seats_count}</td>
                    <td className="whitespace-nowrap p-3">{b.total_amount} {locale === 'ar' ? 'ر.س' : 'SAR'}</td>
                    <td className="whitespace-nowrap p-3">{b.commission_amount} {locale === 'ar' ? 'ر.س' : 'SAR'}</td>
                    <td className="whitespace-nowrap p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${BOOKING_STATUS_COLORS[b.status]}`}>
                        {t(`status.${b.status}`)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-3">
                      {b.contract_signed_at ? (
                        <Link
                          href={`/${locale}/contracts/print/booking/${b.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                          title={new Date(b.contract_signed_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
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
                    <td className="whitespace-nowrap p-3">
                      <Link
                        href={`/${locale}/admin/bookings/${b.id}`}
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
    </div>
  )
}
