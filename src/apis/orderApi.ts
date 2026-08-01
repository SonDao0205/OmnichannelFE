import { csrfHeader, managementApi } from './authApi'
import type { Order, OrderItem, OrderStatus } from '../types/order'

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
  shippingFee?: number
  discountAmount: number
  finalAmount: number
  paymentStatus: string
  status: string
  trackingNumber?: string
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

function mapItem(item: BackendOrderItem): OrderItem {
  return {
    id: item.id,
    productName: item.productName,
    sku: item.sku || '',
    quantity: item.quantity,
    price: item.price,
    variantName: item.variantName,
  }
}

function parseAddress(json: string | undefined) {
  if (!json) return { recipientName: '', phoneNumber: '', fullAddress: '', city: '' }
  try {
    return JSON.parse(json)
  } catch {
    return { recipientName: '', phoneNumber: '', fullAddress: json, city: '' }
  }
}

function mapOrder(order: BackendOrder): Order {
  return {
    id: order.id,
    orderCode: order.orderCode,
    externalOrderId: order.externalOrderId || '',
    marketplace: (order.marketplace || 'MANUAL') as Order['marketplace'],
    customerName: order.customerName,
    customerPhone: order.customerPhone || '',
    items: (order.items || []).map(mapItem),
    totalAmount: order.totalAmount,
    shippingFee: order.shippingFee ?? 0,
    discountAmount: order.discountAmount,
    finalAmount: order.finalAmount,
    status: order.status as OrderStatus,
    paymentStatus: (
      order.paymentStatus === 'PAID'
        ? 'PAID'
        : order.paymentStatus === 'REFUNDED'
          ? 'REFUNDED'
          : 'UNPAID'
    ) as Order['paymentStatus'],
    shippingAddress: parseAddress(order.shippingAddressJson),
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

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

export const orderApi = {
  fetchOrders: async (search = '', status = '', page = 0, size = 50): Promise<Order[]> => {
    const headers = await csrfHeader()
    await managementApi.post('/api/v1/orders/sync', undefined, { headers })
    const params: Record<string, string | number> = { page, size }
    if (search) params.search = search
    if (status && status !== 'ALL') params.status = status
    const response = await managementApi.get<SpringPage<BackendOrder>>('/api/v1/orders', { params })
    const data = response.data
    const list = Array.isArray(data) ? data : (data?.content ?? [])
    return list.map(mapOrder)
  },

  fetchOrdersForReport: async (): Promise<Order[]> => {
    const orders: BackendOrder[] = []
    let page = 0
    while (true) {
      const response = await managementApi.get<SpringPage<BackendOrder>>(
        '/api/v1/orders',
        { params: { page, size: 200 } },
      )
      const data = response.data
      if (Array.isArray(data)) {
        orders.push(...data)
        break
      }
      orders.push(...(data?.content ?? []))
      page += 1
      if (page >= Math.max(1, data?.totalPages ?? 1)) break
    }
    return orders.map(mapOrder)
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await managementApi.get<BackendOrder>(`/api/v1/orders/${id}`)
    return mapOrder(response.data)
  },

  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    const headers = await csrfHeader()
    const response = await managementApi.post<BackendOrder>('/api/v1/orders', payload, { headers })
    return mapOrder(response.data)
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
    const headers = await csrfHeader()
    const response = await managementApi.put<BackendOrder>(
      `/api/v1/orders/${orderId}/status`,
      { status },
      { headers },
    )
    return mapOrder(response.data)
  },

  deleteOrder: async (orderId: string): Promise<string> => {
    const headers = await csrfHeader()
    await managementApi.delete(`/api/v1/orders/${orderId}`, { headers })
    return orderId
  },
}
