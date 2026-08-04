import { SearchOutlined, StarFilled, WarningFilled } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import type { ChatChannelFilter, ChatConversation } from '../../apis/chatApi'
import Avatar from './Avatar'

type InboxStatusFilter = 'attention' | 'read' | 'pinned'

type ConversationInboxProps = {
  channel: ChatChannelFilter
  conversations: ChatConversation[]
  isLoading: boolean
  pinnedConversationIds: Set<string>
  selectedConversationId: string | null
  onChannelChange: (channel: ChatChannelFilter) => void
  onSelectConversation: (conversationId: string) => void
  onTogglePinnedConversation: (conversationId: string) => void
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
  pinnedConversationIds,
  selectedConversationId,
  onChannelChange,
  onSelectConversation,
  onTogglePinnedConversation,
}: ConversationInboxProps) {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<InboxStatusFilter>('attention')

  const filteredConversations = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return conversations.filter((conversation) => {
      const matchesKeyword =
        !normalizedKeyword ||
        conversation.customerName.toLowerCase().includes(normalizedKeyword) ||
        (conversation.lastMessage ?? '').toLowerCase().includes(normalizedKeyword)

      if (!matchesKeyword) return false
      if (statusFilter === 'attention') {
        return conversation.unreadCount > 0 || conversation.aiNeedsHuman
      }
      if (statusFilter === 'read') {
        return conversation.unreadCount === 0 && !conversation.aiNeedsHuman
      }

      return pinnedConversationIds.has(conversation.id)
    })
  }, [conversations, keyword, pinnedConversationIds, statusFilter])

  const attentionCount = conversations.filter(
    (conversation) => conversation.unreadCount > 0 || conversation.aiNeedsHuman,
  ).length
  const readCount = conversations.filter(
    (conversation) => conversation.unreadCount === 0 && !conversation.aiNeedsHuman,
  ).length
  const pinnedCount = conversations.filter((conversation) =>
    pinnedConversationIds.has(conversation.id),
  ).length

  const inboxTabs: Array<{
    label: string
    value: InboxStatusFilter
    count: number
  }> = [
    { label: 'Cần xử lý', value: 'attention', count: attentionCount },
    { label: '\u0110\u00e3 \u0111\u1ecdc', value: 'read', count: readCount },
    { label: 'Ghim', value: 'pinned', count: pinnedCount },
  ]

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
        {inboxTabs.map((tab) => (
          <button
            className={statusFilter === tab.value ? 'is-active' : ''}
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            type="button"
          >
            {tab.label} {tab.count}
          </button>
        ))}
      </div>

      <div className="chat-conversation-list">
        {isLoading ? <div className="chat-empty">Đang tải hội thoại...</div> : null}

        {!isLoading && filteredConversations.length === 0 ? (
          <div className="chat-empty">Chưa có hội thoại phù hợp</div>
        ) : null}

        {filteredConversations.map((conversation, index) => {
          const isActive = conversation.id === selectedConversationId
          const isPinned = pinnedConversationIds.has(conversation.id)
          const channelTagClass =
            conversation.channel === 'LAZADA' ? 'chat-tag chat-tag--blue' : 'chat-tag'

          return (
            <div
              className={`chat-conversation ${isActive ? 'is-active' : ''} ${
                conversation.aiNeedsHuman ? 'is-ai-alert' : ''
              }`}
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectConversation(conversation.id)
                }
              }}
              role="button"
              tabIndex={0}
              title={conversation.aiIssueReason ?? undefined}
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
                  {conversation.aiNeedsHuman ? (
                    <span className="chat-tag chat-tag--ai-alert">
                      <WarningFilled /> AI cần xử lý
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="chat-conversation-meta">
                <div className="chat-conversation-time-row">
                  <button
                    aria-label={isPinned ? 'Bo ghim hoi thoai' : 'Ghim hoi thoai'}
                    className={`chat-pin-button ${isPinned ? 'is-pinned' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onTogglePinnedConversation(conversation.id)
                    }}
                    title={isPinned ? 'Bo ghim hoi thoai' : 'Ghim hoi thoai'}
                    type="button"
                  >
                    <StarFilled />
                  </button>
                  <span>{formatRelativeTime(conversation.lastMessageAt)}</span>
                </div>
                {conversation.unreadCount > 0 ? (
                  <span className="chat-unread">{conversation.unreadCount}</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
