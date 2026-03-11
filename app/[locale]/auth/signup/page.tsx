'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { z } from 'zod'
import { Mail, Lock, User, Phone, Loader2, Plane, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { signupSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [isLoading, setIsLoading] = useState(false)
  const [isVerificationSent, setIsVerificationSent] = useState(false)

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      phone: '',
    },
  })

  async function handleSignup(data: SignupFormData) {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
          data: {
            full_name: data.full_name,
            phone: data.phone || null,
          },
        },
      })

      if (error) {
        toast({ title: error.message, variant: 'destructive' })
        return
      }

      setIsVerificationSent(true)
    } catch {
      toast({ title: tCommon('error'), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerificationSent) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-6">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-3">{t('verification_sent')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('check_email_description')}
          </p>
          <Link
            href={`/${locale}/auth/login`}
            className="inline-flex items-center justify-center py-2.5 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            {tCommon('login')}
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
            <Plane className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('signup_title')}</h1>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-1.5">
                {t('full_name')}
              </label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  {...form.register('full_name')}
                  className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                />
              </div>
              {form.formState.errors.full_name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>

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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...form.register('password')}
                  className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                  placeholder="••••••••"
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                {t('phone')}{' '}
                <span className="text-muted-foreground font-normal">({tCommon('optional')})</span>
              </label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  {...form.register('phone')}
                  className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                  placeholder="+966 5XX XXX XXXX"
                  dir="ltr"
                />
              </div>
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.phone.message}
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
              {t('signup_button')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('already_have_account')}{' '}
          <Link href={`/${locale}/auth/login`} className="text-accent font-medium hover:underline">
            {tCommon('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
