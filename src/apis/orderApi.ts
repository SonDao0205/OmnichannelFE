import { axiosClient } from './axiosClient'
import type { Order, OrderStatus } from '../types/order'

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
        imageUrl: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=600&auto=format&fit=crop',
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
  {
    id: 'ord-1002',
    orderCode: 'OMNI-20260728-772',
    externalOrderId: 'LZD_ORD_4412093',
    marketplace: 'Lazada',
    customerName: 'Trần Thị Bích',
    customerPhone: '091****888',
    items: [
      {
        id: 'item-2',
        productName: 'Quần jeans slim-fit nam chất co giãn xám khói',
        sku: 'JNS952-30',
        imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop',
        quantity: 2,
        price: 359000,
        variantName: 'Size 30',
      },
    ],
    totalAmount: 718000,
    shippingFee: 25000,
    discountAmount: 40000,
    finalAmount: 703000,
    status: 'PACKED',
    paymentStatus: 'PAID',
    shippingAddress: {
      recipientName: 'Trần Thị Bích',
      phoneNumber: '091****888',
      fullAddress: '234 Đường Nguyễn Trãi, Q.5',
      city: 'TP. Hồ Chí Minh',
    },
    trackingNumber: 'LEX_VN_1029384',
    createdAt: '2026-07-28T11:00:00Z',
  },
  {
    id: 'ord-1003',
    orderCode: 'OMNI-20260727-551',
    externalOrderId: 'SHP_ORD_1102938',
    marketplace: 'Shopee',
    customerName: 'Lê Hoàng Nam',
    customerPhone: '093****999',
    items: [
      {
        id: 'item-3',
        productName: 'Áo len dệt kim trơn cổ tròn basic có duyên',
        sku: 'KNT001-S',
        imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop',
        quantity: 1,
        price: 249000,
        variantName: 'Size S',
      },
    ],
    totalAmount: 249000,
    shippingFee: 20000,
    discountAmount: 0,
    finalAmount: 269000,
    status: 'IN_TRANSIT',
    paymentStatus: 'PAID',
    shippingAddress: {
      recipientName: 'Lê Hoàng Nam',
      phoneNumber: '093****999',
      fullAddress: '45/12 Lê Lợi, Q. Hải Châu',
      city: 'Đà Nẵng',
    },
    trackingNumber: 'GHN_DN_5519283',
    createdAt: '2026-07-27T16:45:00Z',
  },
  {
    id: 'ord-1004',
    orderCode: 'OMNI-20260726-104',
    externalOrderId: 'TTS_ORD_7749281',
    marketplace: 'TikTok Shop',
    customerName: 'Phạm Minh Tuấn',
    customerPhone: '090****555',
    items: [
      {
        id: 'item-4',
        productName: 'Áo khoác denim nam dáng rộng AK-204 Vintage Blue',
        sku: 'AK204-L',
        imageUrl: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=600&auto=format&fit=crop',
        quantity: 1,
        price: 489000,
        variantName: 'Size L',
      },
    ],
    totalAmount: 489000,
    shippingFee: 30000,
    discountAmount: 50000,
    finalAmount: 469000,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    shippingAddress: {
      recipientName: 'Phạm Minh Tuấn',
      phoneNumber: '090****555',
      fullAddress: '102 Trần Hưng Đạo, P. Ninh Kiều',
      city: 'Cần Thơ',
    },
    trackingNumber: 'JNT_CT_9918234',
    createdAt: '2026-07-26T08:30:00Z',
  },
]

export const orderApi = {
  fetchOrders: async (): Promise<Order[]> => {
    try {
      const res = await axiosClient.get<any>('/orders')
      return Array.isArray(res) ? res : res?.data || INITIAL_ORDERS
    } catch {
      return INITIAL_ORDERS
    }
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
    try {
      const res = await axiosClient.patch<Order>(`/orders/${orderId}/status`, { status })
      return res as unknown as Order
    } catch {
      const targetOrder = INITIAL_ORDERS.find((o) => o.id === orderId)
      if (targetOrder) {
        targetOrder.status = status
        targetOrder.updatedAt = new Date().toISOString()
        return { ...targetOrder }
      }
      throw new Error('Order not found')
    }
  },
}
