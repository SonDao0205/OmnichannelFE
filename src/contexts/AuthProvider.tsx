import { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '../apis/authApi'
import type {
  AuthSession,
  ChangePasswordPayload,
  LoginCredentials,
} from '../types/auth'
import { AuthContext } from './authContext'

type AuthProviderProps = {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    authApi
      .me()
      .then((currentSession) => {
        if (active) setSession(currentSession)
      })
      .catch(() => {
        if (active) setSession(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const authenticatedSession = await authApi.login(credentials)
    setSession(authenticatedSession)
    return authenticatedSession
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setSession(null)
    }
  }, [])

  const changePassword = useCallback(
    async (payload: ChangePasswordPayload) => {
      const updatedSession = await authApi.changePassword(payload)
      setSession(updatedSession)
      return updatedSession
    },
    [],
  )

  const value = useMemo(
    () => ({
      session,
      isLoading,
      login,
      changePassword,
      logout,
      hasPermission: (permission: string) =>
        session?.permissions.includes(permission) ?? false,
      hasRole: (role: string) => session?.roles.includes(role) ?? false,
    }),
    [changePassword, isLoading, login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
