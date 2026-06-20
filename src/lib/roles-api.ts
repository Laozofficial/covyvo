import { api } from './api'

export type PermissionDescriptor = { key: string; label: string }

export type PermissionGroup = {
  key: string
  label: string
  description: string
  permissions: PermissionDescriptor[]
}

export type SystemRoleDescriptor = {
  slug: string
  name: string
  description: string
  permissions: string[]
}

export type PermissionCatalog = {
  groups: PermissionGroup[]
  systemRoles: SystemRoleDescriptor[]
}

export type Role = {
  id: string
  tenantId: string
  slug: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export type Membership = {
  id: string
  userId: string
  tenantId: string
  role: string
  roleId: string | null
  roleName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    fullName?: string
    emailVerifiedAt?: string | null
    isActive: boolean
    mustChangePassword?: boolean
  } | null
}

type PagedList<T> = { data: T[]; total: number }

export const rolesApi = {
  catalog: () => api<PermissionCatalog>('/roles/permissions/catalog', { auth: true }),

  list: () => api<PagedList<Role>>('/roles', { auth: true }),

  get: (id: string) => api<Role>(`/roles/${id}`, { auth: true }),

  create: (body: { name: string; description?: string; permissions: string[] }) =>
    api<Role>('/roles', { method: 'POST', body, auth: true }),

  update: (
    id: string,
    body: { name?: string; description?: string; permissions?: string[] },
  ) => api<Role>(`/roles/${id}`, { method: 'PATCH', body, auth: true }),

  remove: (id: string) =>
    api<{ message: string }>(`/roles/${id}`, { method: 'DELETE', auth: true }),
}

export const membershipsApi = {
  list: () => api<PagedList<Membership>>('/memberships', { auth: true }),

  create: (body: {
    fullName: string
    email: string
    password: string
    roleId: string
    jobTitle?: string
  }) =>
    api<Membership>('/memberships', { method: 'POST', body, auth: true }),

  assignRole: (id: string, roleId: string) =>
    api<Membership>(`/memberships/${id}/role`, {
      method: 'PATCH',
      body: { roleId },
      auth: true,
    }),

  resetPassword: (id: string, password: string) =>
    api<{
      message: string
      user: { id: string; email: string; fullName: string }
    }>(`/memberships/${id}/reset-password`, {
      method: 'POST',
      body: { password },
      auth: true,
    }),

  remove: (id: string) =>
    api<{ message: string }>(`/memberships/${id}`, {
      method: 'DELETE',
      auth: true,
    }),
}
