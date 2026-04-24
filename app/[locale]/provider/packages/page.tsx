'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { cn, formatPrice } from '@/lib/utils'
import { PACKAGE_STATUS_COLORS } from '@/lib/constants'
import type { Package, PackageStatus } from '@/types'
import {
  Plus,
  Package as PackageIcon,
  Eye,
  Loader2,
  Power,
  Filter,
  Plane,
  BedDouble,
  CarFront,
  MapPin,
} from 'lucide-react'

const VALID_STATUSES: PackageStatus[] = ['active', 'deactivated', 'removed']

export default function ProviderPackagesPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const ts = useTranslations('status')
  const tc = useTranslations('common')

  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'all'>('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPackages()
  }, [statusFilter])

  async function fetchPackages() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/packages/my-packages?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPackages(data.packages || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleStatus(pkg: Package) {
    if (pkg.status !== 'active' && pkg.status !== 'deactivated') return
    setTogglingId(pkg.id)
    try {
      const res = await fetch(`/api/packages/${pkg.id}/deactivate`, { method: 'PATCH' })
      if (res.ok) fetchPackages()
    } finally {
      setTogglingId(null)
    }
  }

  const statusOptions: (PackageStatus | 'all')[] = ['all', ...VALID_STATUSES]

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {pick(locale, 'باقاتي', 'My Packages', 'Paketlerim')}
          </h1>
          <p className="text-slate-500 font-medium">
            {pick(locale, 'إدارة جميع باقاتك وحالاتها', 'Manage all your packages and their statuses', 'Tüm paketlerinizi ve durumlarını yönetin')}
          </p>
        </div>
        <Link
          href={`/${locale}/provider/packages/new`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-base font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          {pick(locale, 'باقة جديدة', 'New Package', 'Yeni Paket')}
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
      ) : packages.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center flex flex-col items-center shadow-sm">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <PackageIcon className="h-10 w-10 text-slate-300" />
          </div>
          <p className="text-xl font-bold text-slate-900 mb-2">
            {pick(locale, 'لا توجد باقات بعد', 'No packages yet', 'Henüz paket yok')}
          </p>
          <p className="text-slate-500 mb-8">
            {pick(locale, 'قم بإضافة باقتك الأولى للبدء في تلقي الحجوزات', 'Add your first package to start receiving bookings', 'Rezervasyon almaya başlamak için ilk paketinizi ekleyin')}
          </p>
          <Link
            href={`/${locale}/provider/packages/new`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-base font-bold hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            {pick(locale, 'أضف أول باقة', 'Post Your First Package', 'İlk Paketinizi Yayınlayın')}
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'الباقة', 'Package', 'Paket')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'الوجهة', 'Destination', 'Varış')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'يشمل', 'Includes', 'İçerir')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {tc('price')}
                  </th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">
                    {pick(locale, 'الحجوزات', 'Bookings', 'Rezervasyonlar')}
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
                {packages.map((pkg) => {
                  const pkgName = isAr ? pkg.name_ar : (pkg.name_en || pkg.name_ar)
                  const destination = isAr ? pkg.destination_city_ar : (pkg.destination_city_en || pkg.destination_city_ar)

                  return (
                    <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-0">
                        <Link
                          href={`/${locale}/provider/packages/${pkg.id}`}
                          className="flex items-center gap-3 p-5"
                        >
                          {pkg.images && pkg.images.length > 0 ? (
                            <img
                              src={pkg.images[0]}
                              alt={pkgName}
                              className="h-12 w-12 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <PackageIcon className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 text-base mb-0.5">{pkgName}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {destination}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          {pkg.includes_flight && (
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-sky-50 text-sky-600" title={pick(locale, 'طيران', 'Flight', 'Uçuş')}>
                              <Plane className="h-4 w-4" />
                            </span>
                          )}
                          {pkg.includes_hotel && (
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-amber-50 text-amber-600" title={pick(locale, 'فندق', 'Hotel', 'Otel')}>
                              <BedDouble className="h-4 w-4" />
                            </span>
                          )}
                          {pkg.includes_car && (
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600" title={pick(locale, 'سيارة', 'Car', 'Araç')}>
                              <CarFront className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-5">
                        <div>
                          <span className="font-black text-slate-900 text-base">
                            {formatPrice(pkg.total_price, pkg.currency)}
                          </span>
                          {pkg.original_price && pkg.original_price > pkg.total_price && (
                            <span className="block text-xs text-slate-400 line-through">
                              {formatPrice(pkg.original_price, pkg.currency)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="font-medium text-slate-700">
                          {pkg.current_bookings} / {pkg.max_bookings}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-bold',
                          pkg.status === 'active' && 'bg-emerald-50 text-emerald-600',
                          pkg.status === 'deactivated' && 'bg-amber-50 text-amber-600',
                          pkg.status === 'removed' && 'bg-red-50 text-red-600',
                        )}>
                          {ts(pkg.status)}
                        </span>
                      </td>
                      <td className="p-5 text-end">
                        <div className="flex items-center justify-end gap-2">
                          {(pkg.status === 'active' || pkg.status === 'deactivated') && (
                            <button
                              onClick={() => handleToggleStatus(pkg)}
                              disabled={togglingId === pkg.id}
                              className={cn(
                                'inline-flex items-center justify-center h-10 w-10 rounded-xl border transition-all shadow-sm',
                                pkg.status === 'active'
                                  ? 'bg-white border-amber-200 text-amber-500 hover:bg-amber-50 hover:border-amber-300'
                                  : 'bg-white border-emerald-200 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-300'
                              )}
                              title={pkg.status === 'active'
                                ? (pick(locale, 'تعطيل', 'Deactivate', 'Devre Dışı Bırak'))
                                : (pick(locale, 'تفعيل', 'Reactivate', 'Yeniden Etkinleştir'))}
                            >
                              {togglingId === pkg.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <Link
                            href={`/${locale}/provider/packages/${pkg.id}`}
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
