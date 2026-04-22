import { Text, Section } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type Props = {
  passengerName?: string
  origin: string
  destination: string
  bookingRef: string
  locale?: 'ar' | 'en'
  claimUrl?: string
  reviewUrl?: string
}

const t = {
  ar: {
    preview: (d: string) => `كيف كانت رحلتك إلى ${d}؟`,
    title: 'كيف كانت رحلتك؟',
    greet: (n?: string) => (n ? `مرحباً ${n}،` : 'مرحباً،'),
    body: (o: string, d: string) =>
      `نتمنى أن تكون رحلتك من ${o} إلى ${d} قد مرّت بسلام. شاركنا تقييمك — يساعد المسافرين الآخرين على اختيار الرحلة المناسبة.`,
    rewardTitle: 'اكسب 50 نقطة طيران',
    rewardSubtitle: 'قيّم رحلتك من حسابك واحصل على 50 نقطة فورية، قابلة للاستخدام في حجزك القادم.',
    claimBtn: 'إنشاء حسابي والتقييم ←',
    reviewBtn: 'قيّم رحلتي ←',
  },
  en: {
    preview: (d: string) => `How was your trip to ${d}?`,
    title: 'How was your trip?',
    greet: (n?: string) => (n ? `Hi ${n},` : 'Hi,'),
    body: (o: string, d: string) =>
      `We hope your trip from ${o} to ${d} went well. Share your rating — it helps other travelers pick the right flight.`,
    rewardTitle: 'Earn 50 Flypoints',
    rewardSubtitle: 'Rate your trip from your account and get 50 instant points toward your next booking.',
    claimBtn: 'Claim account & review →',
    reviewBtn: 'Rate my trip →',
  },
}

export default function TripReview({
  passengerName,
  origin = 'Riyadh',
  destination = 'Jeddah',
  bookingRef = 'BKT-000000',
  locale = 'ar',
  claimUrl,
  reviewUrl,
}: Props) {
  const s = t[locale]
  const btnHref = claimUrl || reviewUrl || '#'
  const btnLabel = claimUrl ? s.claimBtn : s.reviewBtn
  return (
    <BaseLayout previewText={s.preview(destination)}>
      <Text style={title}>{s.title}</Text>
      <Text style={greet}>{s.greet(passengerName)}</Text>
      <Text style={body}>{s.body(origin, destination)}</Text>
      <Section style={rewardSection}>
        <Text style={rewardTitle}>{s.rewardTitle}</Text>
        <Text style={rewardSubtitle}>{s.rewardSubtitle}</Text>
        <a href={btnHref} style={ctaBtn}>{btnLabel}</a>
      </Section>
      <Text style={refNote}>#{bookingRef}</Text>
    </BaseLayout>
  )
}

const title: React.CSSProperties = { color: '#0f172a', fontSize: '24px', fontWeight: 800, lineHeight: '32px', margin: '0 0 16px 0', textAlign: 'center' }
const greet: React.CSSProperties = { color: '#0f172a', fontSize: '16px', margin: '0 0 8px 0' }
const body: React.CSSProperties = { color: '#475569', fontSize: '16px', lineHeight: '26px', margin: '0 0 24px 0' }
const rewardSection: React.CSSProperties = { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '24px', margin: '0 0 24px 0', textAlign: 'center' }
const rewardTitle: React.CSSProperties = { color: '#78350f', fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }
const rewardSubtitle: React.CSSProperties = { color: '#92400e', fontSize: '14px', lineHeight: '22px', margin: '0 0 16px 0' }
const ctaBtn: React.CSSProperties = { backgroundColor: '#f59e0b', borderRadius: '8px', color: '#ffffff', display: 'inline-block', fontSize: '15px', fontWeight: 600, padding: '12px 28px', textDecoration: 'none', textAlign: 'center' }
const refNote: React.CSSProperties = { color: '#94a3b8', fontSize: '12px', textAlign: 'center', margin: '0' }
