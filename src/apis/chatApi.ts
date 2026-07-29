import axios from 'axios'

export const CHAT_SOCKET_URL =
  import.meta.env.VITE_CHAT_SOCKET_URL ?? 'http://localhost:8082'

export const DEFAULT_TENANT_ID =
  import.meta.env.VITE_CHAT_TENANT_ID ??
  '20000000-0000-0000-0000-000000000001'

const chatHttp = axios.create({
  baseURL: import.meta.env.VITE_CHAT_API_URL ?? 'http://localhost:8082/api/v1',
  withCredentials: true,
})

type ApiResponse<T> = {
  code: number | string
  message: string
  data: T
}

export type ChatChannelFilter = 'all' | 'TIKTOK_SHOP' | 'LAZADA'

export type ChatConversation = {
  id: string
  channel: string
  channelName: string
  customerName: string
  avatarUrl: string | null
  phone: string | null
  status: string
  priority: string
  unreadCount: number
  lastMessage: string | null
  lastMessageAt: string | null
}

export type MarketplaceCustomer = {
  displayName?: string | null
  externalCustomerId?: string | null
  avatarUrl?: string | null
  phoneMasked?: string | null
  emailMasked?: string | null
  lastSeenAt?: string | null
}

export type ChatConversationDetail = {
  id: string
  internalStatus: string
  priority: string
  unreadCount: number
  aiMode: string
  marketplaceCustomer?: MarketplaceCustomer
  marketplaceAccount?: {
    marketplace?: {
      marketplaceCode?: string
      marketplaceName?: string
    }
  }
}

export type ChatMessage = {
  id: string
  tenantId: string
  conversationId: string
  direction: 'INBOUND' | 'OUTBOUND'
  senderType: string
  messageType: string
  textContent: string | null
  contentJson: Record<string, unknown>
  deliveryStatus: string
  errorMessage: string | null
  queuedAt: string | null
  sentAt: string | null
  failedAt: string | null
  externalCreatedAt: string | null
  createdAt: string
}

export type ChatOrderHistoryItem = {
  id: string
  externalOrderId: string
  canonicalStatus: string
  paymentStatus: string
  refundStatus: string
  currency: string
  totalAmount: string
  externalCreatedAt: string
  channelName: string
  items: string
}

export type ChatOrderHistory = {
  totalOrders: number
  latestOrderTotal: string
  orders: ChatOrderHistoryItem[]
}

export async function fetchChatConversations(channel: ChatChannelFilter) {
  const response = await chatHttp.get<ApiResponse<ChatConversation[]>>(
    '/conversations',
    {
      params: {
        tenantId: DEFAULT_TENANT_ID,
        channel,
      },
    },
  )

  return response.data.data
}

export async function fetchChatConversationDetail(conversationId: string) {
  const response = await chatHttp.get<ApiResponse<ChatConversationDetail>>(
    `/conversations/${conversationId}`,
    {
      params: {
        tenantId: DEFAULT_TENANT_ID,
      },
    },
  )

  return response.data.data
}

export async function fetchChatMessages(conversationId: string) {
  const response = await chatHttp.get<ApiResponse<ChatMessage[]>>(
    `/conversations/${conversationId}/messages`,
    {
      params: {
        tenantId: DEFAULT_TENANT_ID,
      },
    },
  )

  return response.data.data
}

export async function fetchChatOrderHistory(conversationId: string) {
  const response = await chatHttp.get<ApiResponse<ChatOrderHistory>>(
    `/conversations/${conversationId}/orders`,
    {
      params: {
        tenantId: DEFAULT_TENANT_ID,
      },
    },
  )

  return response.data.data
}

export async function markChatConversationRead(conversationId: string) {
  const response = await chatHttp.patch<ApiResponse<ChatConversationDetail>>(
    `/conversations/${conversationId}/read`,
    {
      tenantId: DEFAULT_TENANT_ID,
    },
  )

  return response.data.data
}

export async function sendChatMessage(conversationId: string, text: string) {
  const response = await chatHttp.post<ApiResponse<ChatMessage>>(
    `/conversations/${conversationId}/messages`,
    {
      tenantId: DEFAULT_TENANT_ID,
      text,
    },
  )

  return response.data.data
}
