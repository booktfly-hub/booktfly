'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Mail, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { pick } from '@/lib/i18n-helpers'
import { cn } from '@/lib/utils'

export function SubscribeInline({ source }: { source: string }) {
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || status !== 'idle') return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-primary/8 to-primary/5 border border-primary/15 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900 leading-tight">
            {pick(locale, 'احصل على أفضل العروض في بريدك', 'Get the best deals in your inbox', 'En iyi teklifleri gelen kutunuza alın')}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {pick(locale, 'عروض حصرية من BookitFly — مجاناً', 'Exclusive BookitFly offers — free', 'BookitFly\'den özel teklifler — ücretsiz')}
          </p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-700">
            {pick(locale, 'تم الاشتراك! ستصلك أفضل العروض قريباً', 'Subscribed! Best deals coming your way', 'Abone oldunuz! En iyi teklifler geliyor')}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={pick(locale, 'بريدك الإلكتروني', 'Your email', 'E-posta adresiniz')}
              required
              className="w-full h-11 ps-9 pe-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading' || !email.trim()}
            className={cn(
              'h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-black text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
              status === 'loading' && 'cursor-wait'
            )}
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              pick(locale, 'اشترك', 'Subscribe', 'Abone Ol')
            )}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="mt-2 text-xs text-red-500 font-medium">
          {pick(locale, 'حدث خطأ، حاول مرة أخرى', 'Something went wrong, try again', 'Bir hata oluştu, tekrar deneyin')}
        </p>
      )}
    </div>
  )
}
