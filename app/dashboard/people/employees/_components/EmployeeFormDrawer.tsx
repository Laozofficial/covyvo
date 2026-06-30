'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import {
  BuildingIcon,
  CalendarIcon,
  CoinIcon,
  CreditCardIcon,
  IdIcon,
  MailIcon,
  MapPinIcon,
  TagIcon,
  UserIcon,
} from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import {
  Department,
  Employee,
  EmploymentStatus,
  EmploymentType,
  Gender,
  MaritalStatus,
  PayFrequency,
  employeesApi,
} from '../../../../../src/lib/hr-api'

import { Designation, designationsApi } from '../../../../../src/lib/business-api'

type Props = {
  open: boolean
  onClose: () => void
  departments: Department[]
  initial?: Employee | null
  onSaved: (employee: Employee) => void
}

type Tab = 'personal' | 'employment' | 'compensation' | 'bank' | 'statutory' | 'emergency'

const TABS: { key: Tab; label: string }[] = [
  { key: 'personal', label: 'Personal' },
  { key: 'employment', label: 'Employment' },
  { key: 'compensation', label: 'Compensation' },
  { key: 'bank', label: 'Bank' },
  { key: 'statutory', label: 'Statutory' },
  { key: 'emergency', label: 'Emergency contact' },
]

const GENDER_OPTS = [
  { value: '', label: '— None —' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const MARITAL_OPTS = [
  { value: '', label: '— None —' },
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
]

const EMPLOYMENT_TYPE_OPTS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
  { value: 'consultant', label: 'Consultant' },
]

const EMPLOYMENT_STATUS_OPTS = [
  { value: 'active', label: 'Active' },
  { value: 'probation', label: 'Probation' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'resigned', label: 'Resigned' },
]

const PAY_FREQ_OPTS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi_weekly', label: 'Bi-weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'daily', label: 'Daily' },
]

