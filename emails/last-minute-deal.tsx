import { lkey } from '@/lib/i18n-helpers'
import { Text, Section, Row, Column, Hr, Link } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type LastMinuteDealProps = {
  listingType: 'flight' | 'room' | 'car'
  title: string
  subtitle: string
  departureOrDate: string
  originalPrice: number
  discountedPrice: number
  discountPercent: number
  hoursLeft: number
  bookingUrl: string
  locale?: 'ar' | 'en' | 'tr'
}

const t = {
  ar: {
    preview: (title: string) => `عرض اللحظة الأخيرة! - ${title}`,
    heading: 'عرض اللحظة الأخيرة!',
    urgency: (hours: number) => `المغادرة خلال ${hours} ساعة`,
    dateLabel: 'التاريخ',
    originalPriceLabel: 'السعر الأصلي',
    discountedPriceLabel: 'سعر العرض',
    discountBadge: (percent: number) => `خصم ${percent}%`,
    bookNow: 'احجز الآن',
    note: 'هذا العرض ينتهي قريباً',
    currency: 'ر.س',
    flightLabel: 'رحلة طيران',
    roomLabel: 'حجز فندقي',
    carLabel: 'تأجير سيارة',
  },
  en: {
    preview: (title: string) => `Last Minute Deal! - ${title}`,
    heading: 'Last Minute Deal!',
    urgency: (hours: number) => `Departing in ${hours} hours`,
    dateLabel: 'Date',
    originalPriceLabel: 'Original Price',
    discountedPriceLabel: 'Deal Price',
    discountBadge: (percent: number) => `${percent}% OFF`,
    bookNow: 'Book Now',
    note: 'This deal expires soon',
    currency: 'SAR',
    flightLabel: 'Flight',
    roomLabel: 'Room',
    carLabel: 'Car Rental',
  },
}

export default function LastMinuteDeal({
  listingType = 'flight',
  title: dealTitle = 'Amazing Deal',
  subtitle: dealSubtitle = 'Riyadh → Jeddah',
  departureOrDate = '2024-01-01',
  originalPrice = 1000,
  discountedPrice = 700,
  discountPercent = 30,
  hoursLeft = 12,
  bookingUrl = 'https://booktfly.com',
  locale = 'ar',
}: LastMinuteDealProps) {
  const strings = t[lkey(locale)]

  const typeLabel =
    listingType === 'flight'
      ? strings.flightLabel
      : listingType === 'room'
        ? strings.roomLabel
        : strings.carLabel

  return (
    <BaseLayout previewText={strings.preview(dealTitle)}>
      {/* Heading with orange/red gradient style */}
      <Text style={heading}>{strings.heading}</Text>

      {/* Urgency badge */}
      <Section style={urgencySection}>
        <Text style={urgencyText}>&#9200; {strings.urgency(hoursLeft)}</Text>
      </Section>

      {/* Deal card */}
      <Section style={dealCard}>
        {/* Type badge */}
        <Text style={typeBadge}>{typeLabel}</Text>

        {/* Deal title and subtitle */}
        <Text style={dealTitleStyle}>{dealTitle}</Text>
        <Text style={dealSubtitleStyle}>{dealSubtitle}</Text>

        <Hr style={cardDivider} />

        {/* Date row */}
        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={detailLabel}>{strings.dateLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{departureOrDate}</Text>
          </Column>
        </Row>

        <Hr style={cardDivider} />

        {/* Pricing section */}
        <Section style={pricingSection}>
          {/* Discount badge */}
          <Text style={discountBadgeStyle}>
            {strings.discountBadge(discountPercent)}
          </Text>

          {/* Original price crossed out */}
          <Text style={originalPriceStyle}>
            {originalPrice.toLocaleString()} {strings.currency}
          </Text>

          {/* Discounted price bold */}
          <Text style={discountedPriceStyle}>
            {discountedPrice.toLocaleString()} {strings.currency}
          </Text>
        </Section>
      </Section>

      {/* Book Now CTA button */}
      <Section style={ctaSection}>
        <Link href={bookingUrl} style={ctaButton}>
          {strings.bookNow}
        </Link>
      </Section>

      <Text style={note}>{strings.note}</Text>
    </BaseLayout>
  )
}

const heading: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
  lineHeight: '36px',
  margin: '0 0 16px 0',
  textAlign: 'center',
  background: 'linear-gradient(135deg, #ea580c, #dc2626)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: '#ea580c',
}

const urgencySection: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '12px 20px',
  margin: '0 0 28px 0',
  textAlign: 'center',
  border: '1px solid #fecaca',
}

const urgencyText: React.CSSProperties = {
  color: '#dc2626',
  fontSize: '15px',
  fontWeight: 700,
  margin: '0',
}

const dealCard: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 28px 0',
  border: '1px solid #e2e8f0',
}

const typeBadge: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#f0f9ff',
  color: '#0369a1',
  fontSize: '12px',
  fontWeight: 700,
  padding: '4px 12px',
  borderRadius: '20px',
  margin: '0 0 16px 0',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  border: '1px solid #bae6fd',
}

const dealTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '20px',
  fontWeight: 800,
  lineHeight: '28px',
  margin: '0 0 8px 0',
}

const dealSubtitleStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
}

const cardDivider: React.CSSProperties = {
  borderColor: '#e2e8f0',
  borderTop: '1px solid #e2e8f0',
  margin: '0',
}

const detailRow: React.CSSProperties = {
  padding: '12px 0',
}

const detailLabelCol: React.CSSProperties = {
  width: '40%',
}

const detailValueCol: React.CSSProperties = {
  width: '60%',
}

const detailLabel: React.CSSProperties = {
  color: '#64748b',
  fontSize: '15px',
  margin: '0',
}

const detailValue: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '15px',
  fontWeight: 600,
  margin: '0',
}

const pricingSection: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px 0 4px 0',
}

const discountBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 800,
  padding: '6px 16px',
  borderRadius: '20px',
  margin: '0 0 16px 0',
  letterSpacing: '0.02em',
}

const originalPriceStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '16px',
  fontWeight: 500,
  margin: '0 0 8px 0',
  textDecoration: 'line-through',
}

const discountedPriceStyle: React.CSSProperties = {
  color: '#ea580c',
  fontSize: '28px',
  fontWeight: 800,
  margin: '0',
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
  margin: '0 0 28px 0',
}

const ctaButton: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#ea580c',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 700,
  padding: '16px 48px',
  borderRadius: '12px',
  textDecoration: 'none',
  textAlign: 'center',
  letterSpacing: '0.02em',
}

const note: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  textAlign: 'center',
}
