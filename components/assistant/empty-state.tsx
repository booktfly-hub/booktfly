'use client'

import { useTranslations } from 'next-intl'
import { Plane, BedDouble, Scale, Globe } from 'lucide-react'
import Image from 'next/image'

export function EmptyState({
  onPick,
  locale,
}: {
  onPick: (prompt: string) => void
  locale: string
}) {
  const t = useTranslations('assistant.empty')

  // Localized prompt seeds — sent verbatim to the model on tap.
  const seedPrompts = {
    flight:
      locale === 'ar'
        ? 'أبحث عن رحلة من الرياض إلى إسطنبول الأسبوع القادم لشخصين'
        : locale === 'tr'
          ? 'Önümüzdeki hafta Riyad\'dan İstanbul\'a 2 kişilik uçak arıyorum'
          : 'Find me a flight from Riyadh to Istanbul next week for 2 people',
    hotel:
      locale === 'ar'
        ? 'ابحث عن فنادق 4 نجوم في دبي لـ 3 ليالٍ'
        : locale === 'tr'
          ? 'Dubai\'de 3 gece için 4 yıldızlı oteller bul'
          : 'Find 4-star hotels in Dubai for 3 nights',
    compare:
      locale === 'ar'
        ? 'قارن أفضل عروض الفنادق في إسطنبول هذا الشهر'
        : locale === 'tr'
          ? 'Bu ay İstanbul\'daki en iyi otel tekliflerini karşılaştır'
          : 'Compare the best hotel deals in Istanbul this month',
    research:
      locale === 'ar'
        ? 'ما رأي المسافرين بالخطوط السعودية؟'
        : locale === 'tr'
          ? 'Türk Hava Yolları yorumları neler?'
          : 'What do travelers say about Saudia airline?',
  }

  const items: Array<{
    key: 'flight' | 'hotel' | 'compare' | 'research'
    icon: React.ComponentType<{ className?: string }>
  }> = [
    { key: 'flight', icon: Plane },
    { key: 'hotel', icon: BedDouble },
    { key: 'compare', icon: Scale },
    { key: 'research', icon: Globe },
  ]

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-end px-4 pb-8">
      {/* Brand mark, faded into the background like ChatGPT empty state */}
      <div className="mt-auto flex flex-col items-center pb-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Image
            src="/booktfly-logo-symbol.png"
            alt="BookitFly"
            width={36}
            height={36}
            className="opacity-90"
          />
        </div>
        <h1 className="text-center text-lg font-bold text-foreground">
          {t('greeting')}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="space-y-2">
        {items.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick(seedPrompts[key])}
            className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-start text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Icon className="h-5 w-5 text-primary" />
            <span>{t(`items.${key}`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
