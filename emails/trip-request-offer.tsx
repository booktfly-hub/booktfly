import { Text, Section, Row, Column, Hr, Button } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type TripRequestOfferProps = {
  providerName: string
  origin: string
  destination: string
  departureDate: string
  seats: number
  pricePerSeat: number
  totalPrice: number
  notes?: string
  locale?: 'ar' | 'en'
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booktfly.com'

const t = {
  ar: {
    preview: 'لديك عرض جديد على طلب رحلتك!',
    title: 'عرض جديد على طلبك ✨',
    subtitle: 'قام مزود خدمة بتقديم عرض على طلب رحلتك.',
    providerLabel: 'مزود الخدمة',
    routeLabel: 'المسار',
    dateLabel: 'تاريخ المغادرة',
    seatsLabel: 'عدد المقاعد',
    pricePerSeatLabel: 'السعر للمقعد',
    totalLabel: 'الإجمالي',
    notesLabel: 'ملاحظات المزود',
    currency: 'ر.س',
    cta: 'عرض العروض',
    arrow: '\u2190',
  },
  en: {
    preview: 'You have a new offer on your trip request!',
    title: 'New Offer on Your Request ✨',
    subtitle: 'A provider has submitted an offer for your trip request.',
    providerLabel: 'Provider',
    routeLabel: 'Route',
    dateLabel: 'Departure Date',
    seatsLabel: 'Seats',
    pricePerSeatLabel: 'Price per Seat',
    totalLabel: 'Total',
    notesLabel: 'Provider Notes',
    currency: 'SAR',
    cta: 'View Offers',
    arrow: '\u2192',
  },
}

export default function TripRequestOffer({
  providerName = 'Provider',
  origin = 'Riyadh',
  destination = 'Jeddah',
  departureDate = '2025-06-01',
  seats = 1,
  pricePerSeat = 0,
  totalPrice = 0,
  notes,
  locale = 'ar',
}: TripRequestOfferProps) {
  const strings = t[locale]

  return (
    <BaseLayout previewText={strings.preview}>
      <Text style={title}>{strings.title}</Text>
      <Text style={subtitle}>{strings.subtitle}</Text>

      <Section style={detailsSection}>
        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={detailLabel}>{strings.providerLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{providerName}</Text>
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
            <Text style={detailLabel}>{strings.dateLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{departureDate}</Text>
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
            <Text style={detailLabel}>{strings.pricePerSeatLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>
              {pricePerSeat.toLocaleString()} {strings.currency}
            </Text>
          </Column>
        </Row>

        <Hr style={rowDivider} />

        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={amountLabelStyle}>{strings.totalLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={amountValueStyle}>
              {totalPrice.toLocaleString()} {strings.currency}
            </Text>
          </Column>
        </Row>

        {notes && (
          <>
            <Hr style={rowDivider} />
            <Row style={detailRow}>
              <Column style={detailLabelCol}>
                <Text style={detailLabel}>{strings.notesLabel}</Text>
              </Column>
              <Column style={detailValueCol}>
                <Text style={detailValue}>{notes}</Text>
              </Column>
            </Row>
          </>
        )}
      </Section>

      <Section style={ctaSection}>
        <Button style={button} href={`${baseUrl}/${locale}/trip-requests`}>
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

const amountLabelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: 700,
  margin: '0',
}

const amountValueStyle: React.CSSProperties = {
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
