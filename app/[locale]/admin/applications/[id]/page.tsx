'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { resolveApiErrorMessage } from '@/lib/api-error'
import { toast } from '@/components/ui/toaster'
import { APPLICATION_STATUS_COLORS, PROVIDER_TYPES } from '@/lib/constants'
import type { ProviderApplication } from '@/types'
import {
  CheckCircle,
  XCircle,
  FileText,
  ArrowRight,
  Download,
} from 'lucide-react'
import { SignatureDisplay } from '@/components/admin/signature-display'

export default function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const t = useTranslations()
  const te = useTranslations('errors')
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const [app, setApp] = useState<ProviderApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectComment, setRejectComment] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('provider_applications')
        .select('*')
        .eq('id', id)
        .single()
      setApp(data)
      setLoading(false)
    }
    fetch()
  }, [id])

  const handleApprove = async () => {
    if (!app) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) {
        toast({ title: t('common.success'), variant: 'success' })
        router.push(`/${locale}/admin/applications`)
      } else {
        const data = await res.json()
        toast({ title: resolveApiErrorMessage(data.error, te), variant: 'destructive' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!app || !rejectComment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', comment: rejectComment }),
      })
      if (res.ok) {
        toast({ title: t('common.success'), variant: 'success' })
        router.push(`/${locale}/admin/applications`)
      } else {
        const data = await res.json()
        toast({ title: resolveApiErrorMessage(data.error, te), variant: 'destructive' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="animate-pulse p-8">{t('common.loading')}</div>
  if (!app) return <div className="p-8 text-muted-foreground">{t('errors.not_found')}</div>

  const docs = [
    { key: 'hajj_permit', url: app.doc_hajj_permit_url, label: t('become_provider.doc_hajj_permit') },
    { key: 'commercial_reg', url: app.doc_commercial_reg_url, label: t('become_provider.doc_commercial_reg') },
    { key: 'tourism_permit', url: app.doc_tourism_permit_url, label: t('become_provider.doc_tourism_permit') },
    { key: 'civil_aviation', url: app.doc_civil_aviation_url, label: t('become_provider.doc_civil_aviation') },
    { key: 'iata_permit', url: app.doc_iata_permit_url, label: t('become_provider.doc_iata_permit') },
  ]

  const uploadedCount = docs.filter((d) => d.url).length

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {t('common.back')}
      </button>

      <div className="bg-white rounded-xl border p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{app.company_name_ar}</h1>
            {app.company_name_en && (
              <p className="text-muted-foreground">{app.company_name_en}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${APPLICATION_STATUS_COLORS[app.status]}`}>
            {t(`status.${app.status}`)}
          </span>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t('common.type')}</p>
            <p className="font-medium">{PROVIDER_TYPES[app.provider_type][locale as 'ar' | 'en']}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('common.email')}</p>
            <p className="font-medium">{app.contact_email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('common.phone')}</p>
            <p className="font-medium" dir="ltr">{app.contact_phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('common.date')}</p>
            <p className="font-medium">
              {new Date(app.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
            </p>
          </div>
        </div>

        {/* Description */}
        {app.company_description_ar && (
          <div>
            <p className="text-muted-foreground text-sm mb-1">{t('common.description')}</p>
            <p className="text-sm">{app.company_description_ar}</p>
          </div>
        )}

        {/* Documents */}
        <div>
          <h3 className="font-semibold mb-3">
            {t('become_provider.documents')} ({uploadedCount}/5)
          </h3>
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.key}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{doc.label}</span>
                </div>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted"
                  >
                    <Download className="h-4 w-4" />
                    {locale === 'ar' ? 'عرض' : 'View'}
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {locale === 'ar' ? 'غير مرفق' : 'Not provided'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Signed Contract */}
        <div>
          <h3 className="font-semibold mb-3">
            {t('contract.step_title_service_provider')}
          </h3>
          <SignatureDisplay
            signatureUrl={app.signature_url}
            signedAt={app.contract_signed_at}
            version={app.contract_version}
            role="service_provider"
            printTargetType="provider_application"
            printTargetId={app.id}
            archiveUrl={app.contract_archive_url}
          />
        </div>

        {/* Previous rejection */}
        {app.admin_comment && (
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-sm font-medium text-destructive mb-1">
              {t('become_provider.rejection_reason')}
            </p>
            <p className="text-sm">{app.admin_comment}</p>
          </div>
        )}

        {/* Actions */}
        {app.status === 'pending_review' && (
          <div className="flex flex-col gap-4 pt-4 border-t">
            {!showReject ? (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-success text-white font-medium hover:bg-success/90 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle className="h-5 w-5" />
                  {t('admin.approve')}
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-white font-medium hover:bg-destructive/90 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                  {t('admin.reject')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder={t('admin.reject_reason')}
                  className="w-full p-3 rounded-lg border text-sm min-h-24 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={submitting || !rejectComment.trim()}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-destructive text-white font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                  >
                    {t('admin.reject')}
                  </button>
                  <button
                    onClick={() => setShowReject(false)}
                    className="px-4 py-2.5 rounded-lg border font-medium hover:bg-muted transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
