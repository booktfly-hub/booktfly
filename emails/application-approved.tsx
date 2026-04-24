import { lkey } from '@/lib/i18n-helpers'
import { Text, Button, Section } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type ApplicationApprovedProps = {
  companyName: string
  locale?: 'ar' | 'en' | 'tr'
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booktfly.com'

const t = {
  ar: {
    preview: 'تمت الموافقة على طلبك',
    greeting: (name: string) => `مرحباً ${name}،`,
    title: 'تهانينا! تمت الموافقة على طلبك 🎉',
    body: 'يسعدنا إبلاغك بأن طلب التسجيل كمزود خدمة قد تمت الموافقة عليه بنجاح. يمكنك الآن البدء في إضافة رحلاتك وإدارة حجوزاتك من خلال لوحة التحكم الخاصة بك.',
    cta: 'الذهاب إلى لوحة التحكم',
    footer: 'شكراً لانضمامك إلى بوكت فلاي!',
  },
  en: {
    preview: 'Your application has been approved',
    greeting: (name: string) => `Hello ${name},`,
    title: 'Congratulations! Your application has been approved 🎉',
    body: 'We are pleased to inform you that your provider registration application has been approved successfully. You can now start adding your trips and managing bookings through your dashboard.',
    cta: 'Go to Dashboard',
    footer: 'Thank you for joining BooktFly!',
  },
}

export default function ApplicationApproved({
  companyName = 'Company',
  locale = 'ar',
}: ApplicationApprovedProps) {
  const strings = t[lkey(locale)]

  return (
    <BaseLayout previewText={strings.preview}>
      <Text style={greeting}>{strings.greeting(companyName)}</Text>
      <Text style={title}>{strings.title}</Text>
      <Text style={body}>{strings.body}</Text>
      <Section style={ctaSection}>
        <Button style={button} href={`${baseUrl}/${locale}/provider/dashboard`}>
          {strings.cta}
        </Button>
      </Section>
      <Text style={footerNote}>{strings.footer}</Text>
    </BaseLayout>
  )
}

const greeting: React.CSSProperties = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
}

const title: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '22px',
  fontWeight: 800,
  lineHeight: '32px',
  margin: '0 0 16px 0',
}

const body: React.CSSProperties = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 32px 0',
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
  margin: '0 0 32px 0',
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

const footerNote: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  textAlign: 'center',
}