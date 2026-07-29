export type AuthUser = {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
}

export type AuthTenant = {
  id: string
  code: string
  name: string
}

export type AuthSession = {
  user: AuthUser
  tenant: AuthTenant
  roles: string[]
  permissions: string[]
  mustChangePassword: boolean
  expiresAt: string
}

export type LoginCredentials = {
  email: string
  password: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type ApiProblem = {
  detail?: string
  code?: string
  fieldErrors?: Record<string, string>
}
