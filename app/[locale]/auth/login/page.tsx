'use client'

import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { z } from 'zod'
import { Mail, Lock, Loader2, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  getAuthCallbackUrl,
  getAuthErrorKey,
  getSafeRedirectPath,
  navigateAfterLogin,
} from '@/lib/auth-client'
import { getLoginSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'
import { GoogleAuthButton } from '@/components/auth/google-auth-button'
import { cn } from '@/lib/utils'

type LoginFormData = z.infer<ReturnType<typeof getLoginSchema>>

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale() as 'ar' | 'en'
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const safeRedirectTo = getSafeRedirectPath(redirectTo)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(getLoginSchema(locale)),
    defaultValues: { email: '', password: '' },
  })

  async function handleLogin(data: LoginFormData) {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast({ title: t(`errors.${getAuthErrorKey(error)}`), variant: 'destructive' })
        return
      }

      const signedInUser = authData.user

      if (!signedInUser) {
        navigateAfterLogin(router, { locale, redirectTo })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', signedInUser.id)
        .maybeSingle()

      navigateAfterLogin(router, {
        locale,
        redirectTo,
        role: profile?.role,
      })
    } catch {
      toast({ title: tCommon('error'), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleAuth() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthCallbackUrl({
            origin: window.location.origin,
            locale,
            redirectTo: safeRedirectTo,
          }),
          skipBrowserRedirect: true,
        },
      })

      if (error) {
        toast({ title: t(`errors.${getAuthErrorKey(error)}`), variant: 'destructive' })
        return
      }

      if (!data?.url) {
        toast({ title: t('errors.generic'), variant: 'destructive' })
        return
      }

      window.location.assign(data.url)
    } catch {
      toast({ title: tCommon('error'), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:min-h-[calc(100vh-4rem)] flex items-center justify-center p-0 sm:p-4 lg:p-8 relative overflow-hidden bg-background">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary-rgb),0.1),transparent)] pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute top-[-10%] start-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px] -z-10" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute bottom-[-10%] end-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[100px] -z-10" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl bg-card border-none sm:border border-border/50 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row z-10 min-h-screen sm:min-h-[750px]"
      >
        {/* Left Side: Brand & Visuals */}
        <div className="hidden lg:flex lg:w-5/12 bg-primary p-12 flex-col justify-between relative overflow-hidden text-primary-foreground">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                x: [0, 50, 0], 
                y: [0, -30, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-10%] start-[-10%] w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"
            />
            <motion.div 
              animate={{ 
                x: [0, -40, 0], 
                y: [0, 20, 0],
              }}
              transition={{ duration: 8, delay: 1, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[-20%] end-[-20%] w-full h-full bg-gradient-to-tl from-black/10 to-transparent rounded-full blur-3xl"
            />
          </div>
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link href={`/${locale}`} className="inline-flex items-center justify-start mb-10 group">
                <Image
                  src="/navbar.png"
                  alt="BooktFly"
                  width={224}
                  height={72}
                  priority
                  className="h-24 w-auto object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.12)] transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </Link>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl lg:text-5xl font-extrabold mb-8 leading-tight tracking-tight"
            >
              {t('login_title')}
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-primary-foreground/80 text-lg leading-relaxed max-w-md font-medium mb-12"
            >
              {t('login_subtitle')}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="space-y-6"
            >
              {[
                { icon: CheckCircle2, text: "10,000+ Trusted Bookings" },
                { icon: CheckCircle2, text: "Verified Travel Providers" },
                { icon: CheckCircle2, text: "Best Price Guarantee" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-primary-foreground/90 font-medium">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
          
          <div className="relative z-10 mt-auto">
            <div className="pt-8 border-t border-white/10 text-sm text-primary-foreground/60 font-medium">
              {t('rights_reserved', { year: new Date().getFullYear() })}
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-7/12 p-6 sm:p-12 lg:p-16 flex flex-col justify-center relative bg-card">
          <div className="max-w-md w-full mx-auto">
            <div className="text-center lg:text-start mb-8 lg:mb-10">
              <Link href={`/${locale}`} className="lg:hidden inline-flex mb-8 group">
                <Image
                  src="/navbar.png"
                  alt="BooktFly"
                  width={224}
                  height={72}
                  priority
                  className="h-20 w-auto object-contain drop-shadow-[0_2px_8px_rgba(var(--primary-rgb),0.15)] transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </Link>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-3">{t('login_greeting')}</h1>
                <p className="text-muted-foreground font-medium">{t('login_title')}</p>
              </motion.div>
            </div>

            <div className="w-full">
              <motion.form
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={loginForm.handleSubmit(handleLogin)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-bold text-foreground/80 ms-1">
                    {t('email')}
                  </label>
                  <div className="group relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                      <Mail className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...loginForm.register('email')}
                      className="w-full ps-12 pe-4 py-4 rounded-2xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-border/80 transition-all duration-200 shadow-sm text-base font-medium"
                      placeholder="name@company.com"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1.5 font-semibold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="text-sm font-bold text-foreground/80 ms-1">
                      {t('password')}
                    </label>
                    <Link
                      href={`/${locale}/auth/reset-password`}
                      className="text-sm text-primary font-bold hover:text-primary/80 transition-colors"
                    >
                      {t('forgot_password')}
                    </Link>
                  </div>
                  <div className="group relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                      <Lock className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      {...loginForm.register('password')}
                      className="w-full ps-12 pe-12 py-4 rounded-2xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-border/80 transition-all duration-200 shadow-sm text-base font-medium"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 end-0 flex items-center pe-4 text-muted-foreground hover:text-foreground transition-colors"
                      title={showPassword ? t('hide_password') : t('show_password')}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1.5 font-semibold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full group relative flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-primary text-primary-foreground font-black text-lg overflow-hidden transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 mt-4"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      {t('login_button')}
                      <ArrowRight className={cn(
                        "w-5 h-5 transition-transform duration-300 group-hover:translate-x-1",
                        locale === 'ar' && "rotate-180 group-hover:-translate-x-1"
                      )} />
                    </>
                  )}
                </button>
              </motion.form>

              <div className="mt-8 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-4 text-sm font-semibold text-muted-foreground">
                      {t('or_continue_with')}
                    </span>
                  </div>
                </div>

                <GoogleAuthButton
                  label={t('google')}
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  isLoading={isLoading}
                />
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center lg:text-start mt-10 space-y-4"
            >
              <p className="text-muted-foreground font-medium">
                {t('dont_have_account')}{' '}
                <Link 
                  href={
                    safeRedirectTo
                      ? `/${locale}/auth/signup?redirect=${encodeURIComponent(safeRedirectTo)}`
                      : `/${locale}/auth/signup`
                  }
                  className="text-primary font-black hover:text-primary/80 transition-colors inline-flex items-center gap-1 group"
                >
                  {tCommon('signup')}
                  <ArrowRight className={cn(
                    "w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5",
                    locale === 'ar' && "rotate-180 group-hover:-translate-x-0.5"
                  )} />
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
