'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '../../../../../src/components/PageHeader'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { ApiError } from '../../../../../src/lib/api'
import { formatMoney } from '../../../../../src/lib/finance-api'
import { storage } from '../../../../../src/lib/storage'
import {
  Payslip,
  PayrollRun,
  payrollAdjustmentsApi,
  payrollRunStatusMeta,
  payrollRunsApi,
} from '../../../../../src/lib/payroll-api'
import { printPayslip } from './_components/payslip-print'

const PAYMENT_METHODS = [
  { value: 'wallet', label: 'Payroll wallet' },
  { value: 'manual_bank', label: 'Manual bank transfer' },
  { value: 'bank_file', label: 'Bank file' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
]

export default function PayrollRunDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const runId = params.id
  const [run, setRun] = useState<PayrollRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Payslip | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [adjOpen, setAdjOpen] = useState(false)

  const companyName =
    (storage.getActiveTenant<{ name?: string }>()?.name as string) ?? 'Covyvo'

  async function load() {
    setLoading(true)
    try {
      setRun(await payrollRunsApi.get(runId))
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load run')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  async function act(key: string, fn: () => Promise<PayrollRun>) {
    setBusy(key)
    setError(null)
    try {
      setRun(await fn())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    )
  }
  if (!run) {
    return (
      <Alert variant="error">{error ?? 'Payroll run not found'}</Alert>
    )
  }

  const meta = payrollRunStatusMeta(run.status)
  const canCompute = run.status === 'draft' || run.status === 'computed'
  const canApprove = run.status === 'computed'
  const canPay = run.status === 'approved' || run.status === 'partially_paid'
  const outstanding =
    Number(run.totalNet) -
    (run.payments ?? [])
      .filter((p) => !p.voidedAt)
      .reduce((s, p) => s + Number(p.amount), 0)

  return (
    <>
      <PageHeader
        title={run.name}
        description={
          <span className="inline-flex items-center gap-2">
            <span className="font-mono text-[12px]">{run.reference}</span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${meta.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            <span className="text-ink-500">
              {run.periodStart} → {run.periodEnd}
            </span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/payroll/runs" className="text-[12.5px] font-semibold text-ink-500 hover:text-ink-800 mr-1">
              ← All runs
            </Link>
            {canCompute && (
              <Button
                variant="secondary"
                loading={busy === 'compute'}
                title="Optional: pre-fill every payslip from each employee's salary structure. You can edit any amount afterwards."
                onClick={() => act('compute', () => payrollRunsApi.compute(run.id))}
              >
                Prefill from structure
              </Button>
            )}
            {canApprove && (
              <Button loading={busy === 'approve'} onClick={() => act('approve', () => payrollRunsApi.approve(run.id))}>
                Approve
              </Button>
            )}
            {canPay && <Button onClick={() => setPayOpen(true)}>Record payment</Button>}
          </div>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Tile label="Employees" value={String(run.employeeCount)} />
        <Tile label="Total earnings" value={formatMoney(run.totalEarnings, run.currency)} />
        <Tile label="Total deductions" value={formatMoney(run.totalDeductions, run.currency)} />
        <Tile label="Net pay" value={formatMoney(run.totalNet, run.currency)} accent />
      </div>

      {canPay && outstanding > 0.005 && (
        <div className="mb-4">
          <Alert variant="info">
            Outstanding to pay: <b>{formatMoney(outstanding, run.currency)}</b>. Pay from the wallet or record a manual payment.
          </Alert>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-[13px] font-bold text-ink-900">Payslips</h2>
          {(run.status === 'draft' || run.status === 'computed') && (
            <p className="text-[11.5px] text-ink-500">Click a payslip to enter or edit amounts, then approve.</p>
          )}
        </div>
        {(run.status === 'draft' || run.status === 'computed') && (
          <button
            onClick={() => setAdjOpen(true)}
            className="text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
          >
            + Add bonus / penalty
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Structure</th>
              <th className="px-4 py-3 text-right">Earnings</th>
              <th className="px-4 py-3 text-right">Deductions</th>
              <th className="px-4 py-3 text-right">Net</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Payslip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(run.payslips ?? []).map((p) => (
              <tr key={p.id} className="text-[12.5px]">
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink-900">
                    {p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : 'Employee'}
                  </div>
                  <div className="text-[11px] text-ink-500 font-mono">{p.employee?.employeeCode}</div>
                </td>
                <td className="px-4 py-3 text-[11.5px] text-ink-600">{p.salaryStructure?.name ?? 'Default'}</td>
                <td className="px-4 py-3 text-right font-mono">{formatMoney(p.totalEarnings, p.currency)}</td>
                <td className="px-4 py-3 text-right font-mono text-rose-600">{formatMoney(p.totalDeductions, p.currency)}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{formatMoney(p.netPay, p.currency)}</td>
                <td className="px-4 py-3">
                  <span className="text-[11px] font-semibold text-ink-600 capitalize">{p.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setViewing(p)}
                    className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <PayslipDrawer
          payslip={viewing}
          editable={run.status === 'draft' || run.status === 'computed'}
          companyName={companyName}
          runName={run.name}
          period={`${run.periodStart} → ${run.periodEnd}`}
          onClose={() => setViewing(null)}
          onSaved={(updated) => {
            setRun(updated)
            setViewing(updated.payslips?.find((p) => p.id === viewing.id) ?? null)
          }}
        />
      )}

      {payOpen && (
        <PaymentModal
          run={run}
          defaultAmount={Math.max(0, outstanding)}
          onClose={() => setPayOpen(false)}
          onPaid={(updated) => {
            setRun(updated)
            setPayOpen(false)
          }}
        />
      )}

      {adjOpen && (
        <AdjustmentModal
          run={run}
          onClose={() => setAdjOpen(false)}
          onAdded={async () => {
            setAdjOpen(false)
            await act('compute', () => payrollRunsApi.compute(run.id))
          }}
        />
      )}
    </>
  )
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'border-brand-200 bg-brand-50' : 'border-ink-200 bg-white'}`}>
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`mt-1 text-[18px] font-bold ${accent ? 'text-brand-700' : 'text-ink-900'}`}>{value}</div>
    </div>
  )
}

type EditRow = { name: string; kind: 'earning' | 'deduction'; amount: string; isTaxable: boolean }

function PayslipDrawer({
  payslip,
  editable,
  companyName,
  runName,
  period,
  onClose,
  onSaved,
}: {
  payslip: Payslip
  editable: boolean
  companyName: string
  runName: string
  period: string
  onClose: () => void
  onSaved: (run: PayrollRun) => void
}) {
  const [editing, setEditing] = useState(false)
  const [rows, setRows] = useState<EditRow[]>([])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function startEdit() {
    setRows(
      (payslip.items ?? []).map((i) => ({
        name: i.name,
        kind: i.kind,
        amount: String(Number(i.amount)),
        isTaxable: i.isTaxable,
      })),
    )
    setEditing(true)
  }

  function addRow(kind: 'earning' | 'deduction') {
    setRows((r) => [...r, { name: '', kind, amount: '', isTaxable: kind === 'earning' }])
  }
  function updateRow(idx: number, patch: Partial<EditRow>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  }
  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx))
  }

  const liveEarnings = editing
    ? rows.filter((r) => r.kind === 'earning').reduce((s, r) => s + (Number(r.amount) || 0), 0)
    : Number(payslip.totalEarnings)
  const liveDeductions = editing
    ? rows.filter((r) => r.kind === 'deduction').reduce((s, r) => s + (Number(r.amount) || 0), 0)
    : Number(payslip.totalDeductions)
  const liveNet = liveEarnings - liveDeductions

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      const items = rows
        .filter((r) => r.name.trim())
        .map((r) => ({
          name: r.name.trim(),
          kind: r.kind,
          amount: Number(r.amount) || 0,
          isTaxable: r.isTaxable,
        }))
      const updated = await payrollRunsApi.updatePayslip(payslip.runId, payslip.id, { items })
      setEditing(false)
      onSaved(updated)
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not save the payslip')
    } finally {
      setSaving(false)
    }
  }

  const earnings = (payslip.items ?? []).filter((i) => i.kind === 'earning')
  const deductions = (payslip.items ?? []).filter((i) => i.kind === 'deduction')

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[min(480px,100vw)] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
          <div>
            <div className="font-bold text-ink-900">
              {payslip.employee ? `${payslip.employee.firstName} ${payslip.employee.lastName}` : 'Payslip'}
            </div>
            <div className="text-[11.5px] text-ink-500">{payslip.employee?.jobTitle ?? '—'}</div>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-ink-400 hover:text-ink-700">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-[12.5px]">
          {err && <Alert variant="error">{err}</Alert>}

          {editing ? (
            <>
              <EditGroup
                title="Earnings"
                rows={rows}
                kind="earning"
                onUpdate={updateRow}
                onRemove={removeRow}
                onAdd={() => addRow('earning')}
              />
              <EditGroup
                title="Deductions"
                rows={rows}
                kind="deduction"
                onUpdate={updateRow}
                onRemove={removeRow}
                onAdd={() => addRow('deduction')}
              />
            </>
          ) : (
            <>
              <Section title="Earnings" items={earnings} currency={payslip.currency} />
              <Section title="Deductions" items={deductions} currency={payslip.currency} tone="rose" />
            </>
          )}

          <div className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 flex items-center justify-between">
            <span className="font-bold text-ink-800">Net pay</span>
            <span className="font-bold text-brand-700 text-[16px]">{formatMoney(liveNet, payslip.currency)}</span>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-ink-200 flex gap-2">
          {editing ? (
            <>
              <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
              <Button loading={saving} onClick={save} className="flex-1">Save payslip</Button>
            </>
          ) : (
            <>
              {editable && (
                <Button variant="secondary" onClick={startEdit} className="flex-1">Edit amounts</Button>
              )}
              <Button
                className="flex-1"
                onClick={() => printPayslip(payslip, { companyName, runName, period })}
              >
                Download PDF
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function EditGroup({
  title,
  rows,
  kind,
  onUpdate,
  onRemove,
  onAdd,
}: {
  title: string
  rows: EditRow[]
  kind: 'earning' | 'deduction'
  onUpdate: (idx: number, patch: Partial<EditRow>) => void
  onRemove: (idx: number) => void
  onAdd: () => void
}) {
  return (
    <div>
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-400 mb-1">{title}</div>
      <div className="space-y-1.5">
        {rows.map((r, idx) =>
          r.kind !== kind ? null : (
            <div key={idx} className="flex items-center gap-1.5">
              <input
                value={r.name}
                onChange={(e) => onUpdate(idx, { name: e.target.value })}
                placeholder={kind === 'earning' ? 'e.g. Basic salary' : 'e.g. PAYE'}
                className="flex-1 h-9 rounded-lg border border-ink-200 px-2.5 text-[12.5px] focus:outline-none focus:border-brand-500"
              />
              <input
                value={r.amount}
                onChange={(e) => onUpdate(idx, { amount: e.target.value })}
                inputMode="decimal"
                placeholder="0.00"
                className="w-28 h-9 rounded-lg border border-ink-200 px-2.5 text-[12.5px] text-right font-mono focus:outline-none focus:border-brand-500"
              />
              <button onClick={() => onRemove(idx)} className="text-ink-400 hover:text-rose-600 px-1 text-lg leading-none">×</button>
            </div>
          ),
        )}
      </div>
      <button onClick={onAdd} className="mt-1.5 text-[12px] font-semibold text-brand-600 hover:text-brand-700">
        + Add {kind}
      </button>
    </div>
  )
}

function Section({
  title,
  items,
  currency,
  tone,
}: {
  title: string
  items: Payslip['items']
  currency: string
  tone?: 'rose'
}) {
  return (
    <div>
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-400 mb-1">{title}</div>
      <div className="rounded-xl border border-ink-200 divide-y divide-ink-100">
        {(items ?? []).length === 0 && <div className="px-3 py-2 text-ink-400">—</div>}
        {(items ?? []).map((i) => (
          <div key={i.id} className="px-3 py-2 flex items-center justify-between">
            <span className="text-ink-700">{i.name}</span>
            <span className={`font-mono ${tone === 'rose' ? 'text-rose-600' : 'text-ink-900'}`}>
              {formatMoney(i.amount, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PaymentModal({
  run,
  defaultAmount,
  onClose,
  onPaid,
}: {
  run: PayrollRun
  defaultAmount: number
  onClose: () => void
  onPaid: (r: PayrollRun) => void
}) {
  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toFixed(2) : '')
  const [method, setMethod] = useState('wallet')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    setSaving(true)
    setErr(null)
    try {
      const updated = await payrollRunsApi.recordPayment(run.id, {
        paymentDate,
        amount: Number(amount),
        method,
        reference: reference || undefined,
        coversAll: true,
      })
      onPaid(updated)
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Payment failed')
      setSaving(false)
    }
  }

  return (
    <Modal title="Record payment" onClose={onClose}>
      {err && <div className="mb-3"><Alert variant="error">{err}</Alert></div>}
      <Field label="Payment method">
        <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </Field>
      {method === 'wallet' && (
        <p className="-mt-2 mb-3 text-[11.5px] text-ink-500">
          This debits your payroll wallet. If the balance is short, the payment is declined —{' '}
          <Link href="/dashboard/payroll/wallet" className="text-brand-600 font-semibold">fund the wallet</Link>.
        </p>
      )}
      <Field label="Amount">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={inputCls} />
      </Field>
      <Field label="Payment date">
        <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Reference (optional)">
        <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} />
      </Field>
      <div className="flex gap-2 justify-end mt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={saving} onClick={submit}>Pay {formatMoney(amount || 0, run.currency)}</Button>
      </div>
    </Modal>
  )
}

function AdjustmentModal({
  run,
  onClose,
  onAdded,
}: {
  run: PayrollRun
  onClose: () => void
  onAdded: () => void
}) {
  const employees = useMemo(() => run.payslips ?? [], [run])
  const [employeeId, setEmployeeId] = useState(employees[0]?.employeeId ?? '')
  const [kind, setKind] = useState<'bonus' | 'penalty'>('bonus')
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    setSaving(true)
    setErr(null)
    try {
      await payrollAdjustmentsApi.create({
        employeeId,
        runId: run.id,
        kind,
        label: label.trim(),
        amount: Number(amount),
      })
      onAdded()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not add adjustment')
      setSaving(false)
    }
  }

  return (
    <Modal title="Add bonus / penalty" onClose={onClose}>
      {err && <div className="mb-3"><Alert variant="error">{err}</Alert></div>}
      <Field label="Employee">
        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputCls}>
          {employees.map((p) => (
            <option key={p.id} value={p.employeeId}>
              {p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : p.employeeId}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Type">
        <select value={kind} onChange={(e) => setKind(e.target.value as 'bonus' | 'penalty')} className={inputCls}>
          <option value="bonus">Bonus (adds to pay)</option>
          <option value="penalty">Penalty (deducts from pay)</option>
        </select>
      </Field>
      <Field label="Label">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Performance bonus" className={inputCls} />
      </Field>
      <Field label="Amount">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={inputCls} />
      </Field>
      <p className="text-[11.5px] text-ink-500 mt-1">The run will be recomputed so this reflects in the payslip.</p>
      <div className="flex gap-2 justify-end mt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={saving} onClick={submit} disabled={!label.trim() || !amount}>Add & recompute</Button>
      </div>
    </Modal>
  )
}

const inputCls =
  'w-full h-10 rounded-lg border border-ink-200 bg-white px-3 text-[13px] font-medium text-ink-900 focus:outline-none focus:border-brand-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-[11.5px] font-semibold text-ink-600 mb-1">{label}</span>
      {children}
    </label>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink-900">{title}</h3>
          <button onClick={onClose} className="text-2xl leading-none text-ink-400 hover:text-ink-700">×</button>
        </div>
        {children}
      </div>
    </>
  )
}
