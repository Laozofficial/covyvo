'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import {
  Wallet,
  WalletTransaction,
  walletApi,
} from '../../../../src/lib/payroll-api'

export default function PayrollWalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [txns, setTxns] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [fundOpen, setFundOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [funding, setFunding] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [w, t] = await Promise.all([walletApi.get(), walletApi.transactions({ limit: 50 })])
      setWallet(w)
      setTxns(t.data ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load wallet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function fund() {
    setFunding(true)
    setError(null)
    setOk(null)
    try {
      const res = await walletApi.fund({ amount: Number(amount) })
      if (res.settled) {
        setOk(`Wallet funded with ${formatMoney(amount, wallet?.currency ?? 'NGN')}.`)
      } else if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl
        return
      }
      setFundOpen(false)
      setAmount('')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Funding failed')
    } finally {
      setFunding(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Payroll wallet"
        description="Fund the wallet, then pay payroll runs straight from the balance."
        actions={<Button onClick={() => setFundOpen(true)}>Fund wallet</Button>}
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      {ok && <div className="mb-4"><Alert variant="success">{ok}</Alert></div>}

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-600 to-violet-700 text-white p-6 mb-4 max-w-md">
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Available balance</div>
            <div className="mt-1 text-[32px] font-bold">{formatMoney(wallet?.balance ?? 0, wallet?.currency ?? 'NGN')}</div>
            <div className="mt-1 text-[12px] opacity-80">Status: {wallet?.status ?? 'active'}</div>
          </div>

          <h2 className="text-[13px] font-bold text-ink-900 mb-2">Transactions</h2>
          {txns.length === 0 ? (
            <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center text-[13px] text-ink-500">
              No wallet activity yet. Fund the wallet to get started.
            </div>
          ) : (
            <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {txns.map((t) => (
                    <tr key={t.id} className="text-[12.5px]">
                      <td className="px-4 py-3 text-[11.5px] text-ink-600">{t.createdAt.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-ink-700">{t.notes ?? t.reference ?? '—'}</td>
                      <td className="px-4 py-3 text-[11px] capitalize text-ink-500">{t.source}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${t.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.direction === 'credit' ? '+' : '−'}{formatMoney(t.amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-600">{formatMoney(t.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {fundOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setFundOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-ink-900">Fund wallet</h3>
              <button onClick={() => setFundOpen(false)} className="text-2xl leading-none text-ink-400 hover:text-ink-700">×</button>
            </div>
            <label className="block mb-3">
              <span className="block text-[11.5px] font-semibold text-ink-600 mb-1">Amount</span>
              <input
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                className="w-full h-11 rounded-lg border border-ink-200 bg-white px-3 text-[15px] font-semibold text-ink-900 focus:outline-none focus:border-brand-500"
              />
            </label>
            <p className="text-[11.5px] text-ink-500 mb-4">
              A payment provider isn&apos;t connected yet, so this records the funding directly. Real gateway funding drops in later.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setFundOpen(false)}>Cancel</Button>
              <Button loading={funding} disabled={!Number(amount)} onClick={fund}>Fund</Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
