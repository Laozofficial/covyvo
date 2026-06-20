'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { ShieldCheckIcon, ShieldIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { Role, rolesApi } from '../../../../src/lib/roles-api'

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    rolesApi
      .list()
      .then((r) => setRoles(r.data ?? []))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load roles'),
      )
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(role: Role) {
    if (!confirm(`Delete the "${role.name}" role? Users holding it will be unassigned.`)) return
    setBusyId(role.id)
    setError(null)
    try {
      await rolesApi.remove(role.id)
      setRoles((rs) => rs.filter((r) => r.id !== role.id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete role')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="Permission-per-action access control. System roles ship pre-seeded; create custom roles for finer-grained access."
        actions={
          <Link
            href="/dashboard/people/roles/new"
            className="inline-flex items-center justify-center font-semibold rounded-lg px-4 py-2.5 text-[13px] tracking-tight transition-colors bg-brand-600 text-white hover:bg-brand-700"
          >
            New role
          </Link>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : roles.length === 0 ? (
        <EmptyState
          icon={<ShieldIcon />}
          title="No roles yet"
          description="System roles seed automatically the first time this page loads — try refreshing."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="rounded-2xl bg-white border border-ink-200 p-4 flex flex-col gap-3 hover:border-brand-300 hover:shadow-[0_4px_16px_-8px_rgba(15,23,42,0.1)] transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className={[
                    'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                    role.isSystem
                      ? 'bg-brand-50 text-brand-600'
                      : 'bg-violet-50 text-violet-600',
                  ].join(' ')}
                >
                  {role.isSystem ? <ShieldCheckIcon size={16} /> : <ShieldIcon size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13.5px] font-bold text-ink-900 truncate">
                      {role.name}
                    </h3>
                    {role.isSystem && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
                        SYSTEM
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-ink-500 mt-0.5 line-clamp-2">
                    {role.description ?? '—'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-ink-100 text-ink-700">
                  {role.permissions.length} permissions
                </span>
                <span className="text-[10.5px] font-mono text-ink-400 px-2 py-0.5">
                  {role.slug}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-ink-100">
                <button
                  onClick={() => router.push(`/dashboard/people/roles/${role.id}`)}
                  className="flex-1 text-[12px] font-semibold text-brand-600 hover:text-brand-700 text-left"
                >
                  {role.slug === 'owner' ? 'View' : 'Edit'} →
                </button>
                {!role.isSystem && (
                  <button
                    onClick={() => handleDelete(role)}
                    disabled={busyId === role.id}
                    className="text-[12px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {busyId === role.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {(
            <Link
              href="/dashboard/people/roles/new"
              className="rounded-2xl border border-dashed border-ink-300 bg-white/50 p-5 flex flex-col items-center justify-center gap-2 hover:border-brand-400 hover:bg-brand-50/40 transition-colors text-center"
            >
              <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <ShieldIcon size={16} />
              </div>
              <p className="text-[12.5px] font-semibold text-ink-700">Create a custom role</p>
              <p className="text-[11px] text-ink-500">For team-specific access patterns</p>
            </Link>
          )}
        </div>
      )}
    </>
  )
}
