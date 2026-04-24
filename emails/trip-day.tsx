import { lkey } from '@/lib/i18n-helpers'
import { Text, Section } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type Props = {
  passengerName?: string
  origin: string
  destination: string
  departureDate: string
  bookingRef: string
  locale?: 'ar' | 'en' | 'tr'
}

const t = {
  ar: {
    preview: (d: string) => `رحلة سعيدة إلى ${d}`,
    title: 'رحلة سعيدة ✈️',
    greet: (n?: string) => (n ? `${n},` : ''),
    body: (o: string, d: string) =>
      `اليوم موعد رحلتك من ${o} إلى ${d}. نتمنى لك رحلة آمنة وممتعة.`,
    tipsTitle: 'نصائح سريعة',
    tip1: 'احرص على الوصول قبل الموعد بـ 3 ساعات للرحلات الدولية.',
    tip2: 'تأكد من الجواز والبطاقة قبل مغادرة المنزل.',
    tip3: 'احفظ رقم الحجز على هاتفك.',
    refLabel: 'رقم الحجز',
  },
  en: {
    preview: (d: string) => `Safe travels to ${d}`,
    title: 'Safe travels ✈️',
    greet: (n?: string) => (n ? `${n},` : ''),
    body: (o: string, d: string) =>
      `Your flight from ${o} to ${d} is today. Wishing you a smooth and pleasant journey.`,
    tipsTitle: 'Quick tips',
    tip1: 'Arrive 3 hours early for international flights.',
    tip2: 'Double-check your passport and ID before leaving home.',
    tip3: 'Keep your booking reference on your phone.',
    refLabel: 'Booking Reference',
  },
}

export default function TripDay({
  passengerName,
  origin = 'Riyadh',
  destination = 'Jeddah',
  bookingRef = 'BKT-000000',
  locale = 'ar',
}: Props) {
  const s = t[lkey(locale)]
  return (
    <BaseLayout previewText={s.preview(destination)}>
      <Text style={title}>{s.title}</Text>
      {passengerName && <Text style={greet}>{s.greet(passengerName)}</Text>}
      <Text style={body}>{s.body(origin, destination)}</Text>
      <Section style={tipsBox}>
        <Text style={tipsTitle}>{s.tipsTitle}</Text>
        <Text style={tipItem}>• {s.tip1}</Text>
        <Text style={tipItem}>• {s.tip2}</Text>
        <Text style={tipItem}>• {s.tip3}</Text>
      </Section>
      <Section style={refSection}>
        <Text style={refLabel}>{s.refLabel}</Text>
        <Text style={refValue}>{bookingRef}</Text>
      </Section>
    </BaseLayout>
  )
}

const title: React.CSSProperties = { color: '#0f172a', fontSize: '26px', fontWeight: 800, lineHeight: '34px', margin: '0 0 16px 0', textAlign: 'center' }
const greet: React.CSSProperties = { color: '#0f172a', fontSize: '16px', margin: '0 0 8px 0' }
const body: React.CSSProperties = { color: '#475569', fontSize: '16px', lineHeight: '26px', margin: '0 0 24px 0' }
const tipsBox: React.CSSProperties = { backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', margin: '0 0 24px 0', border: '1px solid #e2e8f0' }
const tipsTitle: React.CSSProperties = { color: '#0f172a', fontSize: '15px', fontWeight: 700, margin: '0 0 10px 0' }
const tipItem: React.CSSProperties = { color: '#475569', fontSize: '14px', lineHeight: '22px', margin: '0 0 6px 0' }
const refSection: React.CSSProperties = { backgroundColor: '#f0f9ff', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #bae6fd' }
const refLabel: React.CSSProperties = { color: '#0369a1', fontSize: '12px', fontWeight: 600, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }
const refValue: React.CSSProperties = { color: '#0c4a6e', fontSize: '20px', fontWeight: 800, margin: '0', letterSpacing: '0.05em' }
