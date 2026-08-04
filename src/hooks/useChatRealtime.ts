import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { CHAT_SOCKET_URL, type ChatMessage } from '../apis/chatApi'

type MessageCreatedPayload = {
  conversationId: string
  message: ChatMessage
}

export type ConversationUpdatedPayload = {
  conversationId: string
  conversation?: {
    aiMode?: string
    priority?: string
  }
  aiMode?: string
  priority?: string
  handoff?: {
    reasonCode?: string
    reasonText?: string
  }
}

type UseChatRealtimeInput = {
  conversationId: string | null
  onMessageCreated: (payload: MessageCreatedPayload) => void
  onConversationUpdated: (payload: ConversationUpdatedPayload) => void
}

export function useChatRealtime({
  conversationId,
  onMessageCreated,
  onConversationUpdated,
}: UseChatRealtimeInput) {
  useEffect(() => {
    const socket = io(CHAT_SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    if (conversationId) {
      socket.emit('join_conversation', conversationId)
    }

    socket.on('message_created', onMessageCreated)
    socket.on('conversation_updated', onConversationUpdated)

    return () => {
      if (conversationId) {
        socket.emit('leave_conversation', conversationId)
      }

      socket.off('message_created', onMessageCreated)
      socket.off('conversation_updated', onConversationUpdated)
      socket.disconnect()
    }
  }, [conversationId, onConversationUpdated, onMessageCreated])
}
