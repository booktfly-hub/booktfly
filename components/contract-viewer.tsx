'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { SignaturePad } from './signature-pad'
import { FileText, Loader2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContractRole } from '@/lib/contracts/version'

type Props = {
  role: ContractRole
  titleAr: string
  titleEn: string
  bodyAr: string
  bodyEn: string
  version: string
  onSigned: (args: { signatureDataUrl: string; acceptedAt: string; version: string }) => Promise<void> | void
  submitting?: boolean
  submitLabel?: string
}

export function ContractViewer({ role, titleAr, titleEn, bodyAr, bodyEn, version, onSigned, submitting, submitLabel }: Props) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [accepted, setAccepted] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [showEnAlso, setShowEnAlso] = useState(false)

  const canSign = accepted && !!signature && !submitting
  const title = isAr ? titleAr : titleEn
  const body = isAr ? bodyAr : bodyEn

  const handleSubmit = async () => {
    if (!canSign || !signature) return
    await onSigned({
      signatureDataUrl: signature,
      acceptedAt: new Date().toISOString(),
      version,
    })
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {t('contract.role_' + role)} · {t('contract.version')} {version}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowEnAlso((v) => !v)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {showEnAlso ? t('contract.hide_other_lang') : t('contract.show_other_lang')}
        </button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
        <pre className={cn('whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground', isAr && 'text-right')}>
          {body}
        </pre>
        {showEnAlso && (
          <>
            <div className="my-3 h-px bg-slate-200" />
            <pre className={cn('whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground', !isAr && 'text-right')}>
              {isAr ? bodyEn : bodyAr}
            </pre>
          </>
        )}
      </div>

      <label className="flex items-start gap-3 cursor-pointer select-none rounded-xl bg-slate-50 p-3">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary"
          disabled={submitting}
        />
        <span className="text-sm font-medium text-foreground">
          {t('contract.accept_label')}
        </span>
      </label>

      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          {t('signature.label')}
        </label>
        <SignaturePad onChange={setSignature} disabled={!accepted || submitting} />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSign}
        className={cn(
          'w-full rounded-xl py-3 text-sm font-bold transition-all',
          canSign
            ? 'bg-primary text-white shadow-md hover:brightness-95 active:scale-[0.98]'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        )}
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('contract.signing')}
          </span>
        ) : (
          submitLabel || t('contract.sign_and_continue')
        )}
      </button>
    </div>
  )
}
