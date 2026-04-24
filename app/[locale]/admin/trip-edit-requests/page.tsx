'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { EDIT_REQUEST_STATUS_COLORS } from '@/lib/constants'
import { toast } from '@/components/ui/toaster'
import { Check, X, Loader2, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type EditRequest = {
  id: string
  trip_id: string
  provider_id: string
  changes: Record<string, unknown>
  status: string
  admin_comment: string | null
  created_at: string
  trip: {
    origin_city_ar: string
    origin_city_en: string | null
    destination_city_ar: string
    destination_city_en: string | null
    airline: string
    provider: { company_name_ar: string; company_name_en: string | null } | null
  } | null
}

export default function TripEditRequestsPage() {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [requests, setRequests] = useState<EditRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function fetchRequests() {
      const res = await fetch('/api/admin/trip-edit-requests')
      const data = await res.json()
      setRequests(data.requests || [])
      setLoading(false)
    }
    fetchRequests()
  }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setSubmitting(id)
    const res = await fetch(`/api/admin/trip-edit-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comment: action === 'reject' ? rejectComment : undefined }),
    })
    if (res.ok) {
      toast({ title: t('common.success'), variant: 'success' })
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r))
      setRejectComment('')
    } else {
      toast({ title: t('errors.generic'), variant: 'destructive' })
    }
    setSubmitting(null)
  }

  const filtered = statusFilter ? requests.filter((r) => r.status === statusFilter) : requests

  const statuses = ['', 'pending', 'approved', 'rejected']

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{pick(locale, 'طلبات تعديل الرحلات', 'Trip Edit Requests', 'Gezi Düzenleme Talepleri')}</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === s ? 'bg-accent text-accent-foreground border-accent' : 'bg-white hover:bg-muted border-border'
            }`}
          >
            {s ? t(`status.${s === 'pending' ? 'pending_review' : s}`) : pick(locale, 'الكل', 'All', 'Tümü')}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8 text-muted-foreground">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">{t('common.no_results')}</div>
        ) : (
          filtered.map((req) => (
            <div key={req.id} className="bg-white rounded-xl border overflow-hidden">
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {req.trip ? `${isAr ? req.trip.origin_city_ar : (req.trip.origin_city_en || req.trip.origin_city_ar)} → ${isAr ? req.trip.destination_city_ar : (req.trip.destination_city_en || req.trip.destination_city_ar)}` : req.trip_id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {req.trip?.airline} • {req.trip?.provider ? (isAr ? req.trip.provider.company_name_ar : (req.trip.provider.company_name_en || req.trip.provider.company_name_ar)) : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(req.created_at).toLocaleString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'))}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', EDIT_REQUEST_STATUS_COLORS[req.status] || '')}>
                    {t(`status.${req.status === 'pending' ? 'pending_review' : req.status}`)}
                  </span>
                  <button onClick={() => setExpandedId(expandedId === req.id ? null : req.id)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    {expandedId === req.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {expandedId === req.id && (
                <div className="border-t p-5 space-y-4">
                  <h4 className="font-semibold text-sm">{pick(locale, 'التعديلات المطلوبة', 'Requested Changes', 'Talep Edilen Değişiklikler')}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(req.changes).map(([key, value]) => (
                      <div key={key} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-muted-foreground text-xs mb-1">{key}</p>
                        <p className="font-medium break-all">{value === null ? '-' : String(value)}</p>
                      </div>
                    ))}
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <button
                        onClick={() => handleAction(req.id, 'approve')}
                        disabled={submitting === req.id}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success text-white text-sm font-medium hover:bg-success/90 disabled:opacity-50 transition-colors"
                      >
                        {submitting === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {t('admin.approve')}
                      </button>
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          value={rejectComment}
                          onChange={(e) => setRejectComment(e.target.value)}
                          placeholder={pick(locale, 'سبب الرفض...', 'Rejection reason...', 'Red nedeni...')}
                          className="flex-1 border rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() => handleAction(req.id, 'reject')}
                          disabled={submitting === req.id}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                        >
                          {submitting === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          {t('admin.reject')}
                        </button>
                      </div>
                    </div>
                  )}

                  {req.admin_comment && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">{pick(locale, 'ملاحظة الإدارة', 'Admin Comment', 'Yönetici Yorumu')}</p>
                      <p className="text-sm">{req.admin_comment}</p>
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
