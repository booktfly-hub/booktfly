import { lkey } from '@/lib/i18n-helpers'
import { Text, Section, Row, Column, Hr, Button } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type NewBookingProps = {
  passengerName: string
  origin: string
  destination: string
  seats: number
  amount: number
  locale?: 'ar' | 'en' | 'tr'
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booktfly.com'

const t = {
  ar: {
    preview: 'لديك حجز جديد!',
    title: 'حجز جديد ✨',
    subtitle: 'تم استلام حجز جديد على إحدى رحلاتك.',
    passengerLabel: 'اسم الراكب',
    routeLabel: 'المسار',
    seatsLabel: 'عدد المقاعد',
    amountLabel: 'المبلغ',
    currency: 'ر.س',
    cta: 'عرض الحجوزات',
    arrow: '\u2190',
  },
  en: {
    preview: 'You have a new booking!',
    title: 'New Booking ✨',
    subtitle: 'A new booking has been received for one of your trips.',
    passengerLabel: 'Passenger Name',
    routeLabel: 'Route',
    seatsLabel: 'Seats',
    amountLabel: 'Amount',
    currency: 'SAR',
    cta: 'View Bookings',
    arrow: '\u2192',
  },
}

export default function NewBooking({
  passengerName = 'Passenger',
  origin = 'Riyadh',
  destination = 'Jeddah',
  seats = 1,
  amount = 0,
  locale = 'ar',
}: NewBookingProps) {
  const strings = t[lkey(locale)]

  return (
    <BaseLayout previewText={strings.preview}>
      <Text style={title}>{strings.title}</Text>
      <Text style={subtitle}>{strings.subtitle}</Text>

      <Section style={detailsSection}>
        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={detailLabel}>{strings.passengerLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{passengerName}</Text>
          </Column>
        </Row>

        <Hr style={rowDivider} />

        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={detailLabel}>{strings.routeLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>
              {origin} {strings.arrow} {destination}
            </Text>
          </Column>
        </Row>

        <Hr style={rowDivider} />

        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={detailLabel}>{strings.seatsLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{seats}</Text>
          </Column>
        </Row>

        <Hr style={rowDivider} />

        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={amountLabel}>{strings.amountLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={amountValue}>
              {amount.toLocaleString()} {strings.currency}
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={ctaSection}>
        <Button style={button} href={`${baseUrl}/${locale}/provider/bookings`}>
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
}

const subtitle: React.CSSProperties = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 32px 0',
}

const detailsSection: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 32px 0',
  border: '1px solid #e2e8f0',
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

const rowDivider: React.CSSProperties = {
  borderColor: '#e2e8f0',
  borderTop: '1px solid #e2e8f0',
  margin: '0',
}

const amountLabel: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: 700,
  margin: '0',
}

const amountValue: React.CSSProperties = {
  color: '#0ea5e9',
  fontSize: '20px',
  fontWeight: 800,
  margin: '0',
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
  margin: '0',
}

const button: React.CSSProperties = {
  backgroundColor: '#0ea5e9',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 600,
  padding: '14px 36px',
  textDecoration: 'none',
  textAlign: 'center',
  boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)',
}