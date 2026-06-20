'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import { BanknoteIcon, CalendarIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { BankFile, BankFileFormat, bankFilesApi } from '../../../../../src/lib/payroll-api'

type Props = {
  open: boolean
  onClose: () => void
  initial?: BankFile | null
  onSaved: (b: BankFile) => void
}

export function BankFileFormDrawer({ open, onClose, initial, onSaved }: Props) {
  const editing = !!initial
  const [name, setName] = useState('')
  const [format, setFormat] = useState<BankFileFormat>('nibss_nip')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [employeeCount, setEmployeeCount] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [sourceAccount, setSourceAccount] = useState('')
  const [sourceBank, setSourceBank] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setFormat(initial?.format ?? 'nibss_nip')
    setPeriodStart(initial?.periodStart ?? '')
    setPeriodEnd(initial?.periodEnd ?? '')
    setPaymentDate(initial?.paymentDate ?? '')
    setCurrency(initial?.currency ?? 'NGN')
    setEmployeeCount(initial ? String(initial.employeeCount) : '')
    setTotalAmount(initial ? String(Number(initial.totalAmount)) : '')
    setSourceAccount(initial?.sourceAccount ?? '')
    setSourceBank(initial?.sourceBank ?? '')
    setError(null)
  }, [open, initial])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const body = {
        name: name.trim(),
        format,
        periodStart,
        periodEnd,
        paymentDate: paymentDate || undefined,
        currency: currency.toUpperCase(),
        employeeCount: employeeCount ? Number(employeeCount) : 0,
        totalAmount: totalAmount ? Number(totalAmount) : 0,
        sourceAccount: sourceAccount.trim() || undefined,
        sourceBank: sourceBank.trim() || undefined,
      }
      const saved = editing
        ? await bankFilesApi.update(initial!.id, { name: body.name, paymentDate: body.paymentDate ?? null })
        : await bankFilesApi.create(body)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save bank file')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${initial!.reference}` : 'New bank file'}
      description="Salary disbursement batch metadata."
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900">Cancel</button>
          <Button type="submit" form="bf-form" loading={busy} disabled={!name.trim() || !periodStart || !periodEnd}>
            {editing ? 'Save changes' : 'Create file'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="bf-form" onSubmit={handleSubmit} className="space-y-3">
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} icon={<BanknoteIcon />} hint="e.g. Salaries — June 2026" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField
            label="Format"
            value={format}
            onChange={(e) => setFormat(e.target.value as BankFileFormat)}
            disabled={editing}
            options={[
              { value: 'nibss_nip', label: 'NIBSS NIP' },
              { value: 'gtb_csv', label: 'GTBank CSV' },
              { value: 'zenith_csv', label: 'Zenith CSV' },
              { value: 'uba_csv', label: 'UBA CSV' },
              { value: 'generic_csv', label: 'Generic CSV' },
            ]}
          />
          <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} icon={<TagIcon />} hint="e.g. NGN" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TextField label="Period start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} icon={<CalendarIcon />} disabled={editing} />
          <TextField label="Period end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} icon={<CalendarIcon />} disabled={editing} />
          <TextField label="Payment date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} icon={<CalendarIcon />} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="# employees" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} icon={<TagIcon />} disabled={editing} hint="e.g. 25" />
          <TextField label="Total amount" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} icon={<BanknoteIcon />} disabled={editing} hint="e.g. 12500000.00" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Source account" value={sourceAccount} onChange={(e) => setSourceAccount(e.target.value)} icon={<TagIcon />} disabled={editing} hint="e.g. 0123456789" />
          <TextField label="Source bank" value={sourceBank} onChange={(e) => setSourceBank(e.target.value)} icon={<BanknoteIcon />} disabled={editing} hint="e.g. GTBank" />
        </div>
        <p className="text-[11px] text-ink-500">Real file content will be generated by the payroll engine in a future iteration.</p>
      </form>
    </Drawer>
  )
}
