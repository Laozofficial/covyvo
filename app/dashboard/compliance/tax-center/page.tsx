'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { ShieldCheckIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import { TaxObligation, TaxSummary, taxCenterApi } from '../../../../src/lib/reports-api'

function thisMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const CATEGORY_META: Record<TaxObligation['category'], { label: string; chip: string }> = {
  payroll: { label: 'Payroll', chip: 'bg-violet-50 text-violet-700' },
  sales: { label: 'Sales', chip: 'bg-emerald-50 text-emerald-700' },
  purchases: { label: 'Purchases', chip: 'bg-sky-50 text-sky-700' },
}

export default function TaxCenterPage() {
  const [month, setMonth] = useState(thisMonth())
  const [data, setData] = useState<TaxSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setData(await taxCenterApi.summary({ month }))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load tax summary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  return (
    <>
      <PageHeader
        title="Tax Center"
        description="Statutory obligations for the period — file these with the relevant authorities."
      />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4 flex flex-wrap items-center gap-3">
        <label className="text-[12px] font-semibold text-ink-600">Period
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="ml-2 h-9 rounded-lg border border-ink-200 px-2 text-[12.5px]" />
        </label>
        {data && (
          <span className="ml-auto text-[12.5px] font-semibold text-ink-700">
            Total payable this period: <span className="text-brand-700">{formatMoney(data.totalPayable)}</span>
          </span>
        )}
      </div>

      {loading || !data ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {data.obligations.map((o) => (
              <div key={o.code} className="rounded-2xl border border-ink-200 bg-white p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-bold text-ink-900">{o.name}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${CATEGORY_META[o.category].chip}`}>
                    {CATEGORY_META[o.category].label}
                  </span>
                </div>
                <div className="text-[20px] font-bold text-ink-900">
                  {o.amount === null ? <span className="text-ink-400 text-[14px]">Manual</span> : formatMoney(o.amount)}
                </div>
                <div className="text-[11px] text-ink-500 mt-1">{o.basis}</div>
                <div className="text-[10.5px] text-ink-400 mt-1.5">Remit to: {o.authority}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Payroll statutory">
              <Row label="Gross payroll" value={formatMoney(data.payroll.grossPayroll)} />
              <Row label="PAYE" value={formatMoney(data.payroll.paye)} />
              <Row label="Pension — employee (8%)" value={formatMoney(data.payroll.pensionEmployee)} />
              <Row label="Pension — employer (10%)" value={formatMoney(data.payroll.pensionEmployer)} />
              <Row label="NHF (2.5%)" value={formatMoney(data.payroll.nhf)} />
              <Row label="NSITF (1%)" value={formatMoney(data.payroll.nsitf)} />
              <Row label="ITF (1%)" value={formatMoney(data.payroll.itf)} />
              <Row label="Payroll runs in period" value={String(data.payroll.runCount)} muted />
            </Panel>
            <Panel title="VAT & WHT">
              <Row label="Output VAT (on sales)" value={formatMoney(data.vat.outputVat)} />
              <Row label="Input VAT (on purchases)" value={formatMoney(data.vat.inputVat)} />
              <Row label="Net VAT payable" value={formatMoney(data.vat.netVat)} strong />
              <Row label="Invoices in period" value={String(data.vat.invoiceCount)} muted />
              <div className="my-2 border-t border-ink-100" />
              <Row label="Vendor spend (WHT base)" value={formatMoney(data.wht.vendorSpend)} />
              <p className="text-[11px] text-ink-500 mt-1">
                WHT rate depends on transaction type (typically 5–10%). Determine and remit per invoice.
              </p>
            </Panel>
          </div>

          <div className="mt-4">
            <Alert variant="info">
              These figures are computed from your payroll, invoices and purchase orders for the selected
              month. They are remittance summaries to file manually with FIRS, your State IRS, PenCom/PFA,
              FMBN, NSITF and ITF — automated e-filing (NRS/FIRS) is a later integration.
            </Alert>
          </div>
        </>
      )}
    </>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <h3 className="text-[13px] font-bold text-ink-900 mb-3 flex items-center gap-2">
        <ShieldCheckIcon size={15} className="text-brand-600" />
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className={muted ? 'text-ink-400' : 'text-ink-600'}>{label}</span>
      <span className={`font-mono ${strong ? 'font-bold text-brand-700' : muted ? 'text-ink-400' : 'font-semibold text-ink-900'}`}>{value}</span>
    </div>
  )
}
