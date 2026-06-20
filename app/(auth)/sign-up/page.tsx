'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { Alert } from '../../../src/components/ui/Alert'
import { Button } from '../../../src/components/ui/Button'
import { Checkbox } from '../../../src/components/ui/Checkbox'
import { PasswordField } from '../../../src/components/ui/PasswordField'
import { REGISTRATION_STEPS, Stepper } from '../../../src/components/ui/Stepper'
import { TextField } from '../../../src/components/ui/TextField'
import { MailIcon, UserIcon } from '../../../src/components/ui/icons'
import { ApiError } from '../../../src/lib/api'
import { authApi } from '../../../src/lib/auth-api'
import { storage } from '../../../src/lib/storage'
import {
  passwordHint,
  validateEmail,
  validatePassword,
} from '../../../src/lib/validation'

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate() {
    const next: Record<string, string> = {}
    if (!fullName.trim()) next.fullName = 'Full name is required'
    if (!validateEmail(email)) next.email = 'Enter a valid email address'
    if (!validatePassword(password)) next.password = passwordHint
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match'
    if (!acceptedTerms) next.terms = 'Please accept the Terms and Privacy Policy to continue'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return
    setLoading(true)
    try {
      await authApi.startRegistration({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      })
      storage.setPendingEmail(email.trim().toLowerCase())
      router.push('/verify-otp?flow=registration')
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong'
      setFormError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Stepper steps={REGISTRATION_STEPS} current={0} />

      <div className="space-y-1.5">
        <h1 className="text-[19px] font-bold text-ink-900 tracking-tight">
          Create your account
        </h1>
        <p className="text-[12.5px] text-ink-500">
          Use your company email — public domains aren't accepted.
        </p>
      </div>

      {formError && <Alert variant="error">{formError}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Full name"
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          icon={<UserIcon />}
        />
        <TextField
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          icon={<MailIcon />}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={!errors.password ? passwordHint : undefined}
        />
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />

        <Checkbox
          name="terms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          error={errors.terms}
          label={
            <>
              I agree to Covyvo's{' '}
              <Link
                href="/terms"
                target="_blank"
                className="text-brand-600 font-semibold hover:underline"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                target="_blank"
                className="text-brand-600 font-semibold hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </>
          }
        />

        <Button type="submit" fullWidth loading={loading} disabled={!acceptedTerms}>
          Continue
        </Button>
      </form>

      <p className="text-[12.5px] text-ink-500 text-center">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-brand-600 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
