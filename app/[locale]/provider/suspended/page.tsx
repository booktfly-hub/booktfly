'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Ban } from 'lucide-react'
import Link from 'next/link'

export default function ProviderSuspended() {
  const locale = useLocale()

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-destructive/10 text-destructive mb-6">
          <Ban className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold mb-3">
          {locale === 'ar' ? 'تم تعليق حسابك' : 'Account Suspended'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {locale === 'ar'
            ? 'تم تعليق حساب مزود الخدمة الخاص بك. يرجى التواصل مع الدعم لمزيد من المعلومات.'
            : 'Your provider account has been suspended. Please contact support for more information.'}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          {locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
      </div>
    </div>
  )
}
