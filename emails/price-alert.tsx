import { Text, Section, Button } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type PriceAlertProps = {
  origin: string
  destination: string
  currentPrice: number
  targetPrice: number
  searchUrl: string
  locale?: 'ar' | 'en'
}

const t = {
  ar: {
    preview: 'تنبيه انخفاض السعر!',
    title: 'انخفاض في سعر رحلتك!',
    subtitle: 'الرحلة التي تراقبها أصبحت متاحة بسعر أقل.',
    routeLabel: 'المسار',
    currentPriceLabel: 'السعر الحالي',
    targetPriceLabel: 'هدفك',
    currency: 'ر.س',
    cta: 'احجز الآن',
    arrow: '\u2190',
  },
  en: {
    preview: 'Price Drop Alert!',
    title: 'Price Drop on Your Flight!',
    subtitle: 'The flight you\'re watching is now available at a lower price.',
    routeLabel: 'Route',
    currentPriceLabel: 'Current Price',
    targetPriceLabel: 'Your Target',
    currency: 'SAR',
    cta: 'Book Now',
    arrow: '\u2192',
  },
}

export default function PriceAlertEmail({
  origin = 'Riyadh',
  destination = 'Jeddah',
  currentPrice = 500,
  targetPrice = 600,
  searchUrl = '#',
  locale = 'ar',
}: PriceAlertProps) {
  const strings = t[locale]

  return (
    <BaseLayout previewText={strings.preview}>
      <Text style={title}>{strings.title}</Text>
      <Text style={subtitle}>{strings.subtitle}</Text>

      <Section style={priceSection}>
        <Text style={routeText}>
          {origin} {strings.arrow} {destination}
        </Text>
        <Text style={priceText}>
          {currentPrice.toLocaleString()} {strings.currency}
        </Text>
        {targetPrice && (
          <Text style={targetText}>
            {strings.targetPriceLabel}: {targetPrice.toLocaleString()} {strings.currency}
          </Text>
        )}
      </Section>

      <Section style={ctaSection}>
        <Button href={searchUrl} style={ctaButton}>
          {strings.cta}
        </Button>
      </Section>
    </BaseLayout>
  )
}

const title: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: 800,
  lineHeight: '32px',
  margin: '0 0 12px 0',
  textAlign: 'center',
}

const subtitle: React.CSSProperties = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 32px 0',
  textAlign: 'center',
}

const priceSection: React.CSSProperties = {
  backgroundColor: '#f0f9ff',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 32px 0',
  textAlign: 'center',
  border: '1px solid #bae6fd',
}

const routeText: React.CSSProperties = {
  color: '#0369a1',
  fontSize: '16px',
  fontWeight: 600,
  margin: '0 0 12px 0',
}

const priceText: React.CSSProperties = {
  color: '#0c4a6e',
  fontSize: '32px',
  fontWeight: 800,
  margin: '0 0 8px 0',
}

const targetText: React.CSSProperties = {
  color: '#22c55e',
  fontSize: '14px',
  fontWeight: 600,
  margin: '0',
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
  margin: '0 0 32px 0',
}

const ctaButton: React.CSSProperties = {
  backgroundColor: '#0ea5e9',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 700,
  padding: '14px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
}
