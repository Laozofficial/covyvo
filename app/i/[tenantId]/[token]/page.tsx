'use client'

import { use, useEffect, useState } from 'react'
import { ApiError } from '../../../../src/lib/api'
import {
  PublicInvoice,
  invoiceStatusMeta,
  publicInvoicesApi,
} from '../../../../src/lib/invoices-api'

function money(v: string | number, currency = 'NGN') {
  const n = Number(v)
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
  } catch {
    return `${currency} ${n.toFixed(2)}`
  }
}

export default function PublicInvoicePage({
  params,
}: {
  params: Promise<{ tenantId: string; token: string }>
}) {
  const { tenantId, token } = use(params)
  const [inv, setInv] = useState<PublicInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [paidBanner, setPaidBanner] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await publicInvoicesApi.get(tenantId, token)
      setInv(data)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invoice not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('paid') === '1') {
      setPaidBanner(true)
      window.history.replaceState(null, '', window.location.pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function pay() {
    setPaying(true)
    setError(null)
    try {
      const { authorizationUrl } = await publicInvoicesApi.pay(tenantId, token)
      window.location.href = authorizationUrl
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start payment')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    )
  }

  if (error || !inv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-bold text-ink-900">Invoice unavailable</h1>
          <p className="mt-2 text-[13px] text-ink-600">{error ?? 'This invoice link is invalid or has expired.'}</p>
        </div>
      </div>
    )
  }

  const meta = invoiceStatusMeta(inv.status)
  const outstanding = Number(inv.outstanding)

  return (
    <div className="min-h-screen bg-ink-50 py-6 sm:py-10 px-4 print:bg-white print:py-0">
      <div className="mx-auto max-w-2xl">
        {/* action bar — hidden on print */}
        <div className="mb-4 flex items-center justify-between print:hidden">
          <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-md ${meta.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="h-9 px-3 rounded-lg border border-ink-200 bg-white text-[12.5px] font-semibold text-ink-700 hover:bg-ink-50"
            >
              Download PDF
            </button>
            {inv.payable && (
              <button
                onClick={pay}
                disabled={paying}
                className="h-9 px-4 rounded-lg bg-brand-600 text-white text-[12.5px] font-semibold hover:bg-brand-700 disabled:opacity-60"
              >
                {paying ? 'Starting…' : `Pay ${money(outstanding, inv.currency)}`}
              </button>
            )}
          </div>
        </div>

        {paidBanner && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-800 print:hidden">
            Payment received — thank you! It may take a moment to reflect below.
          </div>
        )}

        {/* the invoice sheet */}
        <div className="rounded-2xl border border-ink-200 bg-white p-6 sm:p-8 print:border-0 print:p-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-ink-900">{inv.seller.name}</h1>
              {inv.seller.address && <p className="mt-1 text-[12px] text-ink-500 whitespace-pre-line">{inv.seller.address}</p>}
              {inv.seller.taxId && <p className="mt-0.5 text-[12px] text-ink-500">TIN: {inv.seller.taxId}</p>}
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Invoice</div>
              <div className="font-mono text-[15px] font-bold text-ink-900">{inv.reference}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-[12.5px]">
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-400">Bill to</div>
              <div className="mt-1 font-semibold text-ink-900">{inv.customer.name ?? '—'}</div>
              {inv.customer.email && <div className="text-ink-500">{inv.customer.email}</div>}
            </div>
            <div className="text-right">
              <div><span className="text-ink-400">Issued</span> <span className="font-semibold text-ink-800 ml-1">{inv.issueDate}</span></div>
              <div className="mt-0.5"><span className="text-ink-400">Due</span> <span className="font-semibold text-ink-800 ml-1">{inv.dueDate}</span></div>
            </div>
          </div>

          <table className="mt-6 w-full text-left">
            <thead>
              <tr className="border-b border-ink-200 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-[12.5px]">
              {inv.lines.map((l, i) => (
                <tr key={i}>
                  <td className="py-2.5 text-ink-800">{l.description}</td>
                  <td className="py-2.5 text-right font-mono text-ink-600">{Number(l.quantity)}</td>
                  <td className="py-2.5 text-right font-mono text-ink-600">{money(l.unitPrice, inv.currency)}</td>
                  <td className="py-2.5 text-right font-mono font-semibold text-ink-900">{money(l.lineTotal, inv.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-[240px] text-[12.5px]">
              <div className="flex justify-between py-1"><span className="text-ink-500">Subtotal</span><span className="font-mono text-ink-800">{money(inv.subtotal, inv.currency)}</span></div>
              <div className="flex justify-between py-1"><span className="text-ink-500">Tax</span><span className="font-mono text-ink-800">{money(inv.taxTotal, inv.currency)}</span></div>
              <div className="flex justify-between py-2 border-t border-ink-200 mt-1"><span className="font-bold text-ink-900">Total</span><span className="font-mono font-bold text-ink-900">{money(inv.total, inv.currency)}</span></div>
              {Number(inv.paidAmount) > 0 && (
                <div className="flex justify-between py-1"><span className="text-emerald-600">Paid</span><span className="font-mono text-emerald-600">−{money(inv.paidAmount, inv.currency)}</span></div>
              )}
              <div className="flex justify-between py-2 border-t border-ink-200 mt-1"><span className="font-bold text-ink-900">Amount due</span><span className="font-mono font-bold text-brand-700">{money(outstanding, inv.currency)}</span></div>
            </div>
          </div>

          {inv.notes && (
            <div className="mt-6 border-t border-ink-100 pt-4">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-400">Notes</div>
              <p className="mt-1 text-[12.5px] text-ink-600 whitespace-pre-line">{inv.notes}</p>
            </div>
          )}
        </div>

        {inv.payable && (
          <div className="mt-4 flex justify-center print:hidden">
            <button
              onClick={pay}
              disabled={paying}
              className="h-11 px-6 rounded-xl bg-brand-600 text-white text-[13.5px] font-bold hover:bg-brand-700 disabled:opacity-60"
            >
              {paying ? 'Starting payment…' : `Pay ${money(outstanding, inv.currency)} securely`}
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-ink-400 print:hidden">Secured by Covyvo · TwelveAI payments</p>
      </div>
    </div>
  )
}
