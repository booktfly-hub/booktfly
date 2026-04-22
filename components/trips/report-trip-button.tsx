'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Flag, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

const REASONS = [
  { value: 'spam', labelAr: 'إعلان مزعج', labelEn: 'Spam' },
  { value: 'misleading_price', labelAr: 'سعر مضلل', labelEn: 'Misleading price' },
  { value: 'wrong_details', labelAr: 'تفاصيل خاطئة', labelEn: 'Wrong details' },
  { value: 'unreachable_provider', labelAr: 'المزود غير متواصل', labelEn: 'Unreachable provider' },
  { value: 'offensive', labelAr: 'محتوى مسيء', labelEn: 'Offensive content' },
  { value: 'other', labelAr: 'أخرى', labelEn: 'Other' },
] as const

type Reason = (typeof REASONS)[number]['value']

export function ReportTripButton({ tripId, className }: { tripId: string; className?: string }) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<Reason>('misleading_price')
  const [details, setDetails] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          details: details.trim() || undefined,
          reporter_email: email.trim() || undefined,
        }),
      })
      if (!res.ok) {
        toast({ title: isAr ? 'فشل إرسال البلاغ' : 'Failed to submit report', variant: 'destructive' })
        return
      }
      toast({ title: isAr ? 'تم استلام بلاغك، شكراً' : 'Report submitted. Thank you.', variant: 'success' })
      setOpen(false)
      setDetails('')
      setEmail('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-destructive transition-colors',
          className
        )}
      >
        <Flag className="h-3.5 w-3.5" />
        {isAr ? 'الإبلاغ عن هذه الرحلة' : 'Report this trip'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-destructive" />
                <h3 className="text-lg font-bold">{isAr ? 'الإبلاغ عن رحلة' : 'Report this trip'}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {isAr ? 'السبب' : 'Reason'}
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as Reason)}
                  className="w-full h-11 px-3 border border-border rounded-lg bg-white text-sm font-medium"
                >
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {isAr ? r.labelAr : r.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {isAr ? 'تفاصيل (اختياري)' : 'Details (optional)'}
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder={isAr ? 'ما الذي تريد إخبارنا به؟' : 'Tell us what happened...'}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {isAr ? 'بريدك (اختياري)' : 'Your email (optional)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 px-3 border border-border rounded-lg bg-white text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {isAr ? 'لنتواصل معك إذا احتجنا تفاصيل إضافية' : 'So we can follow up if needed'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t bg-muted/30 rounded-b-2xl">
              <button
                onClick={() => setOpen(false)}
                className="h-10 px-4 rounded-lg text-sm font-semibold hover:bg-muted"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:brightness-95 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAr ? 'إرسال البلاغ' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
