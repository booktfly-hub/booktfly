'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import type { ProviderApplication } from '@/types'
import { APPLICATION_STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

export default function ApplicationStatusPage() {
  const t = useTranslations('become_provider')
  const ts = useTranslations('status')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [application, setApplication] = useState<ProviderApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchApplication() {
      try {
        const res = await fetch('/api/providers/my-application')
        const result = await res.json()
        if (!res.ok) {
          setError(result.error)
          return
        }
        setApplication(result.data)
      } catch {
        setError('Failed to fetch application')
      } finally {
        setLoading(false)
      }
    }

    fetchApplication()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-muted-foreground mb-4">
            {error || tc('no_results')}
          </p>
          <Link
            href={`/${locale}/become-provider/apply`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {t('apply_now')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  const StatusIcon =
    application.status === 'approved'
      ? CheckCircle2
      : application.status === 'rejected'
        ? XCircle
        : Clock

  const statusColorClass = APPLICATION_STATUS_COLORS[application.status] || ''

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          {t('application_status')}
        </h1>

        <div className="bg-card border rounded-xl p-8 text-center space-y-6">
          {/* Status Icon */}
          <div
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mx-auto',
              statusColorClass
            )}
          >
            <StatusIcon className="h-10 w-10" />
          </div>

          {/* Status Label */}
          <div>
            <span
              className={cn(
                'inline-block px-4 py-1.5 rounded-full text-sm font-medium',
                statusColorClass
              )}
            >
              {ts(application.status)}
            </span>
          </div>

          {/* Company Name */}
          <div>
            <p className="text-lg font-semibold">{application.company_name_ar}</p>
            {application.company_name_en && (
              <p className="text-sm text-muted-foreground">
                {application.company_name_en}
              </p>
            )}
          </div>

          {/* Submitted Date */}
          <p className="text-sm text-muted-foreground">
            {tc('date')}:{' '}
            {new Date(application.created_at).toLocaleDateString(
              locale === 'ar' ? 'ar-SA' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' }
            )}
          </p>

          {/* Rejection Reason */}
          {application.status === 'rejected' && application.admin_comment && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-start">
              <p className="text-sm font-medium text-destructive mb-1">
                {t('rejection_reason')}
              </p>
              <p className="text-sm text-muted-foreground">
                {application.admin_comment}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 space-y-3">
            {application.status === 'rejected' && (
              <Link
                href={`/${locale}/become-provider/apply`}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                {t('reapply')}
              </Link>
            )}

            {application.status === 'approved' && (
              <Link
                href={`/${locale}/provider/dashboard`}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                {locale === 'ar' ? 'الذهاب للوحة التحكم' : 'Go to Dashboard'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            {application.status === 'pending_review' && (
              <p className="text-sm text-muted-foreground">
                {locale === 'ar'
                  ? 'سيتم مراجعة طلبك خلال 2-3 أيام عمل'
                  : 'Your application will be reviewed within 2-3 business days'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
