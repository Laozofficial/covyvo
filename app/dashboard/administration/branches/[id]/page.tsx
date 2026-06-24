'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { PageHeader } from '../../../../../src/components/PageHeader'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import {
  BranchIcon,
  BuildingIcon,
  IdIcon,
  MapPinIcon,
} from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { Branch, Department, branchesApi, departmentsApi } from '../../../../../src/lib/hr-api'
import { BranchFormDrawer } from '../_components/BranchFormDrawer'
import { DepartmentFormDrawer } from '../../departments/_components/DepartmentFormDrawer'

export default function BranchDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [branch, setBranch] = useState<Branch | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deptOpen, setDeptOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [busy, setBusy] = useState(false)

  function load() {
    setLoading(true)
    setError(null)
    Promise.all([
      branchesApi.get(params.id),
      departmentsApi.list({ branchId: params.id, includeInactive: true, limit: 100 }),
    ])
      .then(([b, d]) => {
        setBranch(b)
        setDepartments(d.data ?? [])
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load branch'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function handleDeactivate() {
    if (!branch) return
    if (!confirm(`Deactivate "${branch.name}"?`)) return
    setBusy(true)
    try {
      await branchesApi.remove(branch.id)
      router.push('/dashboard/administration/branches')
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not deactivate')
    } finally {
      setBusy(false)
    }
  }

  function handleBranchSaved(b: Branch) {
    setBranch(b)
  }

  function handleDeptSaved(d: Department) {
    setDepartments((prev) => {
      const i = prev.findIndex((x) => x.id === d.id)
      if (i >= 0) {
        const next = [...prev]; next[i] = d; return next
      }
      return [d, ...prev]
    })
  }

  async function handleDeptDeactivate(d: Department) {
    if (!confirm(`Deactivate "${d.name}"?`)) return
    try {
      await departmentsApi.remove(d.id)
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not deactivate')
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    )
  }

  if (error || !branch) {
    return (
      <>
        <Alert variant="error">{error ?? 'Branch not found'}</Alert>
        <div className="mt-4">
          <Link
            href="/dashboard/administration/branches"
            className="text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
          >
            ← Back to branches
          </Link>
        </div>
      </>
    )
  }

  const active = departments.filter((d) => d.isActive).length

  return (
    <>
      <div className="mb-3">
        <Link
          href="/dashboard/administration/branches"
          className="text-[11.5px] font-semibold text-ink-500 hover:text-ink-900"
        >
          ← Branches
        </Link>
      </div>

      <PageHeader
        title={branch.name}
        description={`Branch code ${branch.code}${
          branch.isHeadOffice ? ' · Head office' : ''
        }${!branch.isActive ? ' · Inactive' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            {branch.isActive && (
              <Button variant="secondary" onClick={handleDeactivate} loading={busy}>
                Deactivate
              </Button>
            )}
            <Button onClick={() => setEditOpen(true)}>Edit branch</Button>
          </div>
        }
      />

      <div className="rounded-2xl border border-ink-200 bg-white p-5 mb-6">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-500 mb-3">
          Branch details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow icon={<MapPinIcon />} label="Address" value={branch.address} />
          <DetailRow
            icon={<BuildingIcon />}
            label="Location"
            value={
              [branch.city, branch.state, branch.country].filter(Boolean).join(', ') || null
            }
          />
          <DetailRow icon={<IdIcon />} label="Phone" value={branch.phone} mono />
          <DetailRow icon={<BranchIcon />} label="Code" value={branch.code} mono />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[14px] font-bold text-ink-900 tracking-tight">
            Departments in this branch
          </h2>
          <p className="text-[11.5px] text-ink-500">
            {departments.length} total · {active} active
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingDept(null)
            setDeptOpen(true)
          }}
        >
          Add department
        </Button>
      </div>

      {departments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center">
          <p className="text-[12.5px] font-semibold text-ink-900 mb-1">
            No departments in this branch yet
          </p>
          <p className="text-[11.5px] text-ink-500 mb-4">
            Departments can live inside a branch or stay standalone.
          </p>
          <Button
            onClick={() => {
              setEditingDept(null)
              setDeptOpen(true)
            }}
          >
            Add first department
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[10.5px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {departments.map((d) => (
                <tr key={d.id} className="text-[12.5px]">
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-ink-900">{d.code}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{d.name}</td>
                  <td className="px-4 py-3 text-[11.5px] text-ink-600 max-w-[400px] truncate">
                    {d.description ?? <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {d.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-ink-100 text-ink-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        setEditingDept(d)
                        setDeptOpen(true)
                      }}
                      className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 mr-4"
                    >
                      Edit
                    </button>
                    {d.isActive && (
                      <button
                        onClick={() => handleDeptDeactivate(d)}
                        className="text-[12px] font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BranchFormDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={branch}
        onSaved={handleBranchSaved}
      />

      <DepartmentFormDrawer
        open={deptOpen}
        onClose={() => {
          setDeptOpen(false)
          setEditingDept(null)
        }}
        initial={editingDept}
        branches={[branch]}
        defaultBranchId={branch.id}
        lockBranch
        onSaved={handleDeptSaved}
      />
    </>
  )
}

function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: ReactNode
  label: string
  value: string | null
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-ink-400 mt-0.5 [&>svg]:h-[16px] [&>svg]:w-[16px]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
        <p
          className={[
            'text-[13px] text-ink-900 break-words',
            mono ? 'font-mono' : 'font-medium',
          ].join(' ')}
        >
          {value ?? <span className="font-medium text-ink-400">—</span>}
        </p>
      </div>
    </div>
  )
}
