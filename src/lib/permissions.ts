/**
 * Mirror of backend libs/common/src/constants/permissions.ts.
 * Keep these strings in lock-step; the backend is source of truth.
 */
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',

  EMPLOYEES_READ: 'employees:read',
  EMPLOYEES_CREATE: 'employees:create',
  EMPLOYEES_UPDATE: 'employees:update',
  EMPLOYEES_DELETE: 'employees:delete',

  DEPARTMENTS_READ: 'departments:read',
  DEPARTMENTS_CREATE: 'departments:create',
  DEPARTMENTS_UPDATE: 'departments:update',
  DEPARTMENTS_DELETE: 'departments:delete',

  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  ROLES_ASSIGN: 'roles:assign',

  ACCOUNTS_READ: 'accounts:read',
  ACCOUNTS_CREATE: 'accounts:create',
  ACCOUNTS_UPDATE: 'accounts:update',
  ACCOUNTS_DELETE: 'accounts:delete',

  JOURNALS_READ: 'journals:read',
  JOURNALS_CREATE: 'journals:create',
  JOURNALS_APPROVE: 'journals:approve',
  JOURNALS_POST: 'journals:post',

  PAYROLL_READ: 'payroll:read',
  PAYROLL_RUN: 'payroll:run',
  PAYROLL_APPROVE: 'payroll:approve',

  PAYROLL_STRUCTURES_READ: 'payroll-structures:read',
  PAYROLL_STRUCTURES_CREATE: 'payroll-structures:create',
  PAYROLL_STRUCTURES_UPDATE: 'payroll-structures:update',
  PAYROLL_STRUCTURES_DELETE: 'payroll-structures:delete',

  TAX_READ: 'tax:read',
  TAX_FILE: 'tax:file',

  BANK_FILES_READ: 'bank-files:read',
  BANK_FILES_GENERATE: 'bank-files:generate',

  AUDIT_READ: 'audit:read',

  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  USERS_READ: 'users:read',
  USERS_INVITE: 'users:invite',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  AI_QUERY: 'ai:query',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
