import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  Wallet,
  BarChart3,
  FileText,
  ClipboardCheck,
  Rocket,
  ArrowRight,
  Share2,
  Star,
} from 'lucide-react'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function BecomeMarkeeteerPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('become_marketeer')

  const benefits = [
    { icon: TrendingUp, text: t('benefit_1') },
    { icon: Wallet,     text: t('benefit_2') },
    { icon: BarChart3,  text: t('benefit_3') },
  ]

  const steps = [
    { icon: FileText,      text: t('step_1') },
    { icon: ClipboardCheck, text: t('step_2') },
    { icon: Share2,        text: t('step_3') },
    { icon: Wallet,        text: t('step_4') },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] -left-10 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero */}
      <section className="relative pt-44 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
            <Star className="h-4 w-4" />
            <span>FlyPoints</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            {t('subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/become-marketeer/apply`}
              className={cn(
                buttonVariants({ size: 'lg' }),
                'w-full sm:w-auto rounded-xl px-8 text-lg font-semibold shadow-lg shadow-primary/20'
              )}
            >
              {t('apply_now')}
              <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
            </Link>
            <a
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'lg' }),
                'w-full sm:w-auto rounded-xl px-8 text-lg font-medium'
              )}
            >
              {t('how_it_works')}
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {locale === 'ar' ? 'مميزات البرنامج' : 'Program Benefits'}
          </h2>
          <div className="w-20 h-1.5 bg-primary/50 mx-auto rounded-full" />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <Card
              key={i}
              className="group relative overflow-hidden border-border/50 p-0 transition-all duration-300 hover:border-primary/50 hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="relative p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <b.icon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg text-foreground font-medium leading-relaxed">{b.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto bg-muted/30 rounded-3xl mb-20 border border-border/50">
        <h2 className="text-3xl font-bold mb-12 text-center flex items-center justify-center gap-3">
          <Rocket className="h-8 w-8 text-primary" />
          {t('how_it_works')}
        </h2>
        <div className="space-y-8 relative before:absolute before:inset-0 before:ms-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {steps.map((s, i) => (
            <div key={i} className="relative flex items-center gap-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-primary/10 text-primary shadow shrink-0 z-10">
                <s.icon className="h-5 w-5" />
              </div>
              <Card className="flex-1 border-border/50 transition-colors hover:border-primary/50">
                <CardContent className="p-6">
                <div className="font-bold text-primary mb-1">
                  {locale === 'ar' ? `الخطوة ${i + 1}` : `Step ${i + 1}`}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.text}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center mb-10">
        <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-2xl" />
        <Card className="relative overflow-hidden border-primary/20 p-12 shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <TrendingUp className="w-64 h-64" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {locale === 'ar' ? 'ابدأ الكسب اليوم' : 'Start Earning Today'}
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'انضم إلى شبكة المسوّقين وحوّل متابعيك إلى مصدر دخل حقيقي.'
              : 'Join our marketeer network and turn your followers into a real income stream.'}
          </p>
          <Link
            href={`/${locale}/become-marketeer/apply`}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'rounded-xl px-10 text-xl font-bold shadow-xl shadow-primary/30'
            )}
          >
            {t('apply_now')}
            <ArrowRight className="h-6 w-6 rtl:-scale-x-100" />
          </Link>
        </Card>
      </section>
    </div>
  )
}
