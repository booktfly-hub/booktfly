'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { resolveApiErrorMessage } from '@/lib/api-error'
import { formatPrice } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import { WITHDRAWAL_STATUS_COLORS } from '@/lib/constants'
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Banknote,
} from 'lucide-react'
import type { WalletTransaction, WithdrawalRequest } from '@/types'

type Props = {
  providerIban: string | null
}

export function WalletSection({ providerIban }: Props) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const tc = useTranslations('common')
  const te = useTranslations('errors')

  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const [walletRes, withdrawalsRes] = await Promise.all([
        fetch('/api/provider/wallet'),
        fetch('/api/provider/withdrawals'),
      ])
      const walletData = await walletRes.json()
      const withdrawalsData = await withdrawalsRes.json()

      setBalance(walletData.balance || 0)
      setTransactions(walletData.transactions || [])
      setWithdrawals(withdrawalsData.withdrawals || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount)
    if (!amount || amount <= 0 || amount > balance) {
      toast({ title: te('invalid_amount'), variant: 'destructive' })
      return
    }
    if (!providerIban) {
      toast({ title: te('iban_required'), variant: 'destructive' })
      return
    }

    setSubmitting(true)
    const res = await fetch('/api/provider/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })

    if (res.ok) {
      const data = await res.json()
      setWithdrawals((prev) => [data.withdrawal, ...prev])
      setShowWithdrawForm(false)
      setWithdrawAmount('')
      toast({ title: tc('success'), variant: 'success' })
    } else {
      const err = await res.json()
      toast({ title: resolveApiErrorMessage(err.error, te), variant: 'destructive' })
    }
    setSubmitting(false)
  }

  if (loading) {
    return <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground animate-pulse">{tc('loading')}</div>
  }

  const hasPendingWithdrawal = withdrawals.some((w) => w.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{isAr ? 'رصيد المحفظة' : 'Wallet Balance'}</span>
          </div>
          <p className="text-4xl md:text-5xl font-black tracking-tighter mb-6">{formatPrice(balance)}</p>
          <div className="flex gap-3">
            {!showWithdrawForm && !hasPendingWithdrawal && balance > 0 && (
              <button
                onClick={() => setShowWithdrawForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                <Banknote className="h-4 w-4" />
                {isAr ? 'طلب سحب' : 'Request Withdrawal'}
              </button>
            )}
            {hasPendingWithdrawal && (
              <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/20 text-warning text-sm font-bold">
                <Loader2 className="h-4 w-4" />
                {isAr ? 'طلب سحب قيد المراجعة' : 'Withdrawal pending review'}
              </span>
            )}
          </div>

          {showWithdrawForm && (
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={isAr ? 'المبلغ' : 'Amount'}
                max={balance}
                min={1}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleWithdraw}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? 'تأكيد' : 'Confirm')}
              </button>
              <button
                onClick={() => { setShowWithdrawForm(false); setWithdrawAmount('') }}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors"
              >
                {tc('cancel')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Requests */}
      {withdrawals.length > 0 && (
        <div className="bg-card border rounded-xl">
          <div className="p-5 border-b">
            <h2 className="font-semibold">{isAr ? 'طلبات السحب' : 'Withdrawal Requests'}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-start p-3 font-medium">{isAr ? 'المبلغ' : 'Amount'}</th>
                  <th className="text-start p-3 font-medium">IBAN</th>
                  <th className="text-start p-3 font-medium">{tc('status')}</th>
                  <th className="text-start p-3 font-medium">{tc('date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/20">
                    <td className="p-3 font-bold">{formatPrice(w.amount)}</td>
                    <td className="p-3 font-mono text-xs">{w.provider_iban}</td>
                    <td className="p-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', WITHDRAWAL_STATUS_COLORS[w.status] || '')}>
                        {w.status === 'pending' ? (isAr ? 'قيد المراجعة' : 'Pending')
                          : w.status === 'completed' ? (isAr ? 'مكتمل' : 'Completed')
                          : w.status === 'rejected' ? (isAr ? 'مرفوض' : 'Rejected')
                          : w.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {new Date(w.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div className="bg-card border rounded-xl">
          <div className="p-5 border-b">
            <h2 className="font-semibold">{isAr ? 'سجل المعاملات' : 'Transaction History'}</h2>
          </div>
          <div className="divide-y">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
                <div className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                  tx.type === 'credit' ? 'bg-success/10' : 'bg-destructive/10'
                )}>
                  {tx.type === 'credit'
                    ? <ArrowDownCircle className="h-5 w-5 text-success" />
                    : <ArrowUpCircle className="h-5 w-5 text-destructive" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{isAr ? tx.description_ar : tx.description_en}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className={cn('font-bold', tx.type === 'credit' ? 'text-success' : 'text-destructive')}>
                    {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">{isAr ? 'الرصيد: ' : 'Bal: '}{formatPrice(tx.balance_after)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
