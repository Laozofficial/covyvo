'use client'

import { FormEvent, useEffect, useState } from 'react'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { CountryStateCityFields } from '../../../../src/components/ui/CountryStateCityFields'
import { SelectField } from '../../../../src/components/ui/SelectField'
import { TextField } from '../../../../src/components/ui/TextField'
import {
  BuildingIcon,
  CalendarIcon,
  CoinIcon,
  IdIcon,
  MapPinIcon,
  TagIcon,
} from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { AuthTenant } from '../../../../src/lib/auth-api'
import { storage } from '../../../../src/lib/storage'
import { tenantsApi } from '../../../../src/lib/tenants-api'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((m) => ({ value: m.toLowerCase(), label: m }))

const CURRENCIES = [
  { value: 'NGN', label: 'NGN — Nigerian Naira' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
]

const CATEGORIES = [
  { value: 'small', label: 'Small (≤ ₦100M turnover)' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large / Standard-rate' },
  { value: 'multinational', label: 'Multinational group' },
  { value: 'Technology', label: 'Technology' },
]

export default function CompanyProfilePage() {
  const [tenant, setTenant] = useState<AuthTenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Editable fields
  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [fyStart, setFyStart] = useState('january')
  const [fyEnd, setFyEnd] = useState('december')
  const [address, setAddress] = useState('')
  const [country, setCountry] = useState('Nigeria')
  const [stateRegion, setStateRegion] = useState('')
  const [city, setCity] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [category, setCategory] = useState('small')

  function hydrate(t: AuthTenant) {
    setTenant(t)
    setName(t.name ?? '')
    setTaxId(t.taxId ?? '')
    setFyStart((t.fiscalYearStartMonth ?? 'january').toLowerCase())
    setFyEnd((t.fiscalYearEndMonth ?? 'december').toLowerCase())
    setAddress(t.registeredAddress ?? '')
    setCountry(t.country ?? 'Nigeria')
    setStateRegion(t.state ?? '')
    setCity(t.city ?? '')
    setCurrency((t.baseCurrency ?? 'NGN').toUpperCase())
    setCategory(t.category ?? 'small')
  }

  useEffect(() => {
    // Hydrate from local storage immediately so the form isn't blank,
    // then refresh from the API so country/state/city land if they were
    // missing on the cached blob.
    const cached = storage.getActiveTenant<AuthTenant>()
    if (cached) {
      hydrate(cached)
      setLoading(false)
      tenantsApi
        .get(cached.id)
        .then((fresh) => {
          hydrate(fresh)
          storage.setActiveTenant(fresh)
        })
        .catch(() => {
          /* keep cached values; an explicit error would be noisy here */
        })
    } else {
      setLoading(false)
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!tenant?.id) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await tenantsApi.update(tenant.id, {
        name: name.trim(),
        taxId: taxId.trim(),
        fiscalYearStartMonth: fyStart,
        fiscalYearEndMonth: fyEnd,
        registeredAddress: address.trim(),
        country: country.trim() || undefined,
        state: stateRegion.trim() || undefined,
        city: city.trim() || undefined,
        baseCurrency: currency.toUpperCase(),
        category,
      })
      hydrate(updated)
      storage.setActiveTenant(updated)
      setSuccess('Profile saved')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !tenant) {
    return (
      <>
        <PageHeader
          title="Company Profile"
          description="Legal entity, tax IDs, fiscal year and base currency. These drive compliance defaults."
        />
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      </>
    )
  }

  if (!tenant) {
    return (
      <>
        <PageHeader title="Company Profile" />
        <Alert variant="error">
          {error ?? 'No active workspace. Try signing in again.'}
        </Alert>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Company Profile"
        description="Legal entity, tax IDs, fiscal year and base currency. These drive compliance defaults across payroll, tax filings and bank-file formats."
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert variant="success">{success}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Read-only identity strip */}
        <div className="rounded-2xl bg-white border border-ink-200 p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-brand-600 text-white flex items-center justify-center text-[18px] font-bold shrink-0">
              {(tenant.name?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-ink-900 truncate">
                {tenant.name}
              </p>
              <p className="text-[11.5px] text-ink-500 font-mono truncate">
                {tenant.slug}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {tenant.plan && (
                <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-brand-50 text-brand-700">
                  {tenant.plan}
                </span>
              )}
              <span
                className={[
                  'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md',
                  tenant.isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-ink-100 text-ink-500',
                ].join(' ')}
              >
                <span
                  className={[
                    'h-1.5 w-1.5 rounded-full',
                    tenant.isActive ? 'bg-emerald-500' : 'bg-ink-400',
                  ].join(' ')}
                />
                {tenant.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="rounded-2xl bg-white border border-ink-200 p-5 space-y-4">
          <TextField
            label="Company name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<BuildingIcon />}
          />
          <TextField
            label="Tax ID (TIN)"
            name="taxId"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            icon={<IdIcon />}
            hint="Your NRS-issued Tax Identification Number"
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Fiscal year start"
              name="fyStart"
              value={fyStart}
              onChange={(e) => setFyStart(e.target.value)}
              options={MONTHS}
              icon={<CalendarIcon />}
            />
            <SelectField
              label="Fiscal year end"
              name="fyEnd"
              value={fyEnd}
              onChange={(e) => setFyEnd(e.target.value)}
              options={MONTHS}
              icon={<CalendarIcon />}
            />
          </div>
          <TextField
            label="Street address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            icon={<MapPinIcon />}
            hint="e.g. 12 Adeola Odeku Street, Victoria Island"
          />
          <CountryStateCityFields
            country={country}
            state={stateRegion}
            city={city}
            onChange={({ country: c, state: s, city: ci }) => {
              setCountry(c); setStateRegion(s); setCity(ci)
            }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField
              label="Base currency"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={CURRENCIES}
              icon={<CoinIcon />}
            />
            <SelectField
              label="Company category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORIES}
              icon={<TagIcon />}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 sticky bottom-4 bg-ink-50/95 backdrop-blur-sm rounded-xl border border-ink-200 p-3">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </>
  )
}
