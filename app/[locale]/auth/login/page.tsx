'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { Mail, Lock, Loader2, Plane, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, magicLinkSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'

type LoginFormData = z.infer<typeof loginSchema>
type MagicLinkFormData = z.infer<typeof magicLinkSchema>

export default function LoginPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const magicLinkForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  })

  async function handleLogin(data: LoginFormData) {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast({ title: error.message, variant: 'destructive' })
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single()

      const role = profile?.role || 'buyer'
      if (role === 'admin') {
        router.push(`/${locale}/admin`)
      } else if (role === 'provider') {
        router.push(`/${locale}/provider/dashboard`)
      } else {
        router.push(`/${locale}`)
      }
    } catch {
      toast({ title: tCommon('error'), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMagicLink(data: MagicLinkFormData) {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
        },
      })

      if (error) {
        toast({ title: error.message, variant: 'destructive' })
        return
      }

      toast({ title: t('magic_link_sent'), variant: 'success' })
    } catch {
      toast({ title: tCommon('error'), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Plane className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('login_title')}</h1>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6 sm:p-8">
          {/* Toggle between password and magic link */}
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsMagicLink(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                !isMagicLink
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="w-4 h-4" />
              {t('password')}
            </button>
            <button
              type="button"
              onClick={() => setIsMagicLink(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                isMagicLink
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {t('magic_link')}
            </button>
          </div>

          {!isMagicLink ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
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
                    {...loginForm.register('email')}
                    className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                    placeholder="example@email.com"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    {t('password')}
                  </label>
                  <Link
                    href={`/${locale}/auth/reset-password`}
                    className="text-sm text-accent hover:underline"
                  >
                    {t('forgot_password')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    {...loginForm.register('password')}
                    className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                    placeholder="••••••••"
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {loginForm.formState.errors.password.message}
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
                {t('login_button')}
              </button>
            </form>
          ) : (
            <form onSubmit={magicLinkForm.handleSubmit(handleMagicLink)} className="space-y-4">
              <div>
                <label htmlFor="magic-email" className="block text-sm font-medium text-foreground mb-1.5">
                  {t('email')}
                </label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="magic-email"
                    type="email"
                    autoComplete="email"
                    {...magicLinkForm.register('email')}
                    className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                    placeholder="example@email.com"
                  />
                </div>
                {magicLinkForm.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {magicLinkForm.formState.errors.email.message}
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
                {t('send_magic_link')}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('dont_have_account')}{' '}
          <Link href={`/${locale}/auth/signup`} className="text-accent font-medium hover:underline">
            {tCommon('signup')}
          </Link>
        </p>
      </div>
    </div>
  )
}
