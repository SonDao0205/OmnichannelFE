export type MarketplaceType = 'Shopee' | 'Lazada' | 'TikTok Shop'

export type ProductStatus = 'ACTIVE' | 'OUT_OF_STOCK' | 'DRAFT' | 'LOW_STOCK'

export interface ProductVariant {
  id: string
  name: string
  sku: string
  price: number
  costPrice: number
  stock: number
}

export interface Product {
  id: string
  code: string
  name: string
  category: string
  imageUrl: string
  marketplaces: MarketplaceType[]
  status: ProductStatus
  badgeText?: string
  badgeType?: 'hot' | 'warning' | 'draft'
  variants: ProductVariant[]
  price: number
  costPrice: number
  totalStock: number
  description?: string
  createdAt?: string
}

export interface ProductFilter {
  tab: 'ALL' | 'ACTIVE' | 'OUT_OF_STOCK' | 'DRAFT'
  viewMode: 'grid' | 'table'
  search: string
  page: number
  pageSize: number
}
