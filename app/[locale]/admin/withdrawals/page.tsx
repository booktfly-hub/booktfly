'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { resolveApiErrorMessage } from '@/lib/api-error'
import { WITHDRAWAL_STATUS_COLORS } from '@/lib/constants'
import { toast } from '@/components/ui/toaster'
import { cn, formatPrice } from '@/lib/utils'
import { Check, X, Loader2, Banknote } from 'lucide-react'

type WithdrawalRow = {
  id: string
  provider_id: string
  amount: number
  provider_iban: string
  status: string
  admin_comment: string | null
  created_at: string
  reviewed_at: string | null
  provider: { company_name_ar: string; company_name_en: string | null; iban: string | null; contact_email: string } | null
}

export default function AdminWithdrawalsPage() {
  const t = useTranslations()
  const te = useTranslations('errors')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [commentMap, setCommentMap] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/admin/withdrawals')
      const data = await res.json()
      setWithdrawals(data.withdrawals || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setSubmitting(id)
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comment: commentMap[id] || undefined }),
    })
    if (res.ok) {
      toast({ title: t('common.success'), variant: 'success' })
      setWithdrawals((prev) =>
        prev.map((w) => w.id === id ? { ...w, status: action === 'approve' ? 'completed' : 'rejected' } : w)
      )
    } else {
      const err = await res.json()
      toast({ title: resolveApiErrorMessage(err.error, te), variant: 'destructive' })
    }
    setSubmitting(null)
  }

  const statuses = ['', 'pending', 'completed', 'rejected']
  const filtered = statusFilter ? withdrawals.filter((w) => w.status === statusFilter) : withdrawals

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Banknote className="h-6 w-6" />
        {isAr ? 'طلبات السحب' : 'Withdrawal Requests'}
      </h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === s ? 'bg-accent text-accent-foreground border-accent' : 'bg-white hover:bg-muted border-border'
            }`}
          >
            {s ? (s === 'pending' ? (isAr ? 'قيد المراجعة' : 'Pending')
              : s === 'completed' ? (isAr ? 'مكتمل' : 'Completed')
              : (isAr ? 'مرفوض' : 'Rejected'))
              : (isAr ? 'الكل' : 'All')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{isAr ? 'مزود الخدمة' : 'Provider'}</th>
                <th className="text-start p-3 font-medium">{isAr ? 'المبلغ' : 'Amount'}</th>
                <th className="text-start p-3 font-medium">IBAN</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{t('common.date')}</th>
                <th className="text-start p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t('common.loading')}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t('common.no_results')}</td></tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{isAr ? w.provider?.company_name_ar : (w.provider?.company_name_en || w.provider?.company_name_ar)}</td>
                    <td className="p-3 font-bold">{formatPrice(w.amount)}</td>
                    <td className="p-3 font-mono text-xs">{w.provider_iban}</td>
                    <td className="p-3">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', WITHDRAWAL_STATUS_COLORS[w.status] || '')}>
                        {w.status === 'pending' ? (isAr ? 'قيد المراجعة' : 'Pending')
                          : w.status === 'completed' ? (isAr ? 'مكتمل' : 'Completed')
                          : (isAr ? 'مرفوض' : 'Rejected')}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {new Date(w.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="p-3">
                      {w.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAction(w.id, 'approve')}
                            disabled={submitting === w.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-medium hover:bg-success/90 disabled:opacity-50"
                          >
                            {submitting === w.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            {t('admin.approve')}
                          </button>
                          <input
                            value={commentMap[w.id] || ''}
                            onChange={(e) => setCommentMap((prev) => ({ ...prev, [w.id]: e.target.value }))}
                            placeholder={isAr ? 'ملاحظة...' : 'Comment...'}
                            className="w-24 border rounded px-2 py-1 text-xs"
                          />
                          <button
                            onClick={() => handleAction(w.id, 'reject')}
                            disabled={submitting === w.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-medium hover:bg-destructive/90 disabled:opacity-50"
                          >
                            <X className="h-3 w-3" />
                            {t('admin.reject')}
                          </button>
                        </div>
                      )}
                      {w.admin_comment && (
                        <p className="text-xs text-muted-foreground mt-1">{w.admin_comment}</p>
                      )}
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
