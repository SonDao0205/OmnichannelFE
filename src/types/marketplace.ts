export type MarketplaceCode = 'TIKTOK_SHOP' | 'LAZADA'

export type MarketplaceConnection = {
  id: string
  marketplace: MarketplaceCode
  marketplaceName: string
  externalAccountId: string
  shopName: string
  siteId: string
  currency: string
  timezoneName: string
  status: 'CONNECTED' | 'EXPIRED' | 'REVOKED' | 'ERROR' | 'DISABLED'
  authorizedAt: string | null
  tokenExpiresAt: string | null
  lastVerifiedAt: string | null
  scopes: string[]
}

export type MarketplaceAuthorization = {
  marketplace: MarketplaceCode
  authorizationUrl: string
  expiresAt: string
}
