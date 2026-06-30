'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Checkbox } from '../../../../../src/components/ui/Checkbox'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import { IdIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import {
  Designation,
  DesignationLevel,
  designationsApi,
} from '../../../../../src/lib/business-api'

type Props = {
  open: boolean
  onClose: () => void
  initial?: Designation | null
  onSaved: (d: Designation) => void
}

export function DesignationFormDrawer({ open, onClose, initial, onSaved }: Props) {
  const editing = !!initial
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [level, setLevel] = useState<DesignationLevel | ''>('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setCode(initial?.code ?? '')
    setLevel(initial?.level ?? '')
    setDescription(initial?.description ?? '')
    setIsActive(initial?.isActive ?? true)
    setError(null)
  }, [open, initial])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const body: Partial<Designation> = {
        name: name.trim(),
        code: code.trim() || undefined,
        level: (level || null) as DesignationLevel | null,
        description: description.trim() || null,
      }
      const saved = editing
        ? await designationsApi.update(initial!.id, { ...body, isActive })
        : await designationsApi.create(body)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save designation')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${initial!.code}` : 'New designation'}
      description="A job title employees can be assigned to."
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900">Cancel</button>
          <Button type="submit" form="dsg-form" loading={busy} disabled={!name.trim()}>
            {editing ? 'Save changes' : 'Create designation'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="dsg-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Name *" value={name} onChange={(e) => setName(e.target.value)} icon={<IdIcon />} hint="e.g. Senior Engineer" />
          <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} icon={<TagIcon />} hint="auto-slugified if blank" disabled={editing} />
        </div>
        <SelectField
          label="Level"
          value={level}
          onChange={(e) => setLevel(e.target.value as DesignationLevel | '')}
          options={[
            { value: '', label: '— not set —' },
            { value: 'intern', label: 'Intern' },
            { value: 'junior', label: 'Junior' },
            { value: 'mid', label: 'Mid-level' },
            { value: 'senior', label: 'Senior' },
            { value: 'lead', label: 'Lead' },
            { value: 'manager', label: 'Manager' },
            { value: 'director', label: 'Director' },
            { value: 'executive', label: 'Executive' },
          ]}
        />
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} icon={<TagIcon />} hint="e.g. Owns backend platform and APIs" />
        {editing && (
          <div className="pt-1">
            <Checkbox label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          </div>
        )}
      </form>
    </Drawer>
  )
}
