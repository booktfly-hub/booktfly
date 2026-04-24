import { lkey } from '@/lib/i18n-helpers'
import { Text, Section, Row, Column } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type SimilarTrip = {
  id: string
  origin: string
  destination: string
  departureDate: string
  price: number
}

type Props = {
  passengerName?: string
  destination: string
  trips: SimilarTrip[]
  locale?: 'ar' | 'en' | 'tr'
  claimUrl?: string
  appUrl?: string
}

const t = {
  ar: {
    preview: (d: string) => `رحلات مشابهة إلى ${d}`,
    title: 'رحلات قد تهمك',
    greet: (n?: string) => (n ? `مرحباً ${n}،` : 'مرحباً،'),
    body: 'بناءً على رحلتك الأخيرة، اخترنا لك هذه العروض. احفظ المفضلة في حسابك وكن أول من يعرف عند انخفاض الأسعار.',
    currency: 'ر.س',
    view: 'عرض',
    claimTitle: 'احفظ رحلاتك المفضلة',
    claimSubtitle: 'نبّهك عند انخفاض السعر — بنقرة واحدة بدون كلمة مرور.',
    claimBtn: 'إنشاء حسابي ←',
  },
  en: {
    preview: (d: string) => `Trips similar to ${d}`,
    title: 'You might like these',
    greet: (n?: string) => (n ? `Hi ${n},` : 'Hi,'),
    body: 'Based on your recent trip, we picked these. Save favorites in your account and get notified on price drops.',
    currency: 'SAR',
    view: 'View',
    claimTitle: 'Save your favorite trips',
    claimSubtitle: 'Get alerted when prices drop — one click, no password.',
    claimBtn: 'Claim my account →',
  },
}

export default function SimilarTrips({
  passengerName,
  destination = 'Jeddah',
  trips = [],
  locale = 'ar',
  claimUrl,
  appUrl = 'https://booktfly.com',
}: Props) {
  const s = t[lkey(locale)]
  return (
    <BaseLayout previewText={s.preview(destination)}>
      <Text style={title}>{s.title}</Text>
      <Text style={greet}>{s.greet(passengerName)}</Text>
      <Text style={body}>{s.body}</Text>

      {trips.length > 0 && (
        <Section style={tripsBox}>
          {trips.slice(0, 4).map((trip, i) => (
            <Row key={trip.id} style={{ ...tripRow, borderTop: i === 0 ? 'none' : '1px solid #e2e8f0' }}>
              <Column style={tripInfoCol}>
                <Text style={tripRoute}>{trip.origin} → {trip.destination}</Text>
                <Text style={tripDate}>{trip.departureDate}</Text>
              </Column>
              <Column style={tripPriceCol}>
                <Text style={tripPrice}>{trip.price.toLocaleString()} {s.currency}</Text>
                <a href={`${appUrl}/${locale}/trips/${trip.id}`} style={viewLink}>{s.view} →</a>
              </Column>
            </Row>
          ))}
        </Section>
      )}

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
const tripsBox: React.CSSProperties = { backgroundColor: '#f8fafc', borderRadius: '12px', padding: '8px 16px', margin: '0 0 24px 0', border: '1px solid #e2e8f0' }
const tripRow: React.CSSProperties = { padding: '14px 0' }
const tripInfoCol: React.CSSProperties = { width: '60%' }
const tripPriceCol: React.CSSProperties = { width: '40%', textAlign: 'left' }
const tripRoute: React.CSSProperties = { color: '#0f172a', fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0' }
const tripDate: React.CSSProperties = { color: '#64748b', fontSize: '13px', margin: '0' }
const tripPrice: React.CSSProperties = { color: '#0ea5e9', fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }
const viewLink: React.CSSProperties = { color: '#0369a1', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }
const claimSection: React.CSSProperties = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '24px', textAlign: 'center' }
const claimTitle: React.CSSProperties = { color: '#14532d', fontSize: '17px', fontWeight: 700, margin: '0 0 6px 0' }
const claimSubtitle: React.CSSProperties = { color: '#166534', fontSize: '14px', lineHeight: '22px', margin: '0 0 14px 0' }
const claimButton: React.CSSProperties = { backgroundColor: '#16a34a', borderRadius: '8px', color: '#ffffff', display: 'inline-block', fontSize: '15px', fontWeight: 600, padding: '12px 28px', textDecoration: 'none', textAlign: 'center' }
