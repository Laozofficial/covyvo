'use client'

import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { CreditCardIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import {
  BankAccount,
  BankReconciliation,
  RecWorkspace,
  bankRecApi,
} from '../../../../src/lib/reports-api'

const today = () => new Date().toISOString().slice(0, 10)

export default function BankReconciliationPage() {
  const [mode, setMode] = useState<'list' | 'reconcile'>('list')
  const [recs, setRecs] = useState<BankReconciliation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setRecs(await bankRecApi.list())
      setError(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load reconciliations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (mode === 'reconcile') {
    return <Reconcile onDone={() => { setMode('list'); load() }} onCancel={() => setMode('list')} />
  }

  return (
    <>
      <PageHeader
        title="Bank Reconciliation"
        description="Match your ledger to the bank statement and clear outstanding items."
        actions={<Button onClick={() => setMode('reconcile')}>New reconciliation</Button>}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      {loading ? <Spinner /> : recs.length === 0 ? (
        <EmptyState icon={<CreditCardIcon />} title="No reconciliations yet" description="Reconcile a bank or cash account against its statement." action={<Button onClick={() => setMode('reconcile')}>New reconciliation</Button>} />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Reference</th><th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Statement date</th><th className="px-4 py-3 text-right">Statement</th>
                <th className="px-4 py-3 text-right">Cleared</th><th className="px-4 py-3 text-right">Difference</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {recs.map((r) => (
                <tr key={r.id} className="text-[12.5px]">
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{r.reference}</td>
                  <td className="px-4 py-3 text-ink-700">{r.account?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-[11.5px] text-ink-600">{r.statementDate}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatMoney(r.statementBalance)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatMoney(r.clearedBalance)}</td>
                  <td className={`px-4 py-3 text-right font-mono ${Math.abs(Number(r.difference)) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatMoney(r.difference)}</td>
                  <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize ${r.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-700'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function Reconcile({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [accountId, setAccountId] = useState('')
  const [statementDate, setStatementDate] = useState(today())
  const [statementBalance, setStatementBalance] = useState('')
  const [ws, setWs] = useState<RecWorkspace | null>(null)
  const [cleared, setCleared] = useState<Set<string>>(new Set())
  const [loadingWs, setLoadingWs] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { bankRecApi.accounts().then(setAccounts).catch(() => {}) }, [])

  useEffect(() => {
    if (!accountId) { setWs(null); return }
    setLoadingWs(true)
    bankRecApi.workspace(accountId, statementDate)
      .then((w) => {
        setWs(w)
        // Pre-tick lines already reconciled in prior runs (locked).
        setCleared(new Set(w.lines.filter((l) => l.reconciled).map((l) => l.id)))
      })
      .catch((e) => setErr(e instanceof ApiError ? e.message : 'Failed to load lines'))
      .finally(() => setLoadingWs(false))
  }, [accountId, statementDate])

  const clearedBalance = useMemo(
    () => (ws?.lines ?? []).filter((l) => cleared.has(l.id)).reduce((s, l) => s + Number(l.movement), 0),
    [ws, cleared],
  )
  const difference = (Number(statementBalance) || 0) - clearedBalance
  const balanced = Math.abs(difference) < 0.01

  function toggle(id: string, locked: boolean) {
    if (locked) return
    setCleared((c) => {
      const n = new Set(c)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function save(status: 'draft' | 'completed') {
    setErr(null)
    if (!accountId) return setErr('Pick an account.')
    setSaving(true)
    try {
      await bankRecApi.create({
        accountId,
        statementDate,
        statementBalance: Number(statementBalance) || 0,
        clearedLineIds: Array.from(cleared),
        status,
      })
      onDone()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not save')
      setSaving(false)
    }
  }

  const input = 'h-9 rounded-lg border border-ink-200 px-2.5 text-[12.5px] focus:outline-none focus:border-brand-500'

  return (
    <>
      <PageHeader
        title="New reconciliation"
        description="Tick the ledger lines that appear on your bank statement."
        actions={<Button variant="secondary" onClick={onCancel}>← Back</Button>}
      />

      {err && <div className="mb-4"><Alert variant="error">{err}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block"><span className="block text-[11.5px] font-semibold text-ink-600 mb-1">Bank / cash account</span>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={`${input} w-full`}>
            <option value="">Select…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
          </select>
        </label>
        <label className="block"><span className="block text-[11.5px] font-semibold text-ink-600 mb-1">Statement date</span>
          <input type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} className={`${input} w-full`} />
        </label>
        <label className="block"><span className="block text-[11.5px] font-semibold text-ink-600 mb-1">Statement closing balance</span>
          <input value={statementBalance} onChange={(e) => setStatementBalance(e.target.value)} inputMode="decimal" placeholder="0.00" className={`${input} w-full text-right font-mono`} />
        </label>
      </div>

      {accountId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Tile label="Book balance" value={formatMoney(ws?.bookBalance ?? 0)} />
          <Tile label="Cleared balance" value={formatMoney(clearedBalance)} />
          <Tile label="Statement" value={formatMoney(statementBalance || 0)} />
          <Tile label="Difference" value={formatMoney(difference)} good={balanced} bad={!balanced} />
        </div>
      )}

      {!accountId ? (
        <p className="text-[13px] text-ink-400">Choose an account to begin.</p>
      ) : loadingWs ? <Spinner /> : ws && ws.lines.length === 0 ? (
        <EmptyState icon={<CreditCardIcon />} title="No posted entries" description="This account has no posted journal lines up to the statement date." />
      ) : ws && (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 w-10">Clear</th><th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reference</th><th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {ws.lines.map((l) => (
                <tr key={l.id} className={`text-[12.5px] ${l.reconciled ? 'bg-ink-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={cleared.has(l.id)} disabled={l.reconciled} onChange={() => toggle(l.id, l.reconciled)} />
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-ink-600 whitespace-nowrap">{l.date}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-500">{l.reference}</td>
                  <td className="px-4 py-3 text-ink-700">{l.description ?? '—'}{l.reconciled && <span className="ml-2 text-[10px] text-ink-400">reconciled</span>}</td>
                  <td className={`px-4 py-3 text-right font-mono ${Number(l.movement) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatMoney(l.movement)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {accountId && (
        <div className="mt-4 flex items-center gap-3">
          {balanced
            ? <span className="text-[12.5px] font-semibold text-emerald-600">✓ Balanced — cleared matches the statement.</span>
            : <span className="text-[12.5px] font-semibold text-rose-600">Off by {formatMoney(Math.abs(difference))} — keep clearing lines.</span>}
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" loading={saving} onClick={() => save('draft')}>Save draft</Button>
            <Button loading={saving} disabled={!balanced} onClick={() => save('completed')}>Complete</Button>
          </div>
        </div>
      )}
    </>
  )
}

function Tile({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${good ? 'border-emerald-200 bg-emerald-50/50' : bad ? 'border-rose-200 bg-rose-50/40' : 'border-ink-200 bg-white'}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`mt-1 text-[15px] font-bold ${good ? 'text-emerald-700' : bad ? 'text-rose-700' : 'text-ink-900'}`}>{value}</div>
    </div>
  )
}

function Spinner() {
  return <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" /></div>
}
