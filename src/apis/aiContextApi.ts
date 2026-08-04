import { authErrorMessage, csrfHeader, managementApi } from './authApi'
import type {
  AiShopContext,
  AiShopContextPayload,
} from '../types/aiContext'

export const aiContextApi = {
  async list(shopId: string): Promise<AiShopContext[]> {
    const { data } = await managementApi.get<AiShopContext[]>('/api/ai-contexts', {
      params: { shopId },
    })
    return data
  },

  async create(payload: AiShopContextPayload): Promise<AiShopContext> {
    const headers = await csrfHeader()
    const { data } = await managementApi.post<AiShopContext>(
      '/api/ai-contexts',
      payload,
      { headers },
    )
    return data
  },

  async update(
    contextId: string,
    payload: AiShopContextPayload,
  ): Promise<AiShopContext> {
    const headers = await csrfHeader()
    const { data } = await managementApi.put<AiShopContext>(
      `/api/ai-contexts/${contextId}`,
      payload,
      { headers },
    )
    return data
  },

  async setActive(contextId: string, active: boolean): Promise<AiShopContext> {
    const headers = await csrfHeader()
    const { data } = await managementApi.patch<AiShopContext>(
      `/api/ai-contexts/${contextId}/activation`,
      { active },
      { headers },
    )
    return data
  },

  async delete(contextId: string): Promise<void> {
    const headers = await csrfHeader()
    await managementApi.delete(`/api/ai-contexts/${contextId}`, { headers })
  },
}

export const aiContextErrorMessage = authErrorMessage
