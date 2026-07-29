import {
  CustomerServiceOutlined,
  MoreOutlined,
  PaperClipOutlined,
  PhoneOutlined,
  SendOutlined,
  SmileOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import type {
  ChatConversation,
  ChatConversationDetail,
  ChatMessage,
} from '../../apis/chatApi'
import Avatar from './Avatar'
import ProductPreviewCard from './ProductPreviewCard'

type ChatWindowProps = {
  conversation: ChatConversation | null
  detail: ChatConversationDetail | null
  errorMessage: string | null
  isLoading: boolean
  isSending: boolean
  messages: ChatMessage[]
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
  onSendMessage,
}: ChatWindowProps) {
  const [draft, setDraft] = useState('')
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
          <button type="button" aria-label="Gọi điện">
            <PhoneOutlined />
          </button>
          <button type="button" aria-label="Gọi video">
            <VideoCameraOutlined />
          </button>
          <button type="button" aria-label="Chăm sóc khách hàng">
            <CustomerServiceOutlined />
          </button>
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
        <div className="chat-autopilot">
          <span className="chat-bolt">
            <ThunderboltOutlined />
          </span>
          <div>
            <strong>AI Autopilot Responder</strong>
            <span>Sẵn sàng hỗ trợ lời chào, FAQ và phản hồi lặp lại</span>
          </div>
          <button className="chat-toggle" type="button" aria-label="Bật tắt AI Autopilot" />
        </div>

        <div className="chat-compose-actions">
          <button type="button" aria-label="Đính kèm">
            <PaperClipOutlined />
          </button>
          <button type="button" aria-label="Biểu cảm">
            <SmileOutlined />
          </button>
          <span>Mẫu trả lời nhanh (FB)</span>
        </div>

        <form className="chat-message-input" onSubmit={handleSubmit}>
          <textarea
            disabled={!conversation || isSending}
            onChange={(event) => setDraft(event.target.value)}
            onInput={handleMessageInput}
            placeholder={`Nhập phản hồi cho ${customerName}...`}
            rows={1}
            value={draft}
          />
          <button
            aria-label="Gửi tin nhắn"
            disabled={!conversation || !draft.trim() || isSending}
            type="submit"
          >
            <SendOutlined />
          </button>
        </form>
      </footer>
    </main>
  )
}
