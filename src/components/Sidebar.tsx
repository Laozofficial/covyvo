'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { AuthTenant, AuthUser } from '../lib/auth-api'
import {
  BanknoteIcon,
  BarChartIcon,
  BookIcon,
  CalculatorIcon,
  CartIcon,
  CreditCardIcon,
  DownloadIcon,
  FileTextIcon,
  HeartHandshakeIcon,
  HomeIcon,
  LockClosedIcon,
  PackageIcon,
  ReceiptIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SparklesIcon,
  UsersIcon,
} from './ui/icons'

type Item = {
  label: string
  href?: string
  icon: ReactNode
  locked?: boolean
  badge?: string
}

type Section = { title: string; items: Item[] }

const sections: Section[] = [
  {
    title: 'Workspace',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> }],
  },
  {
    title: 'People',
    items: [
      { label: 'Employees', href: '/dashboard/people/employees', icon: <UsersIcon /> },
      { label: 'Roles & Permissions', href: '/dashboard/people/roles', icon: <ShieldIcon /> },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Chart of Accounts', href: '/dashboard/finance/accounts', icon: <BookIcon /> },
      { label: 'Journal Entries', href: '/dashboard/finance/journals', icon: <FileTextIcon /> },
      { label: 'Invoicing', icon: <ReceiptIcon />, locked: true },
      { label: 'Banking', icon: <CreditCardIcon />, locked: true },
    ],
  },
  {
    title: 'Payroll',
    items: [
      { label: 'Run Payroll', href: '/dashboard/payroll', icon: <BanknoteIcon /> },
      { label: 'Salary Structures', href: '/dashboard/payroll/structures', icon: <CalculatorIcon /> },
      { label: 'Tax Schedules', href: '/dashboard/payroll/tax', icon: <FileTextIcon /> },
      { label: 'Bank Files', href: '/dashboard/payroll/bank-files', icon: <DownloadIcon /> },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { label: 'Audit Trail', href: '/dashboard/compliance/audit', icon: <ShieldCheckIcon /> },
      { label: 'E-Invoicing (NRS-MBS)', icon: <ReceiptIcon />, locked: true },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Inventory', icon: <PackageIcon />, locked: true },
      { label: 'Procurement', icon: <CartIcon />, locked: true },
      { label: 'CRM', icon: <HeartHandshakeIcon />, locked: true },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'AI Assistant', icon: <SparklesIcon />, locked: true },
      { label: 'Reports', icon: <BarChartIcon />, locked: true },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Company Profile', href: '/dashboard/settings/company', icon: <SettingsIcon /> },
      { label: 'Users', href: '/dashboard/settings/users', icon: <UsersIcon /> },
      { label: 'Billing', icon: <CreditCardIcon />, locked: true },
    ],
  },
]

type Props = {
  tenant: AuthTenant | null
  user: AuthUser | null
  onSignOut: () => void
}

export function Sidebar({ tenant, user, onSignOut }: Props) {
  const pathname = usePathname()
  const initials = (user?.fullName ?? user?.email ?? '?')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')

  return (
    <aside className="w-[248px] shrink-0 border-r border-ink-200 bg-white flex flex-col h-screen sticky top-0">
      <div className="px-4 py-4 border-b border-ink-100">
        {tenant?.name ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-ink-50 px-3 py-2.5">
            <div className="h-9 w-9 rounded-lg bg-brand-600 text-white flex items-center justify-center text-[13px] font-bold shrink-0">
              {tenant.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink-900 truncate leading-tight">
                {tenant.name}
              </p>
              <p className="text-[11px] text-ink-500 font-medium truncate">
                {tenant.slug ?? tenant.baseCurrency}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[60px]" aria-hidden />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  <NavRow item={item} pathname={pathname} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-ink-100 p-3">
        <div className="flex items-center gap-2.5 px-1">
          <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px] font-bold shrink-0">
            {initials || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-ink-900 truncate">
              {user?.fullName ?? user?.email}
            </p>
            <p className="text-[10.5px] text-ink-500 truncate">{user?.role ?? '—'}</p>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            className="p-1.5 rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 12H4M4 12l4-4M4 12l4 4" />
              <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavRow({ item, pathname }: { item: Item; pathname: string }) {
  const isActive =
    !!item.href &&
    (pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href)))

  const baseClasses =
    'group flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[12.5px] transition-colors w-full'

  if (item.locked) {
    return (
      <button
        type="button"
        title="Coming soon"
        disabled
        className={`${baseClasses} text-ink-400 cursor-not-allowed`}
      >
        <span className="text-ink-300 [&>svg]:h-[16px] [&>svg]:w-[16px]">{item.icon}</span>
        <span className="flex-1 text-left font-medium">{item.label}</span>
        <LockClosedIcon size={12} className="text-ink-300" />
      </button>
    )
  }

  return (
    <Link
      href={item.href!}
      className={[
        baseClasses,
        isActive
          ? 'bg-brand-50 text-brand-700 font-semibold'
          : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900 font-medium',
      ].join(' ')}
    >
      <span
        className={[
          '[&>svg]:h-[16px] [&>svg]:w-[16px]',
          isActive ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-700',
        ].join(' ')}
      >
        {item.icon}
      </span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
          {item.badge}
        </span>
      )}
    </Link>
  )
}
