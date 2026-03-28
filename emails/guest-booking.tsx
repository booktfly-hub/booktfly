import { Text, Section, Row, Column, Hr, Button } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type GuestBookingProps = {
  passengerName: string
  origin: string
  destination: string
  departureDate: string
  seats: number
  amount: number
  bankName: string
  bankIban: string
  bankHolder: string
  paymentUrl: string
}

export default function GuestBooking({
  passengerName = 'Guest',
  origin = 'Riyadh',
  destination = 'Jeddah',
  departureDate = '',
  seats = 1,
  amount = 0,
  bankName = '',
  bankIban = '',
  bankHolder = '',
  paymentUrl = '',
}: GuestBookingProps) {
  return (
    <BaseLayout previewText="Your flight booking has been created - complete payment">
      <Text style={title}>Booking Confirmed</Text>
      <Text style={subtitle}>
        Hi {passengerName}, a flight booking has been created for you on BooktFly.
        Please complete the payment to confirm your reservation.
      </Text>

      <Section style={detailsSection}>
        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={detailLabel}>Passenger</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{passengerName}</Text>
          </Column>
        </Row>

        <Hr style={rowDivider} />

        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={detailLabel}>Route</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{origin} &rarr; {destination}</Text>
          </Column>
        </Row>

        <Hr style={rowDivider} />

        {departureDate && (
          <>
            <Row style={detailRow}>
              <Column style={detailLabelCol}>
                <Text style={detailLabel}>Departure</Text>
              </Column>
              <Column style={detailValueCol}>
                <Text style={detailValue}>{departureDate}</Text>
              </Column>
            </Row>
            <Hr style={rowDivider} />
          </>
        )}

        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={detailLabel}>Seats</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{seats}</Text>
          </Column>
        </Row>

        <Hr style={rowDivider} />

        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={amountLabelStyle}>Total Amount</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={amountValueStyle}>{amount.toLocaleString()} SAR</Text>
          </Column>
        </Row>
      </Section>

      <Text style={bankTitle}>Bank Transfer Details</Text>
      <Section style={bankSection}>
        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={detailLabel}>Bank</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{bankName}</Text>
          </Column>
        </Row>
        <Hr style={rowDivider} />
        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={detailLabel}>IBAN</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={{ ...detailValue, fontFamily: 'monospace', fontSize: '13px' }}>{bankIban}</Text>
          </Column>
        </Row>
        <Hr style={rowDivider} />
        <Row style={detailRow}>
          <Column style={detailLabelCol}>
            <Text style={detailLabel}>Account Holder</Text>
          </Column>
          <Column style={detailValueCol}>
            <Text style={detailValue}>{bankHolder}</Text>
          </Column>
        </Row>
      </Section>

      <Text style={instructionText}>
        After completing the transfer, please upload your receipt using the button below.
        Your booking will be confirmed once the payment is verified.
      </Text>

      <Section style={ctaSection}>
        <Button style={button} href={paymentUrl}>
          Upload Transfer Receipt &rarr;
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

const bankSection: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 24px 0',
  border: '1px solid #fde68a',
}

const bankTitle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '18px',
  fontWeight: 700,
  margin: '0 0 16px 0',
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

const instructionText: React.CSSProperties = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 24px 0',
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
