import type { Metadata } from 'next'

export const metadata: Metadata = {
  other: {
    'domain-verification': '3bf540c518655b10dbb0c9f4f871136b1dabc286f5fac8040154a10cc7a7b196',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
