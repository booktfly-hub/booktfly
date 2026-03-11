'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { z } from 'zod'
import { Mail, Loader2, KeyRound, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { magicLinkSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'

type ResetFormData = z.infer<typeof magicLinkSchema>

export default function ResetPasswordPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const form = useForm<ResetFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  })

  const BackArrow = locale === 'ar' ? ArrowRight : ArrowLeft

  async function handleReset(data: ResetFormData) {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/${locale}/auth/update-password`,
      })

      if (error) {
        toast({ title: error.message, variant: 'destructive' })
        return
      }

      setIsSent(true)
    } catch {
      toast({ title: tCommon('error'), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-6">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-3">{t('reset_link_sent')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('reset_link_description')}
          </p>
          <Link
            href={`/${locale}/auth/login`}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <BackArrow className="w-4 h-4" />
            {t('back_to_login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('reset_password')}</h1>
          <p className="text-muted-foreground mt-2">{t('reset_password_description')}</p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(handleReset)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...form.register('email')}
                  className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                  placeholder="example@email.com"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {t('send_reset_link')}
            </button>
          </form>
        </div>

        <p className="text-center mt-6">
          <Link
            href={`/${locale}/auth/login`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackArrow className="w-4 h-4" />
            {t('back_to_login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
