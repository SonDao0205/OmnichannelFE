import { axiosClient } from './axiosClient'
import type { Product } from '../types/product'

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
      { id: 'v1', name: 'Size S', sku: 'AK204-S', price: 489000, costPrice: 280000, stock: 30 },
      { id: 'v2', name: 'Size M', sku: 'AK204-M', price: 489000, costPrice: 280000, stock: 42 },
      { id: 'v3', name: 'Size L', sku: 'AK204-L', price: 489000, costPrice: 280000, stock: 40 },
      { id: 'v4', name: 'Size XL', sku: 'AK204-XL', price: 489000, costPrice: 280000, stock: 30 },
    ],
    price: 489000,
    costPrice: 280000,
    totalStock: 142,
    createdAt: '2026-07-20T10:00:00Z',
  },
  {
    id: 'prod-002',
    code: 'JNS-SLM-952',
    name: 'Quần jeans slim-fit nam chất co giãn xám khói',
    category: 'QUẦN JEAN / DENIM',
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop',
    marketplaces: ['Shopee', 'TikTok Shop'],
    status: 'ACTIVE',
    variants: [
      { id: 'v21', name: 'Size 29', sku: 'JNS952-29', price: 359000, costPrice: 210000, stock: 24 },
      { id: 'v22', name: 'Size 30', sku: 'JNS952-30', price: 359000, costPrice: 210000, stock: 30 },
      { id: 'v23', name: 'Size 31', sku: 'JNS952-31', price: 359000, costPrice: 210000, stock: 30 },
    ],
    price: 359000,
    costPrice: 210000,
    totalStock: 84,
    createdAt: '2026-07-22T14:30:00Z',
  },
  {
    id: 'prod-003',
    code: 'KNT-BSC-001',
    name: 'Áo len dệt kim trơn cổ tròn basic có duyên',
    category: 'ÁO THUN & POLO',
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop',
    marketplaces: ['TikTok Shop'],
    status: 'LOW_STOCK',
    badgeText: 'SẮP CHÁY HÀNG',
    badgeType: 'warning',
    variants: [
      { id: 'v31', name: 'Size S', sku: 'KNT001-S', price: 249000, costPrice: 145000, stock: 1 },
      { id: 'v32', name: 'Size M', sku: 'KNT001-M', price: 249000, costPrice: 145000, stock: 2 },
    ],
    price: 249000,
    costPrice: 145000,
    totalStock: 3,
    createdAt: '2026-07-25T09:15:00Z',
  },
  {
    id: 'prod-004',
    code: 'SNK-STR-2026',
    name: 'Giày sneaker nam phong cách Streetwear mẫu 2026',
    category: 'PHỤ KIỆN / GIÀY DÉP',
    imageUrl: '',
    marketplaces: [],
    status: 'DRAFT',
    badgeText: 'BẢN NHÁP / CHƯA HOẠT ĐỘNG',
    badgeType: 'draft',
    variants: [],
    price: 0,
    costPrice: 0,
    totalStock: 0,
    createdAt: '2026-07-28T08:00:00Z',
  },
]

export const productApi = {
  fetchProducts: async (): Promise<Product[]> => {
    try {
      const res = await axiosClient.get<any>('/products')
      return Array.isArray(res) ? res : res?.data || INITIAL_PRODUCTS
    } catch {
      return INITIAL_PRODUCTS
    }
  },

  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    try {
      const res = await axiosClient.post<Product>('/products', productData)
      return res as unknown as Product
    } catch {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        code: productData.code || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: productData.name || 'Sản phẩm mới',
        category: productData.category || 'THỜI TRANG / KHÁC',
        imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=600&auto=format&fit=crop',
        marketplaces: productData.marketplaces || ['Shopee'],
        status: (productData.totalStock ?? 0) > 0 ? 'ACTIVE' : 'DRAFT',
        variants: productData.variants || [],
        price: productData.price || 0,
        costPrice: productData.costPrice || 0,
        totalStock: productData.totalStock || 0,
        createdAt: new Date().toISOString(),
      }
      return newProd
    }
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    try {
      const res = await axiosClient.put<Product>(`/products/${id}`, productData)
      return res as unknown as Product
    } catch {
      return { id, ...productData } as Product
    }
  },

  deleteProduct: async (id: string): Promise<string> => {
    try {
      await axiosClient.delete(`/products/${id}`)
      return id
    } catch {
      return id
    }
  },

  syncMarketplaces: async (): Promise<boolean> => {
    try {
      await axiosClient.post('/products/sync')
      return true
    } catch {
      return true
    }
  },
}
