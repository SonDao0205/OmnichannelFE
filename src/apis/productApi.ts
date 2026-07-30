import { managementApi } from './authApi'
import type { Product, ProductVariant } from '../types/product'

// ─── Kiểu dữ liệu trả về từ Backend Spring Boot ────────────────────────────

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
}

interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// ─── Map Backend → Frontend ──────────────────────────────────────────────────

function mapVariant(v: BackendVariant): ProductVariant {
  return {
    id: v.id,
    name: v.variantName || v.sku,
    sku: v.sku,
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
    status: (p.status as Product['status']) || 'ACTIVE',
    variants: (p.variants || []).map(mapVariant),
    price: p.price,
    costPrice: p.costPrice,
    totalStock: p.totalStock,
    description: p.description,
    createdAt: p.createdAt,
  }
}

// ─── Mock data dự phòng (hiển thị khi chưa bật Backend) ─────────────────────

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    code: 'DNM-OUT-AK204',
    name: 'Áo khoác denim nam dáng rộng AK-204 Vintage Blue',
    category: 'ÁO KHOÁC / OUTERWEAR',
    imageUrl: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=600&auto=format&fit=crop',
    marketplaces: ['Shopee', 'Lazada'],
    status: 'ACTIVE',
    badgeText: 'HOT ITEM',
    badgeType: 'hot',
    variants: [
      { id: 'v1', name: 'Size M', sku: 'AK204-M', price: 489000, costPrice: 280000, stock: 42 },
      { id: 'v2', name: 'Size L', sku: 'AK204-L', price: 489000, costPrice: 280000, stock: 40 },
    ],
    price: 489000,
    costPrice: 280000,
    totalStock: 142,
    createdAt: '2026-07-20T10:00:00Z',
  },
]

// ─── API calls ───────────────────────────────────────────────────────────────

export const productApi = {
  /** Lấy danh sách sản phẩm của tenant (có hỗ trợ tìm kiếm + lọc trạng thái) */
  fetchProducts: async (search = '', status = '', page = 0, size = 50): Promise<Product[]> => {
    try {
      const params: Record<string, string | number> = { page, size }
      if (search) params.search = search
      if (status && status !== 'ALL') params.status = status
      const res = await managementApi.get<SpringPage<BackendProduct>>('/api/v1/products', { params })
      const data = res.data
      const list = Array.isArray(data) ? data : (data?.content ?? [])
      return list.map(mapProduct)
    } catch {
      return INITIAL_PRODUCTS
    }
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
      minStockAlert: 5,
      imageUrl: productData.imageUrl,
      status: productData.status,
      variants: (productData.variants ?? []).map((v) => ({
        sku: v.sku,
        variantName: v.name,
        price: v.price,
        stockQuantity: v.stock,
      })),
    }
    try {
      const res = await managementApi.post<BackendProduct>('/api/v1/products', body)
      return mapProduct(res.data)
    } catch {
      // Fallback: tạo local nếu backend chưa bật
      return {
        id: `prod-${Date.now()}`,
        code: productData.code || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: productData.name || 'Sản phẩm mới',
        category: productData.category || 'THỜI TRANG / KHÁC',
        imageUrl: productData.imageUrl || '',
        marketplaces: productData.marketplaces || [],
        status: (productData.totalStock ?? 0) > 0 ? 'ACTIVE' : 'DRAFT',
        variants: productData.variants || [],
        price: productData.price || 0,
        costPrice: productData.costPrice || 0,
        totalStock: productData.totalStock || 0,
        createdAt: new Date().toISOString(),
      }
    }
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
      minStockAlert: 5,
      imageUrl: productData.imageUrl,
      status: productData.status,
      variants: (productData.variants ?? []).map((v) => ({
        sku: v.sku,
        variantName: v.name,
        price: v.price,
        stockQuantity: v.stock,
      })),
    }
    try {
      const res = await managementApi.put<BackendProduct>(`/api/v1/products/${id}`, body)
      return mapProduct(res.data)
    } catch {
      return { id, ...productData } as Product
    }
  },

  /** Xoá mềm sản phẩm */
  deleteProduct: async (id: string): Promise<string> => {
    try {
      await managementApi.delete(`/api/v1/products/${id}`)
    } catch {
      // fallback: vẫn xoá local
    }
    return id
  },

  /** Điều chỉnh tồn kho (delta dương = nhập, delta âm = xuất) */
  adjustStock: async (id: string, delta: number, note = ''): Promise<Product> => {
    const res = await managementApi.post<BackendProduct>(`/api/v1/products/${id}/adjust-stock`, { delta, note })
    return mapProduct(res.data)
  },

  /** Giữ tương thích với code cũ */
  syncMarketplaces: async (): Promise<boolean> => true,
}
