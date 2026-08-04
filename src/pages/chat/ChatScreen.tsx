import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  approveAiRun,
  createAiSuggestion,
  fetchAiRun,
  fetchLatestAiRun,
  isAiRunAccepted,
  rejectAiRun,
  sendAiFeedback,
  updateAiConversationMode,
  type AiConversationMode,
  type AiRun,
} from '../../apis/aiConversationApi'
import { apiErrorMessage } from '../../apis/authApi'
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
import ChatWindow, {
  type ResponderMode,
} from '../../components/chat/ChatWindow'
import ConversationInbox from '../../components/chat/ConversationInbox'
import CustomerProfilePanel from '../../components/chat/CustomerProfilePanel'
import { useAuth } from '../../contexts/authContext'
import {
  useChatRealtime,
  type ConversationUpdatedPayload,
} from '../../hooks/useChatRealtime'
import './chat.css'

const PINNED_CONVERSATIONS_STORAGE_KEY = 'omnichannel:pinned-conversations'

function responderModeFromAiMode(aiMode?: string): ResponderMode {
  if (aiMode === 'AUTO') return 'ai-autopilot'
  if (aiMode === 'SUGGEST_ONLY') return 'ai-recommend'
  return 'human'
}

function aiModeFromResponderMode(mode: ResponderMode): AiConversationMode {
  if (mode === 'ai-autopilot') return 'AUTO'
  if (mode === 'ai-recommend') return 'SUGGEST_ONLY'
  return 'HUMAN_ONLY'
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

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
  const { session, hasPermission } = useAuth()
  const tenantId = session?.tenant.id ?? null
  const canSuggest = hasPermission('AI.SUGGEST')
  const canApprove = hasPermission('AI.APPROVE')
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
  const [isAiBusy, setIsAiBusy] = useState(false)
  const [aiRun, setAiRun] = useState<AiRun | null>(null)
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [responderMode, setResponderMode] =
    useState<ResponderMode>('human')
  const selectedConversationIdRef = useRef<string | null>(null)
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
    selectedConversationIdRef.current = selectedConversationId
  }, [selectedConversationId])

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
  const effectiveResponderMode: ResponderMode = selectedConversation?.aiNeedsHuman
    ? 'human'
    : responderMode

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
            : null,
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
    // Loading remote inbox data is the synchronization purpose of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!selectedConversationId) {
      // Reset all detail state when the selected external resource is cleared.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversationDetail(null)
      setOrderHistory(null)
      setMessages([])
      setAiRun(null)
      setAiErrorMessage(null)
      return
    }

    async function loadThread(conversationId: string) {
      if (!tenantId) return

      setIsThreadLoading(true)
      setAiRun(null)
      setAiErrorMessage(null)

      try {
        const [detail, threadMessages, orders, latestRun] = await Promise.all([
          fetchChatConversationDetail(tenantId, conversationId),
          fetchChatMessages(tenantId, conversationId),
          fetchChatOrderHistory(tenantId, conversationId),
          canSuggest
            ? fetchLatestAiRun(conversationId).catch(() => null)
            : Promise.resolve(null),
        ])

        if (selectedConversationIdRef.current !== conversationId) return

        setConversationDetail(detail)
        setResponderMode(responderModeFromAiMode(detail.aiMode))
        setOrderHistory(orders)
        setMessages(threadMessages)
        setAiRun(latestRun)
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
  }, [canSuggest, selectedConversationId, tenantId])

  const pollAiRun = useCallback(async (runId: string) => {
    let latest: AiRun | null = null
    for (let attempt = 0; attempt < 24; attempt += 1) {
      latest = await fetchAiRun(runId)
      if (!['GENERATING', 'QUALITY_CHECKING'].includes(latest.status)) {
        return latest
      }
      await wait(750)
    }
    return latest
  }, [])

  const generateAiForTrigger = useCallback(async (
    conversationId: string,
    triggerMessageId: string,
  ) => {
    if (!canSuggest) return
    setIsAiBusy(true)
    setAiErrorMessage(null)
    try {
      const created = await createAiSuggestion(
        conversationId,
        triggerMessageId,
        window.crypto.randomUUID(),
      )
      const result = isAiRunAccepted(created)
        ? await pollAiRun(created.run_id)
        : ['GENERATING', 'QUALITY_CHECKING'].includes(created.status)
          ? await pollAiRun(created.id)
          : created
      if (result && selectedConversationIdRef.current === conversationId) {
        setAiRun(result)
        if (result.status === 'HANDED_OFF' || result.status === 'FAILED') {
          const issueReason =
            result.failure_reason ??
            result.result?.handoff_reason ??
            'AI không thể trả lời. Hội thoại đã chuyển cho nhân viên.'
          setResponderMode('human')
          setAiErrorMessage(issueReason)
          setConversationDetail((current) =>
            current ? { ...current, aiMode: 'HUMAN_ONLY' } : current,
          )
          setConversations((currentConversations) =>
            currentConversations.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    aiMode: 'HUMAN_ONLY',
                    aiNeedsHuman: true,
                    aiIssueReason: issueReason,
                  }
                : conversation,
            ),
          )
        }
      }
      await loadConversations(true)
    } catch (error) {
      const issueReason = apiErrorMessage(error)
      setResponderMode('human')
      setAiErrorMessage(issueReason)
      setConversationDetail((current) =>
        current ? { ...current, aiMode: 'HUMAN_ONLY' } : current,
      )
      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                aiMode: 'HUMAN_ONLY',
                aiNeedsHuman: true,
                aiIssueReason: issueReason,
              }
            : conversation,
        ),
      )
      try {
        await updateAiConversationMode(conversationId, 'HUMAN_ONLY')
      } catch {
        // Keep the local human handoff visible even if the management API is unavailable.
      }
    } finally {
      setIsAiBusy(false)
    }
  }, [canSuggest, loadConversations, pollAiRun])

  const handleGenerateAiSuggestion = async () => {
    const conversationId = selectedConversationId
    if (!conversationId || !canSuggest) return

    const triggerMessage = [...messages]
      .reverse()
      .find((message) => message.direction === 'INBOUND' && message.textContent?.trim())
    if (!triggerMessage) {
      setAiErrorMessage('Hội thoại chưa có tin nhắn khách hàng dạng văn bản để AI phân tích.')
      return
    }

    await generateAiForTrigger(conversationId, triggerMessage.id)
  }

  const handleApproveAiRun = async (text: string, send: boolean) => {
    if (!aiRun || !canApprove) return
    setIsAiBusy(true)
    setAiErrorMessage(null)
    try {
      const result = await approveAiRun(aiRun.id, text, send)
      setAiRun(result)
      if (send && tenantId && selectedConversationId) {
        const threadMessages = await fetchChatMessages(
          tenantId,
          selectedConversationId,
        )
        setMessages(threadMessages)
        await loadConversations(true)
      }
    } catch (error) {
      setAiErrorMessage(apiErrorMessage(error))
    } finally {
      setIsAiBusy(false)
    }
  }

  const handleRejectAiRun = async (reason: string) => {
    if (!aiRun || !canApprove) return
    setIsAiBusy(true)
    setAiErrorMessage(null)
    try {
      const result = await rejectAiRun(aiRun.id, reason)
      const issueReason =
        result.failure_reason ?? reason ?? 'AI đã dừng và cần nhân viên xử lý.'
      setAiRun(result)
      setResponderMode('human')
      setConversationDetail((current) =>
        current ? { ...current, aiMode: 'HUMAN_ONLY' } : current,
      )
      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === selectedConversationId
            ? {
                ...conversation,
                aiMode: 'HUMAN_ONLY',
                aiNeedsHuman: true,
                aiIssueReason: issueReason,
              }
            : conversation,
        ),
      )
      if (selectedConversationId) {
        await updateAiConversationMode(selectedConversationId, 'HUMAN_ONLY')
      }
      await loadConversations(true)
    } catch (error) {
      setAiErrorMessage(apiErrorMessage(error))
    } finally {
      setIsAiBusy(false)
    }
  }

  const handleAiFeedback = async (
    rating: number,
    feedbackType: 'GOOD' | 'INCORRECT',
    correctedText?: string,
    commentText?: string,
  ) => {
    if (!aiRun || !canSuggest) return
    setIsAiBusy(true)
    setAiErrorMessage(null)
    try {
      await sendAiFeedback(
        aiRun.id,
        rating,
        feedbackType,
        correctedText,
        commentText,
      )
    } catch (error) {
      setAiErrorMessage(apiErrorMessage(error))
      throw error
    } finally {
      setIsAiBusy(false)
    }
  }

  const handleResponderModeChange = async (mode: ResponderMode) => {
    if (!selectedConversationId || !canSuggest) return
    const previousMode = responderMode
    setResponderMode(mode)
    setIsAiBusy(true)
    setAiErrorMessage(null)
    try {
      const result = await updateAiConversationMode(
        selectedConversationId,
        aiModeFromResponderMode(mode),
      )
      setConversationDetail((current) =>
        current ? { ...current, aiMode: result.aiMode } : current,
      )
      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === selectedConversationId
            ? {
                ...conversation,
                aiMode: result.aiMode,
                aiNeedsHuman:
                  result.aiMode === 'HUMAN_ONLY' && conversation.aiNeedsHuman,
                aiIssueReason:
                  result.aiMode === 'HUMAN_ONLY'
                    ? conversation.aiIssueReason
                    : null,
              }
            : conversation,
        ),
      )
    } catch (error) {
      setResponderMode(previousMode)
      setAiErrorMessage(apiErrorMessage(error))
    } finally {
      setIsAiBusy(false)
    }
  }

  const handleResponderModeSelection = async (mode: ResponderMode) => {
    if (selectedConversation?.aiNeedsHuman && mode !== 'human') {
      setResponderMode('human')
      setAiErrorMessage(
        'AI đã dừng. Nhân viên cần trả lời khách hàng trước khi bật lại AI.',
      )
      return
    }

    if (mode === 'ai-autopilot') {
      setResponderMode('ai-autopilot')
      setAiErrorMessage(null)
      return
    }

    await handleResponderModeChange(mode)
  }

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
    [
      loadConversations,
      selectedConversationId,
      tenantId,
    ],
  )

  const handleConversationUpdated = useCallback((payload: ConversationUpdatedPayload) => {
    if (payload.conversationId === selectedConversationIdRef.current) {
      const nextAiMode = payload.aiMode ?? payload.conversation?.aiMode
      if (nextAiMode) {
        setResponderMode(responderModeFromAiMode(nextAiMode))
        setConversationDetail((current) =>
          current ? { ...current, aiMode: nextAiMode } : current,
        )
      }
      if (payload.handoff?.reasonText) {
        setAiErrorMessage(payload.handoff.reasonText)
      }
    }
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
        aiErrorMessage={aiErrorMessage}
        aiIssueReason={selectedConversation?.aiIssueReason ?? null}
        aiRun={aiRun}
        canApprove={canApprove}
        canSuggest={canSuggest}
        conversation={selectedConversation}
        detail={conversationDetail}
        errorMessage={errorMessage}
        isLoading={isThreadLoading}
        isSending={isSending}
        isAiBusy={isAiBusy}
        isAutopilotActive={
          !selectedConversation?.aiNeedsHuman &&
          (conversationDetail?.aiMode === 'AUTO' || selectedConversation?.aiMode === 'AUTO')
        }
        messages={messages}
        responderMode={effectiveResponderMode}
        onAiFeedback={handleAiFeedback}
        onApproveAiRun={handleApproveAiRun}
        onGenerateAiSuggestion={handleGenerateAiSuggestion}
        onRejectAiRun={handleRejectAiRun}
        onResponderModeChange={handleResponderModeSelection}
        onStartAutopilot={() => handleResponderModeChange('ai-autopilot')}
        onSendMessage={handleSendMessage}
      />
      <CustomerProfilePanel
        conversation={selectedConversation}
        detail={conversationDetail}
        orderHistory={orderHistory}
        showAiBehaviorInsights={effectiveResponderMode === 'ai-recommend'}
      />
    </section>
  )
}
