'use client'

import Link from 'next/link'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import {
  BuildingIcon,
  SearchIcon,
  UsersIcon,
} from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { useActiveBranch } from '../../../../src/lib/useActiveBranch'
import {
  Department,
  Employee,
  EmploymentStatus,
  EmploymentType,
  departmentsApi,
  employeesApi,
  employmentTypeLabel,
  fullName,
  statusMeta,
} from '../../../../src/lib/hr-api'
import { DepartmentsDrawer } from './_components/DepartmentsDrawer'
import { EmployeeFormDrawer } from './_components/EmployeeFormDrawer'

const STATUS_FILTERS: { value: EmploymentStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'probation', label: 'Probation' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'resigned', label: 'Resigned' },
]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { branchId } = useActiveBranch()
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | ''>('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deptDrawerOpen, setDeptDrawerOpen] = useState(false)

  function loadDepartments() {
    departmentsApi
      .list()
      .then((r) => setDepartments(r.data ?? []))
      .catch(() => {})
  }

  async function loadEmployees() {
    setLoading(true)
    setError(null)
    try {
      const r = await employeesApi.list({
        search: search || undefined,
        departmentId: departmentId || undefined,
        employmentStatus: employmentStatus || undefined,
        branchId: branchId || undefined,
        limit: 100,
      })
      setEmployees(r.data ?? [])
      setTotal(r.total ?? 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDepartments()
  }, [])

  // Debounced reload on filter change
  useEffect(() => {
    const t = setTimeout(() => loadEmployees(), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, departmentId, employmentStatus, branchId])

  const counts = useMemo(() => {
    const active = employees.filter((e) => e.employmentStatus === 'active').length
    const onLeave = employees.filter((e) => e.employmentStatus === 'on_leave').length
    return { active, onLeave }
  }, [employees])

  function handleSaved(e: Employee) {
    setEmployees((prev) => {
      const idx = prev.findIndex((p) => p.id === e.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = e
        return next
      }
      return [e, ...prev]
    })
  }

  return (
    <>
      <PageHeader
        title="Employees"
        description={`${total.toLocaleString()} total · ${counts.active} active · ${counts.onLeave} on leave`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeptDrawerOpen(true)}
            >
              Departments
            </Button>
            <Button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              Add employee
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Filters bar */}
      <div className="rounded-2xl bg-white border border-ink-200 p-3 mb-4 flex flex-col sm:flex-row items-stretch gap-2">
        <div className="relative flex-1">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            size={16}
          />
          <input
            type="search"
            placeholder="Search by name, code, email or title…"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-[13px] font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500"
          />
        </div>
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 focus:outline-none focus:border-brand-500"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={employmentStatus}
          onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus | '')}
          className="h-10 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-semibold text-ink-800 focus:outline-none focus:border-brand-500"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title={search || departmentId || employmentStatus ? 'No matches' : 'No employees yet'}
          description={
            search || departmentId || employmentStatus
              ? 'Try clearing the filters above.'
              : 'Add your first employee to start running compliant payroll.'
          }
          action={
            !search && !departmentId && !employmentStatus ? (
              <Button
                onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}
              >
                Add employee
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Hired</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {employees.map((e) => {
                const meta = statusMeta(e.employmentStatus)
                const initials =
                  (e.firstName[0] ?? '') + (e.lastName[0] ?? '')
                return (
                  <tr key={e.id} className="text-[12.5px]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/people/employees/${e.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                          {initials.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900 truncate group-hover:text-brand-700">
                            {fullName(e)}
                          </p>
                          <p className="text-[11px] text-ink-500 truncate font-mono">
                            {e.employeeCode} · {e.workEmail}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {e.department ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-700">
                          <BuildingIcon size={13} className="text-ink-400" />
                          {e.department.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-400">—</span>
                      )}
                      {e.jobTitle && (
                        <p className="text-[10.5px] text-ink-500 mt-0.5">{e.jobTitle}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-ink-700">
                      {employmentTypeLabel(e.employmentType as EmploymentType)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md',
                          meta.chip,
                        ].join(' ')}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-ink-600 font-medium">
                      {e.hireDate ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditing(e)
                          setFormOpen(true)
                        }}
                        className="text-[12px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <EmployeeFormDrawer
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        departments={departments}
        initial={editing}
        onSaved={handleSaved}
      />

      <DepartmentsDrawer
        open={deptDrawerOpen}
        onClose={() => setDeptDrawerOpen(false)}
        departments={departments}
        onChanged={() => {
          loadDepartments()
          loadEmployees()
        }}
      />
    </>
  )
}
