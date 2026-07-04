'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { TextField } from '../../../../../src/components/ui/TextField'
import { BuildingIcon, IdIcon, MailIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { Customer, customersApi } from '../../../../../src/lib/business-api'

type Props = {
  open: boolean
  onClose: () => void
  /** Called with the freshly-created customer so the parent can preselect it. */
  onCreated: (c: Customer) => void
}

/**
 * Minimal quick-add drawer for creating a customer from inside another
 * flow (invoice, quote, etc). The rest of the customer profile can be
 * filled in later on the Customers page.
 */
export function QuickAddCustomerDrawer({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [taxId, setTaxId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setEmail('')
    setPhone('')
    setTaxId('')
    setError(null)
  }, [open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await customersApi.create({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        taxId: taxId.trim() || undefined,
      })
      onCreated(created)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create customer')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Quick-add customer"
      description="Just the essentials — the rest can be filled in later."
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900"
          >
            Cancel
          </button>
          <Button type="submit" form="quick-customer-form" loading={busy} disabled={!name.trim()}>
            Create + use
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <form id="quick-customer-form" onSubmit={handleSubmit} className="space-y-3">
        <TextField
          label="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<BuildingIcon />}
          hint="e.g. Acme Industries Ltd"
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<MailIcon />}
          hint="e.g. accounts@acme.ng"
        />
        <TextField
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          icon={<IdIcon />}
          hint="e.g. +234 801 234 5678"
        />
        <TextField
          label="Tax ID (TIN)"
          value={taxId}
          onChange={(e) => setTaxId(e.target.value)}
          icon={<TagIcon />}
          hint="e.g. 12345678-0001"
        />
      </form>
    </Drawer>
  )
}
