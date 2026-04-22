'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toaster'
import { Flag, CheckCircle2, XCircle, Eye } from 'lucide-react'
import type { TripReport } from '@/types'

type ReportRow = TripReport & {
  trip: {
    id: string
    origin_city_ar: string
    destination_city_ar: string
    origin_city_en: string | null
    destination_city_en: string | null
    status: string
  } | null
}

const STATUS_TABS: Array<{ value: TripReport['status'] | ''; labelAr: string; labelEn: string }> = [
  { value: 'open', labelAr: 'مفتوحة', labelEn: 'Open' },
  { value: 'reviewing', labelAr: 'قيد المراجعة', labelEn: 'Reviewing' },
  { value: 'resolved', labelAr: 'محلولة', labelEn: 'Resolved' },
  { value: 'dismissed', labelAr: 'مرفوضة', labelEn: 'Dismissed' },
  { value: '', labelAr: 'الكل', labelEn: 'All' },
]

export default function AdminReports() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const supabase = createClient()
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<TripReport['status'] | ''>('open')

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase
        .from('trip_reports')
        .select('*, trip:trips(id, origin_city_ar, destination_city_ar, origin_city_en, destination_city_en, status)')
        .order('created_at', { ascending: false })

      if (statusFilter) query = query.eq('status', statusFilter)

      const { data } = await query
      setRows((data as ReportRow[]) || [])
      setLoading(false)
    }
    load()
  }, [statusFilter, supabase])

  const patchStatus = async (id: string, status: TripReport['status']) => {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      toast({ title: isAr ? 'فشل التحديث' : 'Update failed', variant: 'destructive' })
      return
    }
    const data = (await res.json()) as TripReport
    setRows((prev) =>
      statusFilter && data.status !== statusFilter
        ? prev.filter((r) => r.id !== id)
        : prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    )
    toast({ title: isAr ? 'تم التحديث' : 'Updated', variant: 'success' })
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Flag className="h-6 w-6 text-destructive" />
        <h1 className="text-2xl font-bold">{isAr ? 'بلاغات الرحلات' : 'Trip Reports'}</h1>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === tab.value ? 'bg-accent text-accent-foreground border-accent' : 'bg-white hover:bg-muted border-border'
            }`}
          >
            {isAr ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{isAr ? 'الرحلة' : 'Trip'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'السبب' : 'Reason'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'التفاصيل' : 'Details'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'المبلّغ' : 'Reporter'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'تاريخ' : 'Date'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{isAr ? 'لا توجد بلاغات' : 'No reports'}</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30 align-top">
                    <td className="p-3">
                      {r.trip ? (
                        <Link href={`/${locale}/trips/${r.trip.id}`} target="_blank" className="text-primary hover:underline font-medium">
                          {isAr
                            ? `${r.trip.origin_city_ar} → ${r.trip.destination_city_ar}`
                            : `${r.trip.origin_city_en || r.trip.origin_city_ar} → ${r.trip.destination_city_en || r.trip.destination_city_ar}`}
                        </Link>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                        {r.reason}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs text-muted-foreground">{r.details || '—'}</td>
                    <td className="p-3 text-xs">{r.reporter_email || (r.reporter_id ? 'User' : 'Anon')}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'open' ? 'bg-red-50 text-red-700' :
                        r.status === 'reviewing' ? 'bg-amber-50 text-amber-700' :
                        r.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {r.status === 'open' && (
                          <button
                            onClick={() => patchStatus(r.id, 'reviewing')}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-muted"
                            title={isAr ? 'قيد المراجعة' : 'Start reviewing'}
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        )}
                        {r.status !== 'resolved' && r.status !== 'dismissed' && (
                          <>
                            <button
                              onClick={() => patchStatus(r.id, 'resolved')}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {isAr ? 'حل' : 'Resolve'}
                            </button>
                            <button
                              onClick={() => patchStatus(r.id, 'dismissed')}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-muted"
                            >
                              <XCircle className="h-3 w-3" />
                              {isAr ? 'رفض' : 'Dismiss'}
                            </button>
                          </>
                        )}
                      </div>
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
