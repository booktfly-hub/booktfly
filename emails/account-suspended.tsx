import { Text, Section } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type AccountSuspendedProps = {
  companyName: string
  locale?: 'ar' | 'en'
}

const t = {
  ar: {
    preview: 'تم تعليق حسابك',
    greeting: (name: string) => `مرحبا ${name}،`,
    title: 'تم تعليق حسابك',
    body: 'نود إعلامك بأنه تم تعليق حساب مزود الخدمة الخاص بك. خلال فترة التعليق، لن تتمكن من إضافة رحلات جديدة أو استقبال حجوزات.',
    contactTitle: 'تواصل معنا',
    contactBody: 'إذا كنت تعتقد أن هذا الإجراء تم عن طريق الخطأ أو كانت لديك أي استفسارات، يرجى التواصل مع فريق الدعم على:',
    email: 'support@booktfly.com',
  },
  en: {
    preview: 'Your account has been suspended',
    greeting: (name: string) => `Hello ${name},`,
    title: 'Your Account Has Been Suspended',
    body: 'We would like to inform you that your provider account has been suspended. During the suspension period, you will not be able to add new trips or receive bookings.',
    contactTitle: 'Contact Us',
    contactBody: 'If you believe this action was taken in error or have any questions, please contact our support team at:',
    email: 'support@booktfly.com',
  },
}

export default function AccountSuspended({
  companyName = 'Company',
  locale = 'ar',
}: AccountSuspendedProps) {
  const strings = t[locale]

  return (
    <BaseLayout previewText={strings.preview}>
      <Text style={greeting}>{strings.greeting(companyName)}</Text>

      <Section style={alertSection}>
        <Text style={title}>{strings.title}</Text>
      </Section>

      <Text style={body}>{strings.body}</Text>

      <Section style={contactSection}>
        <Text style={contactTitle}>{strings.contactTitle}</Text>
        <Text style={contactBody}>{strings.contactBody}</Text>
        <Text style={emailText}>{strings.email}</Text>
      </Section>
    </BaseLayout>
  )
}

const greeting: React.CSSProperties = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
}

const alertSection: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 24px 0',
  textAlign: 'center',
  border: '1px solid #fecaca',
}

const title: React.CSSProperties = {
  color: '#dc2626',
  fontSize: '20px',
  fontWeight: 700,
  lineHeight: '28px',
  margin: '0',
}

const body: React.CSSProperties = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 24px 0',
}

const contactSection: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px',
  margin: '0',
}

const contactTitle: React.CSSProperties = {
  color: '#0c4a6e',
  fontSize: '15px',
  fontWeight: 600,
  margin: '0 0 8px 0',
}

const contactBody: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 8px 0',
}

const emailText: React.CSSProperties = {
  color: '#0ea5e9',
  fontSize: '14px',
  fontWeight: 600,
  margin: '0',
}
