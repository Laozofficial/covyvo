'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { Alert } from '../../../src/components/ui/Alert'
import { Button } from '../../../src/components/ui/Button'
import { CountryStateCityFields } from '../../../src/components/ui/CountryStateCityFields'
import { SelectField } from '../../../src/components/ui/SelectField'
import { REGISTRATION_STEPS, Stepper } from '../../../src/components/ui/Stepper'
import { TextField } from '../../../src/components/ui/TextField'
import {
  BuildingIcon,
  CalendarIcon,
  CoinIcon,
  IdIcon,
  MapPinIcon,
  TagIcon,
} from '../../../src/components/ui/icons'
import { ApiError } from '../../../src/lib/api'
import { authApi } from '../../../src/lib/auth-api'
import { storage } from '../../../src/lib/storage'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((m) => ({ value: m, label: m }))

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
]

export default function OnboardingPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [fiscalYearStartMonth, setStart] = useState('January')
  const [fiscalYearEndMonth, setEnd] = useState('December')
  const [streetAddress, setStreetAddress] = useState('')
  const [country, setCountry] = useState('Nigeria')
  const [stateRegion, setStateRegion] = useState('')
  const [city, setCity] = useState('')
  const [baseCurrency, setCurrency] = useState('NGN')
  const [category, setCategory] = useState('small')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registrationToken, setToken] = useState<string | null>(null)

  useEffect(() => {
    const token = storage.getRegistrationToken()
    if (!token) {
      router.replace('/sign-up')
      return
    }
    setToken(token)
  }, [router])

  function streetLine() {
    return streetAddress.trim()
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Company name is required'
    if (!taxId.trim()) next.taxId = 'Tax ID (TIN) is required'
    if (!streetAddress.trim()) next.streetAddress = 'Street address is required'
    if (!country.trim()) next.country = 'Country is required'
    if (!stateRegion.trim()) next.stateRegion = 'State is required'
    if (baseCurrency.length !== 3) next.baseCurrency = 'Pick a base currency'
    if (!category) next.category = 'Pick a category'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!registrationToken) return
    if (!validate()) return
    setLoading(true)
    try {
      const result = await authApi.completeRegistration({
        registrationToken,
        name: name.trim(),
        taxId: taxId.trim(),
        fiscalYearStartMonth,
        fiscalYearEndMonth,
        registeredAddress: streetLine(),
        country: country.trim() || undefined,
        state: stateRegion.trim() || undefined,
        city: city.trim() || undefined,
        baseCurrency,
        category,
      })
      if (result?.accessToken) storage.setAccessToken(result.accessToken)
      storage.clearRegistrationToken()
      storage.clearPendingEmail()
      router.replace('/dashboard')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not complete setup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Stepper steps={REGISTRATION_STEPS} current={2} />

      <div className="space-y-1.5">
        <h1 className="text-[19px] font-bold text-ink-900 tracking-tight">
          Set up your company
        </h1>
        <p className="text-[12.5px] text-ink-500">
          We'll provision your tenant and configure tax defaults.
        </p>
      </div>

      {formError && <Alert variant="error">{formError}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Company name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          icon={<BuildingIcon />}
        />
        <TextField
          label="Tax ID (TIN)"
          name="taxId"
          value={taxId}
          onChange={(e) => setTaxId(e.target.value)}
          error={errors.taxId}
          hint={!errors.taxId ? 'Your NRS-issued Tax Identification Number' : undefined}
          icon={<IdIcon />}
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Fiscal year start"
            name="fiscalYearStartMonth"
            value={fiscalYearStartMonth}
            onChange={(e) => setStart(e.target.value)}
            options={MONTHS}
            icon={<CalendarIcon />}
          />
          <SelectField
            label="Fiscal year end"
            name="fiscalYearEndMonth"
            value={fiscalYearEndMonth}
            onChange={(e) => setEnd(e.target.value)}
            options={MONTHS}
            icon={<CalendarIcon />}
          />
        </div>
        <TextField
          label="Street address"
          name="streetAddress"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          error={errors.streetAddress}
          hint={!errors.streetAddress ? 'e.g. 12 Adeola Odeku Street, Victoria Island' : undefined}
          icon={<MapPinIcon />}
        />
        <CountryStateCityFields
          country={country}
          state={stateRegion}
          city={city}
          onChange={({ country: c, state: s, city: ci }) => {
            setCountry(c); setStateRegion(s); setCity(ci)
          }}
        />
        {(errors.country || errors.stateRegion) && (
          <p className="text-xs text-red-600 pl-1">
            {errors.country || errors.stateRegion}
          </p>
        )}
        <SelectField
          label="Base currency"
          name="baseCurrency"
          value={baseCurrency}
          onChange={(e) => setCurrency(e.target.value)}
          options={CURRENCIES}
          error={errors.baseCurrency}
          icon={<CoinIcon />}
        />
        <SelectField
          label="Company category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={CATEGORIES}
          error={errors.category}
          icon={<TagIcon />}
        />

        <Button type="submit" fullWidth loading={loading}>
          Finish setup
        </Button>
      </form>
    </div>
  )
}
