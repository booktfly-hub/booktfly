'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import type { MarkeeteerApplication } from '@/types'

const statusStyles = {
  pending_review: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)]',
    iconAnim: 'animate-pulse',
  },
  approved: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-600 dark:text-green-400',
    glow: 'shadow-[0_0_40px_-10px_rgba(34,197,94,0.3)]',
    iconAnim: '',
  },
  rejected: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-600 dark:text-red-400',
    glow: 'shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)]',
    iconAnim: '',
  },
}

export default function MarkeeteerStatusPage() {
  const t = useTranslations('become_marketeer')
  const ts = useTranslations('status')
  const locale = useLocale()
  const [application, setApplication] = useState<MarkeeteerApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/marketeers/my-application')
      .then((r) => r.json())
      .then((result) => {
        if (result.error) setError(result.error)
        else setApplication(result.data)
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="min-h-screen pt-44 pb-16 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md"
        >
          <Card className="border-border/50 text-center shadow-lg">
            <CardContent className="p-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-4">{locale === 'ar' ? 'لم يتم العثور على طلب' : 'No Application Found'}</h2>
              <Link
                href={`/${locale}/become-marketeer/apply`}
                className={cn(buttonVariants(), 'rounded-xl')}
              >
                {t('apply_now')}
                <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const styles = statusStyles[application.status as keyof typeof statusStyles] ?? statusStyles.pending_review
  const StatusIcon = application.status === 'approved' ? CheckCircle2 : application.status === 'rejected' ? XCircle : Clock
  const isPending = application.status === 'pending_review'
  const isApproved = application.status === 'approved'
  const isRejected = application.status === 'rejected'

  return (
    <div className="min-h-screen pt-44 pb-16 px-4 bg-muted/20 relative overflow-hidden">
      {isPending && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />}
      {isApproved && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />}

      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            {locale === 'ar' ? 'حالة طلب المسوّق' : 'Marketeer Application Status'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {locale === 'ar' ? 'تابع حالة طلب انضمامك كمسوّق' : 'Track your marketeer application progress'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={cn('relative overflow-hidden', styles.glow)}
        >
          <Card className={cn('border-2 rounded-3xl text-center', styles.border)}>
            <CardContent className="relative p-8 md:p-10">
              <div className={cn('absolute top-0 left-0 right-0 h-1.5', styles.bg, 'opacity-50')} />

              <div className="relative mb-8">
                <div className={cn('w-24 h-24 rounded-full flex items-center justify-center mx-auto', styles.bg, styles.text)}>
                  <StatusIcon className={cn('h-12 w-12', styles.iconAnim)} />
                </div>
                {isPending && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-amber-500/20 rounded-full animate-ping -z-0" />
                )}
              </div>

              <div className="mb-8">
                <Badge
                  data-testid="marketeer-application-status"
                  variant={isApproved ? 'success' : isRejected ? 'destructive' : 'warning'}
                  className="mb-4 rounded-full px-3 py-1"
                >
                  {ts(application.status)}
                </Badge>
                {isPending && (
                  <p className="text-muted-foreground font-medium">{t('pending_subtitle')}</p>
                )}
                {isApproved && (
                  <p className="text-muted-foreground font-medium">
                    {locale === 'ar' ? 'تهانينا! تمت الموافقة على طلبك. ابدأ الآن بمشاركة رابط إحالتك.' : 'Congratulations! Your application has been approved. Start sharing your referral link.'}
                  </p>
                )}
              </div>

              <Separator className="my-8" />

              <Card className="border-border/50 bg-muted/30 text-start shadow-none">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">{locale === 'ar' ? 'الاسم' : 'Name'}</p>
                      <p className="text-foreground font-semibold text-lg">{application.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium mb-1">{locale === 'ar' ? 'تاريخ التقديم' : 'Submitted On'}</p>
                      <p className="text-foreground font-medium">
                        {new Date(application.created_at).toLocaleDateString(
                          locale === 'ar' ? 'ar-SA' : 'en-US',
                          { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isRejected && application.admin_comment && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <Card className="mt-6 border-red-500/20 bg-red-500/10 text-start shadow-none">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="font-semibold text-red-600">{locale === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}</p>
                      </div>
                      <p className="text-sm text-red-600/90 leading-relaxed ps-7">{application.admin_comment}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <div className="pt-8 space-y-4">
                {isRejected && (
                  <Link
                    href={`/${locale}/become-marketeer/apply`}
                    className={cn(buttonVariants({ size: 'lg' }), 'w-full rounded-xl font-bold shadow-lg')}
                  >
                    <RefreshCw className="h-5 w-5" />
                    {locale === 'ar' ? 'إعادة التقديم' : 'Reapply'}
                  </Link>
                )}
                {isApproved && (
                  <Link
                    href={`/${locale}/marketeer/dashboard`}
                    data-testid="marketeer-dashboard-link"
                    className={cn(buttonVariants({ size: 'lg' }), 'group w-full rounded-xl font-bold shadow-lg')}
                  >
                    {locale === 'ar' ? 'الذهاب للوحة المسوّق' : 'Go to Marketeer Dashboard'}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1 rtl:-scale-x-100" />
                  </Link>
                )}
                {isPending && (
                  <Badge variant="warning" className="w-full justify-center rounded-xl py-3 text-sm font-medium">
                    {locale === 'ar' ? 'توقع رداً منا قريباً على بريدك الإلكتروني.' : 'Expect to hear back from us soon via email.'}
                  </Badge>
                )}
                <Link href={`/${locale}`} className="block mt-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {locale === 'ar' ? 'العودة للرئيسية' : 'Return to Homepage'}
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
