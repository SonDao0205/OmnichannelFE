import { SearchOutlined } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import type { ChatChannelFilter, ChatConversation } from '../../apis/chatApi'
import Avatar from './Avatar'

type ConversationInboxProps = {
  channel: ChatChannelFilter
  conversations: ChatConversation[]
  isLoading: boolean
  selectedConversationId: string | null
  onChannelChange: (channel: ChatChannelFilter) => void
  onSelectConversation: (conversationId: string) => void
}

const channelOptions: Array<{
  label: string
  value: ChatChannelFilter
}> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'TikTok Shop', value: 'TIKTOK_SHOP' },
  { label: 'Lazada', value: 'LAZADA' },
]

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.slice(-3).map((word) => word[0]?.toUpperCase() ?? '')
  return letters.join('') || 'KH'
}

function formatRelativeTime(value: string | null) {
  if (!value) return '--'

  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))

  if (minutes < 1) return 'vừa xong'
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`

  return `${Math.floor(hours / 24)}d`
}

export default function ConversationInbox({
  channel,
  conversations,
  isLoading,
  selectedConversationId,
  onChannelChange,
  onSelectConversation,
}: ConversationInboxProps) {
  const [keyword, setKeyword] = useState('')

  const filteredConversations = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    if (!normalizedKeyword) return conversations

    return conversations.filter((conversation) => {
      return (
        conversation.customerName.toLowerCase().includes(normalizedKeyword) ||
        (conversation.lastMessage ?? '').toLowerCase().includes(normalizedKeyword)
      )
    })
  }, [conversations, keyword])

  const unreadCount = conversations.filter(
    (conversation) => conversation.unreadCount > 0,
  ).length
  const openCount = conversations.filter(
    (conversation) => conversation.status !== 'CLOSED',
  ).length
  const closedCount = conversations.length - openCount

  return (
    <aside className="chat-inbox" aria-label="Danh sách hội thoại">
      <div className="chat-inbox-search">
        <label className="chat-search-box">
          <SearchOutlined />
          <input
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm kiếm hội thoại..."
            type="search"
            value={keyword}
          />
        </label>
      </div>

      <div className="chat-channel-filter" aria-label="Bộ lọc kênh">
        {channelOptions.map((option) => (
          <button
            className={`chat-filter-pill ${
              channel === option.value ? 'is-active' : 'chat-filter-pill--ghost'
            }`}
            key={option.value}
            onClick={() => onChannelChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="chat-tabs">
        <button className="is-active" type="button">
          Chưa trả lời {unreadCount}
        </button>
        <button type="button">Đang xử lý {openCount}</button>
        <button type="button">Đã xong {closedCount}</button>
      </div>

      <div className="chat-conversation-list">
        {isLoading ? <div className="chat-empty">Đang tải hội thoại...</div> : null}

        {!isLoading && filteredConversations.length === 0 ? (
          <div className="chat-empty">Chưa có hội thoại phù hợp</div>
        ) : null}

        {filteredConversations.map((conversation, index) => {
          const isActive = conversation.id === selectedConversationId
          const channelTagClass =
            conversation.channel === 'LAZADA' ? 'chat-tag chat-tag--blue' : 'chat-tag'

          return (
            <button
              className={`chat-conversation ${isActive ? 'is-active' : ''}`}
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              type="button"
            >
              <Avatar
                avatarUrl={conversation.avatarUrl}
                initials={getInitials(conversation.customerName)}
                tone={index % 2 === 0 ? 'pink' : 'orange'}
              />
              <div className="chat-conversation-copy">
                <h3>{conversation.customerName}</h3>
                <p>{conversation.lastMessage ?? 'Chưa có tin nhắn'}</p>
                <div className="chat-tag-row">
                  <span className={channelTagClass}>{conversation.channelName}</span>
                  {conversation.priority !== 'NORMAL' ? (
                    <span className="chat-tag">{conversation.priority}</span>
                  ) : null}
                </div>
              </div>
              <div className="chat-conversation-meta">
                <span>{formatRelativeTime(conversation.lastMessageAt)}</span>
                {conversation.unreadCount > 0 ? (
                  <span className="chat-unread">{conversation.unreadCount}</span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
