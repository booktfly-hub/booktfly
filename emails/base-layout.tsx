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
              width="140"
              height="40"
              alt="BooktFly"
              style={logo}
            />
          </Section>

          <Hr style={divider} />

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
  backgroundColor: '#f4f6f8',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans Arabic", sans-serif',
  margin: '0',
  padding: '0',
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '40px auto',
  maxWidth: '600px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
}

const header: React.CSSProperties = {
  backgroundColor: '#0c4a6e',
  padding: '24px 32px',
  textAlign: 'center',
}

const logo: React.CSSProperties = {
  margin: '0 auto',
}

const divider: React.CSSProperties = {
  borderColor: '#e5e7eb',
  borderTop: '1px solid #e5e7eb',
  margin: '0',
}

const content: React.CSSProperties = {
  padding: '32px',
}

const footer: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  padding: '24px 32px',
  textAlign: 'center',
}

const footerText: React.CSSProperties = {
  color: '#0c4a6e',
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 4px 0',
}

const footerCopyright: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
  lineHeight: '18px',
}
