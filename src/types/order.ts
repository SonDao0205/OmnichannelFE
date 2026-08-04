export type OrderMarketplace = 'Shopee' | 'Lazada' | 'TikTok Shop'

export type OrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'FAILED'

export interface OrderItem {
  id: string
  productName: string
  sku: string
  imageUrl?: string
  quantity: number
  price: number
  variantName?: string
}

export interface ShippingAddress {
  recipientName: string
  phoneNumber: string
  fullAddress: string
  city: string
  district?: string
}

export interface Order {
  id: string
  orderCode: string
  externalOrderId: string
  marketplace: OrderMarketplace
  customerName: string
  customerPhone: string
  items: OrderItem[]
  totalAmount: number
  shippingFee: number
  discountAmount: number
  finalAmount: number
  status: OrderStatus
  paymentStatus: 'PAID' | 'UNPAID' | 'REFUNDED'
  shippingAddress: ShippingAddress
  trackingNumber?: string
  createdAt: string
  updatedAt?: string
}

export interface OrderFilter {
  statusTab: 'ALL' | OrderStatus
  marketplace?: OrderMarketplace | 'ALL'
  search: string
  page: number
  pageSize: number
}
