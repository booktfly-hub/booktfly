import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Img,
  Preview,
} from '@react-email/components'
import * as React from 'react'

type BaseLayoutProps = {
  previewText: string
  children: React.ReactNode
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://booktfly.com'

export default function BaseLayout({ previewText, children }: BaseLayoutProps) {
  return (
    <Html lang="ar" dir="rtl">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src={`${baseUrl}/logo.png`}
              width="220"
              alt="BooktFly"
              style={logo}
            />
          </Section>

          {/* Content */}
          <Section style={content}>
            {children}
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              BooktFly - بوكت فلاي
            </Text>
            <Text style={footerCopyright}>
              &copy; {new Date().getFullYear()} BooktFly. All rights reserved.
            </Text>
            <Text style={footerCopyright}>
              جميع الحقوق محفوظة
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans Arabic", sans-serif',
  margin: '0',
  padding: '0',
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  margin: '60px auto',
  maxWidth: '600px',
  overflow: 'hidden',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
  border: '1px solid #f1f5f9',
}

const header: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '40px 32px 32px',
  textAlign: 'center',
  borderBottom: '1px solid #f1f5f9',
}

const logo: React.CSSProperties = {
  margin: '0 auto',
  display: 'block',
  width: '220px',
  height: 'auto',
}

const divider: React.CSSProperties = {
  borderColor: '#f1f5f9',
  borderTop: '1px solid #f1f5f9',
  margin: '0',
}

const content: React.CSSProperties = {
  padding: '40px 32px',
}

const footer: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  padding: '32px',
  textAlign: 'center',
}

const footerText: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '15px',
  fontWeight: 700,
  margin: '0 0 8px 0',
  letterSpacing: '0.5px',
}

const footerCopyright: React.CSSProperties = {
  color: '#64748b',
  fontSize: '13px',
  margin: '0',
  lineHeight: '22px',
}