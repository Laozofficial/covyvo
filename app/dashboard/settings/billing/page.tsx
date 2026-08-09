'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import {
  Addon,
  BillingInvoice,
  CreditPack,
  CreditWallet,
  Plan,
  Subscription,
  billingApi,
  statusMeta,
} from '../../../../src/lib/billing-api'

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [invoices, setInvoices] = useState<BillingInvoice[]>([])
  const [credits, setCredits] = useState<{ invoice: CreditWallet; ai: CreditWallet } | null>(null)
  const [packs, setPacks] = useState<CreditPack[]>([])
  const [addonCatalog, setAddonCatalog] = useState<Addon[]>([])
  const [addonQty, setAddonQty] = useState<Record<string, number>>({})
  const [packId, setPackId] = useState('')
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [changing, setChanging] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [s, pl, cr, pk, ad] = await Promise.all([
        billingApi.subscription(),
        billingApi.plans().catch(() => [] as Plan[]),
        billingApi.credits().catch(() => null),
        billingApi.packs().catch(() => [] as CreditPack[]),
        billingApi.addons().catch(() => [] as Addon[]),
      ])
      setSub(s.subscription)
      setInvoices(s.invoices ?? [])
      setPlans(pl)
      setCredits(cr)
      setPacks(pk.filter((x) => x.isActive))
      setAddonCatalog(ad.filter((x) => x.isActive))
      const q: Record<string, number> = {}
      for (const it of (s.subscription?.addOns ?? [])) q[it.code] = it.quantity
      setAddonQty(q)
      if (pk.length) setPackId(pk[0].id)
      if (s.subscription) setCycle(s.subscription.cycle)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load billing')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function run(fn: () => Promise<unknown>, msg?: string) {
    setBusy(true); setError(null); setOk(null)
    try { await fn(); if (msg) setOk(msg); await load() }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Something went wrong') }
    finally { setBusy(false) }
  }

  const onFree = sub?.plan?.code === 'free' && sub.status === 'active'

  async function selectPlan(planId: string) {
    const target = plans.find((p) => p.id === planId)
    if (!sub) {
      await run(() => billingApi.subscribe(planId, cycle), 'Subscription started.')
    } else if (target?.code !== 'free' && onFree) {
      await run(() => billingApi.trial(planId, cycle), 'Your 7-day free trial has started 🎉')
    } else {
      await run(() => billingApi.changePlan(planId, cycle), 'Plan updated. Any proration appears as an invoice below.')
    }
    setChanging(false)
  }

  async function buyNow(planId: string) {
    setBusy(true); setError(null); setOk(null)
    try {
      const { authorizationUrl } = await billingApi.subscribeNow(planId, cycle)
      window.location.href = authorizationUrl
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start payment')
      setBusy(false)
    }
  }

  async function pay(inv: BillingInvoice) {
    setBusy(true); setError(null)
    try {
      const { authorizationUrl } = await billingApi.checkout(inv.id)
      window.location.href = authorizationUrl
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not start payment'); setBusy(false) }
  }

  async function buy() {
    if (!packId) return
    setBusy(true); setError(null)
    try {
      const inv = await billingApi.buyCredits(packId)
      const { authorizationUrl } = await billingApi.checkout(inv.id)
      window.location.href = authorizationUrl
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not start purchase'); setBusy(false) }
  }

  function saveAddons() {
    const addOns = Object.entries(addonQty).filter(([, q]) => q > 0).map(([code, quantity]) => ({ code, quantity }))
    run(() => billingApi.setAddons(addOns), 'Add-ons updated.')
  }

  const meta = sub ? statusMeta(sub.status) : null
  const planPrice = (p: Plan) => cycle === 'annual' ? (p.annualPrice ?? p.monthlyPrice) : p.monthlyPrice

  return (
    <>
      <PageHeader title="Subscription & Billing" description="Manage your plan, usage credits, and invoices." />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      {ok && <div className="mb-4"><Alert variant="success">{ok}</Alert></div>}

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : (!sub || changing || onFree) ? (
        <>
          {onFree && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
              <div>
                <p className="text-[12.5px] font-bold text-brand-800">You&apos;re on the Free plan</p>
                <p className="text-[11.5px] text-brand-700/80">Start a 7-day free trial or buy a plan now to unlock more branches, users, employees and AI ops.</p>
              </div>
              <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white">Free</span>
            </div>
          )}
          <PlanChooser
            plans={plans}
            cycle={cycle}
            setCycle={setCycle}
            currentPlanId={sub?.planId}
            trialMode={onFree}
            onSelect={selectPlan}
            onBuyNow={onFree ? buyNow : undefined}
            busy={busy}
            heading={onFree ? 'Choose a plan' : sub ? 'Change your plan' : 'Choose a plan'}
            subtitle={onFree ? 'Try any plan free for 7 days, or buy now to activate it immediately.' : sub ? 'Upgrades/downgrades are prorated for the rest of your period.' : 'Start with a 7-day free trial. Cancel anytime.'}
            onCancel={changing && !onFree ? () => setChanging(false) : undefined}
          />
          {onFree && invoices.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-[13px] font-bold text-ink-900">Invoices</h2>
              <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                    <tr><th className="px-4 py-3">Description</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="text-[12.5px]">
                        <td className="px-4 py-3 text-ink-800">{inv.description}</td>
                        <td className="px-4 py-3 text-[11.5px] text-ink-500">{inv.createdAt?.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-ink-900">{formatMoney(inv.total, inv.currency)}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : inv.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{inv.status}</span></td>
                        <td className="px-4 py-3 text-right">{inv.status !== 'paid' && <button onClick={() => pay(inv)} disabled={busy} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50">Pay now</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
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
                  {sub.status === 'trialing' ? 'Trial ends' : sub.cancelAtPeriodEnd ? 'Ends' : 'Renews'} {(sub.status === 'trialing' ? sub.trialEndsAt : sub.currentPeriodEnd)?.slice(0, 10) ?? '—'}
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
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setChanging(true)} className="rounded-lg bg-white/20 px-3 py-2 text-[12.5px] font-bold text-white hover:bg-white/30">
                {onFree ? 'Start free trial' : 'Change plan'}
              </button>
              {!onFree && (sub.cancelAtPeriodEnd ? (
                <button disabled={busy} onClick={() => run(() => billingApi.resume(), 'Subscription resumed.')} className="rounded-lg bg-white/15 px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-white/25">Resume</button>
              ) : (
                <button disabled={busy} onClick={() => run(() => billingApi.cancel(), 'Will cancel at period end.')} className="rounded-lg bg-white/10 px-3 py-2 text-[12.5px] font-semibold text-white/90 hover:bg-white/20">Cancel plan</button>
              ))}
            </div>
          </div>

          {sub.status === 'past_due' && (
            <div className="mb-4"><Alert variant="error">Your subscription is past due. Pay the open invoice below to avoid suspension.</Alert></div>
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
                {packs.map((p) => <option key={p.id} value={p.id}>{p.quantity.toLocaleString()} {p.type === 'invoice' ? 'invoices' : 'AI ops'} — {formatMoney(p.price, 'NGN')}</option>)}
              </select>
            </label>
            <Button loading={busy} disabled={!packId} onClick={buy}>Buy credits</Button>
          </div>

          {/* Add-ons */}
          {addonCatalog.length > 0 && (
            <div className="mb-6 rounded-2xl border border-ink-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-ink-900">Add-ons</h2>
                <Button variant="secondary" loading={busy} onClick={saveAddons}>Save add-ons</Button>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {addonCatalog.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-ink-800">{a.name}</p>
                      <p className="text-[11px] text-ink-400">{formatMoney(a.monthlyPrice, 'NGN')}/mo{a.unitQty > 1 ? ` · +${a.unitQty} each` : ''}</p>
                    </div>
                    {a.type === 'feature' ? (
                      <input type="checkbox" checked={(addonQty[a.code] ?? 0) > 0} onChange={(e) => setAddonQty({ ...addonQty, [a.code]: e.target.checked ? 1 : 0 })} />
                    ) : (
                      <input type="number" min={0} value={addonQty[a.code] ?? 0} onChange={(e) => setAddonQty({ ...addonQty, [a.code]: Math.max(0, parseInt(e.target.value || '0', 10)) })} className="h-8 w-16 rounded-lg border border-ink-200 px-2 text-right text-[12px] focus:border-brand-500 focus:outline-none" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          <h2 className="mb-2 text-[13px] font-bold text-ink-900">Invoices</h2>
          {invoices.length === 0 ? (
            <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center text-[13px] text-ink-500">No invoices yet.</div>
          ) : (
            <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                  <tr><th className="px-4 py-3">Description</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="text-[12.5px]">
                      <td className="px-4 py-3 text-ink-800">{inv.description}</td>
                      <td className="px-4 py-3 text-[11.5px] text-ink-500">{inv.createdAt?.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-ink-900">{formatMoney(inv.total, inv.currency)}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : inv.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{inv.status}</span></td>
                      <td className="px-4 py-3 text-right">{inv.status !== 'paid' && <button onClick={() => pay(inv)} disabled={busy} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50">Pay now</button>}</td>
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

function PlanChooser({
  plans, cycle, setCycle, currentPlanId, trialMode, onSelect, onBuyNow, busy, heading, subtitle, onCancel,
}: {
  plans: Plan[]
  cycle: 'monthly' | 'annual'
  setCycle: (c: 'monthly' | 'annual') => void
  currentPlanId?: string
  trialMode?: boolean
  onSelect: (planId: string) => void
  onBuyNow?: (planId: string) => void
  busy: boolean
  heading: string
  subtitle: string
  onCancel?: () => void
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-ink-900">{heading}</h2>
          <p className="text-[12.5px] text-ink-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5 text-[12px] font-semibold">
            <button onClick={() => setCycle('monthly')} className={`rounded-md px-3 py-1.5 ${cycle === 'monthly' ? 'bg-brand-600 text-white' : 'text-ink-600'}`}>Monthly</button>
            <button onClick={() => setCycle('annual')} className={`rounded-md px-3 py-1.5 ${cycle === 'annual' ? 'bg-brand-600 text-white' : 'text-ink-600'}`}>Annual <span className="opacity-70">(save)</span></button>
          </div>
          {onCancel && <button onClick={onCancel} className="text-[12.5px] font-semibold text-ink-500 hover:text-ink-800">Back</button>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => {
          const price = cycle === 'annual' ? (p.annualPrice ?? p.monthlyPrice) : p.monthlyPrice
          const isCurrent = p.id === currentPlanId
          return (
            <div key={p.id} className={`flex flex-col rounded-2xl border p-5 ${isCurrent ? 'border-brand-500 ring-1 ring-brand-500' : 'border-ink-200'} bg-white`}>
              <p className="text-[15px] font-bold text-ink-900">{p.name}</p>
              <p className="mt-1 text-[24px] font-bold text-ink-900">{formatMoney(price, 'NGN')}<span className="text-[12px] font-medium text-ink-400"> /{cycle === 'annual' ? 'yr' : 'mo'}</span></p>
              {p.description && <p className="mt-1 text-[11.5px] text-ink-500 line-clamp-3">{p.description}</p>}
              <ul className="mt-3 space-y-1 text-[11.5px] text-ink-600">
                <li>{p.maxBranches ?? '∞'} branches · {p.maxUsers ?? '∞'} users</li>
                <li>{p.maxEmployees ?? '∞'} employees</li>
                <li>{p.aiOpsMonthly ?? 'Custom'} AI ops / month</li>
              </ul>
              {onBuyNow && p.code !== 'free' && !isCurrent ? (
                <div className="mt-4 space-y-2">
                  <button
                    disabled={busy}
                    onClick={() => onSelect(p.id)}
                    className="w-full rounded-lg border border-brand-600 py-2 text-[12.5px] font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
                  >
                    Start 7-day trial
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => onBuyNow(p.id)}
                    className="w-full rounded-lg bg-brand-600 py-2 text-[12.5px] font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                  >
                    Buy now — pay & activate
                  </button>
                </div>
              ) : (
                <button
                  disabled={busy || isCurrent}
                  onClick={() => onSelect(p.id)}
                  className={`mt-4 rounded-lg py-2 text-[12.5px] font-semibold ${isCurrent ? 'cursor-default bg-ink-100 text-ink-500' : 'bg-brand-600 text-white hover:bg-brand-700'} disabled:opacity-60`}
                >
                  {isCurrent ? 'Current plan' : (trialMode || !currentPlanId) && p.code !== 'free' ? 'Start 7-day trial' : p.code === 'free' ? 'Switch to Free' : 'Switch to this plan'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CreditCard({ title, w, unit }: { title: string; w?: CreditWallet; unit: string }) {
  const monthlyLeft = w ? Math.max(0, w.monthlyIncluded - w.monthlyUsed) : 0
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500">{title}</p>
      <p className="mt-1 text-[24px] font-bold text-ink-900">{w ? w.available.toLocaleString() : '—'} <span className="text-[12px] font-medium text-ink-400">{unit}</span></p>
      {w && <p className="mt-0.5 text-[11.5px] text-ink-500">{w.purchased.toLocaleString()} purchased{w.monthlyIncluded > 0 && ` · ${monthlyLeft.toLocaleString()} of ${w.monthlyIncluded.toLocaleString()} monthly left`}</p>}
    </div>
  )
}
