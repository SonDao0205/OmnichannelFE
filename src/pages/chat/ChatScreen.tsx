import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchChatConversationDetail,
  fetchChatConversations,
  fetchChatMessages,
  fetchChatOrderHistory,
  markChatConversationRead,
  sendChatMessage,
  type ChatChannelFilter,
  type ChatConversation,
  type ChatConversationDetail,
  type ChatMessage,
  type ChatOrderHistory,
} from '../../apis/chatApi'
import ChatWindow from '../../components/chat/ChatWindow'
import ConversationInbox from '../../components/chat/ConversationInbox'
import CustomerProfilePanel from '../../components/chat/CustomerProfilePanel'
import { useAuth } from '../../contexts/authContext'
import { useChatRealtime } from '../../hooks/useChatRealtime'
import './chat.css'

type ResponderMode = 'ai-autopilot' | 'human' | 'ai-recommend'

const PINNED_CONVERSATIONS_STORAGE_KEY = 'omnichannel:pinned-conversations'

function getMessageTime(message: ChatMessage) {
  return new Date(
    message.externalCreatedAt ??
      message.sentAt ??
      message.queuedAt ??
      message.createdAt,
  ).getTime()
}

function upsertMessage(messages: ChatMessage[], nextMessage: ChatMessage) {
  const exists = messages.some((message) => message.id === nextMessage.id)
  const nextMessages = exists
    ? messages.map((message) =>
        message.id === nextMessage.id ? nextMessage : message,
      )
    : [...messages, nextMessage]

  return nextMessages.sort((first, second) => {
    return getMessageTime(first) - getMessageTime(second)
  })
}

function markConversationLocallyRead(
  conversations: ChatConversation[],
  conversationId: string,
) {
  return conversations.map((conversation) =>
    conversation.id === conversationId
      ? {
          ...conversation,
          unreadCount: 0,
        }
      : conversation,
  )
}

