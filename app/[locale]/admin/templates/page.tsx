'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { Loader2, Save, MessageSquare, Mail, AlertCircle, ImagePlus } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

type EmailTpl = { id: string; slug: string; subject_ar: string; subject_en: string; body_html_ar: string; body_html_en: string; enabled: boolean; variables: string[] }
type WaTpl = { id: string; slug: string; body_ar: string; body_en: string; enabled: boolean; variables: string[] }

export default function AdminTemplatesPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [tab, setTab] = useState<'email' | 'whatsapp'>('email')
  const [emailTpls, setEmailTpls] = useState<EmailTpl[]>([])
  const [waTpls, setWaTpls] = useState<WaTpl[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const [e, w] = await Promise.all([
        fetch('/api/admin/templates?kind=email').then(r => r.json()),
        fetch('/api/admin/templates?kind=whatsapp').then(r => r.json()),
      ])
      setEmailTpls(e.data || [])
      setWaTpls(w.data || [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  async function saveEmail(tpl: EmailTpl) {
    setSavingId(tpl.id)
    try {
      const res = await fetch('/api/admin/templates?kind=email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tpl.id,
          subject_ar: tpl.subject_ar,
          subject_en: tpl.subject_en,
          body_html_ar: tpl.body_html_ar,
          body_html_en: tpl.body_html_en,
          enabled: tpl.enabled,
        }),
      })
      if (!res.ok) {
        const e = await res.json()
        toast({ title: e.error || 'Save failed', variant: 'destructive' })
      } else {
        toast({ title: pick(locale, 'تم الحفظ', 'Saved', 'Kaydedildi'), variant: 'success' })
      }
    } finally {
      setSavingId(null)
    }
  }

  async function saveWa(tpl: WaTpl) {
    setSavingId(tpl.id)
    try {
      const res = await fetch('/api/admin/templates?kind=whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tpl.id, body_ar: tpl.body_ar, body_en: tpl.body_en, enabled: tpl.enabled,
        }),
      })
      if (!res.ok) {
        const e = await res.json()
        toast({ title: e.error || 'Save failed', variant: 'destructive' })
      } else {
        toast({ title: pick(locale, 'تم الحفظ', 'Saved', 'Kaydedildi'), variant: 'success' })
      }
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  const list = tab === 'email' ? emailTpls : waTpls
  const active = list.find(t => t.id === selected) || null

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{pick(locale, 'قوالب الرسائل', 'Message Templates', 'Mesaj Şablonları')}</h1>
        <p className="text-sm text-muted-foreground">
          {pick(locale, 'تحرير قوالب البريد الإلكتروني وقوالب واتساب. يتم استخدامها تلقائياً إذا تم تفعيلها.', 'Edit email and WhatsApp templates. Used automatically when enabled.', 'E-posta ve WhatsApp şablonlarını düzenleyin. Etkinleştirildiğinde otomatik olarak kullanılır.')}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { setTab('email'); setSelected(null) }}
          className={cn('inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors',
            tab === 'email' ? 'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200')}
        >
          <Mail className="h-4 w-4" /> {pick(locale, 'البريد الإلكتروني', 'Email', 'E-posta')}
          <span className="ml-1 rounded-full bg-white/30 px-2 py-0.5 text-xs">{emailTpls.length}</span>
        </button>
        <button
          onClick={() => { setTab('whatsapp'); setSelected(null) }}
          className={cn('inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors',
            tab === 'whatsapp' ? 'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200')}
        >
          <MessageSquare className="h-4 w-4" /> WhatsApp
          <span className="ml-1 rounded-full bg-white/30 px-2 py-0.5 text-xs">{waTpls.length}</span>
        </button>
      </div>

      {tab === 'whatsapp' && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">
              {pick(locale, 'لم يتم تفعيل إرسال WhatsApp بعد', 'WhatsApp sending not yet activated', 'WhatsApp gönderimi henüz etkinleştirilmedi')}
            </p>
            <p className="text-amber-800">
              {pick(locale, 'يمكنك تحرير القوالب الآن. سيتم توصيل Twilio لاحقاً.', 'Edit templates now. Twilio integration will be wired up later.', 'Şablonları şimdi düzenleyin. Twilio entegrasyonu daha sonra eklenecek.')}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2">
          {list.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => setSelected(tpl.id)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors',
                selected === tpl.id ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50'
              )}
            >
              <span className="truncate font-mono text-xs">{tpl.slug}</span>
              {!tpl.enabled && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {pick(locale, 'معطّل', 'Disabled', 'Devre dışı')}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {!active ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {pick(locale, 'اختر قالباً لتحريره', 'Select a template to edit', 'Düzenlemek için bir şablon seçin')}
            </p>
          ) : tab === 'email' ? (
            <EmailEditor tpl={active as EmailTpl} onSave={saveEmail} saving={savingId === active.id} isAr={isAr} locale={locale} onChange={(u) => setEmailTpls(prev => prev.map(t => t.id === u.id ? u : t))} />
          ) : (
            <WaEditor tpl={active as WaTpl} onSave={saveWa} saving={savingId === active.id} isAr={isAr} locale={locale} onChange={(u) => setWaTpls(prev => prev.map(t => t.id === u.id ? u : t))} />
          )}
        </div>
      </div>
    </div>
  )
}

