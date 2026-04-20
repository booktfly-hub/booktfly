'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ContractViewer } from '@/components/contract-viewer'
import { CLIENT_CONTRACT_AR, CLIENT_CONTRACT_EN, CLIENT_CONTRACT_META } from '@/lib/contracts/client'
import { toast } from '@/components/ui/toaster'
import { FileSignature } from 'lucide-react'

type TargetType = 'booking' | 'room_booking' | 'car_booking' | 'package_booking'

type Props = {
  bookingId: string
  guestToken: string | null
  onSigned: () => void
  targetType?: TargetType
}

export function ClientContractStep({ bookingId, guestToken, onSigned, targetType = 'booking' }: Props) {
  const t = useTranslations()
  const locale = useLocale()
  const [submitting, setSubmitting] = useState(false)

  async function handleSigned({ signatureDataUrl }: { signatureDataUrl: string }) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'client',
          target_type: targetType,
          target_id: bookingId,
          signature_data_url: signatureDataUrl,
          contract_version: CLIENT_CONTRACT_META.version,
          guest_token: guestToken || undefined,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast({ title: result.error || t('contract.error_sign_failed'), variant: 'destructive' })
        return
      }
      toast({ title: t('contract.signed_at') + ' ' + new Date().toLocaleString(locale), variant: 'success' })
      onSigned()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12 md:pt-32 lg:pt-36 animate-fade-in-up">
      <div className="text-center mb-6 space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileSignature className="h-7 w-7" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">
          {t('contract.step_title_client')}
        </h1>
        <p className="text-sm md:text-base text-slate-500 font-medium">{t('contract.step_subtitle')}</p>
      </div>

      <ContractViewer
        role="client"
        titleAr={CLIENT_CONTRACT_META.title_ar}
        titleEn={CLIENT_CONTRACT_META.title_en}
        bodyAr={CLIENT_CONTRACT_AR}
        bodyEn={CLIENT_CONTRACT_EN}
        version={CLIENT_CONTRACT_META.version}
        submitting={submitting}
        onSigned={handleSigned}
      />
    </div>
  )
}