const CURRENCY_OPTS = [
  { value: 'NGN', label: 'NGN' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
]

type FormState = {
  employeeCode: string
  firstName: string
  middleName: string
  lastName: string
  gender: string
  dateOfBirth: string
  maritalStatus: string
  nationality: string
  nin: string

  workEmail: string
  personalEmail: string
  phone: string
  address: string

  departmentId: string
  designationId: string
  jobTitle: string
  employmentType: string
  employmentStatus: string
  hireDate: string
  terminationDate: string

  baseSalary: string
  payFrequency: string
  currency: string

  bankName: string
  bankAccountNumber: string
  bankAccountName: string

  tin: string
  pensionPfa: string
  pensionRsaPin: string
  nhfNumber: string

  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
}

function emptyForm(): FormState {
  return {
    employeeCode: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    maritalStatus: '',
    nationality: '',
    nin: '',

    workEmail: '',
    personalEmail: '',
    phone: '',
    address: '',

    departmentId: '',
    designationId: '',
    jobTitle: '',
    employmentType: 'full_time',
    employmentStatus: 'active',
    hireDate: '',
    terminationDate: '',

    baseSalary: '',
    payFrequency: 'monthly',
    currency: 'NGN',

    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',

    tin: '',
    pensionPfa: '',
    pensionRsaPin: '',
    nhfNumber: '',

    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
  }
}

function fromEmployee(e: Employee): FormState {
  return {
    employeeCode: e.employeeCode,
    firstName: e.firstName,
    middleName: e.middleName ?? '',
    lastName: e.lastName,
    gender: e.gender ?? '',
    dateOfBirth: e.dateOfBirth ?? '',
    maritalStatus: e.maritalStatus ?? '',
    nationality: e.nationality ?? '',
    nin: e.nin ?? '',

    workEmail: e.workEmail,
    personalEmail: e.personalEmail ?? '',
    phone: e.phone ?? '',
    address: e.address ?? '',

    departmentId: e.departmentId ?? '',
    designationId: e.designationId ?? '',
    jobTitle: e.jobTitle ?? '',
    employmentType: e.employmentType,
    employmentStatus: e.employmentStatus,
    hireDate: e.hireDate ?? '',
    terminationDate: e.terminationDate ?? '',

    baseSalary: e.baseSalary ?? '',
    payFrequency: e.payFrequency,
    currency: e.currency ?? 'NGN',

    bankName: e.bankName ?? '',
    bankAccountNumber: e.bankAccountNumber ?? '',
    bankAccountName: e.bankAccountName ?? '',

    tin: e.tin ?? '',
    pensionPfa: e.pensionPfa ?? '',
    pensionRsaPin: e.pensionRsaPin ?? '',
    nhfNumber: e.nhfNumber ?? '',

    emergencyContactName: e.emergencyContactName ?? '',
    emergencyContactRelationship: e.emergencyContactRelationship ?? '',
    emergencyContactPhone: e.emergencyContactPhone ?? '',
  }
}

function toPayload(s: FormState) {
  function emptyToUndef<T>(v: T | ''): T | undefined {
    return v === '' || v === null ? undefined : v
  }
  return {
    employeeCode: emptyToUndef(s.employeeCode.trim()),
    firstName: s.firstName.trim(),
    middleName: emptyToUndef(s.middleName.trim()),
    lastName: s.lastName.trim(),
    gender: emptyToUndef(s.gender) as Gender | undefined,
    dateOfBirth: emptyToUndef(s.dateOfBirth),
    maritalStatus: emptyToUndef(s.maritalStatus) as MaritalStatus | undefined,
    nationality: emptyToUndef(s.nationality.trim()),
    nin: emptyToUndef(s.nin.trim()),

    workEmail: s.workEmail.trim().toLowerCase(),
    personalEmail: emptyToUndef(s.personalEmail.trim().toLowerCase()),
    phone: emptyToUndef(s.phone.trim()),
    address: emptyToUndef(s.address.trim()),

    departmentId: emptyToUndef(s.departmentId) as string | undefined,
    designationId: emptyToUndef(s.designationId) as string | undefined,
    jobTitle: emptyToUndef(s.jobTitle.trim()),
    employmentType: s.employmentType as EmploymentType,
    employmentStatus: s.employmentStatus as EmploymentStatus,
    hireDate: emptyToUndef(s.hireDate),
    terminationDate: emptyToUndef(s.terminationDate),

    baseSalary: emptyToUndef(s.baseSalary.trim()),
    payFrequency: s.payFrequency as PayFrequency,
    currency: emptyToUndef(s.currency),

    bankName: emptyToUndef(s.bankName.trim()),
    bankAccountNumber: emptyToUndef(s.bankAccountNumber.trim()),
    bankAccountName: emptyToUndef(s.bankAccountName.trim()),

    tin: emptyToUndef(s.tin.trim()),
    pensionPfa: emptyToUndef(s.pensionPfa.trim()),
    pensionRsaPin: emptyToUndef(s.pensionRsaPin.trim()),
    nhfNumber: emptyToUndef(s.nhfNumber.trim()),

    emergencyContactName: emptyToUndef(s.emergencyContactName.trim()),
    emergencyContactRelationship: emptyToUndef(s.emergencyContactRelationship.trim()),
    emergencyContactPhone: emptyToUndef(s.emergencyContactPhone.trim()),
  }
}

export function EmployeeFormDrawer({
  open,
  onClose,
  departments,
  initial,
  onSaved,
}: Props) {
  const editing = !!initial
  const [tab, setTab] = useState<Tab>('personal')
  const [form, setForm] = useState<FormState>(emptyForm())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(initial ? fromEmployee(initial) : emptyForm())
    setTab('personal')
    setError(null)
  }, [open, initial])

  function patch<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function setIfMissing<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: f[k] || v }))
  }

  // Auto-fill bank account name from full name when blank
  useEffect(() => {
    if (!form.bankAccountName) {
      const full = [form.firstName, form.lastName].filter(Boolean).join(' ')
      if (full) setIfMissing('bankAccountName', full)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.firstName, form.lastName])

  const isValid = useMemo(() => {
    return !!form.firstName.trim() && !!form.lastName.trim() && !!form.workEmail.trim()
  }, [form])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) {
      setError('Name and work email are required')
      setTab('personal')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const payload = toPayload(form)
      const saved = editing
        ? await employeesApi.update(initial!.id, payload as Partial<Employee>)
        : await employeesApi.create(payload as Partial<Employee>)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save employee')
    } finally {
      setSaving(false)
    }
  }

  const deptOptions = useMemo(
    () => [
      { value: '', label: '— No department —' },
      ...departments.map((d) => ({ value: d.id, label: d.name })),
    ],
    [departments],
  )

  // Load designations on open so the Job Title dropdown is populated.
  const [designations, setDesignations] = useState<Designation[]>([])
  useEffect(() => {
    if (!open) return
    designationsApi
      .list({ limit: 100 })
      .then((r) => setDesignations(r.data ?? []))
      .catch(() => {
        /* No big deal — the dropdown just stays empty, free-text jobTitle still works. */
      })
  }, [open])
  const designationOptions = useMemo(
    () => [
      { value: '', label: '— None —' },
      ...designations.map((d) => ({
        value: d.id,
        label: d.name,
        hint: d.level ?? undefined,
      })),
    ],
    [designations],
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={620}
      title={editing ? `Edit ${initial?.firstName ?? 'employee'}` : 'Add employee'}
      description={
        editing
          ? `Update ${initial?.firstName} ${initial?.lastName}'s record.`
          : 'Fill out as much as you have — only name and work email are required to start.'
      }
      footer={
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-ink-500">
            * required: name, work email
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900"
            >
              Cancel
            </button>
            <Button
              type="submit"
              form="employee-form"
              loading={saving}
              disabled={!isValid}
            >
              {editing ? 'Save changes' : 'Add employee'}
            </Button>
          </div>
        </div>
      }
    >
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="flex gap-1 mb-4 border-b border-ink-200 -mx-5 px-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              'px-2.5 py-1.5 text-[12px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-500 hover:text-ink-800',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form id="employee-form" onSubmit={handleSubmit} className="space-y-4">
        {tab === 'personal' && (
          <Section>
            <Row>
              <TextField
                label="First name *"
                value={form.firstName}
                onChange={(e) => patch('firstName', e.target.value)}
                icon={<UserIcon />}
                hint="e.g. Ada"
              />
              <TextField
                label="Middle name"
                value={form.middleName}
                onChange={(e) => patch('middleName', e.target.value)}
                icon={<UserIcon />}
                hint="e.g. Augusta"
              />
            </Row>
            <TextField
              label="Last name *"
              value={form.lastName}
              onChange={(e) => patch('lastName', e.target.value)}
              icon={<UserIcon />}
              hint="e.g. Lovelace"
            />
            <TextField
              label="Work email *"
              type="email"
              value={form.workEmail}
              onChange={(e) => patch('workEmail', e.target.value)}
              icon={<MailIcon />}
              hint="e.g. ada@yourcompany.com"
            />
            <TextField
              label="Personal email"
              type="email"
              value={form.personalEmail}
              onChange={(e) => patch('personalEmail', e.target.value)}
              icon={<MailIcon />}
              hint="e.g. ada@gmail.com"
            />
            <Row>
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(e) => patch('phone', e.target.value)}
                icon={<IdIcon />}
                hint="e.g. +234 802 123 4567"
              />
              <TextField
                label="National ID (NIN)"
                value={form.nin}
                onChange={(e) => patch('nin', e.target.value)}
                icon={<IdIcon />}
                hint="e.g. 12345678901"
              />
            </Row>
            <Row>
              <SelectField
                label="Gender"
                value={form.gender}
                onChange={(e) => patch('gender', e.target.value)}
                options={GENDER_OPTS}
                icon={<UserIcon />}
              />
              <SelectField
                label="Marital status"
                value={form.maritalStatus}
                onChange={(e) => patch('maritalStatus', e.target.value)}
                options={MARITAL_OPTS}
                icon={<UserIcon />}
              />
            </Row>
            <Row>
              <TextField
                label="Date of birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => patch('dateOfBirth', e.target.value)}
                icon={<CalendarIcon />}
              />
              <TextField
                label="Nationality"
                value={form.nationality}
                onChange={(e) => patch('nationality', e.target.value)}
                icon={<TagIcon />}
                hint="e.g. Nigerian"
              />
            </Row>
            <TextField
              label="Address"
              value={form.address}
              onChange={(e) => patch('address', e.target.value)}
              icon={<MapPinIcon />}
              hint="e.g. 12 Adeola Odeku Street, Victoria Island, Lagos"
            />
          </Section>
        )}

        {tab === 'employment' && (
          <Section>
            <Row>
              <TextField
                label="Employee code"
                value={form.employeeCode}
                onChange={(e) => patch('employeeCode', e.target.value)}
                icon={<IdIcon />}
                hint={editing ? undefined : 'Auto-generated if left blank'}
              />
              <SelectField
                label="Department"
                value={form.departmentId}
                onChange={(e) => patch('departmentId', e.target.value)}
                options={deptOptions}
                icon={<BuildingIcon />}
              />
            </Row>
            <Row>
              <SelectField
                label="Designation"
                value={form.designationId}
                onChange={(e) => patch('designationId', e.target.value)}
                options={designationOptions}
                icon={<IdIcon />}
                hint={
                  designations.length === 0
                    ? 'Add titles under People → Designations to pick from a managed list'
                    : undefined
                }
              />
              <TextField
                label="Job title (free-text)"
                value={form.jobTitle}
                onChange={(e) => patch('jobTitle', e.target.value)}
                icon={<TagIcon />}
                hint="Override or leave blank to use the designation name"
              />
            </Row>
            <Row>
              <SelectField
                label="Employment type"
                value={form.employmentType}
                onChange={(e) => patch('employmentType', e.target.value)}
                options={EMPLOYMENT_TYPE_OPTS}
                icon={<TagIcon />}
              />
              <SelectField
                label="Status"
                value={form.employmentStatus}
                onChange={(e) => patch('employmentStatus', e.target.value)}
                options={EMPLOYMENT_STATUS_OPTS}
                icon={<TagIcon />}
              />
            </Row>
            <Row>
              <TextField
                label="Hire date"
                type="date"
                value={form.hireDate}
                onChange={(e) => patch('hireDate', e.target.value)}
                icon={<CalendarIcon />}
              />
              <TextField
                label="Termination date"
                type="date"
                value={form.terminationDate}
                onChange={(e) => patch('terminationDate', e.target.value)}
                icon={<CalendarIcon />}
              />
            </Row>
          </Section>
        )}

        {tab === 'compensation' && (
          <Section>
            <Row>
              <TextField
                label="Base salary"
                value={form.baseSalary}
                onChange={(e) => patch('baseSalary', e.target.value.replace(/[^\d.]/g, ''))}
                icon={<CoinIcon />}
                inputMode="decimal"
                placeholder="0.00"
              />
              <SelectField
                label="Currency"
                value={form.currency}
                onChange={(e) => patch('currency', e.target.value)}
                options={CURRENCY_OPTS}
                icon={<CoinIcon />}
              />
            </Row>
            <SelectField
              label="Pay frequency"
              value={form.payFrequency}
              onChange={(e) => patch('payFrequency', e.target.value)}
              options={PAY_FREQ_OPTS}
              icon={<CalendarIcon />}
            />
          </Section>
        )}

        {tab === 'bank' && (
          <Section>
            <TextField
              label="Bank name"
              value={form.bankName}
              onChange={(e) => patch('bankName', e.target.value)}
              icon={<CreditCardIcon />}
              hint="e.g. Guaranty Trust Bank"
            />
            <Row>
              <TextField
                label="Account number"
                value={form.bankAccountNumber}
                onChange={(e) =>
                  patch('bankAccountNumber', e.target.value.replace(/[^\d]/g, ''))
                }
                inputMode="numeric"
                icon={<CreditCardIcon />}
                hint="e.g. 0123456789"
              />
              <TextField
                label="Account name"
                value={form.bankAccountName}
                onChange={(e) => patch('bankAccountName', e.target.value)}
                icon={<UserIcon />}
                hint="e.g. Ada Lovelace"
              />
            </Row>
          </Section>
        )}

        {tab === 'statutory' && (
          <Section>
            <TextField
              label="Tax ID (TIN)"
              value={form.tin}
              onChange={(e) => patch('tin', e.target.value)}
              icon={<IdIcon />}
              hint="e.g. 12345678-0001"
            />
            <Row>
              <TextField
                label="Pension PFA"
                value={form.pensionPfa}
                onChange={(e) => patch('pensionPfa', e.target.value)}
                icon={<BuildingIcon />}
                hint="e.g. Stanbic IBTC Pension Managers"
              />
              <TextField
                label="Pension RSA PIN"
                value={form.pensionRsaPin}
                onChange={(e) => patch('pensionRsaPin', e.target.value)}
                icon={<IdIcon />}
                hint="e.g. PEN100123456789"
              />
            </Row>
            <TextField
              label="NHF number"
              value={form.nhfNumber}
              onChange={(e) => patch('nhfNumber', e.target.value)}
              icon={<IdIcon />}
              hint="e.g. NHF0123456789"
            />
          </Section>
        )}

        {tab === 'emergency' && (
          <Section>
            <TextField
              label="Contact name"
              value={form.emergencyContactName}
              onChange={(e) => patch('emergencyContactName', e.target.value)}
              icon={<UserIcon />}
              hint="e.g. Bunmi Lovelace"
            />
            <Row>
              <TextField
                label="Relationship"
                value={form.emergencyContactRelationship}
                onChange={(e) =>
                  patch('emergencyContactRelationship', e.target.value)
                }
                icon={<TagIcon />}
                hint="e.g. Spouse"
              />
              <TextField
                label="Contact phone"
                value={form.emergencyContactPhone}
                onChange={(e) => patch('emergencyContactPhone', e.target.value)}
                icon={<IdIcon />}
                hint="e.g. +234 803 987 6543"
              />
            </Row>
          </Section>
        )}
      </form>
    </Drawer>
  )
}

function Section({ children }: { children: ReactNode }) {
  return <div className="space-y-3.5">{children}</div>
}

function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
}
