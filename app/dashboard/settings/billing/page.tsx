'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import {
  BillingInvoice,
  CreditPack,
  CreditWallet,
  Subscription,
  billingApi,
  statusMeta,
} from '../../../../src/lib/billing-api'

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<BillingInvoice[]>([])
  const [credits, setCredits] = useState<{ invoice: CreditWallet; ai: CreditWallet } | null>(null)
  const [packs, setPacks] = useState<CreditPack[]>([])
  const [packId, setPackId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [s, cr, pk] = await Promise.all([
        billingApi.subscription(),
        billingApi.credits().catch(() => null),
        billingApi.packs().catch(() => [] as CreditPack[]),
      ])
      setSub(s.subscription)
      setInvoices(s.invoices ?? [])
      setCredits(cr)
      setPacks(pk.filter((x) => x.isActive))
      if (pk.length) setPackId(pk[0].id)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load billing')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function pay(inv: BillingInvoice) {
    setBusy(true); setError(null)
    try {
      const { authorizationUrl } = await billingApi.checkout(inv.id)
      window.location.href = authorizationUrl
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start payment')
      setBusy(false)
    }
  }

  async function buy() {
    if (!packId) return
    setBusy(true); setError(null)
    try {
      const inv = await billingApi.buyCredits(packId)
      const { authorizationUrl } = await billingApi.checkout(inv.id)
      window.location.href = authorizationUrl
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start purchase')
      setBusy(false)
    }
  }

  const meta = sub ? statusMeta(sub.status) : null

  return (
    <>
      <PageHeader title="Subscription & Billing" description="Your plan, usage credits, and invoices." />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : !sub ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center">
          <p className="text-[14px] font-bold text-ink-900">No active subscription</p>
          <p className="mt-1 text-[12.5px] text-ink-500">Contact your Covyvo administrator to set up a plan.</p>
        </div>
      ) : (
        <>
          {/* Plan card */}
          <div className="mb-4 rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-600 to-violet-700 p-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">Current plan</p>
                <p className="mt-0.5 text-[26px] font-bold">{sub.plan?.name ?? '—'}</p>
                <p className="text-[12.5px] opacity-80">
                  {sub.plan ? `${formatMoney(sub.cycle === 'annual' ? sub.plan.annualPrice ?? sub.plan.monthlyPrice : sub.plan.monthlyPrice, 'NGN')} / ${sub.cycle}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta?.chip}`}>{meta?.label}</span>
                <p className="mt-2 text-[12px] opacity-80">
                  {sub.status === 'trialing' ? 'Trial ends' : 'Renews'} {(sub.status === 'trialing' ? sub.trialEndsAt : sub.currentPeriodEnd)?.slice(0, 10) ?? '—'}
                </p>
              </div>
            </div>
            {sub.plan && (
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-white/20 pt-3 text-[12px] opacity-90">
                <span>Branches: {sub.plan.maxBranches ?? '∞'}</span>
                <span>Users: {sub.plan.maxUsers ?? '∞'}</span>
                <span>Employees: {sub.plan.maxEmployees ?? '∞'}</span>
                <span>AI ops/mo: {sub.plan.aiOpsMonthly ?? 'custom'}</span>
              </div>
            )}
          </div>

          {sub.status === 'past_due' && (
            <div className="mb-4">
              <Alert variant="error">Your subscription is past due. Pay the open invoice below to avoid suspension.</Alert>
            </div>
          )}

          {/* Credits */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CreditCard title="E-invoicing credits" w={credits?.invoice} unit="invoices" />
            <CreditCard title="AI credits" w={credits?.ai} unit="AI ops" />
          </div>
          <div className="mb-6 flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-semibold text-ink-600">Buy a credit pack</span>
              <select value={packId} onChange={(e) => setPackId(e.target.value)} className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 focus:border-brand-500 focus:outline-none">
                {packs.map((p) => (
                  <option key={p.id} value={p.id}>{p.quantity.toLocaleString()} {p.type === 'invoice' ? 'invoices' : 'AI ops'} — {formatMoney(p.price, 'NGN')}</option>
                ))}
              </select>
            </label>
            <Button loading={busy} disabled={!packId} onClick={buy}>Buy credits</Button>
          </div>

          {/* Invoices */}
          <h2 className="mb-2 text-[13px] font-bold text-ink-900">Invoices</h2>
          {invoices.length === 0 ? (
            <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center text-[13px] text-ink-500">No invoices yet.</div>
          ) : (
            <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="text-[12.5px]">
                      <td className="px-4 py-3 text-ink-800">{inv.description}</td>
                      <td className="px-4 py-3 text-[11.5px] text-ink-500">{inv.createdAt?.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-ink-900">{formatMoney(inv.total, inv.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : inv.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{inv.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.status !== 'paid' && (
                          <button onClick={() => pay(inv)} disabled={busy} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50">Pay now</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}

function CreditCard({ title, w, unit }: { title: string; w?: CreditWallet; unit: string }) {
  const monthlyLeft = w ? Math.max(0, w.monthlyIncluded - w.monthlyUsed) : 0
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500">{title}</p>
      <p className="mt-1 text-[24px] font-bold text-ink-900">
        {w ? w.available.toLocaleString() : '—'} <span className="text-[12px] font-medium text-ink-400">{unit}</span>
      </p>
      {w && (
        <p className="mt-0.5 text-[11.5px] text-ink-500">
          {w.purchased.toLocaleString()} purchased
          {w.monthlyIncluded > 0 && ` · ${monthlyLeft.toLocaleString()} of ${w.monthlyIncluded.toLocaleString()} monthly left`}
        </p>
      )}
    </div>
  )
}