function EmailEditor({ tpl, onSave, saving, onChange, isAr, locale }: { tpl: EmailTpl; onSave: (t: EmailTpl) => void; saving: boolean; onChange: (t: EmailTpl) => void; isAr: boolean; locale: string }) {
  const arRef = useRef<HTMLTextAreaElement | null>(null)
  const enRef = useRef<HTMLTextAreaElement | null>(null)
  const [uploading, setUploading] = useState<null | 'ar' | 'en' | 'tr'>(null)

  async function uploadAndInsert(target: 'ar' | 'en' | 'tr', file: File) {
    setUploading(target)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/templates/upload-image', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: json.error || (pick(locale, 'فشل الرفع', 'Upload failed', 'Yükleme başarısız')), variant: 'destructive' })
        return
      }
      const tag = `<img src="${json.url}" alt="" style="max-width:100%; height:auto; display:block; margin:8px 0;" />`
      const field: 'body_html_ar' | 'body_html_en' = target === 'ar' ? 'body_html_ar' : 'body_html_en'
      const textarea = target === 'ar' ? arRef.current : enRef.current
      const current = tpl[field]
      let nextValue: string
      if (textarea) {
        const start = textarea.selectionStart ?? current.length
        const end = textarea.selectionEnd ?? current.length
        nextValue = current.slice(0, start) + tag + current.slice(end)
      } else {
        nextValue = current + tag
      }
      onChange({ ...tpl, [field]: nextValue })
      toast({ title: pick(locale, 'تم إدراج الصورة', 'Image inserted', 'Görsel eklendi'), variant: 'success' })
      // Restore focus and place cursor after the inserted tag
      setTimeout(() => {
        if (textarea) {
          textarea.focus()
          const pos = (textarea.selectionStart ?? 0) + tag.length
          textarea.setSelectionRange(pos, pos)
        }
      }, 0)
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm font-bold">{tpl.slug}</h2>
        <label className="inline-flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={tpl.enabled} onChange={e => onChange({ ...tpl, enabled: e.target.checked })} className="h-4 w-4 accent-primary" />
          {pick(locale, 'مفعّل', 'Enabled', 'Etkin')}
        </label>
      </div>
      {tpl.variables?.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {pick(locale, 'المتغيرات', 'Variables', 'Değişkenler')}: {tpl.variables.map(v => <code key={v} className="mx-1 rounded bg-slate-100 px-1.5 py-0.5">{'{{'}{v}{'}}'}</code>)}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={pick(locale, 'العنوان (AR)', 'Subject (AR)', 'Konu (AR)')}>
          <input dir="rtl" value={tpl.subject_ar} onChange={e => onChange({ ...tpl, subject_ar: e.target.value })} className={inp} />
        </Field>
        <Field label={pick(locale, 'العنوان (EN)', 'Subject (EN)', 'Konu (EN)')}>
          <input dir="ltr" value={tpl.subject_en} onChange={e => onChange({ ...tpl, subject_en: e.target.value })} className={inp} />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field
          label={pick(locale, 'المحتوى HTML (AR)', 'HTML body (AR)', 'HTML gövdesi (AR)')}
          action={<ImageUploadButton uploading={uploading === "ar"} isAr={isAr} locale={locale} onPick={(f) => uploadAndInsert('ar', f)} />}
        >
          <textarea ref={arRef} dir="rtl" rows={10} value={tpl.body_html_ar} onChange={e => onChange({ ...tpl, body_html_ar: e.target.value })} className={textarea} />
        </Field>
        <Field
          label={pick(locale, 'المحتوى HTML (EN)', 'HTML body (EN)', 'HTML gövdesi (EN)')}
          action={<ImageUploadButton uploading={uploading === "en"} isAr={isAr} locale={locale} onPick={(f) => uploadAndInsert('en', f)} />}
        >
          <textarea ref={enRef} dir="ltr" rows={10} value={tpl.body_html_en} onChange={e => onChange({ ...tpl, body_html_en: e.target.value })} className={textarea} />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <PreviewBox html={tpl.body_html_ar} dir="rtl" />
        <PreviewBox html={tpl.body_html_en} dir="ltr" />
      </div>
      <button onClick={() => onSave(tpl)} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {pick(locale, 'حفظ', 'Save', 'Kaydet')}
      </button>
    </div>
  )
}

