import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'Covyvo — Compliance-driven ERP',
  description:
    'Nigeria-first, compliance-driven SaaS ERP. Payroll, tax, e-invoicing and audit, enforced by default.',
  icons: {
    icon: '/favicon.svg',
  },
}

type RootLayoutProps = {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  )
}
