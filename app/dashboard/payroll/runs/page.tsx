'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { BanknoteIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import {
  PayrollRun,
  PayrollRunStatus,
  payrollRunStatusMeta,
  payrollRunsApi,
} from '../../../../src/lib/payroll-api'

const STATUS_FILTERS: { value: PayrollRunStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'computed', label: 'Computed' },
  { value: 'approved', label: 'Approved' },
  { value: 'partially_paid', label: 'Partially paid' },
  { value: 'paid', label: 'Paid' },
]

function firstOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function lastOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
}

export default function PayrollRunsPage() {
  const router = useRouter()
  const [items, setItems] = useState<PayrollRun[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<PayrollRunStatus | ''>('')
  const [creating, setCreating] = useState(false)

  const monthLabel = useMemo(
    () => new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    [],
  )

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const r = await payrollRunsApi.list({ status: status || undefined, limit: 50 })
      setItems(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load payroll runs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  async function createRun() {
    setCreating(true)
    setError(null)
    try {
      const run = await payrollRunsApi.create({
        name: `${monthLabel} payroll`,
        periodStart: firstOfMonth(),
        periodEnd: lastOfMonth(),
        payDate: lastOfMonth(),
      })
      router.push(`/dashboard/payroll/runs/${run.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the run')
      setCreating(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Run payroll"
        description={`${total.toLocaleString()} payroll run${total === 1 ? '' : 's'}`}
        actions={
          <Button onClick={createRun} loading={creating}>
            New payroll run
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4 flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PayrollRunStatus | '')}
          className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 focus:outline-none focus:border-brand-500"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Link
          href="/dashboard/payroll/setup"
          className="ml-auto text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
        >
          Payroll setup →
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BanknoteIcon />}
          title={status ? 'No matching runs' : 'No payroll runs yet'}
          description={
            status
              ? 'Try clearing the filter above.'
              : 'Create your first run — it scaffolds a payslip for every active employee, then computes pay from their salary structure.'
          }
          action={!status ? <Button onClick={createRun} loading={creating}>New payroll run</Button> : null}
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3 text-right">Employees</th>
                <th className="px-4 py-3 text-right">Net</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((r) => {
                const meta = payrollRunStatusMeta(r.status)
                return (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/dashboard/payroll/runs/${r.id}`)}
                    className="text-[12.5px] cursor-pointer hover:bg-ink-50/50"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{r.reference}</td>
                    <td className="px-4 py-3 font-semibold text-ink-900">{r.name}</td>
                    <td className="px-4 py-3 text-[11.5px] text-ink-600">
                      {r.periodStart} → {r.periodEnd}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{r.employeeCount}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatMoney(r.totalNet, r.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${meta.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
