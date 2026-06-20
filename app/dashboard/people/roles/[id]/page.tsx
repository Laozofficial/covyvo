'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { PageHeader } from '../../../../../src/components/PageHeader'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { TextField } from '../../../../../src/components/ui/TextField'
import { ShieldIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { PermissionCatalog, Role, rolesApi } from '../../../../../src/lib/roles-api'
import { PermissionPicker } from '../_components/PermissionPicker'

export default function EditRolePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [role, setRole] = useState<Role | null>(null)
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([rolesApi.get(params.id), rolesApi.catalog()])
      .then(([r, c]) => {
        setRole(r)
        setCatalog(c)
        setName(r.name)
        setDescription(r.description ?? '')
        setPermissions(new Set(r.permissions))
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load role'),
      )
      .finally(() => setLoading(false))
  }, [params.id])

  // Only the Owner role is truly read-only (backend enforces).
  // For everything else we let the user attempt the edit and surface a
  // server-side 403 if they don't have permission, instead of greying out
  // the form based on a possibly-stale cached permissions list.
  const readOnly = role?.slug === 'owner'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!role) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await rolesApi.update(role.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        permissions: Array.from(permissions),
      })
      setRole(updated)
      setSuccess('Role saved')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save role')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    )
  }

  if (!role || !catalog) {
    return (
      <>
        <PageHeader title="Role" />
        {error && <Alert variant="error">{error}</Alert>}
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={role.name}
        description={
          role.isSystem
            ? `System role — ${role.slug === 'owner' ? "the Owner role cannot be modified." : 'editable.'}`
            : 'Custom role.'
        }
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
        <div className="rounded-2xl bg-white border border-ink-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Role name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<ShieldIcon />}
            disabled={readOnly}
          />
          <TextField
            label="Description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            icon={<TagIcon />}
            disabled={readOnly}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13.5px] font-bold text-ink-900">Permissions</h3>
            <p className="text-[11.5px] text-ink-500">
              <span className="font-semibold text-ink-800">{permissions.size}</span>{' '}
              selected
            </p>
          </div>
          <PermissionPicker
            catalog={catalog.groups}
            value={permissions}
            onChange={setPermissions}
            disabled={readOnly}
          />
        </div>

        <div className="flex items-center justify-end gap-2 sticky bottom-4 bg-ink-50/95 backdrop-blur-sm rounded-xl border border-ink-200 p-3 -mx-1">
          <Link
            href="/dashboard/people/roles"
            className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900"
          >
            Back to roles
          </Link>
          {!readOnly && (
            <Button type="submit" loading={saving} disabled={!name.trim()}>
              Save changes
            </Button>
          )}
        </div>
      </form>
    </>
  )
}
