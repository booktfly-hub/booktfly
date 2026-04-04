'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import { Eye } from 'lucide-react'

type PackageBookingRow = {
  id: string
  guest_name: string
  number_of_people: number
  total_amount: number
  commission_amount: number
  provider_payout: number
  status: string
  created_at: string
  start_date: string
  end_date: string
  package: { name_ar: string; name_en: string | null } | null
  provider: { company_name_ar: string } | null
}

export default function AdminPackageBookings() {
  const t = useTranslations()
  const locale = useLocale()
  const supabase = createClient()
  const [bookings, setBookings] = useState<PackageBookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const perPage = 20

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true)
      let query = supabase
        .from('package_bookings')
        .select('id, guest_name, number_of_people, total_amount, commission_amount, provider_payout, status, created_at, start_date, end_date, package:packages(name_ar, name_en), provider:providers(company_name_ar)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1)

      if (statusFilter) query = query.eq('status', statusFilter)

      const { data, count } = await query
      setBookings((data as any) || [])
      setTotal(count || 0)
      setLoading(false)
    }
    fetchBookings()
  }, [statusFilter, page])

  const statuses = ['', 'payment_processing', 'confirmed', 'payment_failed', 'refunded', 'cancelled', 'cancellation_pending']
  const totalPages = Math.ceil(total / perPage)
  const isAr = locale === 'ar'

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{isAr ? 'حجوزات الباقات' : 'Package Bookings'}</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === s ? 'bg-accent text-accent-foreground border-accent' : 'bg-white hover:bg-muted border-border'
            }`}
          >
            {s ? t(`status.${s}`) : isAr ? 'الكل' : 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{isAr ? 'اسم الضيف' : 'Guest Name'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'الباقة' : 'Package'}</th>
                <th className="text-start p-3 font-medium">{t('admin.providers')}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'عدد الأشخاص' : 'People'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'التواريخ' : 'Dates'}</th>
                <th className="text-start p-3 font-medium">{t('common.total')}</th>
                <th className="text-start p-3 font-medium">{t('admin.commissions')}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
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
                bookings.map((b) => {
                  const pkgName = b.package
                    ? isAr
                      ? b.package.name_ar
                      : (b.package.name_en || b.package.name_ar)
                    : '-'
                  return (
                    <tr key={b.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{b.guest_name}</td>
                      <td className="p-3">{pkgName}</td>
                      <td className="p-3">{b.provider?.company_name_ar}</td>
                      <td className="p-3">{b.number_of_people}</td>
                      <td className="p-3 text-xs">
                        <div>{b.start_date}</div>
                        <div className="text-muted-foreground">{b.end_date}</div>
                      </td>
                      <td className="p-3">{b.total_amount} {isAr ? 'ر.س' : 'SAR'}</td>
                      <td className="p-3">{b.commission_amount} {isAr ? 'ر.س' : 'SAR'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${BOOKING_STATUS_COLORS[b.status]}`}>
                          {t(`status.${b.status}`)}
                        </span>
                      </td>
                      <td className="p-3">{new Date(b.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</td>
                      <td className="p-3">
                        <Link
                          href={`/${locale}/admin/package-bookings/${b.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 font-medium text-primary transition-colors hover:bg-muted"
                        >
                          <Eye className="h-4 w-4" />
                          {isAr ? 'تفاصيل' : 'Details'}
                        </Link>
                      </td>
                    </tr>
                  )
                })
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
            {isAr ? 'السابق' : 'Previous'}
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm border bg-white hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {isAr ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}
