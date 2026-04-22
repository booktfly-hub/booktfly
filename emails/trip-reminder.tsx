import { Text, Section } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type Props = {
  passengerName?: string
  origin: string
  destination: string
  departureDate: string
  bookingRef: string
  locale?: 'ar' | 'en'
  claimUrl?: string
}

const t = {
  ar: {
    preview: (o: string, d: string) => `رحلتك إلى ${d} بعد 7 أيام`,
    title: 'رحلتك تقترب — 7 أيام فقط',
    greet: (n?: string) => (n ? `مرحباً ${n}،` : 'مرحباً،'),
    body: (o: string, d: string, date: string) =>
      `نذكّرك برحلتك من ${o} إلى ${d} بتاريخ ${date}. تأكد من جواز السفر وموعد المطار.`,
    refLabel: 'رقم الحجز',
    claimTitle: 'فعّل تنبيهات البوابة الحية',
    claimSubtitle: 'أنشئ حسابك بنقرة — واستلم تحديث رقم البوابة والتأخيرات مباشرةً.',
    claimBtn: 'إنشاء حسابي ←',
  },
  en: {
    preview: (o: string, d: string) => `Your trip to ${d} is 7 days away`,
    title: 'Your trip is 7 days away',
    greet: (n?: string) => (n ? `Hi ${n},` : 'Hi,'),
    body: (o: string, d: string, date: string) =>
      `Just a reminder — your trip from ${o} to ${d} on ${date}. Check your passport and airport timing.`,
    refLabel: 'Booking Reference',
    claimTitle: 'Get live gate alerts',
    claimSubtitle: 'One-click account — receive live gate changes and delays.',
    claimBtn: 'Claim my account →',
  },
}

export default function TripReminder({
  passengerName,
  origin = 'Riyadh',
  destination = 'Jeddah',
  departureDate = '2026-01-01',
  bookingRef = 'BKT-000000',
  locale = 'ar',
  claimUrl,
}: Props) {
  const s = t[locale]
  return (
    <BaseLayout previewText={s.preview(origin, destination)}>
      <Text style={title}>{s.title}</Text>
      <Text style={greet}>{s.greet(passengerName)}</Text>
      <Text style={body}>{s.body(origin, destination, departureDate)}</Text>
      <Section style={refSection}>
        <Text style={refLabel}>{s.refLabel}</Text>
        <Text style={refValue}>{bookingRef}</Text>
      </Section>
      {claimUrl && (
        <Section style={claimSection}>
          <Text style={claimTitle}>{s.claimTitle}</Text>
          <Text style={claimSubtitle}>{s.claimSubtitle}</Text>
          <a href={claimUrl} style={claimButton}>{s.claimBtn}</a>
        </Section>
      )}
    </BaseLayout>
  )
}

const title: React.CSSProperties = { color: '#0f172a', fontSize: '24px', fontWeight: 800, lineHeight: '32px', margin: '0 0 16px 0', textAlign: 'center' }
const greet: React.CSSProperties = { color: '#0f172a', fontSize: '16px', margin: '0 0 8px 0' }
const body: React.CSSProperties = { color: '#475569', fontSize: '16px', lineHeight: '26px', margin: '0 0 24px 0' }
const refSection: React.CSSProperties = { backgroundColor: '#f0f9ff', borderRadius: '12px', padding: '20px', margin: '0 0 24px 0', textAlign: 'center', border: '1px solid #bae6fd' }
const refLabel: React.CSSProperties = { color: '#0369a1', fontSize: '12px', fontWeight: 600, margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }
const refValue: React.CSSProperties = { color: '#0c4a6e', fontSize: '22px', fontWeight: 800, margin: '0', letterSpacing: '0.05em' }
const claimSection: React.CSSProperties = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '24px', margin: '24px 0 0 0', textAlign: 'center' }
const claimTitle: React.CSSProperties = { color: '#14532d', fontSize: '17px', fontWeight: 700, margin: '0 0 6px 0' }
const claimSubtitle: React.CSSProperties = { color: '#166534', fontSize: '14px', lineHeight: '22px', margin: '0 0 14px 0' }
const claimButton: React.CSSProperties = { backgroundColor: '#16a34a', borderRadius: '8px', color: '#ffffff', display: 'inline-block', fontSize: '15px', fontWeight: 600, padding: '12px 28px', textDecoration: 'none', textAlign: 'center' }
