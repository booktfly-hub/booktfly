'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Wallet, Star, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { resolveApiErrorMessage } from '@/lib/api-error'

type WithdrawalRow = {
  id: string
  points: number
  sar_amount: number
  iban: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  admin_comment: string | null
  created_at: string
}

type WalletData = {
  balance: number
  sar_value: number
  sar_rate: number
  withdrawals: WithdrawalRow[]
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قيد المراجعة', en: 'Pending' },
  approved: { ar: 'موافق عليه', en: 'Approved' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
}

export default function MarkeeteerWalletPage() {
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const te = useTranslations('errors')
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [iban, setIban] = useState('')
  const [points, setPoints] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/marketeers/wallet', { headers: { 'Accept-Language': locale } })
      .then((r) => r.json())
      .then((res) => setWalletData(res.data ?? null))
      .finally(() => setLoading(false))
  }, [locale])

  useEffect(() => { load() }, [load])

  async function handleWithdraw() {
    const pts = parseInt(points)
    if (!iban.trim() || isNaN(pts) || pts < 100) {
      toast({ title: isAr ? 'أدخل IBAN صحيح و100 نقطة على الأقل' : 'Enter valid IBAN and at least 100 points', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/marketeers/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': locale },
        body: JSON.stringify({ iban, points: pts }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast({ title: resolveApiErrorMessage(result.error, te), variant: 'destructive' })
        return
      }
      toast({ title: isAr ? 'تم إرسال طلب السحب' : 'Withdrawal request submitted', variant: 'success' })
      setShowForm(false)
      setIban('')
      setPoints('')
      load()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!walletData) return null

  const { balance, sar_value, sar_rate, withdrawals } = walletData
  const pts = parseInt(points)
  const estimatedSar = !isNaN(pts) && pts > 0 ? (pts * sar_rate).toFixed(2) : null

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {isAr ? 'المحفظة' : 'Wallet'}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {isAr ? 'رصيدك وطلبات سحب الأرباح' : 'Your balance and withdrawal requests'}
        </p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-5">
            <Star className="h-7 w-7 text-yellow-500" />
          </div>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">{balance.toLocaleString()}</p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">FlyPoints</p>
          <p className="text-xs text-slate-400 mt-1">{isAr ? `1 نقطة = ${sar_rate} ر.س` : `1 point = ${sar_rate} SAR`}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-5">
            <Wallet className="h-7 w-7 text-green-500" />
          </div>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">
            {sar_value.toLocaleString()}
            <span className="text-xl font-bold text-slate-400 ms-2">{isAr ? 'ر.س' : 'SAR'}</span>
          </p>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
            {isAr ? 'القيمة بالريال' : 'SAR Equivalent'}
          </p>
          <p className="text-xs text-slate-400 mt-1">{isAr ? 'من نقاطك الحالية' : 'From your current points'}</p>
        </div>
      </div>

      {/* Withdrawal form */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">{isAr ? 'طلب سحب' : 'Request Withdrawal'}</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              disabled={balance < 100}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Wallet className="h-4 w-4" />
              {isAr ? 'طلب سحب' : 'Request'}
            </button>
          )}
        </div>

        {showForm ? (
          <div className="p-6 md:p-8 space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{isAr ? 'رقم IBAN' : 'IBAN Number'}</label>
              <input
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="SA..."
                dir="ltr"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {isAr ? `عدد النقاط (المتاح: ${balance.toLocaleString()})` : `Points (available: ${balance.toLocaleString()})`}
              </label>
              <input
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                type="number"
                min={100}
                max={balance}
                placeholder={isAr ? 'الحد الأدنى 100 نقطة' : 'Minimum 100 points'}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
              />
              {estimatedSar && (
                <p className="text-sm text-slate-500 mt-2">
                  ≈ <span className="font-bold text-green-600">{estimatedSar} {isAr ? 'ر.س' : 'SAR'}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleWithdraw}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAr ? 'إرسال الطلب' : 'Submit Request'}
              </button>
              <button
                onClick={() => { setShowForm(false); setIban(''); setPoints('') }}
                className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            <p className="text-sm text-slate-500">
              {balance < 100
                ? (isAr ? 'تحتاج إلى 100 نقطة على الأقل لطلب السحب' : 'You need at least 100 points to request a withdrawal')
                : (isAr ? 'اضغط على "طلب سحب" لتحويل نقاطك إلى ريال سعودي' : 'Click "Request" to convert your points to SAR')}
            </p>
          </div>
        )}
      </div>

      {/* Withdrawal history */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-900">{isAr ? 'سجل طلبات السحب' : 'Withdrawal History'}</h2>
        </div>

        {withdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Wallet className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">{isAr ? 'لا توجد طلبات سحب بعد' : 'No withdrawal requests yet'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center gap-5 p-6 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-black text-slate-900">{w.points.toLocaleString()} <span className="font-bold text-slate-400 text-sm">{isAr ? 'نقطة' : 'pts'}</span></p>
                    <span className="text-slate-300">·</span>
                    <p className="font-bold text-green-600">{w.sar_amount} <span className="text-sm">{isAr ? 'ر.س' : 'SAR'}</span></p>
                  </div>
                  <p className="text-sm font-mono text-slate-400 truncate">{w.iban}</p>
                  {w.admin_comment && (
                    <p className="text-xs text-red-600 mt-1">{w.admin_comment}</p>
                  )}
                </div>
                <div className="text-end shrink-0 space-y-1.5">
                  <span className={cn('text-xs font-bold px-3 py-1 rounded-full', STATUS_STYLES[w.status] ?? 'bg-slate-100 text-slate-600')}>
                    {STATUS_LABELS[w.status]?.[locale] ?? w.status}
                  </span>
                  <p className="text-xs text-slate-400">
                    {new Date(w.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
