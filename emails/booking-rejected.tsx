import { lkey } from '@/lib/i18n-helpers'
import { Text, Section, Row, Column, Hr } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type BookingRejectedProps = {
  bookingRef: string
  origin: string
  destination: string
  amount: number
  reason?: string
  locale?: 'ar' | 'en' | 'tr'
}

const t = {
  ar: {
    preview: (ref: string) => `تم رفض الحجز - ${ref}`,
    title: 'تم رفض الحجز',
    subtitle: 'نود إعلامك بأن مزود الخدمة قام برفض حجزك. سيتم استرداد المبلغ المدفوع.',
    refLabel: 'رقم الحجز',
    routeLabel: 'المسار',
    amountLabel: 'المبلغ المسترد',
    reasonLabel: 'سبب الرفض',
    currency: 'ر.س',
    note: 'سيظهر المبلغ المسترد في حسابك خلال 5-14 يوم عمل حسب البنك الخاص بك.',
    arrow: '\u2190',
  },
  en: {
    preview: (ref: string) => `Booking Rejected - ${ref}`,
    title: 'Booking Rejected',
    subtitle: 'We would like to inform you that the service provider has rejected your booking. The paid amount will be refunded.',
    refLabel: 'Booking Reference',
    routeLabel: 'Route',
    amountLabel: 'Refund Amount',
    reasonLabel: 'Reason',
    currency: 'SAR',
    note: 'The refund will appear in your account within 5-14 business days depending on your bank.',
    arrow: '\u2192',
  },
}

export default function BookingRejected({
  bookingRef = 'BKT-000000',
  origin = 'Riyadh',
  destination = 'Jeddah',
  amount = 0,
  reason,
  locale = 'ar',
}: BookingRejectedProps) {
  const strings = t[lkey(locale)]

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

        <Hr style={rowDivider} />

        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={amountLabelStyle}>{strings.amountLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={amountValueStyle}>
              {amount.toLocaleString()} {strings.currency}
            </Text>
          </Column>
        </Row>

        {reason && (
          <>
            <Hr style={rowDivider} />
            <Row style={detailRow}>
              <Column style={detailLabelCol}>
                <Text style={detailLabel}>{strings.reasonLabel}</Text>
              </Column>
              <Column style={detailValueCol}>
                <Text style={detailValue}>{reason}</Text>
              </Column>
            </Row>
          </>
        )}
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

const amountLabelStyle: React.CSSProperties = {
  color: '#7f1d1d',
  fontSize: '16px',
  fontWeight: 700,
  margin: '0',
}

const amountValueStyle: React.CSSProperties = {
  color: '#dc2626',
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
