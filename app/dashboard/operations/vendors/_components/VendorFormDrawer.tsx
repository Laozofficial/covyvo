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
  BanknoteIcon,
  BuildingIcon,
  CoinIcon,
  CreditCardIcon,
  IdIcon,
  MailIcon,
  MapPinIcon,
  TagIcon,
  UserIcon,
} from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { Vendor, VendorCategory, vendorsApi } from '../../../../../src/lib/business-api'

type Props = {
  open: boolean
  onClose: () => void
  initial?: Vendor | null
  onSaved: (v: Vendor) => void
}

export function VendorFormDrawer({ open, onClose, initial, onSaved }: Props) {
  const editing = !!initial
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState<VendorCategory>('supplier')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [country, setCountry] = useState('Nigeria')
  const [stateRegion, setStateRegion] = useState('')
  const [city, setCity] = useState('')
  const [taxId, setTaxId] = useState('')
  const [paymentTermsDays, setPaymentTermsDays] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [bankName, setBankName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setCode(initial?.code ?? '')
    setCategory(initial?.category ?? 'supplier')
    setContactName(initial?.contactName ?? '')
    setEmail(initial?.email ?? '')
    setPhone(initial?.phone ?? '')
    setAddress(initial?.address ?? '')
    setCountry(initial?.country ?? 'Nigeria')
    setStateRegion(initial?.state ?? '')
    setCity(initial?.city ?? '')
    setTaxId(initial?.taxId ?? '')
    setPaymentTermsDays(initial?.paymentTermsDays != null ? String(initial.paymentTermsDays) : '')
    setCurrency(initial?.currency ?? 'NGN')
    setBankName(initial?.bankName ?? '')
    setBankAccountNumber(initial?.bankAccountNumber ?? '')
    setBankAccountName(initial?.bankAccountName ?? '')
    setNotes(initial?.notes ?? '')
    setIsActive(initial?.isActive ?? true)
    setError(null)
  }, [open, initial])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const body: Partial<Vendor> = {
        name: name.trim(),
        code: code.trim() || undefined,
        category,
        contactName: contactName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        country: country.trim() || null,
        state: stateRegion.trim() || null,
        city: city.trim() || null,
        taxId: taxId.trim() || null,
        paymentTermsDays: paymentTermsDays === '' ? null : Number(paymentTermsDays),
        currency: currency.toUpperCase(),
        bankName: bankName.trim() || null,
        bankAccountNumber: bankAccountNumber.trim() || null,
        bankAccountName: bankAccountName.trim() || null,
        notes: notes.trim() || null,
      }
      const saved = editing
        ? await vendorsApi.update(initial!.id, { ...body, isActive })
        : await vendorsApi.create(body)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save vendor')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      defaultSize="expanded"
      title={editing ? `Edit ${initial!.code}` : 'New vendor'}
      description="A counterparty you buy from or pay. Feeds future POs and AP."
      footer={
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900">Cancel</button>
          <Button type="submit" form="vendor-form" loading={busy} disabled={!name.trim()}>
            {editing ? 'Save changes' : 'Create vendor'}
          </Button>
        </div>
      }
    >
      {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}
      <form id="vendor-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Name *" value={name} onChange={(e) => setName(e.target.value)} icon={<BuildingIcon />} hint="e.g. MTN Nigeria Plc" />
          <TextField label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} icon={<TagIcon />} hint="auto-generated if blank" disabled={editing} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as VendorCategory)}
            options={[
              { value: 'supplier', label: 'Supplier' },
              { value: 'service_provider', label: 'Service provider' },
              { value: 'contractor', label: 'Contractor' },
              { value: 'landlord', label: 'Landlord' },
              { value: 'utility', label: 'Utility' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} icon={<CoinIcon />} hint="e.g. NGN" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Primary contact" value={contactName} onChange={(e) => setContactName(e.target.value)} icon={<UserIcon />} hint="e.g. Bola Okonkwo" />
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<MailIcon />} hint="e.g. accounts@mtn.ng" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<IdIcon />} hint="e.g. +234 803 555 0000" />
          <TextField label="Payment terms (days)" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value.replace(/[^\d]/g, ''))} icon={<TagIcon />} hint="e.g. 14" />
        </div>
        <TextField label="Street address" value={address} onChange={(e) => setAddress(e.target.value)} icon={<MapPinIcon />} hint="e.g. Golden Plaza, Falomo, Ikoyi" />
        <CountryStateCityFields
          country={country}
          state={stateRegion}
          city={city}
          onChange={({ country: c, state: s, city: ci }) => {
            setCountry(c); setStateRegion(s); setCity(ci)
          }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label="Tax ID (TIN)" value={taxId} onChange={(e) => setTaxId(e.target.value)} icon={<IdIcon />} hint="e.g. 23456789-0001" />
          {editing && (
            <div className="flex items-center">
              <Checkbox label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-ink-200 p-4 space-y-3">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
            Bank — for payouts
          </p>
          <TextField label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} icon={<CreditCardIcon />} hint="e.g. Guaranty Trust Bank" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Account number" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^\d]/g, ''))} icon={<CreditCardIcon />} hint="e.g. 0123456789" />
            <TextField label="Account name" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} icon={<UserIcon />} hint="e.g. MTN Nigeria Plc" />
          </div>
        </div>

        <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} icon={<BanknoteIcon />} hint="e.g. Mobile services; net-14" />
      </form>
    </Drawer>
  )
}
