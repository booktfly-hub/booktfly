import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import {
  Users,
  BarChart3,
  Wallet,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  Rocket,
  ArrowRight,
} from 'lucide-react'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function BecomeProviderPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('become_provider')

  const benefits = [
    { icon: Users, text: t('benefit_1') },
    { icon: BarChart3, text: t('benefit_2') },
    { icon: Wallet, text: t('benefit_3') },
  ]

  const steps = [
    { icon: FileText, text: t('step_1') },
    { icon: ClipboardCheck, text: t('step_2') },
    { icon: ShieldCheck, text: t('step_3') },
    { icon: Rocket, text: t('step_4') },
  ]

  const requiredDocs = [
    t('doc_hajj_permit'),
    t('doc_commercial_reg'),
    t('doc_tourism_permit'),
    t('doc_civil_aviation'),
    t('doc_iata_permit'),
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t('subtitle')}
          </p>
          <Link
            href={`/${locale}/become-provider/apply`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            {t('apply_now')}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('benefits_title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="bg-card border rounded-xl p-8 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">
            {t('requirements_title')}
          </h2>
          <div className="bg-card border rounded-xl p-8 space-y-4">
            {requiredDocs.map((doc, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground">{doc}</span>
                <span className="text-xs text-muted-foreground ms-auto">
                  ({t('optional_document')})
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('process_title')}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {i + 1}
                </div>
                <step.icon className="h-6 w-6 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <Link
            href={`/${locale}/become-provider/apply`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            {t('apply_now')}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
