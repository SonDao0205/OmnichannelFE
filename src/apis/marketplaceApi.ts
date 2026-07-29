import { authErrorMessage, csrfHeader, managementApi } from './authApi'
import type {
  MarketplaceAuthorization,
  MarketplaceCode,
  MarketplaceConnection,
} from '../types/marketplace'

export const marketplaceApi = {
  async list(): Promise<MarketplaceConnection[]> {
    const { data } = await managementApi.get<MarketplaceConnection[]>(
      '/api/marketplace-connections',
    )
    return data
  },

  async authorize(
    marketplace: MarketplaceCode,
    returnUrl: string,
  ): Promise<MarketplaceAuthorization> {
    const headers = await csrfHeader()
    const { data } = await managementApi.post<MarketplaceAuthorization>(
      '/api/marketplace-connections/authorize',
      { marketplace, returnUrl },
      { headers },
    )
    return data
  },

  async verify(accountId: string): Promise<MarketplaceConnection> {
    const headers = await csrfHeader()
    const { data } = await managementApi.post<MarketplaceConnection>(
      `/api/marketplace-connections/${accountId}/verify`,
      undefined,
      { headers },
    )
    return data
  },

  async refresh(accountId: string): Promise<MarketplaceConnection> {
    const headers = await csrfHeader()
    const { data } = await managementApi.post<MarketplaceConnection>(
      `/api/marketplace-connections/${accountId}/refresh`,
      undefined,
      { headers },
    )
    return data
  },

  async disconnect(accountId: string): Promise<void> {
    const headers = await csrfHeader()
    await managementApi.delete(
      `/api/marketplace-connections/${accountId}`,
      { headers },
    )
  },
}

export const marketplaceErrorMessage = authErrorMessage
