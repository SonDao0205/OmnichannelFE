import { managementApi } from './authApi'
import type { Order, OrderItem, OrderStatus } from '../types/order'

// ─── Kiểu trả về từ Backend ──────────────────────────────────────────────────

interface BackendOrderItem {
  id: string
  productName: string
  sku: string
  variantName: string
  price: number
  quantity: number
}

interface BackendOrder {
  id: string
  tenantId: string
  orderCode: string
  externalOrderId: string
  marketplace: string
  customerName: string
  customerPhone: string
  shippingAddressJson: string
  totalAmount: number
  shippingFee: number
  discountAmount: number
  finalAmount: number
  paymentStatus: string
  status: string
  items: BackendOrderItem[]
  createdAt: string
  updatedAt?: string
}

interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface OrderPage {
  content: Order[]
  totalElements: number
  totalPages: number
  page: number
  pageSize: number
}

export interface OrderStats {
  total: number
  byStatus: Record<string, number>
}

// ─── Map Backend → Frontend ──────────────────────────────────────────────────

function mapItem(i: BackendOrderItem): OrderItem {
  return {
    id: i.id,
    productName: i.productName,
    sku: i.sku || '',
    quantity: i.quantity,
    price: i.price,
    variantName: i.variantName,
  }
}

function parseAddress(json: string | undefined) {
  if (!json) return { recipientName: '', phoneNumber: '', fullAddress: '', city: '' }
  try { return JSON.parse(json) } catch { return { recipientName: '', phoneNumber: '', fullAddress: json, city: '' } }
}

function mapOrder(o: BackendOrder): Order {
  return {
    id: o.id,
    orderCode: o.orderCode,
    externalOrderId: o.externalOrderId || '',
    marketplace: (o.marketplace || 'MANUAL') as Order['marketplace'],
    customerName: o.customerName,
    customerPhone: o.customerPhone || '',
    items: (o.items || []).map(mapItem),
    totalAmount: o.totalAmount,
    shippingFee: o.shippingFee ?? 0,
    discountAmount: o.discountAmount,
    finalAmount: o.finalAmount,
    status: o.status as OrderStatus,
    paymentStatus: (o.paymentStatus === 'PAID' ? 'PAID' : o.paymentStatus === 'REFUNDED' ? 'REFUNDED' : 'UNPAID') as Order['paymentStatus'],
    shippingAddress: parseAddress(o.shippingAddressJson),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const orderApi = {
  /** Lấy danh sách đơn hàng (tìm kiếm + lọc trạng thái) */
  fetchOrders: async (search = '', status = '', page = 0, size = 50): Promise<OrderPage> => {
    const params: Record<string, string | number> = { page, size }
    if (search) params.search = search
    if (status && status !== 'ALL') params.status = status
    const res = await managementApi.get<SpringPage<BackendOrder>>('/api/v1/orders', { params })
    const data = res.data
    const list = Array.isArray(data) ? data : (data?.content ?? [])
    return {
      content: list.map(mapOrder),
      totalElements: Array.isArray(data) ? data.length : data.totalElements,
      totalPages: Array.isArray(data) ? 1 : data.totalPages,
      page: Array.isArray(data) ? 0 : data.number,
      pageSize: Array.isArray(data) ? size : data.size,
    }
  },

  fetchStats: async (): Promise<OrderStats> => {
    const res = await managementApi.get<OrderStats>('/api/v1/orders/stats')
    return res.data
  },

  /** Lấy chi tiết một đơn hàng */
  getOrder: async (id: string): Promise<Order> => {
    const res = await managementApi.get<BackendOrder>(`/api/v1/orders/${id}`)
    return mapOrder(res.data)
  },

  /** Cập nhật trạng thái đơn hàng - backend dùng PUT /{id}/status */
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
    const res = await managementApi.put<BackendOrder>(`/api/v1/orders/${orderId}/status`, { status })
    return mapOrder(res.data)
  },
}
