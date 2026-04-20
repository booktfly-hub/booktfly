'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { ContractViewer } from '@/components/contract-viewer'
import {
  SERVICE_PROVIDER_CONTRACT_AR,
  SERVICE_PROVIDER_CONTRACT_EN,
  SERVICE_PROVIDER_CONTRACT_META,
} from '@/lib/contracts/service-provider'
import { toast } from '@/components/ui/toaster'
import { FileSignature } from 'lucide-react'

export default function SignServiceProviderContract() {
  const t = useTranslations()
  const locale = useLocale()
  const params = useParams<{ applicationId: string }>()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function onSigned({ signatureDataUrl }: { signatureDataUrl: string }) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'service_provider',
          target_type: 'provider_application',
          target_id: params.applicationId,
          signature_data_url: signatureDataUrl,
          contract_version: SERVICE_PROVIDER_CONTRACT_META.version,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast({ title: result.error || t('contract.error_sign_failed'), variant: 'destructive' })
        return
      }
      toast({ title: t('contract.signed_at') + ' ' + new Date().toLocaleString(locale), variant: 'success' })
      router.replace(`/${locale}/become-provider/status`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-muted/20">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileSignature className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('contract.step_title_service_provider')}
          </h1>
          <p className="text-muted-foreground">{t('contract.step_subtitle')}</p>
        </div>

        <ContractViewer
          role="service_provider"
          titleAr={SERVICE_PROVIDER_CONTRACT_META.title_ar}
          titleEn={SERVICE_PROVIDER_CONTRACT_META.title_en}
          bodyAr={SERVICE_PROVIDER_CONTRACT_AR}
          bodyEn={SERVICE_PROVIDER_CONTRACT_EN}
          version={SERVICE_PROVIDER_CONTRACT_META.version}
          submitting={submitting}
          onSigned={onSigned}
        />
      </div>
    </div>
  )
}
