import { Text, Section, Row, Column, Hr } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type BookingConfirmedProps = {
  bookingRef: string
  origin: string
  destination: string
  departureDate: string
  airline: string
  seats: number
  totalAmount: number
  locale?: 'ar' | 'en'
}

const t = {
  ar: {
    preview: (ref: string) => `تأكيد الحجز - ${ref}`,
    title: 'تم تأكيد حجزك بنجاح!',
    subtitle: 'شكراً لك! تم تأكيد حجزك وإتمام الدفع بنجاح. استعد لرحلتك القادمة.',
    refLabel: 'رقم الحجز',
    routeLabel: 'المسار',
    dateLabel: 'تاريخ المغادرة',
    airlineLabel: 'شركة الطيران',
    seatsLabel: 'عدد المقاعد',
    totalLabel: 'المبلغ الإجمالي',
    currency: 'ر.س',
    note: 'يرجى الاحتفاظ برقم الحجز للرجوع إليه عند الحاجة.',
    arrow: '\u2190',
  },
  en: {
    preview: (ref: string) => `Booking Confirmed - ${ref}`,
    title: 'Your Booking is Confirmed!',
    subtitle: 'Thank you! Your booking has been confirmed and payment processed successfully. Get ready for your upcoming trip.',
    refLabel: 'Booking Reference',
    routeLabel: 'Route',
    dateLabel: 'Departure Date',
    airlineLabel: 'Airline',
    seatsLabel: 'Seats',
    totalLabel: 'Total Amount',
    currency: 'SAR',
    note: 'Please keep your booking reference for future reference.',
    arrow: '\u2192',
  },
}

export default function BookingConfirmed({
  bookingRef = 'BKT-000000',
  origin = 'Riyadh',
  destination = 'Jeddah',
  departureDate = '2024-01-01',
  airline = 'Airline',
  seats = 1,
  totalAmount = 0,
  locale = 'ar',
}: BookingConfirmedProps) {
  const strings = t[locale]

  return (
    <BaseLayout previewText={strings.preview(bookingRef)}>
      <Text style={title}>{strings.title}</Text>
      <Text style={subtitle}>{strings.subtitle}</Text>

      <Section style={refSection}>
        <Text style={refLabel}>{strings.refLabel}</Text>
        <Text style={refValue}>{bookingRef}</Text>
      </Section>

      <Section style={detailsSection}>
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
            <Text style={detailLabel}>{strings.airlineLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{airline}</Text>
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
            <Text style={totalLabel}>{strings.totalLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={totalValue}>
              {totalAmount.toLocaleString()} {strings.currency}
            </Text>
          </Column>
        </Row>
      </Section>

      <Text style={note}>{strings.note}</Text>
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

const refSection: React.CSSProperties = {
  backgroundColor: '#f0f9ff',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 32px 0',
  textAlign: 'center',
  border: '1px solid #bae6fd',
}

const refLabel: React.CSSProperties = {
  color: '#0369a1',
  fontSize: '13px',
  fontWeight: 600,
  margin: '0 0 8px 0',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const refValue: React.CSSProperties = {
  color: '#0c4a6e',
  fontSize: '28px',
  fontWeight: 800,
  margin: '0',
  letterSpacing: '0.05em',
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

const totalLabel: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: 700,
  margin: '0',
}

const totalValue: React.CSSProperties = {
  color: '#0ea5e9',
  fontSize: '20px',
  fontWeight: 800,
  margin: '0',
}

const note: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  textAlign: 'center',
}