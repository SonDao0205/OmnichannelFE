import { useState } from 'react'
import type {
  ChatConversation,
  ChatConversationDetail,
  ChatOrderHistory,
  MarketplaceCustomer,
} from '../../apis/chatApi'
import Avatar from './Avatar'
import { recommendations } from './chatData'
import OrderHistoryPanel from './OrderHistoryPanel'

type CustomerProfilePanelProps = {
  conversation: ChatConversation | null
  detail: ChatConversationDetail | null
  orderHistory: ChatOrderHistory | null
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.slice(-3).map((word) => word[0]?.toUpperCase() ?? '')
  return letters.join('') || 'KH'
}

function getCustomerName(
  conversation: ChatConversation | null,
  customer: MarketplaceCustomer | undefined,
) {
  return (
    conversation?.customerName ??
    customer?.displayName ??
    customer?.externalCustomerId ??
    'Khách hàng'
  )
}

export default function CustomerProfilePanel({
  conversation,
  detail,
  orderHistory,
}: CustomerProfilePanelProps) {
  const [activeTab, setActiveTab] = useState<'dna' | 'orders'>('dna')
  const customer = detail?.marketplaceCustomer
  const customerName = getCustomerName(conversation, customer)
  const channelName =
    conversation?.channelName ??
    detail?.marketplaceAccount?.marketplace?.marketplaceName ??
    'Marketplace'
  const joinedAt = customer?.lastSeenAt
    ? `Hoạt động gần nhất ${new Intl.DateTimeFormat('vi-VN').format(
        new Date(customer.lastSeenAt),
      )}`
    : 'Chưa có lịch sử hoạt động'

  return (
    <aside className="chat-profile" aria-label="Thông tin khách hàng">
      <div className="chat-profile-tabs">
        <button
          className={activeTab === 'dna' ? 'is-active' : ''}
          onClick={() => setActiveTab('dna')}
          type="button"
        >
          Customer DNA
        </button>
        <button
          className={activeTab === 'orders' ? 'is-active' : ''}
          onClick={() => setActiveTab('orders')}
          type="button"
        >
          Lịch sử đơn ({orderHistory?.totalOrders ?? 0})
        </button>
      </div>

      <div className="chat-profile-body">
        {activeTab === 'orders' ? (
          <OrderHistoryPanel orderHistory={orderHistory} />
        ) : (
          <>
            <section className="chat-profile-summary">
              <Avatar
                avatarUrl={conversation?.avatarUrl ?? customer?.avatarUrl}
                initials={getInitials(customerName)}
                size="lg"
              />
              <h2>{customerName}</h2>
              <span className="chat-member">{channelName}</span>
              <span className="chat-joined">{joinedAt}</span>

              <div className="chat-stats">
                <div className="chat-stat">
                  <span>Trạng thái</span>
                  <strong>{conversation?.status ?? detail?.internalStatus ?? '--'}</strong>
                </div>
                <div className="chat-stat">
                  <span>Chưa đọc</span>
                  <strong>{conversation?.unreadCount ?? detail?.unreadCount ?? 0}</strong>
                </div>
              </div>
            </section>

            <section className="chat-profile-section">
              <h3>Thông tin liên hệ</h3>
              <p>
                <b>SĐT</b>
                {conversation?.phone ?? customer?.phoneMasked ?? 'Chưa có'}
              </p>
              <p>
                <b>Email</b>
                {customer?.emailMasked ?? 'Chưa có'}
              </p>
              <p>
                <b>Ưu tiên</b>
                {conversation?.priority ?? detail?.priority ?? '--'}
              </p>
            </section>

            <section className="chat-profile-section">
              <h3>AI behavior insights</h3>
              <div className="chat-insight">
                AI mode: {detail?.aiMode ?? 'Chưa đồng bộ'}
              </div>
              <div className="chat-insight">
                Hội thoại cập nhật theo realtime từ ChatBE.
              </div>
            </section>

            <section className="chat-profile-section chat-profile-section--last">
              <h3>AI smart upsell recommendations</h3>
              <div className="chat-recommendations">
                {recommendations.map((item) => (
                  <article className="chat-mini-product" key={item.name}>
                    <div className={`chat-mini-photo ${item.dark ? 'is-dark' : ''}`} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.price}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </aside>
  )
}
