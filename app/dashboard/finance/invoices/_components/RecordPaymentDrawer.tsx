'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import { CalendarIcon, CoinIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { formatMoney } from '../../../../../src/lib/finance-api'
import {
  Invoice,
  PaymentMethod,
  invoicesApi,
  paymentMethodLabel,
} from '../../../../../src/lib/invoices-api'

type Props = {
  open: boolean
  onClose: () => void
  invoice: Invoice | null
  onRecorded: (i: Invoice) => void
}

export function RecordPaymentDrawer({ open, onClose, invoice, onRecorded }: Props) {
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const outstanding = useMemo(() => {
    if (!invoice) return 0
    return Math.max(0, +(Number(invoice.total) - Number(invoice.paidAmount)).toFixed(2))
  }, [invoice])

  useEffect(() => {
    if (!open || !invoice) return
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setAmount(outstanding.toString())
    setMethod('bank_transfer')
    setReference('')
    setNotes('')
    setError(null)
  }, [open, invoice, outstanding])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!invoice) return
    setBusy(true); setError(null)
    try {
      const saved = await invoicesApi.recordPayment(invoice.id, {
        paymentDate,
        amount: Number(amount),
        method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      onRecorded(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not record payment')
    } finally {
      setBusy(false)
    }
  }

  const numericAmount = Number(amount) || 0
  const canSubmit = invoice && numericAmount > 0 && numericAmount <= outstanding + 0.001

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={invoice ? `Record payment · ${invoice.reference}` : 'Record payment'}
      description={
        invoice
          ? `Outstanding: ${formatMoney(outstanding, invoice.currency)} of ${formatMoney(invoice.total, invoice.currency)}`
          : ''
      }
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900"
          >
            Cancel
          </button>
          <Button type="submit" form="payment-form" loading={busy} disabled={!canSubmit}>
            Record payment
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <form id="payment-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Payment date *"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            icon={<CalendarIcon />}
          />
          <TextField
            label="Amount *"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            icon={<CoinIcon />}
            hint={
              invoice
                ? `up to ${formatMoney(outstanding, invoice.currency)}`
                : undefined
            }
          />
        </div>
        <SelectField
          label="Method"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          options={(['cash', 'bank_transfer', 'card', 'cheque', 'wallet', 'other'] as PaymentMethod[]).map((m) => ({
            value: m,
            label: paymentMethodLabel(m),
          }))}
        />
        <TextField
          label="Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          icon={<TagIcon />}
          hint="e.g. bank txn id, cheque number"
        />
        <TextField
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          icon={<TagIcon />}
          hint="e.g. Received via Access Bank NIP"
        />
      </form>
    </Drawer>
  )
}
