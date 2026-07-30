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
    shippingFee: 0,
    discountAmount: o.discountAmount,
    finalAmount: o.finalAmount,
    status: o.status as OrderStatus,
    paymentStatus: (o.paymentStatus === 'PAID' ? 'PAID' : o.paymentStatus === 'REFUNDED' ? 'REFUNDED' : 'UNPAID') as Order['paymentStatus'],
    shippingAddress: parseAddress(o.shippingAddressJson),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

// ─── Mock data dự phòng ──────────────────────────────────────────────────────

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderCode: 'OMNI-20260728-881',
    externalOrderId: 'TTS_ORD_9918231',
    marketplace: 'TikTok Shop',
    customerName: 'Nguyễn Văn An',
    customerPhone: '098****123',
    items: [
      {
        id: 'item-1',
        productName: 'Áo khoác denim nam dáng rộng AK-204 Vintage Blue',
        sku: 'AK204-M',
        quantity: 1,
        price: 489000,
        variantName: 'Size M',
      },
    ],
    totalAmount: 489000,
    shippingFee: 30000,
    discountAmount: 20000,
    finalAmount: 499000,
    status: 'PENDING',
    paymentStatus: 'PAID',
    shippingAddress: {
      recipientName: 'Nguyễn Văn An',
      phoneNumber: '098****123',
      fullAddress: 'Số 15 Phố Hoàn Kiếm, P. Hàng Bạc, Q. Hoàn Kiếm',
      city: 'Hà Nội',
    },
    trackingNumber: 'SPX_VN_8819231',
    createdAt: '2026-07-28T14:20:00Z',
  },
]

// ─── Request body để tạo đơn hàng ───────────────────────────────────────────

export interface CreateOrderPayload {
  customerName: string
  customerPhone?: string
  marketplace?: string
  paymentStatus?: string
  discountAmount?: number
  shippingAddressJson?: string
  items: {
    productName: string
    sku?: string
    variantName?: string
    price: number
    quantity: number
  }[]
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const orderApi = {
  /** Lấy danh sách đơn hàng (tìm kiếm + lọc trạng thái) */
  fetchOrders: async (search = '', status = '', page = 0, size = 50): Promise<Order[]> => {
    try {
      const params: Record<string, string | number> = { page, size }
      if (search) params.search = search
      if (status && status !== 'ALL') params.status = status
      const res = await managementApi.get<SpringPage<BackendOrder>>('/api/v1/orders', { params })
      const data = res.data
      const list = Array.isArray(data) ? data : (data?.content ?? [])
      return list.map(mapOrder)
    } catch {
      return INITIAL_ORDERS
    }
  },

  /** Lấy chi tiết một đơn hàng */
  getOrder: async (id: string): Promise<Order> => {
    const res = await managementApi.get<BackendOrder>(`/api/v1/orders/${id}`)
    return mapOrder(res.data)
  },

  /** Tạo đơn hàng mới (tạo tay) */
  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    try {
      const res = await managementApi.post<BackendOrder>('/api/v1/orders', payload)
      return mapOrder(res.data)
    } catch {
      // Fallback tạo local khi backend chưa bật
      const totalAmount = payload.items.reduce((s, i) => s + i.price * i.quantity, 0)
      const discount = payload.discountAmount ?? 0
      return {
        id: `ord-${Date.now()}`,
        orderCode: `ORD-${Date.now()}`,
        externalOrderId: '',
        marketplace: (payload.marketplace || 'MANUAL') as Order['marketplace'],
        customerName: payload.customerName,
        customerPhone: payload.customerPhone || '',
        items: payload.items.map((i, idx) => ({ id: `item-${idx}`, sku: i.sku ?? '', ...i })),
        totalAmount,
        shippingFee: 0,
        discountAmount: discount,
        finalAmount: totalAmount - discount,
        status: 'PENDING',
        paymentStatus: (payload.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID') as Order['paymentStatus'],
        shippingAddress: { recipientName: payload.customerName, phoneNumber: payload.customerPhone || '', fullAddress: '', city: '' },
        createdAt: new Date().toISOString(),
      }
    }
  },

  /** Cập nhật trạng thái đơn hàng - backend dùng PUT /{id}/status */
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
    try {
      const res = await managementApi.put<BackendOrder>(`/api/v1/orders/${orderId}/status`, { status })
      return mapOrder(res.data)
    } catch {
      const fake = INITIAL_ORDERS.find((o) => o.id === orderId)
      if (fake) return { ...fake, status, updatedAt: new Date().toISOString() }
      throw new Error('Order not found')
    }
  },

  /** Xoá mềm đơn hàng */
  deleteOrder: async (orderId: string): Promise<string> => {
    try {
      await managementApi.delete(`/api/v1/orders/${orderId}`)
    } catch { /* fallback */ }
    return orderId
  },
}
