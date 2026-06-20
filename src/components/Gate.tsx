'use client'

import { ReactNode } from 'react'
import { Permission } from '../lib/permissions'
import { usePermissions } from '../lib/usePermissions'

type Props = {
  permission?: Permission | string
  any?: Array<Permission | string>
  all?: Array<Permission | string>
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Hides children unless the active user holds the required permission(s).
 *
 *   <Gate permission={PERMISSIONS.PAYROLL_RUN}>
 *     <Button>Start payroll run</Button>
 *   </Gate>
 *
 *   <Gate any={[PERMISSIONS.JOURNALS_CREATE, PERMISSIONS.JOURNALS_POST]}>
 *     ...
 *   </Gate>
 */
export function Gate({ permission, any, all, fallback = null, children }: Props) {
  const { has, hasAny, hasAll } = usePermissions()

  const allowed =
    (permission ? has(permission) : true) &&
    (any && any.length > 0 ? hasAny(any) : true) &&
    (all && all.length > 0 ? hasAll(all) : true)

  return <>{allowed ? children : fallback}</>
}
