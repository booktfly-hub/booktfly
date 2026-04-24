'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import type { BookingStatus } from '@/types'
import { Package as PackageIcon, Loader2, Filter } from 'lucide-react'
import { ContractPill } from '@/components/bookings/contract-pill'

type PackageBookingRow = {
  id: string
  guest_name: string
  number_of_people: number
  start_date: string
  end_date: string
  total_amount: number
  commission_amount: number
  provider_payout: number
  status: string
  created_at: string
  contract_signed_at: string | null
  package: { name_ar: string; name_en: string | null } | null
}

const STATUSES: (BookingStatus | 'all')[] = ['all', 'payment_processing', 'confirmed', 'payment_failed', 'cancelled', 'cancellation_pending']

export default function ProviderPackageBookingsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const t = useTranslations()
  const tc = useTranslations('common')

  const [bookings, setBookings] = useState<PackageBookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      try {
        const res = await fetch(`/api/package-bookings/provider?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setBookings(data.bookings || [])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [statusFilter])

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          {pick(locale, 'حجوزات الباقات', 'Package Bookings', 'Paket Rezervasyonları')}
        </h1>
        <p className="text-slate-500 font-medium">
          {pick(locale, 'إدارة حجوزات باقاتك', 'Manage your package bookings', 'Paket rezervasyonlarınızı yönetin')}
        </p>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
          <Filter className="h-4 w-4 text-slate-400" />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
          {STATUSES.map((status) => (
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
              {status === 'all' ? tc('view_all') : t(`status.${status}`)}
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
            <PackageIcon className="h-10 w-10 text-slate-300" />
          </div>
          <p className="text-xl font-bold text-slate-900 mb-2">
            {pick(locale, 'لا توجد حجوزات بعد', 'No bookings yet', 'Henüz rezervasyon yok')}
          </p>
          <p className="text-slate-500">
            {pick(locale, 'ستظهر حجوزات باقاتك هنا', 'Your package bookings will appear here', 'Paket rezervasyonlarınız burada görünecek')}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{pick(locale, 'الضيف', 'Guest', 'Misafir')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{pick(locale, 'الباقة', 'Package', 'Paket')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{pick(locale, 'عدد الأشخاص', 'People', 'Kişi')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{pick(locale, 'التواريخ', 'Dates', 'Tarihler')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{tc('total')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{pick(locale, 'حصتك', 'Your Payout', 'Ödemeniz')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{tc('status')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{pick(locale, 'العقد', 'Contract', 'Sözleşme')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{tc('date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const pkgName = b.package
                    ? isAr
                      ? b.package.name_ar
                      : (b.package.name_en || b.package.name_ar)
                    : '-'
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 font-bold text-slate-900">{b.guest_name}</td>
                      <td className="p-5 text-slate-700">{pkgName}</td>
                      <td className="p-5 text-slate-700">{b.number_of_people}</td>
                      <td className="p-5 text-slate-700">
                        <div className="text-xs">
                          <span>{b.start_date}</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span>{b.end_date}</span>
                        </div>
                      </td>
                      <td className="p-5 font-bold text-slate-900">{b.total_amount} {pick(locale, 'ر.س', 'SAR', 'SAR')}</td>
                      <td className="p-5 font-bold text-emerald-600">{b.provider_payout} {pick(locale, 'ر.س', 'SAR', 'SAR')}</td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${BOOKING_STATUS_COLORS[b.status]}`}>
                          {t(`status.${b.status}`)}
                        </span>
                      </td>
                      <td className="p-5">
                        <ContractPill signedAt={b.contract_signed_at} targetType="package_booking" bookingId={b.id} />
                      </td>
                      <td className="p-5 text-slate-500">{new Date(b.created_at).toLocaleDateString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
