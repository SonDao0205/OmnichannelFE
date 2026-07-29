import axios, { AxiosError } from 'axios'
import type {
  ApiProblem,
  AuthSession,
  ChangePasswordPayload,
  LoginCredentials,
} from '../types/auth'

const managementApi = axios.create({
  baseURL:
    import.meta.env.VITE_MANAGEMENT_API_URL ?? 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
  withCredentials: true,
})

type CsrfResponse = {
  headerName: string
  token: string
}

async function csrfHeader(): Promise<Record<string, string>> {
  const { data } = await managementApi.get<CsrfResponse>('/api/auth/csrf')
  return { [data.headerName]: data.token }
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const headers = await csrfHeader()
    const { data } = await managementApi.post<AuthSession>(
      '/api/auth/login',
      credentials,
      { headers },
    )
    return data
  },

  async me(): Promise<AuthSession> {
    const { data } = await managementApi.get<AuthSession>('/api/auth/me')
    return data
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
