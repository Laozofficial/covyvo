'use client'

import { useEffect, useState } from 'react'
import {
  BanknoteIcon,
  BarChartIcon,
  CoinIcon,
  ReceiptIcon,
  TagIcon,
  UsersIcon,
} from '../../src/components/ui/icons'
import { AuthUser } from '../../src/lib/auth-api'
import { formatNaira, formatNumber } from '../../src/lib/format'
import { storage } from '../../src/lib/storage'
import { AiAlertsCard } from './_components/AiAlertsCard'
import { CashflowCard } from './_components/CashflowCard'
import { DashboardHeader } from './_components/DashboardHeader'
import { KpiCard } from './_components/KpiCard'
import {
  ApprovalsCard,
  ComplianceDeadlinesCard,
  RecentActivitiesCard,
} from './_components/ListCards'
import { TopExpensesCard } from './_components/TopExpensesCard'

export default function DashboardPage() {
  const [firstName, setFirstName] = useState('there')

  useEffect(() => {
    const u = storage.getActiveUser<AuthUser>()
    const name = (u?.fullName ?? u?.email ?? '').split(/[\s@]+/)[0]
    if (name) setFirstName(name)
  }, [])

  return (
    <div className="py-4">
      <DashboardHeader name={firstName} />

      <AiAlertsCard />

      {/* KPI Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <KpiCard
          label="Total Revenue"
          value={formatNaira(52843699)}
          icon={<BarChartIcon />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ dir: 'up', pct: 20.5, period: 'vs last week', points: [10, 14, 12, 18, 16, 22, 28] }}
        />
        <KpiCard
          label="Total Expense"
          value={formatNaira(18433000)}
          icon={<ReceiptIcon />}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          trend={{ dir: 'up', pct: 8, period: 'vs last week', points: [22, 18, 24, 20, 28, 26, 30] }}
        />
        <KpiCard
          label="Gross Profit"
          value={formatNaira(34500111)}
          icon={<CoinIcon />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ dir: 'up', pct: 44.1, period: 'vs last week', points: [10, 12, 15, 18, 22, 26, 30] }}
        />
        <KpiCard
          label="Cash Balance"
          value={formatNaira(100000000)}
          icon={<CoinIcon />}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          trend={{ dir: 'up', pct: 3, period: 'vs last week', points: [20, 22, 21, 23, 24, 26, 28] }}
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Payroll Cost (This month)"
          value={formatNaira(11556000)}
          icon={<BanknoteIcon />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          trend={{ dir: 'down', pct: 3, period: 'vs last month', points: [28, 26, 24, 22, 20, 18, 16] }}
        />
        <KpiCard
          label="Employees"
          value={formatNumber(82)}
          icon={<UsersIcon />}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          trend={{ dir: 'up', pct: 0, period: 'last month', points: [80, 80, 81, 81, 82, 82, 82] }}
        />
        <KpiCard
          label="Pending Approval"
          value={formatNumber(9)}
          icon={<ReceiptIcon />}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          trend={{ dir: 'up', pct: 5, period: 'vs last week', points: [6, 7, 8, 7, 8, 9, 9] }}
        />
        <KpiCard
          label="Open Invoice"
          value={formatNumber(21)}
          subValue={formatNaira(35240000)}
          icon={<TagIcon />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <CashflowCard />
        <TopExpensesCard />
      </div>

      {/* Bottom row — 3 lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecentActivitiesCard />
        <ComplianceDeadlinesCard />
        <ApprovalsCard />
      </div>
    </div>
  )
}
