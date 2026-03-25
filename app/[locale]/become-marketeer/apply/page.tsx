'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { getMarkeeteerApplicationSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  Loader2,
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
} from 'lucide-react'

type FormData = z.infer<ReturnType<typeof getMarkeeteerApplicationSchema>>

const CLIENT_TIMEOUT_MS = 30_000

export default function ApplyMarkeeteerPage() {
  const t = useTranslations('become_marketeer')
  const tc = useTranslations('common')
  const locale = useLocale() as 'ar' | 'en'
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [isReapply, setIsReapply] = useState(false)

  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch('/api/marketeers/my-application', { cache: 'no-store' })
        if (!res.ok) { setPageLoading(false); return }
        const result = await res.json()
        if (result.data) {
          if (result.data.status === 'pending_review') {
            router.replace(`/${locale}/become-marketeer/status`)
            return
          }
          if (result.data.status === 'approved') {
            router.replace(`/${locale}/marketeer/dashboard`)
            return
          }
          if (result.data.status === 'rejected') {
            setIsReapply(true)
          }
        }
      } catch {
        // first-time applicant
      } finally {
        setPageLoading(false)
      }
    }
    checkExisting()
  }, [locale, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getMarkeeteerApplicationSchema(locale)),
  })

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS)
      const res = await fetch('/api/marketeers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept-Language': locale },
        signal: controller.signal,
        body: JSON.stringify(data),
      }).finally(() => clearTimeout(timeoutId))

      const result = await res.json()

      if (!res.ok) {
        toast({ title: result.error || tc('error'), variant: 'destructive' })
        return
      }

      toast({ title: t('application_received'), variant: 'success' })
      router.push(`/${locale}/become-marketeer/status`)
    } catch (error) {
      const message = error instanceof Error ? error.message : tc('error')
      toast({ title: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  }
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const fields: {
    name: keyof FormData
    label: string
    icon: React.ElementType
    type?: string
    placeholder: string
    required?: boolean
    dir?: 'rtl' | 'ltr'
  }[] = [
    { name: 'full_name',        label: t('full_name'),        icon: User,       type: 'text',  placeholder: locale === 'ar' ? 'الاسم الكامل كما في الهوية' : 'Full name as on ID',  required: true,  dir: 'rtl' },
    { name: 'national_id',      label: t('national_id'),      icon: CreditCard, type: 'text',  placeholder: '1xxxxxxxxx',                                                              required: true,  dir: 'ltr' },
    { name: 'date_of_birth',    label: t('date_of_birth'),    icon: Calendar,   type: 'date',  placeholder: '',                                                                        required: true,  dir: 'ltr' },
    { name: 'phone',            label: t('phone'),            icon: Phone,      type: 'tel',   placeholder: '05xxxxxxxx',                                                              required: true,  dir: 'ltr' },
    { name: 'phone_alt',        label: t('phone_alt'),        icon: Phone,      type: 'tel',   placeholder: '05xxxxxxxx',                                                              required: false, dir: 'ltr' },
    { name: 'email',            label: t('email'),            icon: Mail,       type: 'email', placeholder: 'example@email.com',                                                       required: true,  dir: 'ltr' },
    { name: 'national_address', label: t('national_address'), icon: MapPin,     type: 'text',  placeholder: locale === 'ar' ? 'المنطقة / المدينة / الحي / رقم المبنى' : 'Region / City / District / Building No.', required: true, dir: 'rtl' },
  ]

  return (
    <div className="min-h-screen pt-44 pb-12 px-4 bg-muted/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl -z-10" />

      <motion.div
        className="max-w-2xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            {isReapply
              ? (locale === 'ar' ? 'إعادة تقديم الطلب' : 'Reapply as Marketeer')
              : t('apply_title')}
          </h1>
          <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
        </motion.div>

        {isReapply && (
          <motion.div variants={itemVariants} className="mb-6 text-center">
            <Badge variant="warning" className="rounded-xl px-4 py-2 text-sm font-medium">
              {t('rejected_notice')}
            </Badge>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="border-border/50">
              <CardHeader className="gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    <User className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{t('personal_info')}</CardTitle>
                </div>
                <CardDescription>{t('subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {fields.map((f) => (
                  <div key={f.name}>
                    <Label className="mb-2 flex items-center gap-2">
                      <f.icon className="h-4 w-4 text-muted-foreground" />
                      {f.label}
                      {f.required
                        ? <span className="text-destructive">*</span>
                        : <span className="text-muted-foreground font-normal">({tc('optional')})</span>
                      }
                    </Label>
                    <Input
                      type={f.type}
                      dir={f.dir}
                      placeholder={f.placeholder}
                      {...register(f.name)}
                      className="h-12 rounded-xl border-border/60 bg-background px-4 py-3 text-sm"
                    />
                    {errors[f.name] && (
                      <p className="text-destructive text-xs mt-1.5 font-medium">
                        {errors[f.name]?.message}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="h-14 w-full rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {locale === 'ar' ? 'جاري إرسال الطلب...' : 'Submitting...'}
                </>
              ) : (
                <>
                  {t('submit_application')}
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1 rtl:-scale-x-100" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}
