export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DRAFT' | 'LOW_STOCK'

export interface ProductVariant {
  id: string
  name: string
  sku: string
  color?: string
  size?: string
  price: number
  costPrice: number
  stock: number
}

export interface ProductMedia {
  id: string
  mediaType: 'IMAGE' | 'VIDEO'
  storageKey: string
  publicUrl: string
  sortOrder: number
  primary: boolean
  productVariantId?: string | null
  createdAt?: string
}

export interface Product {
  id: string
  code: string
  name: string
  category: string
  imageUrl: string
  marketplaces: string[]
  marketplaceAccountIds: string[]
  status: ProductStatus
  badgeText?: string
  badgeType?: 'hot' | 'warning' | 'draft'
  variants: ProductVariant[]
  media: ProductMedia[]
  price: number
  costPrice: number
  totalStock: number
  minStockAlert: number
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface ProductFilter {
  tab: 'ALL' | 'ACTIVE' | 'OUT_OF_STOCK' | 'DRAFT'
  viewMode: 'grid' | 'table'
  search: string
  page: number
  pageSize: number
}
