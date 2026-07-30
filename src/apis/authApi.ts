import axios, { AxiosError } from 'axios'
import type {
  ApiProblem,
  AuthSession,
  ChangePasswordPayload,
  LoginCredentials,
} from '../types/auth'

export const managementApi = axios.create({
  baseURL:
    import.meta.env.VITE_MANAGEMENT_API_URL ?? 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

type CsrfResponse = {
  headerName: string
  token: string
}

export async function csrfHeader(): Promise<Record<string, string>> {
  await managementApi.get<CsrfResponse>('/api/auth/csrf')
  // Axios reads the raw XSRF-TOKEN cookie and sends X-XSRF-TOKEN.
  // Do not send the BREACH-masked token returned in the JSON body for SPA calls.
  return {}
}

async function fetchVerifiedSession(): Promise<AuthSession> {
  const { data } = await managementApi.get<AuthSession>('/api/auth/me')
  return data
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const headers = await csrfHeader()
    await managementApi.post<AuthSession>(
      '/api/auth/login',
      credentials,
      { headers },
    )
    try {
      // The login response alone only proves that the credentials were valid.
      // /me proves that the HttpOnly cookie was stored and maps to an active,
      // non-expired, non-revoked tenant session with current authorities.
      return await fetchVerifiedSession()
    } catch (verificationError) {
      try {
        const logoutHeaders = await csrfHeader()
        await managementApi.post('/api/auth/logout', undefined, {
          headers: logoutHeaders,
        })
      } catch {
        // Preserve the original verification failure for the login screen.
      }
      throw verificationError
    }
  },

  async me(): Promise<AuthSession> {
    return fetchVerifiedSession()
  },

  async changePassword(
    payload: ChangePasswordPayload,
  ): Promise<AuthSession> {
    const headers = await csrfHeader()
    const { data } = await managementApi.post<AuthSession>(
      '/api/auth/change-password',
      payload,
      { headers },
    )
    return data
  },

  async logout(): Promise<void> {
    const headers = await csrfHeader()
    await managementApi.post('/api/auth/logout', undefined, { headers })
  },
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const problem = error.response?.data as ApiProblem | undefined
    if (problem?.detail) {
      return problem.detail
    }
    if (error.code === 'ECONNABORTED') {
      return 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.'
    }
    if (!error.response) {
      return 'Không thể kết nối đến máy chủ quản lý.'
    }
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
}

export function authFieldErrors(
  error: unknown,
): Partial<Record<'email' | 'password', string>> {
  if (!(error instanceof AxiosError)) {
    return {}
  }

  const problem = error.response?.data as ApiProblem | undefined
  const fieldErrors = problem?.fieldErrors
  if (!fieldErrors) {
    return {}
  }

  return {
    ...(fieldErrors.email ? { email: fieldErrors.email } : {}),
    ...(fieldErrors.password ? { password: fieldErrors.password } : {}),
  }
}
