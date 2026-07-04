'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { UsersIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import { SetupOverview, payrollSetupApi } from '../../../../src/lib/payroll-api'

export default function PayrollSetupPage() {
  const [data, setData] = useState<SetupOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [assignId, setAssignId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const d = await payrollSetupApi.overview()
      setData(d)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load payroll setup')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (!data) return
    setSelected((prev) =>
      prev.size === data.employees.length ? new Set() : new Set(data.employees.map((e) => e.id)),
    )
  }

  async function assign() {
    if (selected.size === 0) return
    setSaving(true)
    setError(null)
    try {
      await payrollSetupApi.assignStructure({
        employeeIds: Array.from(selected),
        structureId: assignId || null,
      })
      setSelected(new Set())
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not assign structure')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Payroll setup"
        description="Assign salary structures and preview what each employee takes home."
        actions={
          <Link href="/dashboard/payroll/runs">
            <Button variant="secondary">Go to runs</Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : !data || data.employees.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="No active employees"
          description="Add employees first, then come back to assign salary structures."
          action={
            <Link href="/dashboard/people/employees">
              <Button>Go to employees</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="rounded-2xl border border-ink-200 bg-white p-4">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-500">Employees</div>
              <div className="mt-1 text-[18px] font-bold text-ink-900">{data.totals.employeeCount}</div>
            </div>
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-500">Projected monthly net</div>
              <div className="mt-1 text-[18px] font-bold text-brand-700">{formatMoney(data.totals.projectedNet)}</div>
            </div>
            <div className="rounded-2xl border border-ink-200 bg-white p-4">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-500">Structures</div>
              <div className="mt-1 text-[18px] font-bold text-ink-900">{data.structures.length}</div>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-3 mb-4 flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-semibold text-ink-700">
                {selected.size} selected — assign structure:
              </span>
              <select
                value={assignId}
                onChange={(e) => setAssignId(e.target.value)}
                className="h-9 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 focus:outline-none focus:border-brand-500"
              >
                <option value="">Default structure</option>
                {data.structures.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.isDefault ? ' (default)' : ''}
                  </option>
                ))}
              </select>
              <Button loading={saving} onClick={assign}>Apply</Button>
              <button onClick={() => setSelected(new Set())} className="text-[12.5px] font-semibold text-ink-500 hover:text-ink-800">
                Clear
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" checked={selected.size === data.employees.length} onChange={toggleAll} />
                  </th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Structure</th>
                  <th className="px-4 py-3 text-right">Base</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">Deductions</th>
                  <th className="px-4 py-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.employees.map((e) => (
                  <tr key={e.id} className="text-[12.5px]">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink-900">{e.name}</div>
                      <div className="text-[11px] text-ink-500">
                        {e.jobTitle ?? '—'}
                        {e.department ? ` · ${e.department}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11.5px]">
                      <span className="text-ink-700">{e.salaryStructureName ?? 'Default'}</span>
                      {e.usingDefault && <span className="ml-1 text-[10px] text-ink-400">(default)</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-ink-600">{formatMoney(e.baseSalary ?? 0, e.currency)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMoney(e.grossEarnings, e.currency)}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-600">{formatMoney(e.totalDeductions, e.currency)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{formatMoney(e.netPay, e.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
