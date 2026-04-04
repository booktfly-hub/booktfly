'use client'

import { useEffect, useState, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { resolveApiErrorMessage } from '@/lib/api-error'
import { toast } from '@/components/ui/toaster'
import {
  Loader2,
  Plus,
  Upload,
  Trash2,
  Users,
  X,
} from 'lucide-react'

type Customer = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  source: string
  created_at: string
}

export default function MarketeerCustomersPage() {
  const t = useTranslations('marketeer_customers')
  const tc = useTranslations('common')
  const te = useTranslations('errors')
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [importing, setImporting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/marketeers/customers')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!formData.name && !formData.email) {
      toast({ title: isAr ? 'الاسم أو البريد مطلوب' : 'Name or email is required', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/marketeers/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast({ title: tc('success'), variant: 'success' })
        setFormData({ name: '', email: '', phone: '' })
        setShowAddForm(false)
        fetchCustomers()
      } else {
        toast({ title: tc('error'), variant: 'destructive' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('delete_confirm'))) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/marketeers/customers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCustomers((prev) => prev.filter((c) => c.id !== id))
        toast({ title: tc('success'), variant: 'success' })
      } else {
        toast({ title: tc('error'), variant: 'destructive' })
      }
    } finally {
      setDeletingId(null)
    }
  }

  async function handleImport(file: File) {
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/marketeers/customers/import', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: `${isAr ? 'تم استيراد' : 'Imported'} ${data.imported} ${isAr ? 'عميل' : 'customers'}`, variant: 'success' })
        fetchCustomers()
      } else {
        toast({ title: resolveApiErrorMessage(data.error, te), variant: 'destructive' })
      }
    } finally {
      setImporting(false)
    }
  }

  const manualCount = customers.filter((c) => c.source === 'manual').length
  const excelCount = customers.filter((c) => c.source === 'excel').length
  const referralCount = customers.filter((c) => c.source === 'referral').length

  const sourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      manual: 'bg-slate-100 text-slate-600',
      excel: 'bg-blue-50 text-blue-600',
      referral: 'bg-emerald-50 text-emerald-600',
    }
    const labels: Record<string, string> = {
      manual: isAr ? 'يدوي' : 'Manual',
      excel: isAr ? 'استيراد' : 'Import',
      referral: isAr ? 'إحالة' : 'Referral',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${colors[source] || 'bg-slate-100 text-slate-600'}`}>
        {labels[source] || source}
      </span>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('title')}</h1>
          <p className="text-slate-500 font-medium">{isAr ? 'إدارة قائمة عملائك' : 'Manage your customer list'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            {t('add_customer')}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? (isAr ? 'جاري الاستيراد...' : 'Importing...') : t('import_csv')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('total'), count: customers.length, color: 'bg-slate-900 text-white' },
          { label: isAr ? 'يدوي' : 'Manual', count: manualCount, color: 'bg-white border border-slate-200 text-slate-900' },
          { label: isAr ? 'استيراد' : 'Imported', count: excelCount, color: 'bg-white border border-slate-200 text-blue-600' },
          { label: isAr ? 'إحالة' : 'Referral', count: referralCount, color: 'bg-white border border-slate-200 text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl p-5 ${stat.color} shadow-sm`}>
            <p className="text-2xl font-black">{stat.count}</p>
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">{t('add_customer')}</h3>
            <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-slate-100 rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{t('name')}</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{t('email')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{t('phone')}</label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={submitting}
            className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isAr ? 'إضافة' : 'Add'}
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center flex flex-col items-center shadow-sm">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-slate-300" />
          </div>
          <p className="text-xl font-bold text-slate-900 mb-2">{t('no_customers')}</p>
          <p className="text-slate-500">{t('add_first')}</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{t('name')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{t('email')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{t('phone')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{t('source')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs">{tc('date')}</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-widest text-xs text-end">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-bold text-slate-900">{c.name || '-'}</td>
                    <td className="p-5 text-slate-700" dir="ltr">{c.email || '-'}</td>
                    <td className="p-5 text-slate-700" dir="ltr">{c.phone || '-'}</td>
                    <td className="p-5">{sourceBadge(c.source)}</td>
                    <td className="p-5 text-slate-500">{new Date(c.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</td>
                    <td className="p-5 text-end">
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all shadow-sm disabled:opacity-50"
                      >
                        {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
