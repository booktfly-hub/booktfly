'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { ChevronDown, ChevronUp, Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlightRequest } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  reviewed: { ar: 'تمت المراجعة', en: 'Reviewed' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
}

const CABIN_LABELS: Record<string, { ar: string; en: string }> = {
  economy: { ar: 'اقتصادية', en: 'Economy' },
  business: { ar: 'رجال الأعمال', en: 'Business' },
  first: { ar: 'الدرجة الأولى', en: 'First Class' },
}

export default function FlightRequestsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [requests, setRequests] = useState<FlightRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/flight-requests')
      const data = await res.json()
      setRequests(data.requests || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleAction = async (id: string, status: 'reviewed' | 'cancelled') => {
    setSubmitting(id)
    const res = await fetch(`/api/admin/flight-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    })
    if (res.ok) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status, admin_notes: adminNotes || null } : r))
      setAdminNotes('')
      setExpandedId(null)
    }
    setSubmitting(null)
  }

  const filtered = statusFilter ? requests.filter(r => r.status === statusFilter) : requests
  const statuses = ['', 'pending', 'reviewed', 'cancelled']

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{pick(locale, 'طلبات الرحلات', 'Flight Requests', 'Uçuş Talepleri')}</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === s ? 'bg-accent text-accent-foreground border-accent' : 'bg-white hover:bg-muted border-border'
            }`}
          >
            {s ? (isAr ? STATUS_LABELS[s].ar : STATUS_LABELS[s].en) : (pick(locale, 'الكل', 'All', 'Tümü'))}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8 text-muted-foreground">{pick(locale, 'جارٍ التحميل...', 'Loading...', 'Yükleniyor...')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">{pick(locale, 'لا توجد نتائج', 'No results', 'Sonuç yok')}</div>
        ) : (
          filtered.map(req => (
            <div key={req.id} className="bg-white rounded-xl border overflow-hidden">
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {req.origin} → {req.destination}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {req.name} • {req.phone} • {req.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(req.created_at).toLocaleString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'))}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', STATUS_COLORS[req.status])}>
                    {isAr ? STATUS_LABELS[req.status].ar : STATUS_LABELS[req.status].en}
                  </span>
                  <button
                    onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    {expandedId === req.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {expandedId === req.id && (
                <div className="border-t p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {[
                      { label: pick(locale, 'تاريخ المغادرة', 'Departure', 'Kalkış'), value: req.departure_date },
                      { label: pick(locale, 'تاريخ العودة', 'Return', 'Dönüş'), value: req.return_date || '—' },
                      { label: pick(locale, 'عدد المقاعد', 'Seats', 'Koltuklar'), value: req.seats_needed },
                      { label: pick(locale, 'درجة السفر', 'Cabin', 'Kabin'), value: isAr ? CABIN_LABELS[req.cabin_class].ar : CABIN_LABELS[req.cabin_class].en },
                      { label: pick(locale, 'الميزانية القصوى', 'Max Budget', 'Maks Bütçe'), value: req.budget_max ? `${req.budget_max} SAR` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        <p className="font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </div>

                  {req.notes && (
                    <div className="bg-sky-50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">{pick(locale, 'ملاحظات', 'Notes', 'Notlar')}</p>
                      <p className="text-sm">{req.notes}</p>
                    </div>
                  )}

                  {req.status === 'pending' && (
                    <div className="space-y-3 pt-4 border-t">
                      <textarea
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                        rows={2}
                        placeholder={pick(locale, 'ملاحظة للإدارة (اختياري)...', 'Admin note (optional)...', 'Yönetici notu (isteğe bağlı)...')}
                        className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAction(req.id, 'reviewed')}
                          disabled={submitting === req.id}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {submitting === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          {pick(locale, 'تمت المراجعة', 'Mark Reviewed', 'İncelendi Olarak İşaretle')}
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'cancelled')}
                          disabled={submitting === req.id}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-300 disabled:opacity-50 transition-colors"
                        >
                          {submitting === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          {pick(locale, 'إلغاء', 'Cancel', 'İptal')}
                        </button>
                      </div>
                    </div>
                  )}

                  {req.admin_notes && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">{pick(locale, 'ملاحظة الإدارة', 'Admin Note', 'Yönetici Notu')}</p>
                      <p className="text-sm">{req.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
