import { authErrorMessage, csrfHeader, managementApi } from './authApi'
import type {
  MarketplaceAuthorization,
  MarketplaceCode,
  MarketplaceConnection,
} from '../types/marketplace'

export interface MarketplaceSyncResult {
  accounts: number
  products: number
  variants: number
  pushedProducts: number
  pushedVariants: number
  orders: number
  orderItems: number
  archivedProducts: number
  archivedVariants: number
  failures: number
  pullFailures: number
  pushFailures: number
  shopResults: MarketplaceShopSyncResult[]
  completedAt: string
}

export interface MarketplaceSyncRequest {
  productIds: string[]
  marketplaceAccountIds: string[]
  allProducts: boolean
}

export interface MarketplaceShopSyncResult {
  accountId: string
  marketplace: MarketplaceCode | 'UNKNOWN'
  externalAccountId: string
  shopName: string
  status: 'SUCCEEDED' | 'PARTIAL' | 'FAILED' | 'SKIPPED'
  pullStatus: 'SUCCEEDED' | 'PARTIAL' | 'FAILED' | 'SKIPPED'
  pushStatus: 'SUCCEEDED' | 'PARTIAL' | 'FAILED' | 'SKIPPED'
  products: number
  variants: number
  pushedProducts: number
  pushedVariants: number
  orders: number
  orderItems: number
  archivedProducts: number
  archivedVariants: number
  errorCode: string | null
  errorMessage: string | null
  pullErrorMessage: string | null
  pushErrorMessage: string | null
  completedAt: string
}

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

  async syncAll(request?: MarketplaceSyncRequest): Promise<MarketplaceSyncResult> {
    const headers = await csrfHeader()
    const { data } = await managementApi.post<MarketplaceSyncResult>(
      '/api/marketplace-connections/sync',
      request,
      { headers },
    )
    return data
  },

  async syncAccount(accountId: string): Promise<MarketplaceSyncResult> {
    const headers = await csrfHeader()
    const { data } = await managementApi.post<MarketplaceSyncResult>(
      `/api/marketplace-connections/${accountId}/sync`,
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
