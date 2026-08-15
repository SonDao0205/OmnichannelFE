import { Button, Tooltip } from 'antd'
import type {
  ChatConversation,
  ChatConversationDetail,
  CustomerAiProfileView,
  CustomerProductRecommendation,
  MarketplaceCustomer,
} from '../../apis/chatApi'
import Avatar from './Avatar'

type CustomerProfilePanelProps = {
  conversation: ChatConversation | null
  detail: ChatConversationDetail | null
  customerProfile: CustomerAiProfileView | null
  isProfileLoading: boolean
  showAiBehaviorInsights: boolean
  onRefreshProfile: () => void
  onDismissRecommendation: (recommendation: CustomerProductRecommendation) => void
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
  customerProfile,
  isProfileLoading,
  showAiBehaviorInsights,
  onRefreshProfile,
  onDismissRecommendation,
}: CustomerProfilePanelProps) {
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
  const profile = customerProfile?.aiProfile
  const leadPriority = customerProfile?.leadPriority
  const recommendations = customerProfile?.recommendations ?? []
  const preferences = profile?.preferences ?? []

  function formatMoney(value: string, currency: string) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(Number(value))
  }

  return (
    <aside className="chat-profile" aria-label="Thông tin khách hàng">
      <div className="chat-profile-body">
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
                  <span>Lead priority</span>
                  {leadPriority ? (
                    <Tooltip
                      title={(
                        <div className="lead-priority-tooltip">
                          <strong>{leadPriority.label}</strong>
                          <p>{leadPriority.definition}</p>
                          {leadPriority.reason ? <p><b>Lý do:</b> {leadPriority.reason}</p> : null}
                          <small>Nguồn: {leadPriority.source}</small>
                        </div>
                      )}
                    >
                      <button
                        className={`lead-priority-badge is-${leadPriority.code.toLowerCase()}`}
                        type="button"
                        aria-label={`${leadPriority.label}: ${leadPriority.definition}`}
                      >
                        {leadPriority.label}
                      </button>
                    </Tooltip>
                  ) : <strong>Chưa phân loại</strong>}
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
                <b>XL</b>
                Mức độ xử lý: {conversation?.priority ?? detail?.priority ?? '--'}
              </p>
              <div className="chat-customer-preferences">
                <b>Ưu tiên của khách</b>
                {isProfileLoading ? <span>Đang phân tích…</span> : null}
                {!isProfileLoading && preferences.length === 0 ? (
                  <span>AI chưa đủ dữ liệu</span>
                ) : null}
                <div className="chat-preference-chips">
                  {preferences.slice(0, 6).map((preference) => (
                    <span key={preference}>{preference}</span>
                  ))}
                </div>
              </div>
            </section>

            {showAiBehaviorInsights ? (
              <section className="chat-profile-section">
                <h3>AI behavior insights</h3>
                <div className="chat-insight">
                  {profile?.summary || 'AI chưa có đủ dữ liệu để tóm tắt khách hàng.'}
                </div>
                <div className="chat-insight">
                  AI mode: {detail?.aiMode ?? 'Chưa đồng bộ'} · Hồ sơ v{profile?.version ?? 0}
                </div>
                <Button size="small" loading={isProfileLoading} onClick={onRefreshProfile}>
                  Phân tích lại hồ sơ
                </Button>
              </section>
            ) : null}

            <section className="chat-profile-section chat-profile-section--last">
              <h3>AI smart upsell recommendations</h3>
              {recommendations.length === 0 ? (
                <div className="chat-empty">
                  {leadPriority?.code === 'COLD_LEAD'
                    ? 'Cần hiểu rõ nhu cầu trước khi đề xuất sản phẩm.'
                    : 'Chưa có sản phẩm phù hợp để đề xuất.'}
                </div>
              ) : null}
              <div className="chat-recommendations">
                {recommendations.map((item) => (
                  <article className="chat-mini-product" key={item.id}>
                    {item.imageUrl ? (
                      <img className="chat-mini-photo" src={item.imageUrl} alt="" />
                    ) : <div className="chat-mini-photo" />}
                    <div className="chat-mini-product-body">
                      <strong>{item.productName}</strong>
                      {item.variantName ? <small>{item.variantName}</small> : null}
                      <span>{formatMoney(item.price, item.currency)}</span>
                      <small>Còn {item.availableStock} · {item.type}</small>
                      <p>{item.reason}</p>
                      <button type="button" onClick={() => onDismissRecommendation(item)}>
                        Ẩn gợi ý
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
      </div>
    </aside>
  )
}
