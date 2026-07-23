'use client'

import { useEffect, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { CoinIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import { Employee, employeesApi } from '../../../../src/lib/hr-api'
import {
  Advance,
  AdvanceStatus,
  advancesApi,
  expenseStatusMeta,
} from '../../../../src/lib/expenses-api'

const NEXT: Partial<Record<AdvanceStatus, { to: AdvanceStatus; label: string; color: string }>> = {
  requested: { to: 'approved', label: 'Approve', color: 'text-emerald-600' },
  approved: { to: 'disbursed', label: 'Mark disbursed', color: 'text-violet-600' },
  disbursed: { to: 'retired', label: 'Retire', color: 'text-brand-600' },
}

export default function AdvancesPage() {
  const [items, setItems] = useState<Advance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawer, setDrawer] = useState(false)
  const [detail, setDetail] = useState<Advance | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const r = await advancesApi.list({ limit: 100 })
      setItems(r.data ?? [])
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load advances')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { employeesApi.list({ limit: 300 }).then((r) => setEmployees(r.data ?? [])).catch((e) => console.error('Failed to load employees', e)) }, [])

  async function transition(a: Advance, to: AdvanceStatus) {
    setBusy(a.id)
    try {
      await advancesApi.update(a.id, { status: to })
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
        title="Advances"
        description="Cash advances to employees — retired against their expense claims."
        actions={<Button onClick={() => setDrawer(true)}>New advance</Button>}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={<CoinIcon />} title="No advances yet" description="Record a cash advance to an employee." action={<Button onClick={() => setDrawer(true)}>New advance</Button>} />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Reference</th><th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Purpose</th><th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Retired</th><th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((a) => {
                const next = NEXT[a.status]
                return (
                  <tr key={a.id} className="text-[12.5px]">
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{a.reference}</td>
                    <td className="px-4 py-3 text-ink-700">{a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : '—'}</td>
                    <td className="px-4 py-3 text-[11.5px] text-ink-500">{a.purpose ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{formatMoney(a.amount, a.currency)}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink-600">{formatMoney(a.retiredAmount, a.currency)}</td>
                    <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize ${expenseStatusMeta(a.status).chip}`}>{a.status}</span></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => advancesApi.get(a.id).then(setDetail)} className="text-[12px] font-semibold text-ink-500 mr-3">Retire view</button>
                      {next && <button disabled={busy === a.id} onClick={() => transition(a, next.to)} className={`text-[12px] font-semibold ${next.color}`}>{next.label}</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {drawer && <AdvanceDrawer employees={employees} onClose={() => setDrawer(false)} onSaved={async () => { setDrawer(false); await load() }} />}
      {detail && <RetireDrawer advance={detail} onClose={() => setDetail(null)} />}
    </>
  )
}

function AdvanceDrawer({ employees, onClose, onSaved }: { employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const [employeeId, setEmployeeId] = useState('')
  const [requestDate, setRequestDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const input = 'w-full h-9 rounded-lg border border-ink-200 px-2.5 text-[12.5px] focus:outline-none focus:border-brand-500'

  async function submit() {
    setErr(null)
    if (!employeeId || !Number(amount)) return setErr('Pick an employee and enter an amount.')
    setSaving(true)
    try {
      await advancesApi.create({ employeeId, requestDate, amount: Number(amount), purpose: purpose || undefined })
      onSaved()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not save')
      setSaving(false)
    }
  }

  return (
    <Modal title="New advance" onClose={onClose}>
      {err && <div className="mb-3"><Alert variant="error">{err}</Alert></div>}
      <Field label="Employee"><select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={input}><option value="">Select…</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></Field>
      <Field label="Request date"><input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} className={input} /></Field>
      <Field label="Amount"><input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={input} /></Field>
      <Field label="Purpose"><input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Field trip logistics" className={input} /></Field>
      <div className="flex gap-2 justify-end mt-4"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={saving} onClick={submit}>Save</Button></div>
    </Modal>
  )
}

function RetireDrawer({ advance, onClose }: { advance: Advance; onClose: () => void }) {
  const r = advance.retirement
  return (
    <Modal title={`Retirement — ${advance.reference}`} onClose={onClose}>
      {!r ? <p className="text-[13px] text-ink-500">No retirement data.</p> : (
        <div className="space-y-3 text-[12.5px]">
          <Row label="Advance amount" value={formatMoney(r.advanceAmount, advance.currency)} />
          <Row label="Claimed (approved)" value={formatMoney(r.claimed, advance.currency)} />
          <div className="border-t border-ink-100 pt-2">
            {Number(r.owedByEmployee) > 0
              ? <Row label="Employee to refund" value={formatMoney(r.owedByEmployee, advance.currency)} strong />
              : Number(r.owedToEmployee) > 0
                ? <Row label="Top-up owed to employee" value={formatMoney(r.owedToEmployee, advance.currency)} strong />
                : <Row label="Fully retired" value="✓" strong />}
          </div>
          <div className="text-[11px] font-bold uppercase text-ink-400 pt-2">Linked claims</div>
          {r.claims.length === 0 ? <p className="text-ink-400">None linked yet.</p> : r.claims.map((c) => (
            <div key={c.id} className="flex justify-between"><span className="text-ink-600 font-mono text-[11.5px]">{c.reference}</span><span className="capitalize text-ink-500">{c.status}</span><span className="font-mono">{formatMoney(c.total)}</span></div>
          ))}
        </div>
      )}
      <div className="flex justify-end mt-4"><Button variant="secondary" onClick={onClose}>Close</Button></div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block mb-3"><span className="block text-[11.5px] font-semibold text-ink-600 mb-1">{label}</span>{children}</label>
}
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex justify-between"><span className="text-ink-600">{label}</span><span className={`font-mono ${strong ? 'font-bold text-brand-700' : 'text-ink-900'}`}>{value}</span></div>
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-ink-900">{title}</h3><button onClick={onClose} className="text-2xl leading-none text-ink-400 hover:text-ink-700">×</button></div>
        {children}
      </div>
    </>
  )
}
function Spinner() {
  return <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" /></div>
}
