'use client'

import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { ReceiptIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import { Employee, employeesApi } from '../../../../src/lib/hr-api'
import {
  Advance,
  ExpenseClaim,
  ExpenseClaimStatus,
  advancesApi,
  expenseClaimsApi,
  expenseStatusMeta,
} from '../../../../src/lib/expenses-api'

const NEXT: Partial<Record<ExpenseClaimStatus, { to: ExpenseClaimStatus; label: string; color: string }>> = {
  draft: { to: 'submitted', label: 'Submit', color: 'text-sky-600' },
  submitted: { to: 'approved', label: 'Approve', color: 'text-emerald-600' },
  approved: { to: 'reimbursed', label: 'Mark reimbursed', color: 'text-violet-600' },
}

export default function ExpenseClaimsPage() {
  const [items, setItems] = useState<ExpenseClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ExpenseClaimStatus | ''>('')
  const [drawer, setDrawer] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [advances, setAdvances] = useState<Advance[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const r = await expenseClaimsApi.list({ status: status || undefined, limit: 100 })
      setItems(r.data ?? [])
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load expense claims')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status])
  useEffect(() => {
    employeesApi.list({ limit: 300 }).then((r) => setEmployees(r.data ?? [])).catch((e) => console.error('Failed to load employees', e))
    advancesApi.list({ status: 'disbursed', limit: 100 }).then((r) => setAdvances(r.data ?? [])).catch((e) => console.error('Failed to load advances', e))
  }, [])

  async function transition(c: ExpenseClaim, to: ExpenseClaimStatus) {
    setBusy(c.id)
    try {
      await expenseClaimsApi.update(c.id, { status: to })
      await load()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Could not update')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Expense Claims"
        description="Employee expense claims — approve to reimburse, or draw down an advance."
        actions={<Button onClick={() => setDrawer(true)}>New claim</Button>}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value as ExpenseClaimStatus | '')} className="h-9 rounded-lg border border-ink-200 px-3 text-[12.5px] font-semibold">
          <option value="">All statuses</option>
          {['draft', 'submitted', 'approved', 'rejected', 'reimbursed'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={<ReceiptIcon />} title="No expense claims yet" description="Employees can file claims for reimbursement." action={<Button onClick={() => setDrawer(true)}>New claim</Button>} />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Reference</th><th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date</th><th className="px-4 py-3">Against advance</th>
                <th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((c) => {
                const next = NEXT[c.status]
                return (
                  <tr key={c.id} className="text-[12.5px]">
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{c.reference}</td>
                    <td className="px-4 py-3 text-ink-700">{c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : '—'}</td>
                    <td className="px-4 py-3 text-[11.5px] text-ink-600">{c.claimDate}</td>
                    <td className="px-4 py-3 text-[11.5px] font-mono text-ink-500">{c.advance?.reference ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{formatMoney(c.total, c.currency)}</td>
                    <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize ${expenseStatusMeta(c.status).chip}`}>{c.status}</span></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {c.status === 'submitted' && <button disabled={busy === c.id} onClick={() => transition(c, 'rejected')} className="text-[12px] font-semibold text-rose-600 mr-3">Reject</button>}
                      {next && <button disabled={busy === c.id} onClick={() => transition(c, next.to)} className={`text-[12px] font-semibold ${next.color}`}>{next.label}</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {drawer && <ClaimDrawer employees={employees} advances={advances} onClose={() => setDrawer(false)} onSaved={async () => { setDrawer(false); await load() }} />}
    </>
  )
}

type LineRow = { expenseDate: string; category: string; description: string; amount: string }

function ClaimDrawer({ employees, advances, onClose, onSaved }: { employees: Employee[]; advances: Advance[]; onClose: () => void; onSaved: () => void }) {
  const [employeeId, setEmployeeId] = useState('')
  const [advanceId, setAdvanceId] = useState('')
  const [claimDate, setClaimDate] = useState(new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState<LineRow[]>([{ expenseDate: claimDate, category: 'general', description: '', amount: '' }])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const input = 'w-full h-9 rounded-lg border border-ink-200 px-2.5 text-[12.5px] focus:outline-none focus:border-brand-500'

  const total = useMemo(() => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0), [rows])

  function setRow(i: number, patch: Partial<LineRow>) { setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r))) }

  async function submit() {
    setErr(null)
    if (!employeeId) return setErr('Select an employee.')
    const lines = rows.filter((r) => r.description.trim() && Number(r.amount) > 0).map((r) => ({ expenseDate: r.expenseDate, category: r.category || 'general', description: r.description.trim(), amount: Number(r.amount) }))
    if (!lines.length) return setErr('Add at least one expense line.')
    setSaving(true)
    try {
      await expenseClaimsApi.create({ employeeId, advanceId: advanceId || undefined, claimDate, lines })
      onSaved()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not save')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[min(560px,100vw)] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200"><h3 className="font-bold text-ink-900">New expense claim</h3><button onClick={onClose} className="text-2xl leading-none text-ink-400 hover:text-ink-700">×</button></div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {err && <Alert variant="error">{err}</Alert>}
          <label className="block"><span className="block text-[11.5px] font-semibold text-ink-600 mb-1">Employee</span><select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={input}><option value="">Select…</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="block text-[11.5px] font-semibold text-ink-600 mb-1">Claim date</span><input type="date" value={claimDate} onChange={(e) => setClaimDate(e.target.value)} className={input} /></label>
            <label className="block"><span className="block text-[11.5px] font-semibold text-ink-600 mb-1">Against advance (optional)</span><select value={advanceId} onChange={(e) => setAdvanceId(e.target.value)} className={input}><option value="">None</option>{advances.map((a) => <option key={a.id} value={a.id}>{a.reference}</option>)}</select></label>
          </div>
          <div>
            <div className="text-[11.5px] font-semibold text-ink-600 mb-1">Expenses</div>
            <div className="space-y-1.5">
              <div className="grid grid-cols-[100px_1fr_90px_28px] gap-1.5 text-[10px] font-bold uppercase text-ink-400 px-0.5"><span>Date</span><span>Description</span><span>Amount</span><span /></div>
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-[100px_1fr_90px_28px] gap-1.5">
                  <input type="date" value={r.expenseDate} onChange={(e) => setRow(i, { expenseDate: e.target.value })} className={input} />
                  <input value={r.description} onChange={(e) => setRow(i, { description: e.target.value })} placeholder="e.g. Taxi" className={input} />
                  <input value={r.amount} onChange={(e) => setRow(i, { amount: e.target.value })} inputMode="decimal" className={`${input} text-right`} />
                  <button onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))} className="text-ink-400 hover:text-rose-600 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
            <button onClick={() => setRows((rs) => [...rs, { expenseDate: claimDate, category: 'general', description: '', amount: '' }])} className="mt-1.5 text-[12px] font-semibold text-brand-600">+ Add expense</button>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-ink-200 flex items-center gap-3">
          <span className="text-[13px] font-bold text-ink-900">Total: {formatMoney(total)}</span>
          <div className="ml-auto flex gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={saving} onClick={submit}>Save</Button></div>
        </div>
      </div>
    </>
  )
}

function Spinner() {
  return <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" /></div>
}
