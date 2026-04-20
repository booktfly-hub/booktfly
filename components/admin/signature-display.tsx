'use client'

import { useLocale, useTranslations } from 'next-intl'
import { FileSignature, Printer, Archive } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  signatureUrl: string | null
  signedAt: string | null
  version?: string | null
  role: 'client' | 'marketeer' | 'service_provider'
  // When provided, the "Print" button links to /contracts/print/{target_type}/{target_id}
  printTargetType?: 'booking' | 'room_booking' | 'car_booking' | 'package_booking' | 'provider_application' | 'marketeer_application'
  printTargetId?: string
  archiveUrl?: string | null
}

export function SignatureDisplay({ signatureUrl, signedAt, version, role, printTargetType, printTargetId, archiveUrl }: Props) {
  const t = useTranslations()
  const locale = useLocale()

  if (!signatureUrl || !signedAt) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 bg-slate-50/50">
        <div className="flex items-center gap-3 text-slate-500">
          <FileSignature className="h-5 w-5" />
          <div>
            <p className="text-sm font-bold">{t('contract.not_signed')}</p>
            <p className="text-xs text-muted-foreground">
              {t('contract.role_' + role)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <FileSignature className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {t('contract.role_' + role)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('contract.signed_at')}: {new Date(signedAt).toLocaleString(locale)}
              {version ? ` · ${t('contract.version')} ${version}` : ''}
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-3">
        <Image
          src={signatureUrl}
          alt={t('signature.label')}
          width={480}
          height={180}
          className="h-auto w-full max-w-md mx-auto object-contain"
          unoptimized
        />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <a
          href={signatureUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-primary hover:underline"
        >
          {t('contract.view_signature')} →
        </a>
        {printTargetType && printTargetId && (
          <Link
            href={`/${locale}/contracts/print/${printTargetType}/${printTargetId}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <Printer className="h-3 w-3" />
            {locale === 'ar' ? 'طباعة / PDF' : 'Print / PDF'}
          </Link>
        )}
        {archiveUrl && (
          <a
            href={archiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:underline"
            title={locale === 'ar' ? 'نسخة أرشيفية ثابتة' : 'Immutable archive snapshot'}
          >
            <Archive className="h-3 w-3" />
            {locale === 'ar' ? 'نسخة محفوظة' : 'Archived snapshot'}
          </a>
        )}
      </div>
    </div>
  )
}
