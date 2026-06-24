'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Checkbox } from '../../../../../src/components/ui/Checkbox'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import { BranchIcon, BuildingIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { Branch, Department, departmentsApi } from '../../../../../src/lib/hr-api'

type Props = {
  open: boolean
  onClose: () => void
  initial?: Department | null
  branches: Branch[]
  /** Pre-fill the branch dropdown when creating from a branch context. */
  defaultBranchId?: string
  /** Hide the branch dropdown — used on a branch detail page where it's pinned. */
  lockBranch?: boolean
  onSaved: (d: Department) => void
}

export function DepartmentFormDrawer({
  open,
  onClose,
  initial,
  branches,
  defaultBranchId,
  lockBranch,
  onSaved,
}: Props) {
  const editing = !!initial
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [branchId, setBranchId] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setCode(initial?.code ?? '')
    setDescription(initial?.description ?? '')
    setBranchId(initial?.branchId ?? defaultBranchId ?? '')
    setIsActive(initial?.isActive ?? true)
    setError(null)
  }, [open, initial, defaultBranchId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const body = {
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        branchId: branchId || null,
      }
      const saved = editing
        ? await departmentsApi.update(initial!.id, { ...body, isActive })
        : await departmentsApi.create(body)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save department')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${initial!.code}` : 'New department'}
      description="A team or org unit inside your business."
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900">Cancel</button>
          <Button type="submit" form="dept-form" loading={busy} disabled={!name.trim()}>
            {editing ? 'Save changes' : 'Create department'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="dept-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Name *" value={name} onChange={(e) => setName(e.target.value)} icon={<BuildingIcon />} hint="e.g. Engineering" />
          <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} icon={<TagIcon />} hint="e.g. ENG (auto-generated if blank)" disabled={editing} />
        </div>
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} icon={<TagIcon />} hint="e.g. Product engineering team" />
        {!lockBranch && (
          <SelectField
            label="Branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            icon={<BranchIcon />}
            options={[
              { value: '', label: '— none (standalone) —' },
              ...branches.map((b) => ({ value: b.id, label: `${b.code} · ${b.name}` })),
            ]}
          />
        )}
        {editing && (
          <div className="pt-1">
            <Checkbox label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          </div>
        )}
      </form>
    </Drawer>
  )
}
