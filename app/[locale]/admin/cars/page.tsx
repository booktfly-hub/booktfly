'use client'

import { pick, lkey } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toaster'
import { CAR_STATUS_COLORS, CAR_CATEGORIES } from '@/lib/constants'
import type { Car } from '@/types'
import { Trash2 } from 'lucide-react'

export default function AdminCars() {
  const t = useTranslations()
  const locale = useLocale()
  const supabase = createClient()
  const [cars, setCars] = useState<(Car & { provider: { company_name_ar: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const perPage = 20

  useEffect(() => {
    async function fetchCars() {
      let query = supabase
        .from('cars')
        .select('*, provider:providers(company_name_ar)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1)

      if (statusFilter) query = query.eq('status', statusFilter)

      const { data, count } = await query
      setCars((data as any) || [])
      setTotal(count || 0)
      setLoading(false)
    }
    fetchCars()
  }, [statusFilter, page])

  const handleRemove = async (carId: string) => {
    if (!removeReason.trim()) return
    const res = await fetch(`/api/admin/cars/${carId}/remove`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: removeReason }),
    })
    if (res.ok) {
      toast({ title: t('common.success'), variant: 'success' })
      setCars((prev) => prev.map((c) => (c.id === carId ? { ...c, status: 'removed' as const } : c)))
      setRemoveId(null)
      setRemoveReason('')
    }
  }

  const statuses = ['', 'active', 'deactivated', 'removed']
  const totalPages = Math.ceil(total / perPage)
  const isAr = locale === 'ar'

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{pick(locale, 'إدارة السيارات', 'Cars Management', 'Araç Yönetimi')}</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === s ? 'bg-accent text-accent-foreground border-accent' : 'bg-white hover:bg-muted border-border'
            }`}
          >
            {s ? t(`status.${s}`) : pick(locale, 'الكل', 'All', 'Tümü')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{pick(locale, 'السيارة', 'Car', 'Araç')}</th>
                <th className="text-start p-3 font-medium">{pick(locale, 'المدينة', 'City', 'Şehir')}</th>
                <th className="text-start p-3 font-medium">{pick(locale, 'الفئة', 'Category', 'Kategori')}</th>
                <th className="text-start p-3 font-medium">{t('admin.providers')}</th>
                <th className="text-start p-3 font-medium">{t('common.price')}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t('common.loading')}</td></tr>
              ) : cars.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t('common.no_results')}</td></tr>
              ) : (
                cars.map((car) => {
                  const carName = pick(locale, `${car.brand_ar} ${car.model_ar}`, `${car.brand_en || car.brand_ar} ${car.model_en || car.model_ar}`)
                  return (
                    <tr key={car.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">
                        {carName}
                        <span className="text-xs text-muted-foreground ms-2">{car.year}</span>
                      </td>
                      <td className="p-3">{isAr ? car.city_ar : (car.city_en || car.city_ar)}</td>
                      <td className="p-3">{CAR_CATEGORIES[car.category as keyof typeof CAR_CATEGORIES]?.[lkey(locale)] || car.category}</td>
                      <td className="p-3">{(car.provider as any)?.company_name_ar}</td>
                      <td className="p-3">{car.price_per_day} {pick(locale, 'ر.س', 'SAR', 'SAR')}/{pick(locale, 'يوم', 'day', 'gün')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${CAR_STATUS_COLORS[car.status]}`}>
                          {t(`status.${car.status}`)}
                        </span>
                      </td>
                      <td className="p-3">
                        {car.status === 'active' && (
                          <>
                            {removeId === car.id ? (
                              <div className="flex gap-2">
                                <input
                                  value={removeReason}
                                  onChange={(e) => setRemoveReason(e.target.value)}
                                  placeholder={pick(locale, 'سبب الإزالة', 'Remove reason', 'Kaldırma nedeni')}
                                  className="p-1.5 text-xs border rounded w-32"
                                />
                                <button onClick={() => handleRemove(car.id)} className="text-xs text-destructive hover:underline">
                                  {t('common.confirm')}
                                </button>
                                <button onClick={() => setRemoveId(null)} className="text-xs hover:underline">
                                  {t('common.cancel')}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRemoveId(car.id)}
                                className="inline-flex items-center gap-1 text-destructive hover:underline text-xs"
                              >
                                <Trash2 className="h-3 w-3" />
                                {pick(locale, 'إزالة', 'Remove', 'Kaldır')}
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
            {pick(locale, 'السابق', 'Previous', 'Önceki')}
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm border bg-white hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {pick(locale, 'التالي', 'Next', 'İleri')}
          </button>
        </div>
      )}
    </div>
  )
}
