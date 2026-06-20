'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { PageHeader } from '../../../../../src/components/PageHeader'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { BuildingIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import {
  Department,
  Employee,
  departmentsApi,
  employeesApi,
  employmentTypeLabel,
  fullName,
  payFrequencyLabel,
  statusMeta,
} from '../../../../../src/lib/hr-api'
import { formatNaira } from '../../../../../src/lib/format'
import { EmployeeFormDrawer } from '../_components/EmployeeFormDrawer'

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  function load() {
    setLoading(true)
    setError(null)
    Promise.all([employeesApi.get(params.id), departmentsApi.list()])
      .then(([e, d]) => {
        setEmployee(e)
        setDepartments(d.data ?? [])
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load employee'),
      )
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function handleDeactivate() {
    if (!employee) return
    if (!confirm(`Deactivate ${fullName(employee)}? Their status will change to terminated.`)) return
    setRemoving(true)
    try {
      await employeesApi.remove(employee.id)
      router.push('/dashboard/people/employees')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not deactivate employee')
    } finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    )
  }

  if (!employee) {
    return (
      <>
        <PageHeader title="Employee" />
        <Alert variant="error">{error ?? 'Employee not found'}</Alert>
        <div className="mt-4">
          <Link
            href="/dashboard/people/employees"
            className="text-[12.5px] font-semibold text-brand-600 hover:underline"
          >
            ← Back to employees
          </Link>
        </div>
      </>
    )
  }

  const meta = statusMeta(employee.employmentStatus)
  const initials =
    (employee.firstName[0] ?? '') + (employee.lastName[0] ?? '')

  return (
    <>
      <Link
        href="/dashboard/people/employees"
        className="inline-block mb-3 text-[12px] font-semibold text-ink-500 hover:text-ink-900"
      >
        ← All employees
      </Link>

      {/* Header card */}
      <div className="rounded-2xl bg-white border border-ink-200 p-5 mb-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-[18px] font-bold shrink-0">
            {initials.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[19px] font-bold text-ink-900 tracking-tight">
                {fullName(employee)}
              </h1>
              <span
                className={[
                  'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md',
                  meta.chip,
                ].join(' ')}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
            <p className="text-[12.5px] text-ink-500 mt-1">
              {employee.jobTitle ?? '—'}
              {employee.department && (
                <>
                  {' '}
                  <span className="inline-flex items-center gap-1 ml-1 text-ink-700 font-semibold">
                    <BuildingIcon size={12} className="text-ink-400" />
                    {employee.department.name}
                  </span>
                </>
              )}
            </p>
            <p className="text-[11.5px] text-ink-500 mt-0.5 font-mono">
              {employee.employeeCode} · {employee.workEmail}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            {employee.isActive && (
              <button
                onClick={handleDeactivate}
                disabled={removing}
                className="text-[12.5px] font-semibold text-red-600 hover:text-red-700 px-3 py-2 disabled:opacity-50"
              >
                {removing ? 'Deactivating…' : 'Deactivate'}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Personal">
          <Field label="Full name" value={fullName(employee)} />
          <Field label="Date of birth" value={employee.dateOfBirth} />
          <Field label="Gender" value={employee.gender} />
          <Field label="Marital status" value={employee.maritalStatus} />
          <Field label="Nationality" value={employee.nationality} />
          <Field label="NIN" value={employee.nin} mono />
          <Field label="Personal email" value={employee.personalEmail} />
          <Field label="Phone" value={employee.phone} />
          <Field label="Address" value={employee.address} wide />
        </Card>

        <Card title="Employment">
          <Field label="Employee code" value={employee.employeeCode} mono />
          <Field label="Department" value={employee.department?.name} />
          <Field label="Job title" value={employee.jobTitle} />
          <Field label="Employment type" value={employmentTypeLabel(employee.employmentType)} />
          <Field label="Status" value={meta.label} />
          <Field label="Hire date" value={employee.hireDate} />
          <Field label="Termination date" value={employee.terminationDate} />
        </Card>

        <Card title="Compensation">
          <Field
            label="Base salary"
            value={
              employee.baseSalary
                ? (employee.currency ?? 'NGN') === 'NGN'
                  ? formatNaira(Number(employee.baseSalary))
                  : `${employee.currency} ${Number(employee.baseSalary).toLocaleString()}`
                : undefined
            }
          />
          <Field label="Pay frequency" value={payFrequencyLabel(employee.payFrequency)} />
          <Field label="Currency" value={employee.currency} />
        </Card>

        <Card title="Bank">
          <Field label="Bank name" value={employee.bankName} />
          <Field label="Account number" value={employee.bankAccountNumber} mono />
          <Field label="Account name" value={employee.bankAccountName} />
        </Card>

        <Card title="Statutory">
          <Field label="Tax ID (TIN)" value={employee.tin} mono />
          <Field label="Pension PFA" value={employee.pensionPfa} />
          <Field label="Pension RSA PIN" value={employee.pensionRsaPin} mono />
          <Field label="NHF number" value={employee.nhfNumber} mono />
        </Card>

        <Card title="Emergency contact">
          <Field label="Name" value={employee.emergencyContactName} />
          <Field label="Relationship" value={employee.emergencyContactRelationship} />
          <Field label="Phone" value={employee.emergencyContactPhone} />
        </Card>
      </div>

      <EmployeeFormDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        departments={departments}
        initial={employee}
        onSaved={(e) => setEmployee(e)}
      />
    </>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-ink-200 p-5">
      <h3 className="text-[13px] font-bold text-ink-900 mb-3">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</dl>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
  wide,
}: {
  label: string
  value?: string | null
  mono?: boolean
  wide?: boolean
}) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </dt>
      <dd
        className={[
          'text-[12.5px] text-ink-900 mt-0.5',
          mono ? 'font-mono' : 'font-medium',
          !value ? 'text-ink-400 italic' : '',
        ].join(' ')}
      >
        {value ? value : '—'}
      </dd>
    </div>
  )
}
