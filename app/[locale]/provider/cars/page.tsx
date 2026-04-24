'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { cn, formatPrice } from '@/lib/utils'
import { CAR_CATEGORIES } from '@/lib/constants'
import type { Car, CarStatus } from '@/types'
import {
  Plus,
  CarFront,
  Eye,
  Loader2,
  Power,
  Filter,
} from 'lucide-react'

const VALID_STATUSES: CarStatus[] = ['active', 'deactivated', 'removed']

export default function ProviderCarsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const t = useTranslations('provider')
  const ts = useTranslations('status')
  const tc = useTranslations('common')

  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<CarStatus | 'all'>('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCars()
  }, [statusFilter])

  async function fetchCars() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/cars/my-cars?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCars(data.cars || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleStatus(car: Car) {
    if (car.status !== 'active' && car.status !== 'deactivated') return
    setTogglingId(car.id)
    try {
      const res = await fetch(`/api/cars/${car.id}/deactivate`, { method: 'PATCH' })
      if (res.ok) fetchCars()
    } finally {
      setTogglingId(null)
    }
  }

  const statusOptions: (CarStatus | 'all')[] = ['all', ...VALID_STATUSES]

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {pick(locale, 'سياراتي', 'My Cars', 'Araçlarım')}
          </h1>
          <p className="text-slate-500 font-medium">
            {pick(locale, 'إدارة جميع سياراتك وحالاتها', 'Manage all your cars and their statuses', 'Tüm araçlarınızı ve durumlarını yönetin')}
          </p>
        </div>
        <Link
          href={`/${locale}/provider/cars/new`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-base font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          {pick(locale, 'سيارة جديدة', 'New Car', 'Yeni Araç')}
        </Link>
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
      ) : cars.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center flex flex-col items-center shadow-sm">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <CarFront className="h-10 w-10 text-slate-300" />
          </div>
          <p className="text-xl font-bold text-slate-900 mb-2">
            {pick(locale, 'لا توجد سيارات بعد', 'No cars yet', 'Henüz araç yok')}
          </p>
          <p className="text-slate-500 mb-8">
            {pick(locale, 'قم بإضافة سيارتك الأولى للبدء في تلقي الحجوزات', 'Add your first car to start receiving bookings', 'Rezervasyon almaya başlamak için ilk aracınızı ekleyin')}
          </p>
          <Link
            href={`/${locale}/provider/cars/new`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-base font-bold hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            {pick(locale, 'أضف أول سيارة', 'Post Your First Car', 'İlk Aracınızı Yayınlayın')}
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'السيارة', 'Car', 'Araç')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'المدينة', 'City', 'Şehir')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'الفئة', 'Category', 'Kategori')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {tc('price')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {tc('status')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs text-end">
                    {tc('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cars.map((car) => {
                  const categoryLabel = CAR_CATEGORIES[car.category as keyof typeof CAR_CATEGORIES]
                  const carName = pick(locale, `${car.brand_ar} ${car.model_ar}`, `${car.brand_en || car.brand_ar} ${car.model_en || car.model_ar}`)

                  return (
                    <tr key={car.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-0">
                        <Link
                          href={`/${locale}/provider/cars/${car.id}`}
                          className="flex items-center gap-3 p-5"
                        >
                          {car.images && car.images.length > 0 ? (
                            <img
                              src={car.images[0]}
                              alt={carName}
                              className="h-12 w-12 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <CarFront className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 text-base mb-0.5">{carName}</p>
                            <p className="text-xs text-slate-400">{car.year}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-5">
                        <span className="font-medium text-slate-700">
                          {isAr ? car.city_ar : car.city_en || car.city_ar}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className="inline-flex px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 font-medium text-slate-700 text-xs">
                          {categoryLabel ? (isAr ? categoryLabel.ar : categoryLabel.en) : car.category}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className="font-black text-slate-900 text-base">
                          {formatPrice(car.price_per_day, car.currency)}
                        </span>
                        <span className="text-xs text-slate-400 ms-1">
                          / {pick(locale, 'يوم', 'day', 'gün')}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-bold',
                          car.status === 'active' && 'bg-emerald-50 text-emerald-600',
                          car.status === 'deactivated' && 'bg-amber-50 text-amber-600',
                          car.status === 'removed' && 'bg-red-50 text-red-600',
                        )}>
                          {ts(car.status)}
                        </span>
                      </td>
                      <td className="p-5 text-end">
                        <div className="flex items-center justify-end gap-2">
                          {(car.status === 'active' || car.status === 'deactivated') && (
                            <button
                              onClick={() => handleToggleStatus(car)}
                              disabled={togglingId === car.id}
                              className={cn(
                                'inline-flex items-center justify-center h-10 w-10 rounded-xl border transition-all shadow-sm',
                                car.status === 'active'
                                  ? 'bg-white border-amber-200 text-amber-500 hover:bg-amber-50 hover:border-amber-300'
                                  : 'bg-white border-emerald-200 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-300'
                              )}
                              title={car.status === 'active'
                                ? (pick(locale, 'تعطيل', 'Deactivate', 'Devre Dışı Bırak'))
                                : (pick(locale, 'تفعيل', 'Reactivate', 'Yeniden Etkinleştir'))}
                            >
                              {togglingId === car.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <Link
                            href={`/${locale}/provider/cars/${car.id}`}
                            className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
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
