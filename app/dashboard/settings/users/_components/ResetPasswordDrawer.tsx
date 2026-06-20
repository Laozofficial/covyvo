'use client'

import { FormEvent, useEffect, useState } from 'react'
import { CredentialsCard } from '../../../../../src/components/CredentialsCard'
import { Alert } from '../../../../../src/components/ui/Alert'
import { Button } from '../../../../../src/components/ui/Button'
import { Drawer } from '../../../../../src/components/ui/Drawer'
import { PasswordField } from '../../../../../src/components/ui/PasswordField'
import { ApiError } from '../../../../../src/lib/api'
import { Membership, membershipsApi } from '../../../../../src/lib/roles-api'
import {
  passwordHint,
  validatePassword,
} from '../../../../../src/lib/validation'
import { generatePassword } from './InviteUserDrawer'

type Props = {
  open: boolean
  onClose: () => void
  membership: Membership | null
}

export function ResetPasswordDrawer({ open, onClose, membership }: Props) {
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{
    email: string
    password: string
    name: string
  } | null>(null)

  useEffect(() => {
    if (!open) return
    setPassword(generatePassword())
    setErrors({})
    setFormError(null)
    setSuccess(null)
  }, [open, membership])

  function validate() {
    const next: Record<string, string> = {}
    if (!validatePassword(password)) next.password = passwordHint
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
    if (!membership) return
    if (!validate()) return
    setLoading(true)
    try {
      const result = await membershipsApi.resetPassword(membership.id, password)
      setSuccess({
        email: result.user.email,
        password,
        name: result.user.fullName,
      })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!membership) return null

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={success ? 'Password reset' : 'Reset password'}
      description={
        success
          ? `${success.name} will be required to set a new password on their next sign-in. Share the temporary password below.`
          : `Set a new temporary password for ${membership.user?.fullName ?? membership.user?.email ?? 'this user'}. They'll be forced to change it on next login.`
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
              form="reset-password-form"
              loading={loading}
              disabled={!password}
            >
              Reset password
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
            title="New credentials"
            hint="They'll be forced to set a new password the first time they sign in."
          />
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
            <p className="text-[11.5px] font-semibold text-amber-800">
              Save the password now
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
              We won't show it again.
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
            id="reset-password-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="rounded-xl bg-ink-50 border border-ink-200 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                User
              </p>
              <p className="text-[13px] font-semibold text-ink-900 mt-0.5">
                {membership.user?.fullName ?? membership.user?.email ?? 'Unknown user'}
              </p>
              <p className="text-[11.5px] text-ink-500">
                {membership.user?.email}
              </p>
            </div>

            <div className="space-y-1.5">
              <PasswordField
                label="New temporary password"
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
          </form>
        </>
      )}
    </Drawer>
  )
}
