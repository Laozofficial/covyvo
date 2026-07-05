import { ReactNode } from 'react'
import {
  BanknoteIcon,
  CartIcon,
  CreditCardIcon,
  FileTextIcon,
  PackageIcon,
  ReceiptIcon,
  UsersIcon,
  AlertTriangleIcon,
} from '../../../src/components/ui/icons'
import { timeAgo } from '../../../src/lib/insights-api'

/* ---------- Recent Activities ---------- */

export type ActivityItem = {
  id: string
  action: string
  resource: string
  summary: string | null
  userName: string | null
  createdAt: string
}

function resourceIcon(resource: string): { icon: ReactNode; iconBg: string; iconColor: string } {
  const map: Record<string, { icon: ReactNode; iconBg: string; iconColor: string }> = {
    'payroll-runs': { icon: <BanknoteIcon />, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    'payroll-schedule': { icon: <BanknoteIcon />, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    wallet: { icon: <CreditCardIcon />, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    invoices: { icon: <ReceiptIcon />, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    journals: { icon: <FileTextIcon />, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    'purchase-orders': { icon: <CartIcon />, iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
    'goods-receipts': { icon: <PackageIcon />, iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
    employees: { icon: <UsersIcon />, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  }
  return map[resource] ?? { icon: <FileTextIcon />, iconBg: 'bg-ink-100', iconColor: 'text-ink-500' }
}

export function RecentActivitiesCard({ items = [] }: { items?: ActivityItem[] }) {
  return (
    <Card title="Recent activities">
      {items.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-ink-400">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {items.map((a) => {
            const meta = resourceIcon(a.resource)
            return (
              <li key={a.id} className="flex items-start gap-3 py-2.5">
                <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${meta.iconBg} ${meta.iconColor} [&>svg]:h-4 [&>svg]:w-4`}>
                  {meta.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-ink-900 truncate">{a.summary ?? a.resource}</p>
                  <p className="text-[10.5px] text-ink-500 font-medium">By {a.userName ?? 'Someone'}</p>
                  <p className="text-[10.5px] text-ink-400">{timeAgo(a.createdAt)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/* ---------- Compliance Deadlines ---------- */

type Deadline = { title: string; dueOn: string; daysLeft: number }

const deadlines: Deadline[] = [
  { title: 'PAYE Monthly Return', dueOn: 'Due May 26, 2026', daysLeft: 3 },
  { title: 'VAT Return', dueOn: 'Due May 26, 2026', daysLeft: 7 },
  { title: 'WHT Remittance', dueOn: 'Due May 26, 2026', daysLeft: 12 },
  { title: 'PAYE Monthly Return', dueOn: 'Due May 26, 2026', daysLeft: 14 },
  { title: 'Pension Remittance', dueOn: 'Due May 26, 2026', daysLeft: 15 },
]

function urgencyColor(daysLeft: number) {
  if (daysLeft <= 3) return 'text-red-600'
  if (daysLeft <= 7) return 'text-amber-600'
  return 'text-ink-500'
}

export function ComplianceDeadlinesCard() {
  return (
    <Card title="Compliance Alerts">
      <ul className="divide-y divide-ink-100">
        {deadlines.map((d, i) => (
          <li key={i} className="flex items-start gap-3 py-2.5">
            <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-600 [&>svg]:h-4 [&>svg]:w-4">
              <AlertTriangleIcon />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-ink-900 truncate">{d.title}</p>
              <p className="text-[10.5px] text-ink-500 font-medium">{d.dueOn}</p>
            </div>
            <span className={`text-[11px] font-bold ${urgencyColor(d.daysLeft)} shrink-0`}>
              {d.daysLeft} days left
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/* ---------- Approvals ---------- */

type Approval = { title: string; count: number; icon: ReactNode }

export function ApprovalsCard({
  pendingPayroll = 0,
  openInvoices = 0,
  purchaseOrders = 0,
}: {
  pendingPayroll?: number
  openInvoices?: number
  purchaseOrders?: number
}) {
  const approvals: Approval[] = [
    { title: 'Payroll runs to approve', count: pendingPayroll, icon: <BanknoteIcon /> },
    { title: 'Open invoices', count: openInvoices, icon: <ReceiptIcon /> },
    { title: 'Purchase orders', count: purchaseOrders, icon: <FileTextIcon /> },
  ]
  return (
    <Card title="Needs attention">
      <ul className="divide-y divide-ink-100">
        {approvals.map((a, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <span className="text-ink-400 [&>svg]:h-4 [&>svg]:w-4">{a.icon}</span>
            <span className="flex-1 text-[12.5px] font-semibold text-ink-700">
              {a.title}
            </span>
            <span className="h-6 w-6 rounded-md bg-ink-100 text-ink-700 text-[11px] font-bold flex items-center justify-center">
              {a.count}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-ink-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13.5px] font-bold text-ink-900">{title}</h3>
        <button className="text-[11.5px] font-semibold text-brand-600 hover:underline">
          View all
        </button>
      </div>
      {children}
    </div>
  )
}
