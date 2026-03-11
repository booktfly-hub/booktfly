import { Text, Section, Row, Column, Hr } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type BookingRefundedProps = {
  bookingRef: string
  amount: number
  locale?: 'ar' | 'en'
}

const t = {
  ar: {
    preview: (ref: string) => `تأكيد استرداد المبلغ - ${ref}`,
    title: 'تم استرداد المبلغ',
    subtitle: 'نود إعلامك بأنه تم استرداد المبلغ الخاص بحجزك بنجاح.',
    refLabel: 'رقم الحجز',
    amountLabel: 'المبلغ المسترد',
    currency: 'ر.س',
    note: 'سيظهر المبلغ المسترد في حسابك خلال 5-14 يوم عمل حسب البنك الخاص بك.',
  },
  en: {
    preview: (ref: string) => `Refund Confirmation - ${ref}`,
    title: 'Refund Processed',
    subtitle: 'We would like to inform you that the refund for your booking has been processed successfully.',
    refLabel: 'Booking Reference',
    amountLabel: 'Refund Amount',
    currency: 'SAR',
    note: 'The refund will appear in your account within 5-14 business days depending on your bank.',
  },
}

export default function BookingRefunded({
  bookingRef = 'BKT-000000',
  amount = 0,
  locale = 'ar',
}: BookingRefundedProps) {
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
            <Text style={amountLabelStyle}>{strings.amountLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={amountValueStyle}>
              {amount.toLocaleString()} {strings.currency}
            </Text>
          </Column>
        </Row>
      </Section>

      <Text style={note}>{strings.note}</Text>
    </BaseLayout>
  )
}

const title: React.CSSProperties = {
  color: '#0c4a6e',
  fontSize: '20px',
  fontWeight: 700,
  lineHeight: '28px',
  margin: '0 0 8px 0',
  textAlign: 'center',
}

const subtitle: React.CSSProperties = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 24px 0',
  textAlign: 'center',
}

const detailsSection: React.CSSProperties = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 24px 0',
  border: '1px solid #bae6fd',
}

const detailRow: React.CSSProperties = {
  padding: '8px 0',
}

const detailLabelCol: React.CSSProperties = {
  width: '40%',
}

const detailValueCol: React.CSSProperties = {
  width: '60%',
}

const detailLabel: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
}

const detailValue: React.CSSProperties = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: 600,
  margin: '0',
}

const rowDivider: React.CSSProperties = {
  borderColor: '#bae6fd',
  borderTop: '1px solid #bae6fd',
  margin: '0',
}

const amountLabelStyle: React.CSSProperties = {
  color: '#0c4a6e',
  fontSize: '14px',
  fontWeight: 700,
  margin: '0',
}

const amountValueStyle: React.CSSProperties = {
  color: '#0c4a6e',
  fontSize: '18px',
  fontWeight: 700,
  margin: '0',
}

const note: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
  textAlign: 'center',
}
