'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Shield, Lightbulb, Users, Award } from 'lucide-react'

interface AboutPageClientProps {
  locale: string
}

export function AboutPageClient({ locale }: AboutPageClientProps) {
  const t = useTranslations('about')

  const values = [
    { icon: Shield, title: t('value_trust'), color: 'bg-blue-50 text-blue-600' },
    { icon: Lightbulb, title: t('value_innovation'), color: 'bg-amber-50 text-amber-600' },
    { icon: Users, title: t('value_community'), color: 'bg-green-50 text-green-600' },
    { icon: Award, title: t('value_excellence'), color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <Image
          src="/logo.png"
          alt="BookItFly"
          width={160}
          height={60}
          className="mx-auto mb-6"
        />
        <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      </div>

      {/* Mission */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-3">{t('mission')}</h2>
        <p className="text-muted-foreground leading-relaxed">{t('mission_text')}</p>
      </section>

      {/* Values */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6">{t('values')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {values.map((value) => (
            <div key={value.title} className="rounded-xl border border-border p-4 text-center">
              <div className={`inline-flex rounded-full p-3 mb-3 ${value.color}`}>
                <value.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">{value.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="rounded-xl bg-primary/5 border border-primary/10 p-8">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">1000+</p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'ar' ? 'رحلة متاحة' : 'Available Trips'}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">50+</p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'ar' ? 'مزود خدمة موثق' : 'Verified Providers'}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">10,000+</p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'ar' ? 'مسافر سعيد' : 'Happy Travelers'}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
