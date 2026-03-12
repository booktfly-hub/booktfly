import { Text, Button, Section } from '@react-email/components'
import * as React from 'react'
import BaseLayout from './base-layout'

type ApplicationRejectedProps = {
  companyName: string
  comment?: string
  locale?: 'ar' | 'en'
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booktfly.com'

const t = {
  ar: {
    preview: 'تحديث حالة طلبك',
    greeting: (name: string) => `مرحباً ${name}،`,
    title: 'تحديث حالة طلب التسجيل',
    body: 'نأسف لإبلاغك بأن طلب التسجيل كمزود خدمة لم يتم قبوله في الوقت الحالي.',
    commentLabel: 'ملاحظات المراجعة:',
    reapplyText: 'يمكنك تعديل بياناتك وإعادة تقديم الطلب مرة أخرى.',
    cta: 'إعادة تقديم الطلب',
    footer: 'إذا كانت لديك أي استفسارات، لا تتردد في التواصل معنا.',
  },
  en: {
    preview: 'Application status update',
    greeting: (name: string) => `Hello ${name},`,
    title: 'Application Status Update',
    body: 'We regret to inform you that your provider registration application has not been accepted at this time.',
    commentLabel: 'Review Comments:',
    reapplyText: 'You can update your information and resubmit your application.',
    cta: 'Reapply',
    footer: 'If you have any questions, please do not hesitate to contact us.',
  },
}

export default function ApplicationRejected({
  companyName = 'Company',
  comment,
  locale = 'ar',
}: ApplicationRejectedProps) {
  const strings = t[locale]

  return (
    <BaseLayout previewText={strings.preview}>
      <Text style={greeting}>{strings.greeting(companyName)}</Text>
      <Text style={title}>{strings.title}</Text>
      <Text style={body}>{strings.body}</Text>

      {comment && (
        <Section style={commentSection}>
          <Text style={commentLabel}>{strings.commentLabel}</Text>
          <Text style={commentText}>{comment}</Text>
        </Section>
      )}

      <Text style={reapplyNote}>{strings.reapplyText}</Text>

      <Section style={ctaSection}>
        <Button style={button} href={`${baseUrl}/${locale}/become-provider/apply`}>
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
  margin: '0 0 24px 0',
}

const commentSection: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  borderRadius: '12px',
  padding: '20px',
  margin: '0 0 24px 0',
  borderLeft: '4px solid #f59e0b',
  borderRight: '4px solid #f59e0b',
}

const commentLabel: React.CSSProperties = {
  color: '#b45309',
  fontSize: '14px',
  fontWeight: 700,
  margin: '0 0 8px 0',
}

const commentText: React.CSSProperties = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
}

const reapplyNote: React.CSSProperties = {
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