import axios from 'axios'

export const CHAT_SOCKET_URL =
  import.meta.env.VITE_CHAT_SOCKET_URL ?? 'http://localhost:8082'

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
  aiMode: string
  aiNeedsHuman: boolean
  aiIssueReason: string | null
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

export async function fetchChatConversations(
  tenantId: string,
  channel: ChatChannelFilter,
) {
  const response = await chatHttp.get<ApiResponse<ChatConversation[]>>(
    '/conversations',
    {
      params: {
        tenantId,
        channel,
      },
    },
  )

  return response.data.data
}

export async function fetchChatConversationDetail(
  tenantId: string,
  conversationId: string,
) {
  const response = await chatHttp.get<ApiResponse<ChatConversationDetail>>(
    `/conversations/${conversationId}`,
    {
      params: {
        tenantId,
      },
    },
  )

  return response.data.data
}

export async function fetchChatMessages(tenantId: string, conversationId: string) {
  const response = await chatHttp.get<ApiResponse<ChatMessage[]>>(
    `/conversations/${conversationId}/messages`,
    {
      params: {
        tenantId,
      },
    },
  )

  return response.data.data
}

export async function fetchChatOrderHistory(
  tenantId: string,
  conversationId: string,
) {
  const response = await chatHttp.get<ApiResponse<ChatOrderHistory>>(
    `/conversations/${conversationId}/orders`,
    {
      params: {
        tenantId,
      },
    },
  )

  return response.data.data
}

export async function markChatConversationRead(
  tenantId: string,
  conversationId: string,
) {
  const response = await chatHttp.patch<ApiResponse<ChatConversationDetail>>(
    `/conversations/${conversationId}/read`,
    {
      tenantId,
    },
  )

  return response.data.data
}

export async function sendChatMessage(
  tenantId: string,
  conversationId: string,
  text: string,
) {
  const response = await chatHttp.post<ApiResponse<ChatMessage>>(
    `/conversations/${conversationId}/messages`,
    {
      tenantId,
      text,
    },
  )

  return response.data.data
}
