'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { PageHeader } from '../../../../../src/components/PageHeader'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { TextField } from '../../../../../src/components/ui/TextField'
import { ShieldIcon, TagIcon } from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { PermissionCatalog, rolesApi } from '../../../../../src/lib/roles-api'
import { PermissionPicker } from '../_components/PermissionPicker'

export default function NewRolePage() {
  const router = useRouter()
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    rolesApi
      .catalog()
      .then((c) => setCatalog(c))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load catalog'),
      )
      .finally(() => setLoading(false))
  }, [])

  function applyPreset(slug: string) {
    if (!catalog) return
    const def = catalog.systemRoles.find((r) => r.slug === slug)
    if (!def) return
    setPermissions(new Set(def.permissions))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Role name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const role = await rolesApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        permissions: Array.from(permissions),
      })
      router.replace(`/dashboard/people/roles/${role.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create role')
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Create a role"
        description="Pick the permissions this role should have. Start from a system-role preset for a head start."
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
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
          />
          <TextField
            label="Description (optional)"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            icon={<TagIcon />}
          />
        </div>

        {catalog && catalog.systemRoles.length > 0 && (
          <div className="rounded-2xl bg-white border border-ink-200 p-4">
            <p className="text-[12px] font-semibold text-ink-700 mb-2">
              Start from a preset
            </p>
            <div className="flex flex-wrap gap-2">
              {catalog.systemRoles.map((sr) => (
                <button
                  key={sr.slug}
                  type="button"
                  onClick={() => applyPreset(sr.slug)}
                  className="text-[12px] font-semibold rounded-lg border border-ink-200 bg-white px-3 py-1.5 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                >
                  {sr.name}{' '}
                  <span className="text-ink-400 font-medium">
                    ({sr.permissions.length})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13.5px] font-bold text-ink-900">Permissions</h3>
            <p className="text-[11.5px] text-ink-500">
              <span className="font-semibold text-ink-800">{permissions.size}</span>{' '}
              selected
            </p>
          </div>
          {loading || !catalog ? (
            <div className="rounded-2xl border border-ink-200 bg-white p-10 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
            </div>
          ) : (
            <PermissionPicker
              catalog={catalog.groups}
              value={permissions}
              onChange={setPermissions}
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 sticky bottom-4 bg-ink-50/95 backdrop-blur-sm rounded-xl border border-ink-200 p-3 -mx-1">
          <Link
            href="/dashboard/people/roles"
            className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900"
          >
            Cancel
          </Link>
          <Button type="submit" loading={saving} disabled={!name.trim()}>
            Create role
          </Button>
        </div>
      </form>
    </>
  )
}
