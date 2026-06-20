'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import { BookIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { Account, AccountType, accountsApi } from '../../../../../src/lib/finance-api'

type Props = {
  open: boolean
  onClose: () => void
  initial?: Account | null
  parents: Account[]
  onSaved: (a: Account) => void
}

const TYPES: { value: AccountType; label: string }[] = [
  { value: 'asset',     label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity',    label: 'Equity' },
  { value: 'revenue',   label: 'Revenue' },
  { value: 'expense',   label: 'Expense' },
]

export function AccountFormDrawer({ open, onClose, initial, parents, onSaved }: Props) {
  const editing = !!initial
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('asset')
  const [parentId, setParentId] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCode(initial?.code ?? '')
    setName(initial?.name ?? '')
    setAccountType(initial?.accountType ?? 'asset')
    setParentId(initial?.parentId ?? '')
    setCurrency(initial?.currency ?? 'NGN')
    setDescription(initial?.description ?? '')
    setError(null)
  }, [open, initial])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const body = {
        code: code.trim(),
        name: name.trim(),
        accountType,
        parentId: parentId || null,
        currency: currency.trim().toUpperCase() || undefined,
        description: description.trim() || undefined,
      }
      const saved = editing
        ? await accountsApi.update(initial!.id, body)
        : await accountsApi.create(body)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save account')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? 'Edit account' : 'New account'}
      description="A GL account that journals can post to."
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900">Cancel</button>
          <Button type="submit" form="account-form" loading={busy} disabled={!code.trim() || !name.trim()}>
            {editing ? 'Save changes' : 'Create account'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="account-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value)} icon={<TagIcon />} hint="e.g. 1110" />
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} icon={<BookIcon />} hint="e.g. Cash at Bank" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField
            label="Type"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as AccountType)}
            options={TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
          <SelectField
            label="Parent (optional)"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            options={[
              { value: '', label: '— none —' },
              ...parents.filter((p) => p.id !== initial?.id).map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` })),
            ]}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} icon={<TagIcon />} hint="e.g. NGN" />
          <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} icon={<TagIcon />} hint="e.g. Main operating cash account" />
        </div>
      </form>
    </Drawer>
  )
}
