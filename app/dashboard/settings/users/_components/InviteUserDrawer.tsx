'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CredentialsCard } from '../../../../../src/components/CredentialsCard'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { PasswordField } from '../../../../../src/components/ui/PasswordField'
import { SelectField } from '../../../../../src/components/ui/SelectField'
import { TextField } from '../../../../../src/components/ui/TextField'
import {
  MailIcon,
  ShieldIcon,
  UserIcon,
} from '../../../../../src/components/ui/icons'
import { ApiError } from '../../../../../src/lib/api'
import { Membership, Role, membershipsApi } from '../../../../../src/lib/roles-api'
import {
  passwordHint,
  validateEmail,
  validatePassword,
} from '../../../../../src/lib/validation'

type Props = {
  open: boolean
  onClose: () => void
  roles: Role[]
  onCreated: (m: Membership) => void
}

export function generatePassword(): string {
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '23456789'
  const symbols = '!@#$%^&*'
  const all = lower + upper + digits + symbols
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)]
  const chars = [pick(lower), pick(upper), pick(digits), pick(symbols)]
  for (let i = chars.length; i < 14; i++) chars.push(pick(all))
  return chars.sort(() => Math.random() - 0.5).join('')
}

export function InviteUserDrawer({ open, onClose, roles, onCreated }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Success snapshot — shown after creation so admin can copy credentials.
  const [success, setSuccess] = useState<{
    email: string
    password: string
    name: string
    role: string
  } | null>(null)

  useEffect(() => {
    if (!open) return
    setFullName('')
    setEmail('')
    setPassword('')
    setRoleId(
      roles.find((r) => r.slug === 'member')?.id ?? roles[0]?.id ?? '',
    )
    setErrors({})
    setFormError(null)
    setSuccess(null)
  }, [open, roles])

  function validate() {
    const next: Record<string, string> = {}
    if (!fullName.trim()) next.fullName = 'Full name is required'
    if (!validateEmail(email)) next.email = 'Enter a valid email address'
    if (!validatePassword(password)) next.password = passwordHint
    if (!roleId) next.roleId = 'Pick a role'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleGenerate() {
    setPassword(generatePassword())
    setErrors((e) => ({ ...e, password: '' }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return
    setLoading(true)
    try {
      const created = await membershipsApi.create({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        roleId,
      })
      onCreated(created)
      setSuccess({
        email: created.user?.email ?? email.trim().toLowerCase(),
        password,
        name: created.user?.fullName ?? fullName.trim(),
        role: roles.find((r) => r.id === roleId)?.name ?? 'Member',
      })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create user')
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }))
  const canPreviewCreds = useMemo(
    () => validateEmail(email) && validatePassword(password),
    [email, password],
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={success ? 'User added' : 'Add user'}
      description={
        success
          ? `${success.name} now has ${success.role} access. We sent them an invitation email — copy the credentials below if you'd like to share them directly too.`
          : "Create an account in this workspace and assign a role. We'll email them an invitation; you can also copy the credentials when you're done."
      }
      footer={
        success ? (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900"
            >
              Done
            </button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSuccess(null)}
            >
              Add another
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[12.5px] font-semibold text-ink-600 px-3 py-2 hover:text-ink-900"
            >
              Cancel
            </button>
            <Button
              type="submit"
              form="invite-user-form"
              loading={loading}
              disabled={!fullName.trim() || !email.trim() || !password || !roleId}
            >
              Add user
            </Button>
          </div>
        )
      }
    >
      {success ? (
        <div className="space-y-5">
          <CredentialsCard
            email={success.email}
            password={success.password}
            title="Credentials"
            hint="They'll be forced to set a new password the first time they sign in."
          />
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
            <p className="text-[11.5px] font-semibold text-amber-800">
              Save the password now
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
              We won't show it again. If you forget it before they sign in,
              reset it from the user row.
            </p>
          </div>
        </div>
      ) : (
        <>
          {formError && (
            <div className="mb-4">
              <Alert variant="error">{formError}</Alert>
            </div>
          )}

          <form
            id="invite-user-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <TextField
              label="Full name"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
              icon={<UserIcon />}
              autoComplete="off"
            />
            <TextField
              label="Work email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              icon={<MailIcon />}
              autoComplete="off"
            />
            <div className="space-y-1.5">
              <PasswordField
                label="Temporary password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                hint={!errors.password ? passwordHint : undefined}
                autoComplete="new-password"
              />
              <div className="pl-1">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-[11.5px] font-semibold text-brand-600 hover:underline"
                >
                  Generate strong password
                </button>
              </div>
            </div>
            <SelectField
              label="Role"
              name="roleId"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              options={roleOptions}
              error={errors.roleId}
              icon={<ShieldIcon />}
            />

            {canPreviewCreds && (
              <div className="pt-2 border-t border-ink-100">
                <CredentialsCard
                  email={email.trim().toLowerCase()}
                  password={password}
                  title="Credentials preview"
                  hint="Copy now if you want to share manually too — these match what'll be sent to the user."
                />
              </div>
            )}
          </form>
        </>
      )}
    </Drawer>
  )
}
