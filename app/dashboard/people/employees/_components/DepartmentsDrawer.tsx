'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { TextField } from '../../../../../src/components/ui/TextField'
import {
  BuildingIcon,
  TagIcon,
} from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { Department, departmentsApi } from '../../../../../src/lib/hr-api'

type Props = {
  open: boolean
  onClose: () => void
  departments: Department[]
  onChanged: () => void
}

export function DepartmentsDrawer({ open, onClose, departments, onChanged }: Props) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setCode('')
    setDescription('')
    setError(null)
  }, [open])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      await departmentsApi.create({
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
      })
      setName('')
      setCode('')
      setDescription('')
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add department')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(d: Department) {
    if (!confirm(`Remove "${d.name}"? It will be hidden from employee forms.`)) return
    setRemovingId(d.id)
    setError(null)
    try {
      await departmentsApi.remove(d.id)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove department')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Departments"
      description="Manage the departments that employees can be assigned to."
      footer={
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900"
          >
            Done
          </button>
        </div>
      }
    >
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="space-y-3 mb-5 rounded-xl border border-ink-200 bg-ink-50/40 p-3"
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
          Add a department
        </p>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<BuildingIcon />}
          hint="e.g. Engineering"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Code (optional)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            icon={<TagIcon />}
            hint="Auto-generated from name if blank"
          />
          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            icon={<TagIcon />}
            hint="e.g. Product engineering team"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={busy} disabled={!name.trim()}>
            Add
          </Button>
        </div>
      </form>

      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-2">
        Existing departments
      </p>
      {departments.length === 0 ? (
        <p className="text-[12px] text-ink-500">
          No departments yet — add your first one above.
        </p>
      ) : (
        <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200 bg-white">
          {departments.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 px-3.5 py-2.5"
            >
              <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                {d.code.slice(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-ink-900 truncate">
                  {d.name}
                </p>
                <p className="text-[10.5px] text-ink-500 font-mono truncate">
                  {d.code}
                  {d.description ? ` • ${d.description}` : ''}
                </p>
              </div>
              <button
                onClick={() => handleRemove(d)}
                disabled={removingId === d.id}
                className="text-[11.5px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {removingId === d.id ? 'Removing…' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}
