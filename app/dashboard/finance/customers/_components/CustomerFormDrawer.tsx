'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Checkbox } from '../../../../../src/components/ui/Checkbox'
import { CountryStateCityFields } from '../../../../../src/components/ui/CountryStateCityFields'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import {
  BuildingIcon,
  CoinIcon,
  IdIcon,
  MailIcon,
  MapPinIcon,
  TagIcon,
  UserIcon,
} from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { Customer, CustomerTaxStatus, customersApi } from '../../../../../src/lib/business-api'

type Props = {
  open: boolean
  onClose: () => void
  initial?: Customer | null
  onSaved: (c: Customer) => void
}

export function CustomerFormDrawer({ open, onClose, initial, onSaved }: Props) {
  const editing = !!initial
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [country, setCountry] = useState('Nigeria')
  const [stateRegion, setStateRegion] = useState('')
  const [city, setCity] = useState('')
  const [taxId, setTaxId] = useState('')
  const [taxStatus, setTaxStatus] = useState<CustomerTaxStatus | ''>('')
  const [paymentTermsDays, setPaymentTermsDays] = useState('')
  const [creditLimit, setCreditLimit] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setCode(initial?.code ?? '')
    setContactName(initial?.contactName ?? '')
    setEmail(initial?.email ?? '')
    setPhone(initial?.phone ?? '')
    setAddress(initial?.address ?? '')
    setCountry(initial?.country ?? 'Nigeria')
    setStateRegion(initial?.state ?? '')
    setCity(initial?.city ?? '')
    setTaxId(initial?.taxId ?? '')
    setTaxStatus(initial?.taxStatus ?? '')
    setPaymentTermsDays(initial?.paymentTermsDays != null ? String(initial.paymentTermsDays) : '')
    setCreditLimit(initial?.creditLimit ? String(Number(initial.creditLimit)) : '')
    setCurrency(initial?.currency ?? 'NGN')
    setNotes(initial?.notes ?? '')
    setIsActive(initial?.isActive ?? true)
    setError(null)
  }, [open, initial])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const body: Partial<Customer> = {
        name: name.trim(),
        code: code.trim() || undefined,
        contactName: contactName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        country: country.trim() || null,
        state: stateRegion.trim() || null,
        city: city.trim() || null,
        taxId: taxId.trim() || null,
        taxStatus: (taxStatus || null) as CustomerTaxStatus | null,
        paymentTermsDays: paymentTermsDays === '' ? null : Number(paymentTermsDays),
        creditLimit: creditLimit === '' ? null : Number(creditLimit) as unknown as string,
        currency: currency.toUpperCase(),
        notes: notes.trim() || null,
      }
      const saved = editing
        ? await customersApi.update(initial!.id, { ...body, isActive })
        : await customersApi.create(body)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save customer')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      defaultSize="expanded"
      title={editing ? `Edit ${initial!.code}` : 'New customer'}
      description="A counterparty you sell to. Feeds future quotations, invoices and AR."
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900">Cancel</button>
          <Button type="submit" form="customer-form" loading={busy} disabled={!name.trim()}>
            {editing ? 'Save changes' : 'Create customer'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="customer-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Name *" value={name} onChange={(e) => setName(e.target.value)} icon={<BuildingIcon />} hint="e.g. Acme Industries Ltd" />
          <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} icon={<TagIcon />} hint="auto-generated if blank" disabled={editing} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Primary contact" value={contactName} onChange={(e) => setContactName(e.target.value)} icon={<UserIcon />} hint="e.g. Jane Okafor" />
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<MailIcon />} hint="e.g. accounts@acme.ng" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<IdIcon />} hint="e.g. +234 801 234 5678" />
          <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} icon={<CoinIcon />} hint="e.g. NGN" />
        </div>
        <TextField label="Street address" value={address} onChange={(e) => setAddress(e.target.value)} icon={<MapPinIcon />} hint="e.g. 12 Adeola Odeku Street, Victoria Island" />
        <CountryStateCityFields
          country={country}
          state={stateRegion}
          city={city}
          onChange={({ country: c, state: s, city: ci }) => {
            setCountry(c); setStateRegion(s); setCity(ci)
          }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TextField label="Tax ID (TIN)" value={taxId} onChange={(e) => setTaxId(e.target.value)} icon={<IdIcon />} hint="e.g. 12345678-0001" />
          <SelectField
            label="Tax status"
            value={taxStatus}
            onChange={(e) => setTaxStatus(e.target.value as CustomerTaxStatus | '')}
            options={[
              { value: '', label: '— not set —' },
              { value: 'registered', label: 'VAT registered' },
              { value: 'unregistered', label: 'Unregistered' },
              { value: 'exempt', label: 'Exempt' },
            ]}
          />
          <TextField label="Payment terms (days)" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value.replace(/[^\d]/g, ''))} icon={<TagIcon />} hint="e.g. 30" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Credit limit" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value.replace(/[^\d.]/g, ''))} icon={<CoinIcon />} hint="e.g. 5000000.00" />
          {editing && (
            <div className="flex items-center">
              <Checkbox label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            </div>
          )}
        </div>
        <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} icon={<TagIcon />} hint="e.g. Net-30; key account, finance contact is Jane" />
      </form>
    </Drawer>
  )
}
