'use client'

import { pick } from '@/lib/i18n-helpers'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { SignaturePad } from '@/components/signature-pad'
import { toast } from '@/components/ui/toaster'
import { FileSignature, Pencil, Trash2, Loader2, Check, X } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

type Props = {
  initialSignatureUrl: string | null
  onSaved?: (url: string | null) => void
}

export function ProfileSignatureSection({ initialSignatureUrl, onSaved }: Props) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [editing, setEditing] = useState(false)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(initialSignatureUrl)
  const [pending, setPending] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function save() {
    if (!pending) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/profile/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_data_url: pending }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: json.error || t('contract.error_sign_failed'), variant: 'destructive' })
        return
      }
      setSignatureUrl(json.signature_url)
      setEditing(false)
      setPending(null)
      toast({ title: pick(locale, 'تم حفظ التوقيع', 'Signature saved', 'İmza kaydedildi'), variant: 'success' })
      onSaved?.(json.signature_url)
    } finally {
      setSubmitting(false)
    }
  }

  async function remove() {
    if (!confirm(pick(locale, 'هل أنت متأكد من حذف التوقيع؟', 'Delete saved signature?', 'Kayıtlı imza silinsin mi?'))) return
    setDeleting(true)
    try {
      const res = await fetch('/api/profile/signature', { method: 'DELETE' })
      if (!res.ok) {
        toast({ title: pick(locale, 'فشل الحذف', 'Delete failed', 'Silme başarısız'), variant: 'destructive' })
        return
      }
      setSignatureUrl(null)
      toast({ title: pick(locale, 'تم الحذف', 'Removed', 'Kaldırıldı'), variant: 'success' })
      onSaved?.(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-primary" />
          <h3 className="font-bold">{pick(locale, 'التوقيع المحفوظ', 'Saved signature', 'Kayıtlı imza')}</h3>
        </div>
        {!editing && signatureUrl && (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold hover:bg-slate-50">
              <Pencil className="h-3.5 w-3.5" />
              {pick(locale, 'تحديث', 'Update', 'Güncelle')}
            </button>
            <button
              onClick={remove}
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs font-bold text-destructive hover:bg-destructive/5 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {pick(locale, 'حذف', 'Delete', 'Sil')}
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {pick(locale, 'توقيعك المحفوظ يُستخدم لتوقيع العقود مستقبلاً. يمكنك تحديثه أو حذفه في أي وقت.', 'Your saved signature is used to sign future contracts. You can update or delete it anytime.', 'Kayıtlı imzanız gelecekteki sözleşmeleri imzalamak için kullanılır. İstediğiniz zaman güncelleyebilir veya silebilirsiniz.')}
      </p>

      {!editing && signatureUrl && (
        <div className="rounded-xl border bg-white p-3">
          <Image
            src={signatureUrl}
            alt="Saved signature"
            width={480}
            height={180}
            className="h-auto w-full max-w-md mx-auto object-contain"
            unoptimized
          />
        </div>
      )}

      {!editing && !signatureUrl && (
        <button
          onClick={() => setEditing(true)}
          className="w-full rounded-xl border-2 border-dashed border-slate-300 py-6 text-sm font-semibold text-slate-500 hover:bg-slate-50"
        >
          {pick(locale, 'إضافة توقيع محفوظ', 'Add a saved signature', 'Kayıtlı imza ekle')}
        </button>
      )}

      {editing && (
        <div className="space-y-3">
          <SignaturePad onChange={setPending} disabled={submitting} />
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={!pending || submitting}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all',
                pending && !submitting
                  ? 'bg-primary text-white shadow-md hover:brightness-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {pick(locale, 'حفظ التوقيع', 'Save signature', 'İmzayı kaydet')}
            </button>
            <button
              onClick={() => { setEditing(false); setPending(null) }}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              {pick(locale, 'إلغاء', 'Cancel', 'İptal')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
