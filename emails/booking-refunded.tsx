import { lkey } from '@/lib/i18n-helpers'
import { Text, Section, Row, Column, Hr } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type BookingRefundedProps = {
  bookingRef: string
  amount: number
  locale?: 'ar' | 'en' | 'tr'
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
  color: '#0f172a',
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
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 32px 0',
  border: '1px solid #bbf7d0',
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
  color: '#166534',
  fontSize: '15px',
  margin: '0',
}

const detailValue: React.CSSProperties = {
  color: '#14532d',
  fontSize: '15px',
  fontWeight: 700,
  margin: '0',
}

const rowDivider: React.CSSProperties = {
  borderColor: '#bbf7d0',
  borderTop: '1px solid #bbf7d0',
  margin: '0',
}

const amountLabelStyle: React.CSSProperties = {
  color: '#166534',
  fontSize: '16px',
  fontWeight: 700,
  margin: '0',
}

const amountValueStyle: React.CSSProperties = {
  color: '#15803d',
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