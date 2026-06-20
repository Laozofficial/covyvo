'use client'

import { useEffect, useState } from 'react'
import { EmptyState } from '../../../../src/components/EmptyState'
import { PageHeader } from '../../../../src/components/PageHeader'
import { Alert } from '../../../../src/components/ui/Alert'
import { Button } from '../../../../src/components/ui/Button'
import { UsersIcon } from '../../../../src/components/ui/icons'
import { ApiError } from '../../../../src/lib/api'
import { Membership, Role, membershipsApi, rolesApi } from '../../../../src/lib/roles-api'
import { storage } from '../../../../src/lib/storage'
import { AuthUser } from '../../../../src/lib/auth-api'
import { InviteUserDrawer } from './_components/InviteUserDrawer'
import { ResetPasswordDrawer } from './_components/ResetPasswordDrawer'

export default function UsersPage() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [me, setMe] = useState<AuthUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<Membership | null>(null)

  useEffect(() => {
    setMe(storage.getActiveUser<AuthUser>())
    Promise.all([membershipsApi.list(), rolesApi.list()])
      .then(([m, r]) => {
        setMemberships(m.data ?? [])
        setRoles(r.data ?? [])
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load users'),
      )
      .finally(() => setLoading(false))
  }, [])

  async function handleRoleChange(membership: Membership, roleId: string) {
    if (!roleId || roleId === membership.roleId) return
    setBusy(membership.id)
    setError(null)
    setSuccess(null)
    try {
      const updated = await membershipsApi.assignRole(membership.id, roleId)
      setMemberships((all) =>
        all.map((m) =>
          m.id === membership.id
            ? {
                ...m,
                roleId: updated.roleId,
                role: updated.role,
                roleName:
                  roles.find((r) => r.id === updated.roleId)?.name ?? updated.role,
              }
            : m,
        ),
      )
      setSuccess('Role updated')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update role')
    } finally {
      setBusy(null)
    }
  }

  async function handleRemove(membership: Membership) {
    if (!confirm(`Remove ${membership.user?.email ?? 'this user'} from this workspace?`)) return
    setBusy(membership.id)
    setError(null)
    setSuccess(null)
    try {
      await membershipsApi.remove(membership.id)
      setMemberships((all) => all.filter((m) => m.id !== membership.id))
      setSuccess('User removed')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove user')
    } finally {
      setBusy(null)
    }
  }

  function initials(email?: string, name?: string) {
    return (name ?? email ?? '?')
      .split(/[\s@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('')
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Invite teammates and assign roles. Their permissions update on their next sign-in."
        actions={<Button onClick={() => setDrawerOpen(true)}>Add user</Button>}
      />

      <InviteUserDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        roles={roles.filter((r) => r.slug !== 'owner')}
        onCreated={(m) => {
          setMemberships((prev) => [m, ...prev])
          setSuccess(`${m.user?.email ?? 'User'} added`)
        }}
      />

      <ResetPasswordDrawer
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        membership={resetTarget}
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

      {loading ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        </div>
      ) : memberships.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Just you for now"
          description="Invite teammates to start collaborating."
        />
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-ink-50/60 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {memberships.map((m) => {
                const isMe = m.userId === me?.id
                const isOwner = m.role === 'owner'
                return (
                  <tr key={m.id} className="text-[12.5px]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px] font-bold">
                          {initials(m.user?.email, m.user?.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900 truncate">
                            {m.user?.fullName ?? m.user?.email}
                            {isMe && (
                              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-ink-100 text-ink-500">
                                YOU
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-ink-500 truncate">
                            {m.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {!isOwner ? (
                        <select
                          value={m.roleId ?? ''}
                          onChange={(e) => handleRoleChange(m, e.target.value)}
                          disabled={busy === m.id}
                          className="h-9 rounded-lg border border-ink-200 bg-white px-2 text-[12px] font-semibold text-ink-800 focus:outline-none focus:border-brand-500 disabled:opacity-50"
                        >
                          {roles
                            .filter((r) => r.slug !== 'owner')
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <span className="text-[12px] font-semibold text-ink-700">
                          {m.roleName}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const pending =
                          m.isActive && m.user?.mustChangePassword === true
                        const tone = !m.isActive
                          ? 'inactive'
                          : pending
                          ? 'pending'
                          : 'active'
                        const styles = {
                          active: {
                            chip: 'bg-emerald-50 text-emerald-700',
                            dot: 'bg-emerald-500',
                            label: 'Active',
                          },
                          pending: {
                            chip: 'bg-amber-50 text-amber-700',
                            dot: 'bg-amber-500',
                            label: 'Invite pending',
                          },
                          inactive: {
                            chip: 'bg-ink-100 text-ink-500',
                            dot: 'bg-ink-400',
                            label: 'Inactive',
                          },
                        }[tone]
                        return (
                          <span
                            title={
                              tone === 'pending'
                                ? "Hasn't signed in and set a new password yet"
                                : undefined
                            }
                            className={[
                              'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md',
                              styles.chip,
                            ].join(' ')}
                          >
                            <span
                              className={[
                                'h-1.5 w-1.5 rounded-full',
                                styles.dot,
                                tone === 'pending' ? 'animate-pulse' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            />
                            {styles.label}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isOwner && !isMe ? (
                        <div className="inline-flex items-center gap-3">
                          <button
                            onClick={() => setResetTarget(m)}
                            disabled={busy === m.id}
                            className="text-[12px] font-semibold text-ink-600 hover:text-ink-900 disabled:opacity-50"
                          >
                            Reset password
                          </button>
                          <span className="text-ink-300">·</span>
                          <button
                            onClick={() => handleRemove(m)}
                            disabled={busy === m.id}
                            className="text-[12px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {busy === m.id ? 'Working…' : 'Remove'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-ink-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
