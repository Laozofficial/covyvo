'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Checkbox } from '../../../../../src/components/ui/Checkbox'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import { CoinIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import {
  CalculationType,
  ComponentKind,
  SalaryStructure,
  salaryStructuresApi,
} from '../../../../../src/lib/payroll-api'

type Props = {
  open: boolean
  onClose: () => void
  initial?: SalaryStructure | null
  onSaved: (s: SalaryStructure) => void
}

type DraftComponent = {
  code: string
  name: string
  kind: ComponentKind
  calculationType: CalculationType
  amount: string
  rate: string
  isTaxable: boolean
}

const emptyComp = (): DraftComponent => ({
  code: '',
  name: '',
  kind: 'earning',
  calculationType: 'fixed',
  amount: '',
  rate: '',
  isTaxable: true,
})

export function StructureFormDrawer({ open, onClose, initial, onSaved }: Props) {
  const editing = !!initial
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [isDefault, setIsDefault] = useState(false)
  const [comps, setComps] = useState<DraftComponent[]>([emptyComp()])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCode(initial?.code ?? '')
    setName(initial?.name ?? '')
    setDescription(initial?.description ?? '')
    setCurrency(initial?.currency ?? 'NGN')
    setIsDefault(initial?.isDefault ?? false)
    setComps(initial?.components.length
      ? initial.components.map((c) => ({
          code: c.code, name: c.name,
          kind: c.kind, calculationType: c.calculationType,
          amount: c.amount ? String(Number(c.amount)) : '',
          rate: c.rate ? String(Number(c.rate)) : '',
          isTaxable: c.isTaxable,
        }))
      : [emptyComp()])
    setError(null)
  }, [open, initial])

  function updateComp(i: number, patch: Partial<DraftComponent>) {
    setComps((prev) => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        currency: currency.trim().toUpperCase(),
        isDefault,
        components: comps.filter((c) => c.code.trim() && c.name.trim()).map((c) => ({
          code: c.code.trim().toUpperCase(),
          name: c.name.trim(),
          kind: c.kind,
          calculationType: c.calculationType,
          amount: c.amount ? Number(c.amount) : undefined,
          rate: c.rate ? Number(c.rate) : undefined,
          isTaxable: c.isTaxable,
        })),
      }
      const saved = editing
        ? await salaryStructuresApi.update(initial!.id, payload)
        : await salaryStructuresApi.create(payload)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save structure')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      defaultSize="expanded"
      title={editing ? `Edit ${initial!.code}` : 'New salary structure'}
      description="Template of earnings and deductions used by payroll."
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900">Cancel</button>
          <Button type="submit" form="structure-form" loading={busy} disabled={!code.trim() || !name.trim() || comps.every((c) => !c.code.trim())}>
            {editing ? 'Save changes' : 'Create structure'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="structure-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} icon={<TagIcon />} disabled={editing} hint="e.g. STD-NG" />
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} icon={<CoinIcon />} hint="e.g. Standard Nigeria" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} icon={<TagIcon />} hint="e.g. Default payroll template (basic + allowances + statutory)" />
          <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} icon={<TagIcon />} hint="e.g. NGN" />
        </div>
        <Checkbox label="Default structure for this tenant" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />

        <div className="rounded-xl border border-ink-200 overflow-hidden">
          <div className="px-3 py-2 bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">Components</div>
          <div className="divide-y divide-ink-100">
            {comps.map((c, i) => (
              <div key={i} className="p-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <TextField label="Code" value={c.code} onChange={(e) => updateComp(i, { code: e.target.value.toUpperCase() })} icon={<TagIcon />} hint="e.g. BASIC" />
                  <TextField label="Name" value={c.name} onChange={(e) => updateComp(i, { name: e.target.value })} icon={<TagIcon />} hint="e.g. Basic Salary" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <SelectField
                    label="Kind"
                    value={c.kind}
                    onChange={(e) => updateComp(i, { kind: e.target.value as ComponentKind })}
                    options={[
                      { value: 'earning', label: 'Earning' },
                      { value: 'deduction', label: 'Deduction' },
                    ]}
                  />
                  <SelectField
                    label="Method"
                    value={c.calculationType}
                    onChange={(e) => updateComp(i, { calculationType: e.target.value as CalculationType })}
                    options={[
                      { value: 'fixed', label: 'Fixed' },
                      { value: 'percent_of_basic', label: '% of basic' },
                      { value: 'percent_of_gross', label: '% of gross' },
                      { value: 'formula', label: 'Formula' },
                    ]}
                  />
                  <TextField label="Amount" value={c.amount} onChange={(e) => updateComp(i, { amount: e.target.value })} disabled={c.calculationType !== 'fixed'} hint="e.g. 50000" />
                  <TextField label="Rate" value={c.rate} onChange={(e) => updateComp(i, { rate: e.target.value })} disabled={c.calculationType === 'fixed' || c.calculationType === 'formula'} hint="e.g. 0.08 (= 8%)" />
                </div>
                <div className="flex items-center justify-between">
                  <Checkbox label="Taxable" checked={c.isTaxable} onChange={(e) => updateComp(i, { isTaxable: e.target.checked })} />
                  {comps.length > 1 && (
                    <button type="button" onClick={() => setComps((prev) => prev.filter((_, idx) => idx !== i))} className="text-[11.5px] font-semibold text-rose-600 hover:text-rose-700">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-ink-100 bg-ink-50/40">
            <button type="button" onClick={() => setComps((prev) => [...prev, emptyComp()])} className="text-[12px] font-semibold text-brand-600 hover:text-brand-700">
              + Add component
            </button>
          </div>
        </div>
      </form>
    </Drawer>
  )
}
