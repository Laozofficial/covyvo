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
import { DashboardSummary, dashboardApi } from '../../src/lib/insights-api'
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
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    const u = storage.getActiveUser<AuthUser>()
    const name = (u?.fullName ?? u?.email ?? '').split(/[\s@]+/)[0]
    if (name) setFirstName(name)
  }, [])

  useEffect(() => {
    // Fire-and-forget; quietly leave summary null on failure (tiles show a
    // dash). 401s are handled by the api.ts interceptor.
    dashboardApi.summary().then(setSummary).catch(() => setSummary(null))
  }, [])

  const kpis = summary?.kpis
  const counts = summary?.counts
  const num = (v: number | undefined) => (v === undefined ? '—' : formatNumber(v))
  const money = (v: number | undefined) => (v === undefined ? '—' : formatNaira(v))
  const showQuickSetup = counts?.employees === 0

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
                {counts?.branches === undefined ? 'Loading…' : `${counts.branches} so far`}
              </p>
            </Link>
            <Link
              href="/dashboard/administration/departments"
              className="rounded-xl border border-ink-200 bg-white p-3 hover:border-brand-400 transition-colors"
            >
              <BuildingIcon className="text-brand-600 mb-1" />
              <p className="text-[12.5px] font-semibold text-ink-900">Add departments</p>
              <p className="text-[11px] text-ink-500">
                {counts?.departments === undefined ? 'Loading…' : `${counts.departments} so far`}
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
          value={money(kpis?.revenue)}
          subValue={kpis ? `${formatNaira(kpis.collected)} collected` : undefined}
          icon={<BarChartIcon />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          href="/dashboard/finance/invoices"
        />
        <KpiCard
          label="Total Expense"
          value={money(kpis?.expense)}
          subValue="Procurement + payroll"
          icon={<ReceiptIcon />}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          href="/dashboard/operations/purchase-orders"
        />
        <KpiCard
          label="Gross Profit"
          value={money(kpis?.grossProfit)}
          icon={<CoinIcon />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          href="/dashboard/finance/trial-balance"
        />
        <KpiCard
          label="Wallet Balance"
          value={money(kpis?.walletBalance)}
          icon={<CoinIcon />}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          href="/dashboard/payroll/wallet"
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Payroll Cost (This month)"
          value={money(kpis?.payrollThisMonth)}
          icon={<BanknoteIcon />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          href="/dashboard/payroll/runs"
        />
        <KpiCard
          label="Employees"
          value={num(counts?.employees)}
          icon={<UsersIcon />}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          href="/dashboard/people/employees"
        />
        <KpiCard
          label="Pending Approval"
          value={num(counts?.pendingApprovals)}
          icon={<ReceiptIcon />}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          href="/dashboard/payroll/runs"
        />
        <KpiCard
          label="Open Invoices"
          value={num(counts?.openInvoices)}
          subValue={kpis ? `${formatNaira(kpis.receivablesOutstanding)} outstanding` : undefined}
          icon={<TagIcon />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          href="/dashboard/finance/accounts-receivable"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <CashflowCard />
        <TopExpensesCard />
      </div>

      {/* Bottom row — 3 lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecentActivitiesCard items={summary?.recentActivity ?? []} />
        <ComplianceDeadlinesCard />
        <ApprovalsCard
          pendingPayroll={counts?.pendingApprovals ?? 0}
          openInvoices={counts?.openInvoices ?? 0}
          purchaseOrders={counts?.purchaseOrders ?? 0}
        />
      </div>
    </div>
  )
}
