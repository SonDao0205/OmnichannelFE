import { AxiosError } from 'axios'
import { managementApi } from './authApi'
import type { ApiProblem } from '../types/auth'

export type Customer = {
  id: string
  customerCode: string
  displayName: string
  phoneNumber?: string
  email?: string
  identityStatus: 'UNVERIFIED' | 'VERIFIED' | 'MERGED'
  createdAt: string
  hasPotentialDuplicates: boolean
  totalOrders?: number
  totalSpend?: number
}

export type LinkedChannel = {
  linkId: string
  marketplaceCustomerId: string
  channelName: string
  accountName: string
  buyerName: string
  avatarUrl?: string
  phoneMasked?: string
  emailMasked?: string
  verificationStatus: string
  linkedAt: string
}

export type CustomerMetrics = {
  totalOrders: number
  totalSpend: number
  lastChannelSeen: string
}

export type CustomerDetail = {
  id: string
  customerCode: string
  displayName: string
  phoneNumber?: string
  email?: string
  identityStatus: 'UNVERIFIED' | 'VERIFIED' | 'MERGED'
  createdAt: string
  updatedAt: string
  mergedIntoId?: string
  linkedChannels: LinkedChannel[]
  metrics: CustomerMetrics
}

export type CustomerInteraction = {
  eventId: string
  eventName: string
  marketplaceCode: string
  marketplaceAccountName: string
  screen?: string
  entityType?: string
  entityExternalId?: string
  propertiesJson: string
  occurredAt: string
}

export type CreateCustomerPayload = {
  displayName: string
  phoneNumber?: string
  email?: string
}

export type UpdateCustomerPayload = {
  displayName: string
  phoneNumber?: string
  email?: string
}

export type MergeCustomersPayload = {
  sourceCustomerId: string
  targetCustomerId: string
  selectedDisplayName: string
  selectedPhone?: string
  selectedEmail?: string
}

export type PageResponse<T> = {
  content: T[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

// Helper to refresh CSRF cookie if required
async function csrfHeader(): Promise<Record<string, string>> {
  try {
    await managementApi.get('/api/auth/csrf')
  } catch {
    // Ignore error
  }
  return {}
}

export const customerApi = {
  async getCustomerList(params: {
    search?: string
    status?: string
    page?: number
    size?: number
  }): Promise<PageResponse<Customer>> {
    const { data } = await managementApi.get<PageResponse<Customer>>('/api/customers', {
      params,
    })
    return data
  },

  async getCustomerDetail(id: string): Promise<CustomerDetail> {
    const { data } = await managementApi.get<CustomerDetail>(`/api/customers/${id}`)
    return data
  },

  async createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
    const headers = await csrfHeader()
    const { data } = await managementApi.post<Customer>('/api/customers', payload, {
      headers,
    })
    return data
  },

  async updateCustomer(id: string, payload: UpdateCustomerPayload): Promise<Customer> {
    const headers = await csrfHeader()
    const { data } = await managementApi.put<Customer>(`/api/customers/${id}`, payload, {
      headers,
    })
    return data
  },

  async deleteCustomer(id: string): Promise<void> {
    const headers = await csrfHeader()
    await managementApi.delete(`/api/customers/${id}`, { headers })
  },

  async getPotentialDuplicates(id: string): Promise<Customer[]> {
    const { data } = await managementApi.get<Customer[]>(`/api/customers/${id}/duplicates`)
    return data
  },

  async getInteractions(id: string): Promise<CustomerInteraction[]> {
    const { data } = await managementApi.get<CustomerInteraction[]>(
      `/api/customers/${id}/interactions`
    )
    return data
  },

  async mergeCustomers(payload: MergeCustomersPayload): Promise<void> {
    const headers = await csrfHeader()
    await managementApi.post('/api/customers/merge', payload, { headers })
  },
}

export function customerErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const problem = error.response?.data as ApiProblem | undefined
    if (problem?.detail) {
      return problem.detail
    }
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Đã có lỗi xảy ra khi thao tác dữ liệu khách hàng.'
}
