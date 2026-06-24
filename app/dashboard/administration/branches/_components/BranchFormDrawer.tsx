'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Checkbox } from '../../../../../src/components/ui/Checkbox'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { TextField } from '../../../../../src/components/ui/TextField'
import { BranchIcon, BuildingIcon, IdIcon, MapPinIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { Branch, branchesApi } from '../../../../../src/lib/hr-api'

type Props = {
  open: boolean
  onClose: () => void
  initial?: Branch | null
  onSaved: (b: Branch) => void
}

export function BranchFormDrawer({ open, onClose, initial, onSaved }: Props) {
  const editing = !!initial
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('Nigeria')
  const [phone, setPhone] = useState('')
  const [isHeadOffice, setIsHeadOffice] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setCode(initial?.code ?? '')
    setAddress(initial?.address ?? '')
    setCity(initial?.city ?? '')
    setState(initial?.state ?? '')
    setCountry(initial?.country ?? 'Nigeria')
    setPhone(initial?.phone ?? '')
    setIsHeadOffice(initial?.isHeadOffice ?? false)
    setIsActive(initial?.isActive ?? true)
    setError(null)
  }, [open, initial])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const body = {
        name: name.trim(),
        code: code.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        country: country.trim() || undefined,
        phone: phone.trim() || undefined,
        isHeadOffice,
      }
      const saved = editing
        ? await branchesApi.update(initial!.id, { ...body, isActive })
        : await branchesApi.create(body)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save branch')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${initial!.code}` : 'New branch'}
      description="A physical location — head office, regional branch or overseas office."
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900">Cancel</button>
          <Button type="submit" form="branch-form" loading={busy} disabled={!name.trim()}>
            {editing ? 'Save changes' : 'Create branch'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="branch-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Name *" value={name} onChange={(e) => setName(e.target.value)} icon={<BranchIcon />} hint="e.g. Lagos HQ" />
          <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} icon={<TagIcon />} hint="e.g. LOS-HQ" disabled={editing} />
        </div>
        <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} icon={<MapPinIcon />} hint="e.g. 12 Adeola Odeku Street, Victoria Island" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} icon={<BuildingIcon />} hint="e.g. Lagos" />
          <TextField label="State" value={state} onChange={(e) => setState(e.target.value)} icon={<BuildingIcon />} hint="e.g. Lagos" />
          <TextField label="Country" value={country} onChange={(e) => setCountry(e.target.value)} icon={<MapPinIcon />} hint="e.g. Nigeria" />
        </div>
        <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<IdIcon />} hint="e.g. +234 801 234 5678" />
        <div className="space-y-2 pt-1">
          <Checkbox label="This is the head office" checked={isHeadOffice} onChange={(e) => setIsHeadOffice(e.target.checked)} />
          {editing && (
            <Checkbox label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          )}
        </div>
      </form>
    </Drawer>
  )
}
