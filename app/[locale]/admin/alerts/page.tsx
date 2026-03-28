'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { AlertTriangle, AlertCircle, Info, X, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react'

type AdminAlert = {
  id: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  title_ar: string
  title_en: string
  body_ar: string | null
  body_en: string | null
  metadata: Record<string, any> | null
  dismissed: boolean
  dismissed_by: string | null
  dismissed_at: string | null
  created_at: string
  dismisser?: { full_name: string } | null
}

type FilterTab = 'active' | 'all' | 'critical' | 'dismissed'

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 }
const PER_PAGE = 20

function relativeTime(dateStr: string, locale: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (locale === 'ar') {
    if (diffMin < 1) return 'الآن'
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`
    if (diffHr < 24) return `منذ ${diffHr} ساعة`
    if (diffDay < 30) return `منذ ${diffDay} يوم`
    return date.toLocaleDateString('ar-SA')
  }

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 30) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US')
}

function SeverityIcon({ severity, className }: { severity: string; className?: string }) {
  if (severity === 'critical') return <AlertTriangle className={cn('w-5 h-5', className)} />
  if (severity === 'warning') return <AlertCircle className={cn('w-5 h-5', className)} />
  return <Info className={cn('w-5 h-5', className)} />
}

export default function AdminAlerts() {
  const t = useTranslations()
  const locale = useLocale()
  const supabase = createClient()
  const [alerts, setAlerts] = useState<AdminAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('active')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set())
  const [newAlertIds, setNewAlertIds] = useState<Set<string>>(new Set())
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('admin_alerts')
      .select('*, dismisser:profiles!dismissed_by(full_name)', { count: 'exact' })

    if (filter === 'active') query = query.eq('dismissed', false)
    else if (filter === 'critical') query = query.eq('severity', 'critical')
    else if (filter === 'dismissed') query = query.eq('dismissed', true)

    query = query
      .order('created_at', { ascending: false })
      .range(page * PER_PAGE, (page + 1) * PER_PAGE - 1)

    const { data, count } = await query
    const sorted = ((data as AdminAlert[]) || []).sort((a, b) => {
      const sevDiff = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
      if (sevDiff !== 0) return sevDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    setAlerts(sorted)
    setTotal(count || 0)
    setLoading(false)
  }, [filter, page])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  useEffect(() => {
    channelRef.current = supabase
      .channel('admin-alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_alerts' },
        (payload) => {
          const newAlert = payload.new as AdminAlert
          setNewAlertIds((prev) => new Set(prev).add(newAlert.id))
          setAlerts((prev) => {
            const merged = [newAlert, ...prev]
            return merged.sort((a, b) => {
              const sevDiff = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
              if (sevDiff !== 0) return sevDiff
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })
          })
          setTotal((prev) => prev + 1)
          setTimeout(() => {
            setNewAlertIds((prev) => {
              const next = new Set(prev)
              next.delete(newAlert.id)
              return next
            })
          }, 3000)
        }
      )
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [])

  const dismissAlert = async (id: string) => {
    setDismissingIds((prev) => new Set(prev).add(id))
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, dismissed: true, dismissed_at: new Date().toISOString() } : a))
    )

    try {
      await fetch('/api/admin/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: id, dismissed: true }),
      })
    } catch {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, dismissed: false, dismissed_at: null } : a))
      )
    } finally {
      setDismissingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const dismissAll = async () => {
    const activeAlerts = alerts.filter((a) => !a.dismissed)
    const ids = activeAlerts.map((a) => a.id)
    setDismissingIds(new Set(ids))
    setAlerts((prev) =>
      prev.map((a) =>
        ids.includes(a.id) ? { ...a, dismissed: true, dismissed_at: new Date().toISOString() } : a
      )
    )

    try {
      await Promise.all(
        ids.map((id) =>
          fetch('/api/admin/alerts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alertId: id, dismissed: true }),
          })
        )
      )
    } catch {
      fetchAlerts()
    } finally {
      setDismissingIds(new Set())
    }
  }

  const activeAlerts = alerts.filter((a) => !a.dismissed)
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length
  const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length
  const infoCount = activeAlerts.filter((a) => a.severity === 'info').length
  const totalPages = Math.ceil(total / PER_PAGE)

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'active', label: locale === 'ar' ? 'النشطة' : 'Active' },
    { key: 'all', label: locale === 'ar' ? 'الكل' : 'All' },
    { key: 'critical', label: locale === 'ar' ? 'حرجة' : 'Critical' },
    { key: 'dismissed', label: locale === 'ar' ? 'المرفوضة' : 'Dismissed' },
  ]

  const getTitle = (alert: AdminAlert) => (locale === 'ar' ? alert.title_ar : alert.title_en)
  const getBody = (alert: AdminAlert) => (locale === 'ar' ? alert.body_ar : alert.body_en)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{locale === 'ar' ? 'التنبيهات' : 'Alerts'}</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilter(tab.key)
              setPage(0)
            }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
              filter === tab.key
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-white hover:bg-muted border-border'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-semibold text-red-700">{criticalCount}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-700">{warningCount}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700">{infoCount}</span>
        </div>
        {activeAlerts.length > 0 && (
          <button
            onClick={dismissAll}
            className="ms-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 border border-border transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            {locale === 'ar' ? 'رفض الكل' : 'Dismiss All'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {locale === 'ar' ? 'لا توجد تنبيهات' : 'No alerts found'}
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'critical'
            const isWarning = alert.severity === 'warning'
            const isNew = newAlertIds.has(alert.id)

            return (
              <div
                key={alert.id}
                className={cn(
                  'relative rounded-xl border p-4 transition-all duration-300',
                  isCritical && 'border-s-4 border-s-red-500',
                  isWarning && 'border-s-4 border-s-amber-500',
                  !isCritical && !isWarning && 'border-s-4 border-s-blue-500',
                  isCritical && !alert.dismissed && 'bg-red-50/60',
                  isWarning && !alert.dismissed && 'bg-amber-50/60',
                  !isCritical && !isWarning && !alert.dismissed && 'bg-blue-50/60',
                  alert.dismissed && 'opacity-60 bg-muted/30',
                  isNew && 'ring-2 ring-accent animate-pulse'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'mt-0.5 shrink-0',
                      isCritical && 'text-red-600',
                      isWarning && 'text-amber-600',
                      !isCritical && !isWarning && 'text-blue-600'
                    )}
                  >
                    <SeverityIcon severity={alert.severity} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1',
                            isCritical && 'bg-red-100 text-red-700',
                            isWarning && 'bg-amber-100 text-amber-700',
                            !isCritical && !isWarning && 'bg-blue-100 text-blue-700'
                          )}
                        >
                          {alert.severity === 'critical'
                            ? locale === 'ar'
                              ? 'حرج'
                              : 'Critical'
                            : alert.severity === 'warning'
                              ? locale === 'ar'
                                ? 'تحذير'
                                : 'Warning'
                              : locale === 'ar'
                                ? 'معلومات'
                                : 'Info'}
                        </span>
                        <h3 className="font-semibold text-foreground">{getTitle(alert)}</h3>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {relativeTime(alert.created_at, locale)}
                      </span>
                    </div>

                    {getBody(alert) && (
                      <p className="text-sm text-muted-foreground mt-1">{getBody(alert)}</p>
                    )}

                    {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(alert.metadata).map(([key, value]) => (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background/80 border text-xs"
                          >
                            <span className="font-medium text-muted-foreground">{key}:</span>
                            <span>{String(value)}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {alert.dismissed && alert.dismissed_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {locale === 'ar' ? 'تم الرفض' : 'Dismissed'}
                        {alert.dismisser?.full_name && ` ${locale === 'ar' ? 'بواسطة' : 'by'} ${alert.dismisser.full_name}`}
                        {' · '}
                        {relativeTime(alert.dismissed_at, locale)}
                      </p>
                    )}
                  </div>

                  {!alert.dismissed && (
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      disabled={dismissingIds.has(alert.id)}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      title={locale === 'ar' ? 'رفض' : 'Dismiss'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground px-3">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
