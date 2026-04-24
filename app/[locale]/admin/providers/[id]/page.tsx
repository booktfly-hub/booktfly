'use client'
import { lkey } from '@/lib/i18n-helpers'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { resolveApiErrorMessage } from '@/lib/api-error'
import { toast } from '@/components/ui/toaster'
import type { Provider } from '@/types'
import { PROVIDER_TYPES } from '@/lib/constants'
import { ArrowRight, Ban, CheckCircle, Shield } from 'lucide-react'

export default function AdminProviderDetail() {
  const { id } = useParams<{ id: string }>()
  const t = useTranslations()
  const te = useTranslations('errors')
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [loading, setLoading] = useState(true)
  const [suspendReason, setSuspendReason] = useState('')
  const [showSuspend, setShowSuspend] = useState(false)
  const [commissionRate, setCommissionRate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('providers').select('*').eq('id', id).single()
      setProvider(data)
      if (data?.commission_rate) setCommissionRate(String(data.commission_rate))
      setLoading(false)
    }
    fetch()
  }, [id])

  const handleAction = async (action: string, body: Record<string, unknown> = {}) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      })
      if (res.ok) {
        toast({ title: t('common.success'), variant: 'success' })
        router.refresh()
        // Re-fetch provider
        const { data } = await supabase.from('providers').select('*').eq('id', id).single()
        setProvider(data)
        setShowSuspend(false)
      } else {
        const data = await res.json()
        toast({ title: resolveApiErrorMessage(data.error, te), variant: 'destructive' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="animate-pulse p-8">{t('common.loading')}</div>
  if (!provider) return <div className="p-8 text-muted-foreground">{t('errors.not_found')}</div>

  const badges = [
    { key: 'has_hajj_permit', label: t('become_provider.doc_hajj_permit') },
    { key: 'has_commercial_reg', label: t('become_provider.doc_commercial_reg') },
    { key: 'has_tourism_permit', label: t('become_provider.doc_tourism_permit') },
    { key: 'has_civil_aviation', label: t('become_provider.doc_civil_aviation') },
    { key: 'has_iata_permit', label: t('become_provider.doc_iata_permit') },
  ]

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {t('common.back')}
      </button>

      <div className="space-y-6">
        {/* Provider info */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">{provider.company_name_ar}</h1>
              {provider.company_name_en && <p className="text-muted-foreground">{provider.company_name_en}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                {PROVIDER_TYPES[provider.provider_type][lkey(locale)]}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              provider.status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            }`}>
              {t(`status.${provider.status}`)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">{t('common.email')}</p><p className="font-medium">{provider.contact_email}</p></div>
            <div><p className="text-muted-foreground">{t('common.phone')}</p><p className="font-medium" dir="ltr">{provider.contact_phone}</p></div>
          </div>

          {/* Document badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {badges.map((b) => (
              provider[b.key as keyof Provider] && (
                <span key={b.key} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                  <Shield className="h-3 w-3" />
                  {b.label}
                </span>
              )
            ))}
          </div>
        </div>

        {/* Commission */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{t('admin.commission_settings')}</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground block mb-1">{t('admin.default_commission')} (%)</label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder={locale === 'ar' ? 'افتراضي (10%)' : 'Default (10%)'}
                className="w-full p-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                min="0"
                max="100"
                step="0.5"
              />
            </div>
            <button
              onClick={() => handleAction('update_commission', { commission_rate: commissionRate ? Number(commissionRate) : null })}
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {t('common.save')}
            </button>
          </div>
        </div>

        {/* Suspend / Unsuspend */}
        <div className="bg-white rounded-xl border p-6">
          {provider.status === 'active' ? (
            <>
              {!showSuspend ? (
                <button
                  onClick={() => setShowSuspend(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors"
                >
                  <Ban className="h-4 w-4" />
                  {t('admin.suspend')}
                </button>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder={t('admin.suspend_reason')}
                    className="w-full p-3 rounded-lg border text-sm min-h-20 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction('suspend', { reason: suspendReason })}
                      disabled={submitting || !suspendReason.trim()}
                      className="px-4 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                    >
                      {t('admin.suspend')}
                    </button>
                    <button
                      onClick={() => setShowSuspend(false)}
                      className="px-4 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              {provider.suspended_reason && (
                <p className="text-sm text-destructive mb-3">{t('admin.suspend_reason')}: {provider.suspended_reason}</p>
              )}
              <button
                onClick={() => handleAction('unsuspend')}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success text-white text-sm font-medium hover:bg-success/90 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                {t('admin.unsuspend')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
