'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { AuthTenant, AuthUser } from '../lib/auth-api'
import {
  BanknoteIcon,
  BarChartIcon,
  BookIcon,
  BranchIcon,
  BuildingIcon,
  CalculatorIcon,
  CalendarIcon,
  CartIcon,
  ChevronDownIcon,
  CoinIcon,
  CreditCardIcon,
  DownloadIcon,
  FileTextIcon,
  HeartHandshakeIcon,
  HomeIcon,
  IdIcon,
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
  icon?: ReactNode
  locked?: boolean
  badge?: string
}

/**
 * Aligned with the Covyvo Phase 1 product spec. Each `Module` is a
 * collapsible top-level group in the sidebar. Items inside can be split
 * into named sub-areas (e.g. Finance → Accounting / Commercial / Fixed
 * Assets) using `subHeader` markers — those render as small dividers.
 *
 * `locked: true` items are spec'd but not yet built; they appear greyed
 * with a lock icon so users see what's coming.
 */
type SubHeader = { kind: 'sub'; label: string }
type Entry = ({ kind: 'item' } & Item) | SubHeader

type Module = {
  key: string
  title: string
  icon: ReactNode
  entries: Entry[]
}

const MODULES: Module[] = [
  {
    key: 'workspace',
    title: 'Workspace',
    icon: <HomeIcon />,
    entries: [
      { kind: 'item', label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
    ],
  },
  {
    key: 'finance',
    title: 'Finance',
    icon: <BookIcon />,
    entries: [
      { kind: 'sub', label: 'Accounting' },
      { kind: 'item', label: 'Chart of Accounts', href: '/dashboard/finance/accounts', icon: <BookIcon /> },
      { kind: 'item', label: 'Journal Entries', href: '/dashboard/finance/journals', icon: <FileTextIcon /> },
      { kind: 'item', label: 'General Ledger', icon: <BookIcon />, locked: true },
      { kind: 'item', label: 'Accounts Receivable', icon: <ReceiptIcon />, locked: true },
      { kind: 'item', label: 'Accounts Payable', icon: <ReceiptIcon />, locked: true },
      { kind: 'item', label: 'Bank Reconciliation', icon: <CreditCardIcon />, locked: true },
      { kind: 'sub', label: 'Commercial' },
      { kind: 'item', label: 'Customers', href: '/dashboard/finance/customers', icon: <UsersIcon /> },
      { kind: 'item', label: 'Quotations', icon: <FileTextIcon />, locked: true },
      { kind: 'item', label: 'Customer Invoices', icon: <ReceiptIcon />, locked: true },
      { kind: 'item', label: 'Credit Notes', icon: <FileTextIcon />, locked: true },
      { kind: 'item', label: 'Collections', icon: <BanknoteIcon />, locked: true },
      { kind: 'sub', label: 'Fixed Assets' },
      { kind: 'item', label: 'Asset Register', icon: <PackageIcon />, locked: true },
      { kind: 'item', label: 'Depreciation', icon: <CalculatorIcon />, locked: true },
    ],
  },
  {
    key: 'people',
    title: 'People',
    icon: <UsersIcon />,
    entries: [
      { kind: 'sub', label: 'Employees' },
      { kind: 'item', label: 'Employees', href: '/dashboard/people/employees', icon: <UsersIcon /> },
      { kind: 'item', label: 'Designations', href: '/dashboard/people/designations', icon: <IdIcon /> },
      { kind: 'item', label: 'Attendance', icon: <CalendarIcon />, locked: true },
      { kind: 'sub', label: 'Payroll' },
      { kind: 'item', label: 'Salary Structures', href: '/dashboard/payroll/structures', icon: <CalculatorIcon /> },
      { kind: 'item', label: 'Run Payroll', icon: <BanknoteIcon />, locked: true },
      { kind: 'item', label: 'Loans & Advances', icon: <CoinIcon />, locked: true },
      { kind: 'sub', label: 'Disbursement' },
      { kind: 'item', label: 'Bank Files', href: '/dashboard/payroll/bank-files', icon: <DownloadIcon /> },
      { kind: 'sub', label: 'Self-Service' },
      { kind: 'item', label: 'Employee Portal', icon: <UsersIcon />, locked: true },
    ],
  },
  {
    key: 'compliance',
    title: 'Compliance',
    icon: <ShieldIcon />,
    entries: [
      { kind: 'sub', label: 'Tax Center' },
      { kind: 'item', label: 'Tax Schedules', href: '/dashboard/payroll/tax', icon: <FileTextIcon /> },
      { kind: 'item', label: 'VAT', icon: <FileTextIcon />, locked: true },
      { kind: 'item', label: 'WHT', icon: <FileTextIcon />, locked: true },
      { kind: 'item', label: 'PAYE', icon: <FileTextIcon />, locked: true },
      { kind: 'item', label: 'Pension & NHF', icon: <FileTextIcon />, locked: true },
      { kind: 'sub', label: 'E-Invoicing' },
      { kind: 'item', label: 'NRS-MBS Hub', icon: <ReceiptIcon />, locked: true },
      { kind: 'item', label: 'Transmission Logs', icon: <FileTextIcon />, locked: true },
      { kind: 'sub', label: 'Other' },
      { kind: 'item', label: 'Compliance Calendar', icon: <CalendarIcon />, locked: true },
      { kind: 'item', label: 'Tax Clearance', icon: <ShieldCheckIcon />, locked: true },
      { kind: 'item', label: 'Audit Trail', href: '/dashboard/compliance/audit', icon: <ShieldCheckIcon /> },
    ],
  },
  {
    key: 'operations',
    title: 'Operations',
    icon: <CartIcon />,
    entries: [
      { kind: 'sub', label: 'Procurement' },
      { kind: 'item', label: 'Vendors', href: '/dashboard/operations/vendors', icon: <HeartHandshakeIcon /> },
      { kind: 'item', label: 'Purchase Orders', href: '/dashboard/operations/purchase-orders', icon: <CartIcon /> },
      { kind: 'item', label: 'Goods Receipts', href: '/dashboard/operations/goods-receipts', icon: <PackageIcon /> },
      { kind: 'sub', label: 'Inventory' },
      { kind: 'item', label: 'Products', href: '/dashboard/operations/products', icon: <PackageIcon /> },
      { kind: 'item', label: 'Warehouses', icon: <BuildingIcon />, locked: true },
      { kind: 'sub', label: 'Expenses' },
      { kind: 'item', label: 'Expense Claims', icon: <ReceiptIcon />, locked: true },
    ],
  },
  {
    key: 'intelligence',
    title: 'Intelligence',
    icon: <SparklesIcon />,
    entries: [
      { kind: 'item', label: 'Ask Ada', icon: <SparklesIcon />, locked: true, badge: 'AI' },
      { kind: 'item', label: 'Compliance Intel', icon: <ShieldCheckIcon />, locked: true },
    ],
  },
  {
    key: 'reports',
    title: 'Reports',
    icon: <BarChartIcon />,
    entries: [
      { kind: 'item', label: 'Financial Reports', icon: <BarChartIcon />, locked: true },
      { kind: 'item', label: 'Payroll Reports', icon: <BarChartIcon />, locked: true },
      { kind: 'item', label: 'Compliance Reports', icon: <BarChartIcon />, locked: true },
      { kind: 'item', label: 'E-Invoicing Reports', icon: <BarChartIcon />, locked: true },
    ],
  },
  {
    key: 'admin',
    title: 'Administration',
    icon: <SettingsIcon />,
    entries: [
      { kind: 'sub', label: 'Access' },
      { kind: 'item', label: 'Users', href: '/dashboard/settings/users', icon: <UsersIcon /> },
      { kind: 'item', label: 'Roles & Permissions', href: '/dashboard/people/roles', icon: <ShieldIcon /> },
      { kind: 'sub', label: 'Organisation' },
      { kind: 'item', label: 'Company Profile', href: '/dashboard/settings/company', icon: <SettingsIcon /> },
      { kind: 'item', label: 'Branches', href: '/dashboard/administration/branches', icon: <BranchIcon /> },
      { kind: 'item', label: 'Departments', href: '/dashboard/administration/departments', icon: <BuildingIcon /> },
      { kind: 'sub', label: 'Platform' },
      { kind: 'item', label: 'Integrations', icon: <SettingsIcon />, locked: true },
      { kind: 'item', label: 'Subscription & Billing', icon: <CreditCardIcon />, locked: true },
      { kind: 'item', label: 'Audit Logs', icon: <FileTextIcon />, locked: true },
    ],
  },
]

const STORAGE_KEY = 'covyvo-sidebar-open'

function moduleContainsActive(m: Module, pathname: string): boolean {
  for (const e of m.entries) {
    if (e.kind !== 'item' || !e.href) continue
    if (pathname === e.href) return true
    if (e.href !== '/dashboard' && pathname.startsWith(e.href)) return true
  }
  return false
}

type Props = {
  tenant: AuthTenant | null
  user: AuthUser | null
  onSignOut: () => void
}

export function Sidebar({ tenant, user, onSignOut }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState<Record<string, boolean>>({})

  // Initialise from localStorage; default to opening only the module that
  // contains the active route.
  useEffect(() => {
    let stored: Record<string, boolean> | null = null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) stored = JSON.parse(raw) as Record<string, boolean>
    } catch { /* ignore */ }

    const next: Record<string, boolean> = stored ?? {}
    // Always open the module of the currently-active route, even if the
    // user had it collapsed previously — otherwise they'd lose the
    // active highlight.
    for (const m of MODULES) {
      if (moduleContainsActive(m, pathname)) {
        next[m.key] = true
      }
    }
    if (!stored) {
      // First visit: open workspace by default too so they always see Dashboard.
      next.workspace = true
    }
    setOpen(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggle(key: string) {
    setOpen((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

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

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {MODULES.map((m) => {
          const isOpen = !!open[m.key]
          const isActiveModule = moduleContainsActive(m, pathname)
          return (
            <div key={m.key}>
              <button
                type="button"
                onClick={() => toggle(m.key)}
                aria-expanded={isOpen}
                className={[
                  'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[12.5px] transition-colors group',
                  isActiveModule
                    ? 'text-ink-900 font-bold'
                    : 'text-ink-700 hover:bg-ink-50 hover:text-ink-900 font-semibold',
                ].join(' ')}
              >
                <span
                  className={[
                    '[&>svg]:h-[16px] [&>svg]:w-[16px]',
                    isActiveModule ? 'text-brand-600' : 'text-ink-500 group-hover:text-ink-800',
                  ].join(' ')}
                >
                  {m.icon}
                </span>
                <span className="flex-1 text-left tracking-tight">{m.title}</span>
                <span
                  className={[
                    'text-ink-400 transition-transform duration-150',
                    isOpen ? 'rotate-0' : '-rotate-90',
                  ].join(' ')}
                >
                  <ChevronDownIcon size={14} />
                </span>
              </button>

              {isOpen && m.entries.length > 0 && (
                <ul className="mt-0.5 mb-1.5 pl-2 pr-1 space-y-0.5">
                  {m.entries.map((entry, idx) =>
                    entry.kind === 'sub' ? (
                      <li
                        key={`${m.key}-sub-${idx}`}
                        className="pt-2 pb-0.5 px-2 text-[9.5px] font-bold uppercase tracking-widest text-ink-400"
                      >
                        {entry.label}
                      </li>
                    ) : (
                      <li key={`${m.key}-${entry.label}`}>
                        <NavRow item={entry} pathname={pathname} />
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          )
        })}
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
    'group flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-lg text-[12.5px] transition-colors w-full'

  if (item.locked) {
    return (
      <button
        type="button"
        title="Coming in a later iteration"
        disabled
        className={`${baseClasses} text-ink-400 cursor-not-allowed`}
      >
        {item.icon && (
          <span className="text-ink-300 [&>svg]:h-[14px] [&>svg]:w-[14px]">{item.icon}</span>
        )}
        <span className="flex-1 text-left font-medium">{item.label}</span>
        <LockClosedIcon size={11} className="text-ink-300" />
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
      {item.icon && (
        <span
          className={[
            '[&>svg]:h-[14px] [&>svg]:w-[14px]',
            isActive ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-700',
          ].join(' ')}
        >
          {item.icon}
        </span>
      )}
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
          {item.badge}
        </span>
      )}
    </Link>
  )
}
