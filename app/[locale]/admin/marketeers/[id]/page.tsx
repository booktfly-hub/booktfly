'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { toast } from '@/components/ui/toaster'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { MarkeeteerApplication } from '@/types'
import { ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AdminMarkeeteerDetail() {
  const { id } = useParams<{ id: string }>()
  const locale = useLocale()
  const t = useTranslations()
  const router = useRouter()

  const [app, setApp] = useState<MarkeeteerApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [comment, setComment] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/marketeers/${id}`)
      const result = await res.json()
      setApp(result.data || null)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleAction(action: 'approve' | 'reject') {
    if (!app) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/marketeers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast({ title: result.error || t('common.error'), variant: 'destructive' })
        return
      }
      toast({
        title: action === 'approve'
          ? (locale === 'ar' ? 'تمت الموافقة على المسوّق' : 'Marketeer approved')
          : (locale === 'ar' ? 'تم رفض الطلب' : 'Application rejected'),
        variant: 'success',
      })
      router.push(`/${locale}/admin/marketeers`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="animate-pulse p-8 text-muted-foreground">{t('common.loading')}</div>
  if (!app) return <div className="p-8 text-muted-foreground">{t('errors.not_found')}</div>

  const fields = [
    { label: locale === 'ar' ? 'الاسم الكامل' : 'Full Name', value: app.full_name },
    { label: locale === 'ar' ? 'رقم الهوية' : 'National ID', value: app.national_id, ltr: true },
    { label: locale === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth', value: new Date(app.date_of_birth).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') },
    { label: locale === 'ar' ? 'رقم الجوال' : 'Phone', value: app.phone, ltr: true },
    { label: locale === 'ar' ? 'رقم جوال آخر' : 'Alt Phone', value: app.phone_alt || '—', ltr: true },
    { label: locale === 'ar' ? 'البريد الإلكتروني' : 'Email', value: app.email, ltr: true },
    { label: locale === 'ar' ? 'العنوان الوطني' : 'National Address', value: app.national_address },
    { label: locale === 'ar' ? 'تاريخ التقديم' : 'Applied On', value: new Date(app.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') },
  ]

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {t('common.back')}
      </button>

      <div className="bg-white rounded-xl border p-6 space-y-6">
        <div className="flex items-start justify-between">
          <h1 className="text-xl font-bold">{app.full_name}</h1>
          <Badge
            variant={
              app.status === 'approved' ? 'success'
              : app.status === 'rejected' ? 'destructive'
              : 'warning'
            }
          >
            {t(`status.${app.status}`)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-muted-foreground">{f.label}</p>
              <p className="font-medium" dir={f.ltr ? 'ltr' : undefined}>{f.value}</p>
            </div>
          ))}
        </div>

        {app.admin_comment && (
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-sm font-medium text-destructive mb-1">
              {locale === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}
            </p>
            <p className="text-sm">{app.admin_comment}</p>
          </div>
        )}

        {app.status === 'pending_review' && (
          <div className="flex flex-col gap-4 pt-4 border-t">
            {!showReject ? (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAction('approve')}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {locale === 'ar' ? 'قبول' : 'Approve'}
                </Button>
                <Button
                  onClick={() => setShowReject(true)}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4" />
                  {locale === 'ar' ? 'رفض' : 'Reject'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={locale === 'ar' ? 'اكتب سبب الرفض...' : 'Enter rejection reason...'}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAction('reject')}
                    disabled={submitting || !comment.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {locale === 'ar' ? 'تأكيد الرفض' : 'Confirm Rejection'}
                  </Button>
                  <Button onClick={() => setShowReject(false)} variant="outline">
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
