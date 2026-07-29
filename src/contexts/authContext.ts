import { createContext, useContext } from 'react'
import type {
  AuthSession,
  ChangePasswordPayload,
  LoginCredentials,
} from '../types/auth'

export type AuthContextValue = {
  session: AuthSession | null
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<AuthSession>
  changePassword: (payload: ChangePasswordPayload) => Promise<AuthSession>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
