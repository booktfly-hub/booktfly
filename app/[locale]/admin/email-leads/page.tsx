'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Search, Loader2, Download, Mail, UserPlus, PlaneTakeoff, ChevronLeft, ChevronRight } from 'lucide-react'

type LeadSource = 'profile' | 'flight_request'

type Lead = {
  email: string
  name: string | null
  phone: string | null
  source: LeadSource
  created_at: string
}

const PAGE_SIZE = 25

export default function AdminEmailLeadsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const supabase = createClient()

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState<'all' | LeadSource>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(0)
    }, 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [searchQuery])

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: profiles }, { data: requests }] = await Promise.all([
      supabase
        .from('profiles')
        .select('email, full_name, phone, created_at')
        .not('email', 'is', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('flight_requests')
        .select('email, name, phone, created_at')
        .not('email', 'is', null)
        .order('created_at', { ascending: false }),
    ])

    const merged: Record<string, Lead> = {}
    ;(profiles || []).forEach((p) => {
      const e = (p.email || '').toLowerCase().trim()
      if (!e) return
      merged[e] = {
        email: e,
        name: p.full_name || null,
        phone: p.phone || null,
        source: 'profile',
        created_at: p.created_at,
      }
    })
    ;(requests || []).forEach((r) => {
      const e = (r.email || '').toLowerCase().trim()
      if (!e) return
      if (!merged[e]) {
        merged[e] = {
          email: e,
          name: r.name || null,
          phone: r.phone || null,
          source: 'flight_request',
          created_at: r.created_at,
        }
      }
    })

    setLeads(Object.values(merged).sort((a, b) => b.created_at.localeCompare(a.created_at)))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return leads.filter((l) => {
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false
      if (!q) return true
      return (
        l.email.includes(q) ||
        (l.name || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q)
      )
    })
  }, [leads, sourceFilter, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const exportCsv = () => {
    const header = ['Email', 'Name', 'Phone', 'Source', 'Created']
    const rows = filtered.map((l) => [
      l.email,
      l.name || '',
      l.phone || '',
      l.source,
      l.created_at,
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sourceCount = useMemo(() => ({
    profile: leads.filter((l) => l.source === 'profile').length,
    flight_request: leads.filter((l) => l.source === 'flight_request').length,
  }), [leads])

  const tabs: { value: 'all' | LeadSource; label: string; count: number }[] = [
    { value: 'all', label: pick(locale, 'الكل', 'All', 'Tümü'), count: leads.length },
    { value: 'profile', label: pick(locale, 'حسابات', 'Accounts', 'Hesaplar'), count: sourceCount.profile },
    { value: 'flight_request', label: pick(locale, 'طلبات رحلات', 'Flight Requests', 'Uçuş Talepleri'), count: sourceCount.flight_request },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{pick(locale, 'قائمة البريد الإلكتروني', 'Email Leads', 'E-posta Müşteri Adayları')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pick(locale, 'كل من دخل الموقع وترك بريده الإلكتروني', 'Everyone who visited the site and shared their email', 'Siteyi ziyaret eden ve e-postasını paylaşan herkes')}
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          {pick(locale, 'تصدير CSV', 'Export CSV', 'CSV Dışa Aktar')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border bg-white p-5">
          <div className="inline-flex rounded-xl bg-blue-50 p-2.5 mb-3">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">{leads.length.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{pick(locale, 'إجمالي البريد الفريد', 'Total Unique Emails', 'Toplam Benzersiz E-posta')}</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="inline-flex rounded-xl bg-emerald-50 p-2.5 mb-3">
            <UserPlus className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold">{sourceCount.profile.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{pick(locale, 'حسابات مسجلة', 'Registered Accounts', 'Kayıtlı Hesaplar')}</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="inline-flex rounded-xl bg-amber-50 p-2.5 mb-3">
            <PlaneTakeoff className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold">{sourceCount.flight_request.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{pick(locale, 'طلبات رحلات', 'Flight Requests', 'Uçuş Talepleri')}</p>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div className="relative w-full max-w-lg">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={pick(locale, 'بحث بالبريد أو الاسم أو الهاتف...', 'Search email, name or phone...', 'E-posta, ad veya telefon ara...')}
            className="w-full rounded-lg border bg-white px-3 ps-9 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setSourceFilter(tab.value); setPage(0) }}
              className={cn(
                'shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                sourceFilter === tab.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border text-slate-600 hover:bg-slate-50'
              )}
            >
              {tab.label} <span className="opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{pick(locale, 'البريد', 'Email', 'E-posta')}</th>
                <th className="text-start p-3 font-medium">{pick(locale, 'الاسم', 'Name', 'Ad')}</th>
                <th className="text-start p-3 font-medium">{pick(locale, 'الهاتف', 'Phone', 'Telefon')}</th>
                <th className="text-start p-3 font-medium">{pick(locale, 'المصدر', 'Source', 'Kaynak')}</th>
                <th className="text-start p-3 font-medium">{pick(locale, 'التاريخ', 'Date', 'Tarih')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  {pick(locale, 'جاري التحميل...', 'Loading...', 'Yükleniyor...')}
                </td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">
                  {pick(locale, 'لا توجد نتائج', 'No results', 'Sonuç yok')}
                </td></tr>
              ) : (
                pageRows.map((l) => (
                  <tr key={l.email} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium text-slate-900">{l.email}</td>
                    <td className="p-3 text-slate-600">{l.name || '—'}</td>
                    <td className="p-3 font-mono text-xs text-slate-600">{l.phone || '—'}</td>
                    <td className="p-3">
                      <span className={cn(
                        'inline-flex px-2 py-0.5 rounded-md text-xs font-medium',
                        l.source === 'profile' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                      )}>
                        {l.source === 'profile'
                          ? (pick(locale, 'حساب', 'Account', 'Hesap'))
                          : (pick(locale, 'طلب رحلة', 'Flight Request', 'Uçuş Talebi'))}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 text-xs">
                      {new Date(l.created_at).toLocaleDateString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-slate-500">
              {pick(locale, `عرض ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} من ${filtered.length}`, `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}`)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
                {pick(locale, 'السابق', 'Prev', 'Önceki')}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-slate-50"
              >
                {pick(locale, 'التالي', 'Next', 'İleri')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
