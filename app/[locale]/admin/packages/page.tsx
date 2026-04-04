'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toaster'
import { PACKAGE_STATUS_COLORS } from '@/lib/constants'
import type { Package } from '@/types'
import { Trash2, Plane, BedDouble, CarFront } from 'lucide-react'

export default function AdminPackages() {
  const t = useTranslations()
  const locale = useLocale()
  const supabase = createClient()
  const [packages, setPackages] = useState<(Package & { provider: { company_name_ar: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const perPage = 20

  useEffect(() => {
    async function fetchPackages() {
      setLoading(true)
      let query = supabase
        .from('packages')
        .select('*, provider:providers(company_name_ar)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1)

      if (statusFilter) query = query.eq('status', statusFilter)

      const { data, count } = await query
      setPackages((data as any) || [])
      setTotal(count || 0)
      setLoading(false)
    }
    fetchPackages()
  }, [statusFilter, page])

  const handleRemove = async (packageId: string) => {
    if (!removeReason.trim()) return
    const res = await fetch(`/api/admin/packages/${packageId}/remove`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: removeReason }),
    })
    if (res.ok) {
      toast({ title: t('common.success'), variant: 'success' })
      setPackages((prev) => prev.map((p) => (p.id === packageId ? { ...p, status: 'removed' as const } : p)))
      setRemoveId(null)
      setRemoveReason('')
    }
  }

  const statuses = ['', 'active', 'deactivated', 'removed']
  const totalPages = Math.ceil(total / perPage)
  const isAr = locale === 'ar'

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{isAr ? 'إدارة الباقات' : 'Packages Management'}</h1>

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
                <th className="text-start p-3 font-medium">{isAr ? 'الباقة' : 'Package'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'الوجهة' : 'Destination'}</th>
                <th className="text-start p-3 font-medium">{t('admin.providers')}</th>
                <th className="text-start p-3 font-medium">{t('common.price')}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'يشمل' : 'Includes'}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{t('common.date')}</th>
                <th className="text-start p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{t('common.loading')}</td></tr>
              ) : packages.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{t('common.no_results')}</td></tr>
              ) : (
                packages.map((pkg) => {
                  const pkgName = isAr ? pkg.name_ar : (pkg.name_en || pkg.name_ar)
                  const destination = isAr ? pkg.destination_city_ar : (pkg.destination_city_en || pkg.destination_city_ar)
                  return (
                    <tr key={pkg.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{pkgName}</td>
                      <td className="p-3">{destination}</td>
                      <td className="p-3">{(pkg.provider as any)?.company_name_ar}</td>
                      <td className="p-3">
                        {pkg.total_price} {isAr ? 'ر.س' : 'SAR'}
                        {pkg.original_price && pkg.original_price > pkg.total_price && (
                          <span className="text-xs text-muted-foreground line-through ms-2">
                            {pkg.original_price}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {pkg.includes_flight && <Plane className="h-4 w-4 text-blue-500" title={isAr ? 'طيران' : 'Flight'} />}
                          {pkg.includes_hotel && <BedDouble className="h-4 w-4 text-amber-500" title={isAr ? 'فندق' : 'Hotel'} />}
                          {pkg.includes_car && <CarFront className="h-4 w-4 text-green-500" title={isAr ? 'سيارة' : 'Car'} />}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PACKAGE_STATUS_COLORS[pkg.status]}`}>
                          {t(`status.${pkg.status}`)}
                        </span>
                      </td>
                      <td className="p-3">{new Date(pkg.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</td>
                      <td className="p-3">
                        {pkg.status === 'active' && (
                          <>
                            {removeId === pkg.id ? (
                              <div className="flex gap-2">
                                <input
                                  value={removeReason}
                                  onChange={(e) => setRemoveReason(e.target.value)}
                                  placeholder={isAr ? 'سبب الإزالة' : 'Remove reason'}
                                  className="p-1.5 text-xs border rounded w-32"
                                />
                                <button onClick={() => handleRemove(pkg.id)} className="text-xs text-destructive hover:underline">
                                  {t('common.confirm')}
                                </button>
                                <button onClick={() => setRemoveId(null)} className="text-xs hover:underline">
                                  {t('common.cancel')}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRemoveId(pkg.id)}
                                className="inline-flex items-center gap-1 text-destructive hover:underline text-xs"
                              >
                                <Trash2 className="h-3 w-3" />
                                {isAr ? 'إزالة' : 'Remove'}
                              </button>
                            )}
                          </>
                        )}
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
