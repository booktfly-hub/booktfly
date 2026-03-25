'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { z } from 'zod'
import { Mail, Lock, User, Phone, Loader2, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorKey } from '@/lib/auth-client'
import { getSignupSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

type SignupFormData = z.infer<ReturnType<typeof getSignupSchema>>

export default function SignupPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale() as 'ar' | 'en'
  const [isLoading, setIsLoading] = useState(false)
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<SignupFormData>({
    resolver: zodResolver(getSignupSchema(locale)),
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
      const refCode = document.cookie.split('; ').find(r => r.startsWith('ref_code='))?.split('=')[1] ?? null
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
          data: {
            full_name: data.full_name,
            phone: data.phone || null,
            locale,
            referred_by: refCode,
          },
        },
      })

      if (error) {
        toast({ title: t(`errors.${getAuthErrorKey(error)}`), variant: 'destructive' })
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
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary-rgb),0.1),transparent)] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg text-center bg-card rounded-3xl border border-border/50 shadow-2xl p-10 sm:p-16 z-10"
        >
          <div className="flex justify-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 text-success border-4 border-success/20 shadow-lg shadow-success/10"
            >
              <CheckCircle2 className="w-12 h-12" />
            </motion.div>
          </div>
          <h2 className="text-3xl font-black text-foreground mb-4 tracking-tight">{t('verification_sent')}</h2>
          <p className="text-muted-foreground mb-10 text-lg font-medium leading-relaxed">
            {t('check_email_description')}
          </p>
          <Link
            href={`/${locale}/auth/login`}
            className="w-full inline-flex items-center justify-center py-4 px-8 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300"
          >
            {tCommon('login')}
            <ArrowRight className={cn(
              "ms-2 w-5 h-5",
              locale === 'ar' && "rotate-180"
            )} />
          </Link>
        </motion.div>
      </div>
    )
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
        className="w-full max-w-6xl bg-card border-none sm:border border-border/50 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row z-10 min-h-screen sm:min-h-[850px]"
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
              <Link href={`/${locale}`} className="inline-flex items-center justify-center mb-10 group">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 group-hover:rotate-3">
                  <Image src="/booktfly-logo-symbol.png" alt="BooktFly" width={40} height={40} className="object-contain" />
                </div>
                <span className="ms-4 text-2xl font-black tracking-tighter">BooktFly</span>
              </Link>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl lg:text-5xl font-extrabold mb-8 leading-tight tracking-tight"
            >
              {t('signup_title')}
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-primary-foreground/80 text-lg leading-relaxed max-w-md font-medium mb-12"
            >
              {t('signup_subtitle')}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="space-y-6"
            >
              {[
                { icon: CheckCircle2, text: "Seamless Flight Booking Experience" },
                { icon: CheckCircle2, text: "Exclusive Member-only Deals" },
                { icon: CheckCircle2, text: "24/7 Priority Customer Support" }
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
              <Link href={`/${locale}`} className="lg:hidden inline-block mb-8 group">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Image src="/booktfly-logo-symbol.png" alt="BooktFly" width={32} height={32} className="object-contain" />
                  </div>
                  <span className="text-2xl font-black tracking-tighter text-primary">BooktFly</span>
                </div>
              </Link>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-3">{t('signup_greeting')}</h1>
                <p className="text-muted-foreground font-medium">{t('signup_title')}</p>
              </motion.div>
            </div>

            <div className="w-full">
              <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="full_name" className="text-sm font-bold text-foreground/80 ms-1">
                    {t('full_name')}
                  </label>
                  <div className="group relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                      <User className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      id="full_name"
                      type="text"
                      autoComplete="name"
                      {...form.register('full_name')}
                      className="w-full ps-12 pe-4 py-4 rounded-2xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-border/80 transition-all duration-200 shadow-sm text-base font-medium"
                      placeholder="John Doe"
                    />
                  </div>
                  {form.formState.errors.full_name && (
                    <p className="text-sm text-destructive mt-1.5 font-semibold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {form.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

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
                      {...form.register('email')}
                      className="w-full ps-12 pe-4 py-4 rounded-2xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-border/80 transition-all duration-200 shadow-sm text-base font-medium"
                      placeholder="name@company.com"
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1.5 font-semibold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-bold text-foreground/80 ms-1">
                    {t('password')}
                  </label>
                  <div className="group relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                      <Lock className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      {...form.register('password')}
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
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1.5 font-semibold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-bold text-foreground/80 ms-1">
                    {t('phone')}{' '}
                    <span className="text-muted-foreground font-normal">({tCommon('optional')})</span>
                  </label>
                  <div className="group relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                      <Phone className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      {...form.register('phone')}
                      className="w-full ps-12 pe-4 py-4 rounded-2xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-border/80 transition-all duration-200 shadow-sm text-base font-medium"
                      placeholder="+966 5XX XXX XXXX"
                      dir="ltr"
                    />
                  </div>
                  {form.formState.errors.phone && (
                    <p className="text-sm text-destructive mt-1.5 font-semibold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <span className="w-1 h-1 rounded-full bg-destructive" />
                      {form.formState.errors.phone.message}
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
                      {t('signup_button')}
                      <ArrowRight className={cn(
                        "w-5 h-5 transition-transform duration-300 group-hover:translate-x-1",
                        locale === 'ar' && "rotate-180 group-hover:-translate-x-1"
                      )} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center lg:text-start mt-10 space-y-4"
            >
              <p className="text-muted-foreground font-medium">
                {t('already_have_account')}{' '}
                <Link 
                  href={`/${locale}/auth/login`} 
                  className="text-primary font-black hover:text-primary/80 transition-colors inline-flex items-center gap-1 group"
                >
                  {tCommon('login')}
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
