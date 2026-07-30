import { AxiosError } from 'axios'
import { managementApi } from './authApi'
import type { ApiProblem } from '../types/auth'

export type StaffUser = {
  id: string
  email: string
  displayName: string
  phoneNumber?: string
  roles: string[]
  status: 'ACTIVE' | 'LOCKED'
  createdAt: string
}

export type CreateStaffPayload = {
  email: string
  displayName: string
  phoneNumber?: string
  password?: string
}

export type UpdateStaffPayload = {
  displayName: string
  phoneNumber?: string
  status?: 'ACTIVE' | 'LOCKED'
}

// Helper to refresh CSRF cookie if required by Spring Security
async function csrfHeader(): Promise<Record<string, string>> {
  try {
    await managementApi.get('/api/auth/csrf')
  } catch {
    // Ignore error, let Axios attempt request
  }
  return {}
}

export const staffApi = {
  async getStaffList(): Promise<StaffUser[]> {
    const { data } = await managementApi.get<StaffUser[]>('/api/staff')
    return data
  },

  async createStaff(payload: CreateStaffPayload): Promise<StaffUser> {
    const headers = await csrfHeader()
    const { data } = await managementApi.post<StaffUser>(
      '/api/staff',
      payload,
      { headers }
    )
    return data
  },

  async updateStaff(id: string, payload: UpdateStaffPayload): Promise<StaffUser> {
    const headers = await csrfHeader()
    const { data } = await managementApi.put<StaffUser>(
      `/api/staff/${id}`,
      payload,
      { headers }
    )
    return data
  },

  async toggleStaffStatus(id: string, newStatus: 'ACTIVE' | 'LOCKED'): Promise<StaffUser> {
    const headers = await csrfHeader()
    const { data } = await managementApi.patch<StaffUser>(
      `/api/staff/${id}/status`,
      { status: newStatus },
      { headers }
    )
    return data
  },

  async deleteStaff(id: string): Promise<void> {
    const headers = await csrfHeader()
    await managementApi.delete(`/api/staff/${id}`, { headers })
  },

  async resetPassword(id: string, payload: { password?: string }): Promise<void> {
    const headers = await csrfHeader()
    await managementApi.post(`/api/staff/${id}/reset-password`, payload, { headers })
  },
}

export function staffErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (error instanceof AxiosError) {
    const problem = error.response?.data as ApiProblem | undefined
    if (problem?.detail) {
      return problem.detail
    }
  }
  return 'Đã có lỗi xảy ra khi thao tác với dữ liệu nhân viên.'
}
