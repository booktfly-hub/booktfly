import { Text, Section, Row, Column, Hr } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type BookingCancelledProps = {
  bookingRef: string
  origin: string
  destination: string
  locale?: 'ar' | 'en'
}

const t = {
  ar: {
    preview: (ref: string) => `تم إلغاء الحجز - ${ref}`,
    title: 'تم إلغاء الحجز',
    subtitle: 'نود إعلامك بأنه تم إلغاء الحجز التالي.',
    refLabel: 'رقم الحجز',
    routeLabel: 'المسار',
    note: 'إذا كانت لديك أي استفسارات بخصوص هذا الإلغاء، يرجى التواصل مع فريق الدعم.',
    arrow: '\u2190',
  },
  en: {
    preview: (ref: string) => `Booking Cancelled - ${ref}`,
    title: 'Booking Cancelled',
    subtitle: 'We would like to inform you that the following booking has been cancelled.',
    refLabel: 'Booking Reference',
    routeLabel: 'Route',
    note: 'If you have any questions regarding this cancellation, please contact our support team.',
    arrow: '\u2192',
  },
}

export default function BookingCancelled({
  bookingRef = 'BKT-000000',
  origin = 'Riyadh',
  destination = 'Jeddah',
  locale = 'ar',
}: BookingCancelledProps) {
  const strings = t[locale]

  return (
    <BaseLayout previewText={strings.preview(bookingRef)}>
      <Text style={title}>{strings.title}</Text>
      <Text style={subtitle}>{strings.subtitle}</Text>

      <Section style={detailsSection}>
        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={detailLabel}>{strings.refLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{bookingRef}</Text>
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
      </Section>

      <Text style={note}>{strings.note}</Text>
    </BaseLayout>
  )
}

const title: React.CSSProperties = {
  color: '#dc2626',
  fontSize: '22px',
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

const detailsSection: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 32px 0',
  border: '1px solid #fecaca',
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
  color: '#7f1d1d',
  fontSize: '15px',
  margin: '0',
}

const detailValue: React.CSSProperties = {
  color: '#450a0a',
  fontSize: '15px',
  fontWeight: 700,
  margin: '0',
}

const rowDivider: React.CSSProperties = {
  borderColor: '#fecaca',
  borderTop: '1px solid #fecaca',
  margin: '0',
}

const note: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  textAlign: 'center',
}