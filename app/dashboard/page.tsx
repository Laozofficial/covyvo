'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  BanknoteIcon,
  BarChartIcon,
  BranchIcon,
  BuildingIcon,
  CoinIcon,
  ReceiptIcon,
  TagIcon,
  UsersIcon,
} from '../../src/components/ui/icons'
import { AuthUser } from '../../src/lib/auth-api'
import { formatNaira, formatNumber } from '../../src/lib/format'
import {
  branchesApi,
  departmentsApi,
  employeesApi,
} from '../../src/lib/hr-api'
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
  const [counts, setCounts] = useState<{ employees: number | null; branches: number | null; departments: number | null }>({
    employees: null,
    branches: null,
    departments: null,
  })

  useEffect(() => {
    const u = storage.getActiveUser<AuthUser>()
    const name = (u?.fullName ?? u?.email ?? '').split(/[\s@]+/)[0]
    if (name) setFirstName(name)
  }, [])

  useEffect(() => {
    // Fire-and-forget; quietly leave counts as null on failure (the tile
    // falls back to a dash). 401s are handled by the api.ts interceptor.
    Promise.allSettled([
      employeesApi.list({ limit: 1 }),
      branchesApi.list({ limit: 1, includeInactive: true }),
      departmentsApi.list({ limit: 1, includeInactive: true }),
    ]).then(([emp, br, dept]) => {
      setCounts({
        employees: emp.status === 'fulfilled' ? emp.value.total : null,
        branches: br.status === 'fulfilled' ? br.value.total : null,
        departments: dept.status === 'fulfilled' ? dept.value.total : null,
      })
    })
  }, [])

  const showQuickSetup = counts.employees === 0

  return (
    <div className="py-4">
      <DashboardHeader name={firstName} />

      {showQuickSetup && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-5 mb-4">
          <p className="text-[13px] font-bold text-ink-900 tracking-tight">
            Let's get your workspace set up
          </p>
          <p className="text-[12px] text-ink-600 mt-1 mb-3">
            A few quick steps to make the dashboard feel like your business.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link
              href="/dashboard/administration/branches"
              className="rounded-xl border border-ink-200 bg-white p-3 hover:border-brand-400 transition-colors"
            >
              <BranchIcon className="text-brand-600 mb-1" />
              <p className="text-[12.5px] font-semibold text-ink-900">Add a branch</p>
              <p className="text-[11px] text-ink-500">
                {counts.branches === null ? 'Loading…' : `${counts.branches} so far`}
              </p>
            </Link>
            <Link
              href="/dashboard/administration/departments"
              className="rounded-xl border border-ink-200 bg-white p-3 hover:border-brand-400 transition-colors"
            >
              <BuildingIcon className="text-brand-600 mb-1" />
              <p className="text-[12.5px] font-semibold text-ink-900">Add departments</p>
              <p className="text-[11px] text-ink-500">
                {counts.departments === null ? 'Loading…' : `${counts.departments} so far`}
              </p>
            </Link>
            <Link
              href="/dashboard/people/employees"
              className="rounded-xl border border-ink-200 bg-white p-3 hover:border-brand-400 transition-colors"
            >
              <UsersIcon className="text-brand-600 mb-1" />
              <p className="text-[12.5px] font-semibold text-ink-900">Add your first employee</p>
              <p className="text-[11px] text-ink-500">0 so far</p>
            </Link>
          </div>
        </div>
      )}

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
          value={counts.employees === null ? '—' : formatNumber(counts.employees)}
          icon={<UsersIcon />}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
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
