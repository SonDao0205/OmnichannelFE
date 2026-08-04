import {
  MoreOutlined,
  PaperClipOutlined,
  SendOutlined,
  SmileOutlined,
} from '@ant-design/icons'
import type { FormEvent, KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import type {
  ChatConversation,
  ChatConversationDetail,
  ChatMessage,
} from '../../apis/chatApi'
import type { AiRun } from '../../apis/aiConversationApi'
import AiSuggestionPanel from './AiSuggestionPanel'
import Avatar from './Avatar'
import ProductPreviewCard from './ProductPreviewCard'

export type ResponderMode = 'ai-autopilot' | 'human' | 'ai-recommend'

type ChatWindowProps = {
  conversation: ChatConversation | null
  detail: ChatConversationDetail | null
  errorMessage: string | null
  isLoading: boolean
  isSending: boolean
  messages: ChatMessage[]
  aiRun: AiRun | null
  aiIssueReason: string | null
  aiErrorMessage: string | null
  isAiBusy: boolean
  canSuggest: boolean
  canApprove: boolean
  responderMode: ResponderMode
  isAutopilotActive: boolean
  onResponderModeChange: (mode: ResponderMode) => Promise<void>
  onStartAutopilot: () => Promise<void>
  onGenerateAiSuggestion: () => Promise<void>
  onApproveAiRun: (text: string, send: boolean) => Promise<void>
  onRejectAiRun: (reason: string) => Promise<void>
  onAiFeedback: (
    rating: number,
    feedbackType: 'GOOD' | 'INCORRECT',
    correctedText?: string,
    commentText?: string,
  ) => Promise<void>
  onSendMessage: (text: string) => Promise<boolean>
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.slice(-3).map((word) => word[0]?.toUpperCase() ?? '')
  return letters.join('') || 'KH'
}

function formatMessageTime(message: ChatMessage) {
  const value =
    message.externalCreatedAt ??
    message.sentAt ??
    message.queuedAt ??
    message.createdAt

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getMessageText(message: ChatMessage) {
  if (message.textContent) return message.textContent
  if (message.messageType === 'TEXT') return ''
  return `[${message.messageType}]`
}

export default function ChatWindow({
  conversation,
  detail,
  errorMessage,
  isLoading,
  isSending,
  messages,
  aiRun,
  aiIssueReason,
  aiErrorMessage,
  isAiBusy,
  canSuggest,
  canApprove,
  responderMode,
  isAutopilotActive,
  onResponderModeChange,
  onStartAutopilot,
  onGenerateAiSuggestion,
  onApproveAiRun,
  onRejectAiRun,
  onAiFeedback,
  onSendMessage,
}: ChatWindowProps) {
  const [draft, setDraft] = useState('')
  const [isActionSelectOpen, setIsActionSelectOpen] = useState(false)
  const messagesRef = useRef<HTMLElement | null>(null)

  const handleMessageInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  useEffect(() => {
    const messagesElement = messagesRef.current
    if (!messagesElement) return

    messagesElement.scrollTop = messagesElement.scrollHeight
  }, [messages])

  const customerName =
    conversation?.customerName ??
    detail?.marketplaceCustomer?.displayName ??
    detail?.marketplaceCustomer?.externalCustomerId ??
    'Khách hàng'
  const customerInitials = getInitials(customerName)
  const avatarUrl =
    conversation?.avatarUrl ?? detail?.marketplaceCustomer?.avatarUrl ?? null
  const channelName =
    conversation?.channelName ??
    detail?.marketplaceAccount?.marketplace?.marketplaceName ??
    ''

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = draft.trim()
    if (!text || isSending) return

    const sent = await onSendMessage(text)
    if (sent) setDraft('')
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return
    }
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  return (
    <main className="chat-window">
      <header className="chat-header">
        <div className="chat-person">
          <Avatar avatarUrl={avatarUrl} initials={customerInitials} />
          <div>
            <h1>
              {customerName} {channelName ? <span>{channelName}</span> : null}
            </h1>
            <p>{conversation ? 'Đang theo dõi hội thoại' : 'Chưa chọn hội thoại'}</p>
          </div>
        </div>

        <div className="chat-tools" aria-label="Công cụ hội thoại">
          <button type="button" aria-label="Tùy chọn thêm">
            <MoreOutlined />
          </button>
        </div>
      </header>

      <section className="chat-messages" aria-label="Nội dung chat" ref={messagesRef}>
        {errorMessage ? <div className="chat-error">{errorMessage}</div> : null}

        {!conversation ? (
          <div className="chat-empty">Chọn một hội thoại để xem tin nhắn</div>
        ) : null}

        {conversation && isLoading ? (
          <div className="chat-empty">Đang tải tin nhắn...</div>
        ) : null}

        {conversation && !isLoading && messages.length === 0 ? (
          <div className="chat-empty">Hội thoại này chưa có tin nhắn</div>
        ) : null}

        {messages.map((message) => {
          const isOutgoing = message.direction === 'OUTBOUND'

          return (
            <div
              className={`chat-message-row ${isOutgoing ? 'chat-message-row--outgoing' : ''}`}
              key={message.id}
            >
              {!isOutgoing ? (
                <Avatar avatarUrl={avatarUrl} initials={customerInitials} />
              ) : null}
              <div className="chat-bubble-stack">
                {message.messageType !== 'TEXT' ? <ProductPreviewCard /> : null}
                <div
                  className={`chat-bubble ${
                    getMessageText(message) ? '' : 'chat-bubble--muted'
                  }`}
                >
                  {getMessageText(message) || 'Tin nhắn không có nội dung text'}
                </div>
                <span className="chat-time">
                  {formatMessageTime(message)}
                  {isOutgoing ? ` · ${message.deliveryStatus}` : ''}
                </span>
              </div>
            </div>
          )
        })}
      </section>

      <footer className="chat-composer">
        {conversation ? (
          <AiSuggestionPanel
            key={aiRun?.id ?? 'no-ai-run'}
            aiIssueReason={aiIssueReason}
            canApprove={canApprove}
            canSuggest={canSuggest}
            errorMessage={aiErrorMessage}
            isBusy={isAiBusy}
            isAutopilotActive={isAutopilotActive}
            mode={responderMode}
            onApprove={onApproveAiRun}
            onFeedback={onAiFeedback}
            onGenerate={onGenerateAiSuggestion}
            onPauseAutopilot={() => onResponderModeChange('human')}
            onStartAutopilot={onStartAutopilot}
            onReject={onRejectAiRun}
            onUseSuggestion={setDraft}
            run={aiRun}
          />
        ) : null}
        <div className="chat-compose-actions">
          <button type="button" aria-label="Đính kèm">
            <PaperClipOutlined />
          </button>
          <button type="button" aria-label="Biểu cảm">
            <SmileOutlined />
          </button>
          <div className="chat-action-menu">
            <button
              className="chat-action-trigger"
              onClick={() => setIsActionSelectOpen((isOpen) => !isOpen)}
              type="button"
            >
              {'Th\u00eam t\u00e1c v\u1ee5'}
            </button>
            {isActionSelectOpen ? (
              <label className="chat-action-select-wrap">
                <span>Responder</span>
                <select
                  onChange={(event) => {
                    void onResponderModeChange(event.target.value as ResponderMode)
                  }}
                  disabled={!conversation || !canSuggest || isAiBusy}
                  value={responderMode}
                >
                  <option value="ai-autopilot">AI Autopilot Responder</option>
                  <option value="human">Human Responder</option>
                  <option value="ai-recommend">AI recommend responder</option>
                </select>
              </label>
            ) : null}
          </div>
        </div>

        <form className="chat-message-input" onSubmit={handleSubmit}>
          <textarea
            disabled={!conversation || isSending || isAutopilotActive}
            onChange={(event) => setDraft(event.target.value)}
            onInput={handleMessageInput}
            onKeyDown={handleComposerKeyDown}
            placeholder={
              isAutopilotActive
                ? 'Tạm dừng AI Autopilot để nhân viên trả lời'
                : `Nhập phản hồi cho ${customerName}...`
            }
            rows={1}
            value={draft}
          />
          <button
            aria-label="Gửi tin nhắn"
            disabled={
              !conversation ||
              !draft.trim() ||
              isSending ||
              isAutopilotActive
            }
            type="submit"
          >
            <SendOutlined />
          </button>
        </form>
      </footer>
    </main>
  )
}
