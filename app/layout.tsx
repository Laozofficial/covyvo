import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'covyvo-frontend',
  icons: {
    icon: '/favicon.svg',
  },
}

type RootLayoutProps = {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}