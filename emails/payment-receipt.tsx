import { lkey } from '@/lib/i18n-helpers'
import { Text, Section, Row, Column, Hr } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type PaymentReceiptProps = {
  bookingRef: string
  type: 'flight' | 'room' | 'car'
  origin: string
  destination: string
  departureDate: string
  airline?: string
  seats?: number
  nights?: number
  carBrand?: string
  days?: number
  totalAmount: number
  commissionFree: number
  passengerName: string
  locale?: 'ar' | 'en' | 'tr'
}

const t = {
  ar: {
    preview: (ref: string) => `إيصال الدفع - ${ref}`,
    title: 'إيصال الدفع',
    subtitle: 'تم معالجة دفعتك بنجاح',
    refLabel: 'رقم الحجز',
    passengerLabel: 'اسم المسافر',
    routeLabel: 'المسار',
    dateLabel: 'تاريخ المغادرة',
    airlineLabel: 'شركة الطيران',
    seatsLabel: 'عدد المقاعد',
    nightsLabel: 'عدد الليالي',
    carBrandLabel: 'ماركة السيارة',
    daysLabel: 'عدد الأيام',
    totalLabel: 'المبلغ الإجمالي',
    amountPaidLabel: 'المبلغ المدفوع',
    currency: 'ر.س',
    note: 'هذا إيصالك الرسمي',
    paymentSuccess: 'تم الدفع بنجاح',
    arrow: '\u2190',
  },
  en: {
    preview: (ref: string) => `Payment Receipt - ${ref}`,
    title: 'Payment Receipt',
    subtitle: 'Your payment has been processed successfully',
    refLabel: 'Booking Reference',
    passengerLabel: 'Passenger Name',
    routeLabel: 'Route',
    dateLabel: 'Departure Date',
    airlineLabel: 'Airline',
    seatsLabel: 'Seats',
    nightsLabel: 'Nights',
    carBrandLabel: 'Car Brand',
    daysLabel: 'Days',
    totalLabel: 'Total Amount',
    amountPaidLabel: 'Amount Paid',
    currency: 'SAR',
    note: 'This is your official receipt',
    paymentSuccess: 'Payment Successful',
    arrow: '\u2192',
  },
}

export default function PaymentReceipt({
  bookingRef = 'BKT-000000',
  type = 'flight',
  origin = 'Riyadh',
  destination = 'Jeddah',
  departureDate = '2024-01-01',
  airline,
  seats,
  nights,
  carBrand,
  days,
  totalAmount = 0,
  commissionFree = 0,
  passengerName = 'Guest',
  locale = 'ar',
}: PaymentReceiptProps) {
  const strings = t[lkey(locale)]

  return (
    <BaseLayout previewText={strings.preview(bookingRef)}>
      {/* Green checkmark area */}
      <Section style={checkmarkSection}>
        <Text style={checkmarkIcon}>&#10003;</Text>
        <Text style={checkmarkText}>{strings.paymentSuccess}</Text>
      </Section>

      <Text style={title}>{strings.title}</Text>
      <Text style={subtitle}>{strings.subtitle}</Text>

      {/* Booking reference blue box */}
      <Section style={refSection}>
        <Text style={refLabel}>{strings.refLabel}</Text>
        <Text style={refValue}>{bookingRef}</Text>
      </Section>

      {/* Details section */}
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
            <Text style={detailLabel}>{strings.dateLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{departureDate}</Text>
          </Column>
        </Row>

        {/* Flight-specific fields */}
        {type === 'flight' && airline && (
          <>
            <Hr style={rowDivider} />
            <Row style={detailRow}>
              <Column style={detailLabelCol}>
                <Text style={detailLabel}>{strings.airlineLabel}</Text>
              </Column>
              <Column style={detailValueCol}>
                <Text style={detailValue}>{airline}</Text>
              </Column>
            </Row>
          </>
        )}

        {type === 'flight' && seats && (
          <>
            <Hr style={rowDivider} />
            <Row style={detailRow}>
              <Column style={detailLabelCol}>
                <Text style={detailLabel}>{strings.seatsLabel}</Text>
              </Column>
              <Column style={detailValueCol}>
                <Text style={detailValue}>{seats}</Text>
              </Column>
            </Row>
          </>
        )}

        {/* Room-specific fields */}
        {type === 'room' && nights && (
          <>
            <Hr style={rowDivider} />
            <Row style={detailRow}>
              <Column style={detailLabelCol}>
                <Text style={detailLabel}>{strings.nightsLabel}</Text>
              </Column>
              <Column style={detailValueCol}>
                <Text style={detailValue}>{nights}</Text>
              </Column>
            </Row>
          </>
        )}

        {/* Car-specific fields */}
        {type === 'car' && carBrand && (
          <>
            <Hr style={rowDivider} />
            <Row style={detailRow}>
              <Column style={detailLabelCol}>
                <Text style={detailLabel}>{strings.carBrandLabel}</Text>
              </Column>
              <Column style={detailValueCol}>
                <Text style={detailValue}>{carBrand}</Text>
              </Column>
            </Row>
          </>
        )}

        {type === 'car' && days && (
          <>
            <Hr style={rowDivider} />
            <Row style={detailRow}>
              <Column style={detailLabelCol}>
                <Text style={detailLabel}>{strings.daysLabel}</Text>
              </Column>
              <Column style={detailValueCol}>
                <Text style={detailValue}>{days}</Text>
              </Column>
            </Row>
          </>
        )}
      </Section>

      {/* Total amount highlighted box */}
      <Section style={totalSection}>
        <Row style={totalRow}>
          <Column style={detailLabelCol}>
            <Text style={totalLabelText}>{strings.amountPaidLabel}</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={totalValueText}>
              {commissionFree.toLocaleString()} {strings.currency}
            </Text>
          </Column>
        </Row>
      </Section>

      <Text style={note}>{strings.note}</Text>
    </BaseLayout>
  )
}

const checkmarkSection: React.CSSProperties = {
  textAlign: 'center',
  margin: '0 0 24px 0',
}

const checkmarkIcon: React.CSSProperties = {
  display: 'inline-block',
  width: '56px',
  height: '56px',
  lineHeight: '56px',
  borderRadius: '50%',
  backgroundColor: '#dcfce7',
  color: '#16a34a',
  fontSize: '28px',
  fontWeight: 800,
  textAlign: 'center',
  margin: '0 auto 12px auto',
}

const checkmarkText: React.CSSProperties = {
  color: '#16a34a',
  fontSize: '16px',
  fontWeight: 700,
  margin: '0',
  textAlign: 'center',
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
  margin: '0 0 24px 0',
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

const totalSection: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 32px 0',
  border: '1px solid #bbf7d0',
}

const totalRow: React.CSSProperties = {
  padding: '4px 0',
}

const totalLabelText: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '16px',
  fontWeight: 700,
  margin: '0',
}

const totalValueText: React.CSSProperties = {
  color: '#16a34a',
  fontSize: '22px',
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