function ImageUploadButton({ uploading, isAr, onPick, locale }: { uploading: boolean; isAr: boolean; onPick: (f: File) => void; locale: string }) {
  const inputId = 'img-upload-' + Math.random().toString(36).slice(2, 8)
  return (
    <label
      htmlFor={inputId}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer',
        uploading ? 'opacity-50 cursor-wait' : 'hover:bg-slate-50 text-slate-700'
      )}
    >
      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
      {pick(locale, 'إدراج صورة', 'Insert image', 'Görsel ekle')}
      <input
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
          e.target.value = ''
        }}
      />
    </label>
  )
}

function WaEditor({ tpl, onSave, saving, onChange, isAr, locale }: { tpl: WaTpl; onSave: (t: WaTpl) => void; saving: boolean; onChange: (t: WaTpl) => void; isAr: boolean; locale: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm font-bold">{tpl.slug}</h2>
        <label className="inline-flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={tpl.enabled} onChange={e => onChange({ ...tpl, enabled: e.target.checked })} className="h-4 w-4 accent-primary" />
          {pick(locale, 'مفعّل', 'Enabled', 'Etkin')}
        </label>
      </div>
      {tpl.variables?.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {pick(locale, 'المتغيرات', 'Variables', 'Değişkenler')}: {tpl.variables.map(v => <code key={v} className="mx-1 rounded bg-slate-100 px-1.5 py-0.5">{'{{'}{v}{'}}'}</code>)}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={pick(locale, 'رسالة WhatsApp (AR)', 'WhatsApp (AR)', 'WhatsApp (AR)')}>
          <textarea dir="rtl" rows={6} value={tpl.body_ar} onChange={e => onChange({ ...tpl, body_ar: e.target.value })} className={textarea} />
        </Field>
        <Field label={pick(locale, 'رسالة WhatsApp (EN)', 'WhatsApp (EN)', 'WhatsApp (EN)')}>
          <textarea dir="ltr" rows={6} value={tpl.body_en} onChange={e => onChange({ ...tpl, body_en: e.target.value })} className={textarea} />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <WaPreview text={tpl.body_ar} dir="rtl" />
        <WaPreview text={tpl.body_en} dir="ltr" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onSave(tpl)} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pick(locale, 'حفظ', 'Save', 'Kaydet')}
        </button>
        <button
          type="button"
          disabled
          title={pick(locale, 'لم يتم ربط Twilio بعد', 'Twilio not yet integrated', 'Twilio henüz entegre edilmedi')}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 opacity-70 cursor-not-allowed"
        >
          <MessageSquare className="h-4 w-4" />
          {pick(locale, 'إرسال تجريبي (قريباً)', 'Send test (coming soon)', 'Test gönder (yakında)')}
        </button>
      </div>
    </div>
  )
}

const inp = 'w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary'
const textarea = 'w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary'

function Field({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="block text-xs font-bold">{label}</label>
        {action}
      </div>
      {children}
    </div>
  )
}

function PreviewBox({ html, dir }: { html: string; dir: 'ltr' | 'rtl' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
      <p className="mb-2 font-bold text-muted-foreground">Preview</p>
      <div className="rounded-lg bg-white p-3" dir={dir} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

function WaPreview({ text, dir }: { text: string; dir: 'ltr' | 'rtl' }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-xs" dir={dir}>
      <p className="mb-2 font-bold text-emerald-700">WhatsApp preview</p>
      <div className="rounded-2xl rounded-tl-sm bg-white p-3 text-sm shadow-sm whitespace-pre-wrap">{text}</div>
    </div>
  )
}
