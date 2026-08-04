import { managementApi } from './authApi'
import type { Product, ProductMedia, ProductVariant } from '../types/product'
import { marketplaceApi } from './marketplaceApi'

// ─── Kiểu dữ liệu trả về từ Backend Spring Boot ────────────────────────────

interface BackendVariant {
  id: string
  sku: string
  variantName: string
  color?: string | null
  size?: string | null
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
  updatedAt: string
  variants: BackendVariant[]
  media?: ProductMedia[]
  marketplaceAccountIds?: string[]
}

interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function storedStatus(status: Product['status'] | undefined) {
  return status === 'LOW_STOCK' || status === 'OUT_OF_STOCK' ? 'ACTIVE' : status
}

// ─── Map Backend → Frontend ──────────────────────────────────────────────────

function mapVariant(v: BackendVariant): ProductVariant {
  return {
    id: v.id,
    name: v.variantName || v.sku,
    sku: v.sku,
    color: v.color || '',
    size: v.size || '',
    price: v.price,
    costPrice: 0,
    stock: v.stockQuantity,
  }
}

function mapProduct(p: BackendProduct): Product {
  return {
    id: p.id,
    code: p.productCode || '',
    name: p.name,
    category: p.category || '',
    imageUrl: p.imageUrl || '',
    marketplaces: [],
    marketplaceAccountIds: p.marketplaceAccountIds ?? [],
    status: (p.status as Product['status']) || 'ACTIVE',
    variants: (p.variants || []).map(mapVariant),
    media: p.media || [],
    price: p.price,
    costPrice: p.costPrice,
    totalStock: p.totalStock,
    minStockAlert: p.minStockAlert ?? 5,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const productApi = {
  queueMarketplaceSync: async (request: {
    allProducts: boolean
    productIds: string[]
    marketplaceAccountIds: string[]
  }): Promise<{ products: number; shops: number; queuedMappings: number }> => {
    const res = await managementApi.post<{
      products: number
      shops: number
      queuedMappings: number
    }>('/api/v1/products/marketplace-sync', request)
    return res.data
  },

  /** Lấy danh sách sản phẩm của tenant (có hỗ trợ tìm kiếm + lọc trạng thái) */
  fetchProducts: async (search = '', status = '', page = 0, size = 50): Promise<Product[]> => {
    const params: Record<string, string | number> = { page, size }
    if (search) params.search = search
    if (status && status !== 'ALL') params.status = status
    const res = await managementApi.get<SpringPage<BackendProduct>>('/api/v1/products', { params })
    const data = res.data
    const list = Array.isArray(data) ? data : (data?.content ?? [])
    return list.map(mapProduct)
  },

  /** Lấy toàn bộ sản phẩm theo từng trang, tuân thủ giới hạn 100 bản ghi của backend. */
  fetchAllProducts: async (): Promise<Product[]> => {
    const pageSize = 100
    const products: Product[] = []
    for (let page = 0; page < 1_000; page += 1) {
      const batch = await productApi.fetchProducts('', '', page, pageSize)
      products.push(...batch)
      if (batch.length < pageSize) return products
    }
    throw new Error('Số lượng sản phẩm vượt giới hạn tải kho an toàn.')
  },

  /** Tạo sản phẩm mới */
  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    const body = {
      name: productData.name,
      productCode: productData.code,
      category: productData.category,
      description: productData.description,
      price: productData.price ?? 0,
      costPrice: productData.costPrice ?? 0,
      totalStock: productData.totalStock ?? 0,
      minStockAlert: productData.minStockAlert ?? 5,
      imageUrl: productData.imageUrl,
      status: storedStatus(productData.status),
      variants: (productData.variants ?? []).map((v) => ({
        sku: v.sku,
        variantName: v.name,
        color: v.color || null,
        size: v.size || null,
        price: v.price,
        stockQuantity: v.stock,
      })),
    }
    const res = await managementApi.post<BackendProduct>('/api/v1/products', body)
    return mapProduct(res.data)
  },

  /** Cập nhật sản phẩm */
  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    const body = {
      name: productData.name,
      productCode: productData.code,
      category: productData.category,
      description: productData.description,
      price: productData.price ?? 0,
      costPrice: productData.costPrice ?? 0,
      totalStock: productData.totalStock ?? 0,
      minStockAlert: productData.minStockAlert ?? 5,
      imageUrl: productData.imageUrl,
      status: storedStatus(productData.status),
      variants: (productData.variants ?? []).map((v) => ({
        sku: v.sku,
        variantName: v.name,
        color: v.color || null,
        size: v.size || null,
        price: v.price,
        stockQuantity: v.stock,
      })),
    }
    const res = await managementApi.put<BackendProduct>(`/api/v1/products/${id}`, body)
    return mapProduct(res.data)
  },

  uploadMedia: async (productId: string, files: File[]): Promise<ProductMedia[]> => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    const res = await managementApi.post<ProductMedia[]>(
      `/api/v1/products/${productId}/media`,
      formData,
      // Cloudinary có thể mất hơn hai phút với nhiều file. Chỉ kết thúc request
      // khi backend đã tải xong toàn bộ media hoặc trả về lỗi thực sự.
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
      },
    )
    return res.data
  },

  reorderMedia: async (
    productId: string,
    media: Array<{ id: string; primary: boolean }>,
  ): Promise<ProductMedia[]> => {
    const res = await managementApi.put<ProductMedia[]>(
      `/api/v1/products/${productId}/media/order`,
      {
        items: media.map((item, index) => ({
          mediaId: item.id,
          sortOrder: index,
          primary: item.primary,
        })),
      },
    )
    return res.data
  },

  deleteMedia: async (productId: string, mediaId: string): Promise<void> => {
    await managementApi.delete(`/api/v1/products/${productId}/media/${mediaId}`)
  },

  /** Xoá mềm sản phẩm */
  deleteProduct: async (id: string): Promise<string> => {
    await managementApi.delete(`/api/v1/products/${id}`)
    return id
  },

  /** Điều chỉnh tồn kho (delta dương = nhập, delta âm = xuất) */
  adjustStock: async (id: string, delta: number, note = '', variantId?: string): Promise<Product> => {
    const res = await managementApi.post<BackendProduct>(`/api/v1/products/${id}/adjust-stock`, {
      delta,
      note,
      variantId,
    })
    return mapProduct(res.data)
  },

  /** Giữ tương thích với code cũ */
  syncMarketplaces: async () => marketplaceApi.syncAll(),
}
