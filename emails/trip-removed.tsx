import { Text, Section } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type TripRemovedProps = {
  origin: string
  destination: string
  reason: string
  locale?: 'ar' | 'en'
}

const t = {
  ar: {
    preview: 'تم حذف رحلتك',
    title: 'تم حذف الرحلة',
    subtitle: 'نود إعلامك بأن الإدارة قامت بحذف إحدى رحلاتك.',
    routeLabel: 'الرحلة:',
    reasonLabel: 'سبب الحذف:',
    note: 'إذا كانت لديك أي استفسارات، يرجى التواصل مع فريق الدعم.',
    arrow: '\u2190',
  },
  en: {
    preview: 'Your trip has been removed',
    title: 'Trip Removed',
    subtitle: 'We would like to inform you that an admin has removed one of your trips.',
    routeLabel: 'Trip:',
    reasonLabel: 'Removal Reason:',
    note: 'If you have any questions, please contact our support team.',
    arrow: '\u2192',
  },
}

export default function TripRemoved({
  origin = 'Riyadh',
  destination = 'Jeddah',
  reason = '',
  locale = 'ar',
}: TripRemovedProps) {
  const strings = t[locale]

  return (
    <BaseLayout previewText={strings.preview}>
      <Text style={title}>{strings.title}</Text>
      <Text style={subtitle}>{strings.subtitle}</Text>

      <Section style={infoSection}>
        <Text style={infoLabel}>{strings.routeLabel}</Text>
        <Text style={infoValue}>
          {origin} {strings.arrow} {destination}
        </Text>
      </Section>

      <Section style={reasonSection}>
        <Text style={reasonLabel}>{strings.reasonLabel}</Text>
        <Text style={reasonValue}>{reason}</Text>
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
}

const subtitle: React.CSSProperties = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 24px 0',
}

const infoSection: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 24px 0',
  border: '1px solid #e2e8f0',
}

const infoLabel: React.CSSProperties = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 8px 0',
}

const infoValue: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '18px',
  fontWeight: 700,
  margin: '0',
}

const reasonSection: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 32px 0',
  borderLeft: '4px solid #dc2626',
  borderRight: '4px solid #dc2626',
}

const reasonLabel: React.CSSProperties = {
  color: '#b91c1c',
  fontSize: '14px',
  fontWeight: 700,
  margin: '0 0 8px 0',
}

const reasonValue: React.CSSProperties = {
  color: '#991b1b',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
}

const note: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  textAlign: 'center',
}