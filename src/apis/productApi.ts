import { authErrorMessage, csrfHeader, managementApi } from './authApi'
import type { Product, ProductVariant } from '../types/product'

interface BackendVariant {
  id: string
  sku: string
  variantName: string
  price: number
  stockQuantity: number
}

interface BackendProduct {
  id: string
  tenantId: string
  name: string
  productCode: string
  category: string
  description: string
  price: number
  costPrice: number
  totalStock: number
  minStockAlert: number
  imageUrl: string
  status: string
  createdAt: string
  variants: BackendVariant[]
  marketplaces: string[]
}

interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface ProductSyncResult {
  productCount: number
  marketplaceCount: number
  importedCount: number
  successCount: number
  errorCount: number
  results: Array<{
    productId: string
    productName: string
    marketplace: string
    marketplaceAccountId: string
    success: boolean
    externalProductId: string | null
    error: string | null
  }>
}

function mapVariant(variant: BackendVariant): ProductVariant {
  return {
    id: variant.id,
    name: variant.variantName || variant.sku,
    sku: variant.sku,
    price: variant.price,
    costPrice: 0,
    stock: variant.stockQuantity,
  }
}

function mapProduct(product: BackendProduct): Product {
  return {
    id: product.id,
    code: product.productCode || '',
    name: product.name,
    category: product.category || '',
    imageUrl: product.imageUrl || '',
    marketplaces: (product.marketplaces || []) as Product['marketplaces'],
    status: (product.status as Product['status']) || 'ACTIVE',
    variants: (product.variants || []).map(mapVariant),
    price: product.price,
    costPrice: product.costPrice,
    totalStock: product.totalStock,
    minStockAlert: product.minStockAlert,
    description: product.description,
    createdAt: product.createdAt,
  }
}

function requestBody(product: Partial<Product>) {
  return {
    name: product.name,
    productCode: product.code,
    category: product.category,
    description: product.description,
    price: product.price ?? 0,
    costPrice: product.costPrice ?? 0,
    totalStock: product.totalStock ?? 0,
    minStockAlert: 5,
    imageUrl: product.imageUrl,
    status: product.status,
    marketplaces: product.marketplaces ?? [],
    variants: (product.variants ?? []).map((variant) => ({
      sku: variant.sku,
      variantName: variant.name,
      price: variant.price,
      stockQuantity: variant.stock,
    })),
  }
}

export const productApi = {
  async fetchProducts(
    search = '',
    status = '',
    page = 0,
    size = 50,
  ): Promise<Product[]> {
    const params: Record<string, string | number> = { page, size }
    if (search) params.search = search
    if (status && status !== 'ALL') params.status = status
    const response = await managementApi.get<SpringPage<BackendProduct>>(
      '/api/v1/products',
      { params },
    )
    const data = response.data
    const list = Array.isArray(data) ? data : (data?.content ?? [])
    return list.map(mapProduct)
  },

  async fetchAllProducts(search = '', status = ''): Promise<Product[]> {
    const products: BackendProduct[] = []
    let page = 0
    while (true) {
      const params: Record<string, string | number> = { page, size: 200 }
      if (search) params.search = search
      if (status && status !== 'ALL') params.status = status
      const response = await managementApi.get<SpringPage<BackendProduct>>(
        '/api/v1/products',
        { params },
      )
      const data = response.data
      if (Array.isArray(data)) {
        products.push(...data)
        break
      }
      products.push(...(data?.content ?? []))
      page += 1
      if (page >= Math.max(1, data?.totalPages ?? 1)) break
    }
    return products.map(mapProduct)
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const headers = await csrfHeader()
    const response = await managementApi.post<BackendProduct>(
      '/api/v1/products',
      requestBody(product),
      { headers },
    )
    return mapProduct(response.data)
  },

  async updateProduct(
    id: string,
    product: Partial<Product>,
  ): Promise<Product> {
    const headers = await csrfHeader()
    const response = await managementApi.put<BackendProduct>(
      `/api/v1/products/${id}`,
      requestBody(product),
      { headers },
    )
    return mapProduct(response.data)
  },

  async deleteProduct(id: string): Promise<string> {
    const headers = await csrfHeader()
    await managementApi.delete(`/api/v1/products/${id}`, { headers })
    return id
  },

  async adjustStock(
    id: string,
    delta: number,
    note = '',
    variantId?: string,
  ): Promise<Product> {
    const headers = await csrfHeader()
    const response = await managementApi.post<BackendProduct>(
      `/api/v1/products/${id}/adjust-stock`,
      { delta, note, variantId },
      { headers },
    )
    return mapProduct(response.data)
  },

  async syncMarketplaces(): Promise<ProductSyncResult> {
    const headers = await csrfHeader()
    const response = await managementApi.post<ProductSyncResult>(
      '/api/v1/products/sync',
      undefined,
      { headers },
    )
    return response.data
  },
}

export function productErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim()) {
    return error
  }
  return authErrorMessage(error)
}
