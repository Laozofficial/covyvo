import { ReactNode } from 'react'
import {
  BanknoteIcon,
  CreditCardIcon,
  FileTextIcon,
  ReceiptIcon,
  AlertTriangleIcon,
} from '../../../src/components/ui/icons'

/* ---------- Recent Activities ---------- */

type Activity = { title: string; user: string; time: string; icon: ReactNode; iconBg: string; iconColor: string }

const activities: Activity[] = [
  { title: 'Payroll run "April 2026" created', user: 'Admin User', time: '8:45 AM', icon: <BanknoteIcon />, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  { title: 'Payment to Union Bank', user: 'Admin User', time: '8:45 AM', icon: <CreditCardIcon />, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { title: 'Invoice INV-12345 created', user: 'Admin User', time: '8:45 AM', icon: <ReceiptIcon />, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  { title: 'Journal Entry JE-12345 posted', user: 'Admin User', time: '8:45 AM', icon: <FileTextIcon />, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
]

export function RecentActivitiesCard() {
  return (
    <Card title="Recent activities">
      <ul className="divide-y divide-ink-100">
        {activities.map((a, i) => (
          <li key={i} className="flex items-start gap-3 py-2.5">
            <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${a.iconBg} ${a.iconColor} [&>svg]:h-4 [&>svg]:w-4`}>
              {a.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-ink-900 truncate">{a.title}</p>
              <p className="text-[10.5px] text-ink-500 font-medium">By {a.user}</p>
              <p className="text-[10.5px] text-ink-400">{a.time}</p>
            </div>
          </li>
        ))}
      </ul>
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

const approvals: Approval[] = [
  { title: 'Payment Vouchers', count: 6, icon: <ReceiptIcon /> },
  { title: 'Purchase orders', count: 8, icon: <FileTextIcon /> },
  { title: 'Journal Entries', count: 1, icon: <FileTextIcon /> },
  { title: 'Payroll Runs', count: 2, icon: <BanknoteIcon /> },
]

export function ApprovalsCard() {
  return (
    <Card title="Approvals">
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