export default function ChatScreen() {
  const { session } = useAuth()
  const tenantId = session?.tenant.id ?? null
  const [channel, setChannel] = useState<ChatChannelFilter>('all')
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [conversationDetail, setConversationDetail] =
    useState<ChatConversationDetail | null>(null)
  const [orderHistory, setOrderHistory] = useState<ChatOrderHistory | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isInboxLoading, setIsInboxLoading] = useState(false)
  const [isThreadLoading, setIsThreadLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [responderMode, setResponderMode] =
    useState<ResponderMode>('human')
  const [pinnedConversationIds, setPinnedConversationIds] = useState<Set<string>>(
    () => {
      try {
        const storedValue = window.localStorage.getItem(
          PINNED_CONVERSATIONS_STORAGE_KEY,
        )
        const parsedValue = storedValue ? JSON.parse(storedValue) : []

        return Array.isArray(parsedValue)
          ? new Set(parsedValue.filter((item): item is string => typeof item === 'string'))
          : new Set<string>()
      } catch {
        return new Set<string>()
      }
    },
  )

  useEffect(() => {
    window.localStorage.setItem(
      PINNED_CONVERSATIONS_STORAGE_KEY,
      JSON.stringify([...pinnedConversationIds]),
    )
  }, [pinnedConversationIds])

  const handleTogglePinnedConversation = useCallback((conversationId: string) => {
    setPinnedConversationIds((currentIds) => {
      const nextIds = new Set(currentIds)

      if (nextIds.has(conversationId)) {
        nextIds.delete(conversationId)
      } else {
        nextIds.add(conversationId)
      }

      return nextIds
    })
  }, [])

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ) ?? null,
    [conversations, selectedConversationId],
  )

  const loadConversations = useCallback(
    async (silent = false) => {
      if (!tenantId) {
        setConversations([])
        setSelectedConversationId(null)
        return
      }

      if (!silent) setIsInboxLoading(true)

      try {
        const data = await fetchChatConversations(tenantId, channel)
        setConversations(data)
        setSelectedConversationId((currentId) =>
          currentId && data.some((item) => item.id === currentId)
            ? currentId
            : data[0]?.id ?? null,
        )
        setErrorMessage(null)
      } catch {
        setErrorMessage('Không tải được danh sách hội thoại.')
      } finally {
        if (!silent) setIsInboxLoading(false)
      }
    },
    [channel, tenantId],
  )

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!selectedConversationId) {
      setConversationDetail(null)
      setOrderHistory(null)
      setMessages([])
      return
    }

    async function loadThread(conversationId: string) {
      if (!tenantId) return

      setIsThreadLoading(true)

      try {
        const [detail, threadMessages, orders] = await Promise.all([
          fetchChatConversationDetail(tenantId, conversationId),
          fetchChatMessages(tenantId, conversationId),
          fetchChatOrderHistory(tenantId, conversationId),
        ])

        setConversationDetail(detail)
        setOrderHistory(orders)
        setMessages(threadMessages)
        setConversations((currentConversations) =>
          markConversationLocallyRead(currentConversations, conversationId),
        )

        if (detail.unreadCount > 0) {
          const readDetail = await markChatConversationRead(
            tenantId,
            conversationId,
          )
          setConversationDetail(readDetail)
          setConversations((currentConversations) =>
            markConversationLocallyRead(currentConversations, conversationId),
          )
        }

        setErrorMessage(null)
      } catch {
        setErrorMessage('Không tải được nội dung hội thoại.')
      } finally {
        setIsThreadLoading(false)
      }
    }

    void loadThread(selectedConversationId)
  }, [selectedConversationId, tenantId])

  const handleMessageCreated = useCallback(
    (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.conversationId === selectedConversationId) {
        setMessages((currentMessages) =>
          upsertMessage(currentMessages, payload.message),
        )
        setConversations((currentConversations) =>
          markConversationLocallyRead(currentConversations, payload.conversationId),
        )

        if (payload.message.direction === 'INBOUND') {
          if (tenantId) {
            void markChatConversationRead(
              tenantId,
              payload.conversationId,
            ).finally(() => {
              void loadConversations(true)
            })
          }
          return
        }
      }

      void loadConversations(true)
    },
    [loadConversations, selectedConversationId, tenantId],
  )

  const handleConversationUpdated = useCallback(() => {
    void loadConversations(true)
  }, [loadConversations])

  useChatRealtime({
    conversationId: selectedConversationId,
    onMessageCreated: handleMessageCreated,
    onConversationUpdated: handleConversationUpdated,
  })

  const handleSendMessage = async (text: string) => {
    if (!selectedConversationId || !tenantId) return false

    setIsSending(true)

    try {
      const message = await sendChatMessage(tenantId, selectedConversationId, text)
      setMessages((currentMessages) => upsertMessage(currentMessages, message))
      await loadConversations(true)
      setErrorMessage(null)
      return true
    } catch {
      setErrorMessage(
        'Gửi tin nhắn thất bại. Kiểm tra token marketplace hoặc ChatBE.',
      )
      return false
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="chat-page" aria-label="Quản lý hội thoại đa kênh">
      <ConversationInbox
        channel={channel}
        conversations={conversations}
        isLoading={isInboxLoading}
        pinnedConversationIds={pinnedConversationIds}
        selectedConversationId={selectedConversationId}
        onChannelChange={setChannel}
        onSelectConversation={setSelectedConversationId}
        onTogglePinnedConversation={handleTogglePinnedConversation}
      />
      <ChatWindow
        conversation={selectedConversation}
        detail={conversationDetail}
        errorMessage={errorMessage}
        isLoading={isThreadLoading}
        isSending={isSending}
        messages={messages}
        responderMode={responderMode}
        onResponderModeChange={setResponderMode}
        onSendMessage={handleSendMessage}
      />
      <CustomerProfilePanel
        conversation={selectedConversation}
        detail={conversationDetail}
        orderHistory={orderHistory}
        showAiBehaviorInsights={responderMode === 'ai-recommend'}
      />
    </section>
  )
}
