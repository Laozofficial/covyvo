'use client'

import { useEffect, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { BookIcon, ChevronDownIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { formatMoney } from '../../../../src/lib/finance-api'
import { GeneralLedger, GlAccount, reportsApi } from '../../../../src/lib/reports-api'

export default function GeneralLedgerPage() {
  const [data, setData] = useState<GeneralLedger | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>({})

  useEffect(() => {
    reportsApi
      .generalLedger()
      .then((d) => {
        setData(d)
        // Open the first account by default.
        if (d.accounts[0]) setOpen({ [d.accounts[0].accountId]: true })
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load ledger'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHeader title="General Ledger" description="Every posted journal line, by account, with running balances." />

      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : !data || data.accounts.length === 0 ? (
        <EmptyState icon={<BookIcon />} title="No posted activity" description="Journal entries appear here once they're posted." />
      ) : (
        <div className="space-y-3">
          {data.accounts.map((acc) => (
            <AccountBlock
              key={acc.accountId}
              acc={acc}
              open={!!open[acc.accountId]}
              onToggle={() => setOpen((o) => ({ ...o, [acc.accountId]: !o[acc.accountId] }))}
            />
          ))}
        </div>
      )}
    </>
  )
}

function AccountBlock({ acc, open, onToggle }: { acc: GlAccount; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ink-50/50">
        <span className="font-mono text-[12px] text-ink-500">{acc.code}</span>
        <span className="font-bold text-ink-900 text-[13px]">{acc.name}</span>
        <span className="text-[11px] capitalize text-ink-400">{acc.accountType}</span>
        <span className="ml-auto font-mono font-semibold text-[12.5px]">{formatMoney(acc.closingBalance)}</span>
        <span className={`text-ink-400 transition-transform ${open ? '' : '-rotate-90'}`}><ChevronDownIcon size={14} /></span>
      </button>
      {open && (
        <div className="border-t border-ink-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Reference</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 text-right">Debit</th>
                <th className="px-4 py-2 text-right">Credit</th>
                <th className="px-4 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              <tr className="text-[12px] text-ink-500">
                <td className="px-4 py-2" colSpan={5}>Opening balance</td>
                <td className="px-4 py-2 text-right font-mono">{formatMoney(acc.openingBalance)}</td>
              </tr>
              {acc.lines.map((l, i) => (
                <tr key={i} className="text-[12px]">
                  <td className="px-4 py-2 text-ink-600 whitespace-nowrap">{l.date}</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-ink-600">{l.reference}</td>
                  <td className="px-4 py-2 text-ink-700">{l.description ?? '—'}</td>
                  <td className="px-4 py-2 text-right font-mono">{Number(l.debit) ? formatMoney(l.debit) : ''}</td>
                  <td className="px-4 py-2 text-right font-mono">{Number(l.credit) ? formatMoney(l.credit) : ''}</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold">{formatMoney(l.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
