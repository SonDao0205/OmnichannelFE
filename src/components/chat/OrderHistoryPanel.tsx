import type { ChatOrderHistory } from '../../apis/chatApi'

type OrderHistoryPanelProps = {
  orderHistory: ChatOrderHistory | null
}

function formatMoney(value: string, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}

function statusLabel(status: string) {
  if (status === 'DELIVERED') return 'Hoàn tất'
  if (status === 'RETURNED') return 'Đã hoàn'
  if (status === 'CANCELLED') return 'Đã hủy'
  return status
}

export default function OrderHistoryPanel({ orderHistory }: OrderHistoryPanelProps) {
  const orders = orderHistory?.orders ?? []

  return (
    <div className="chat-order-history" aria-label="Lịch sử đơn hàng">
      <div className="chat-order-summary">
        <div>
          <span>Tổng đơn</span>
          <strong>{orderHistory?.totalOrders ?? 0}</strong>
        </div>
        <div>
          <span>Giá trị gần nhất</span>
          <strong>{formatMoney(orderHistory?.latestOrderTotal ?? '0')}</strong>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="chat-empty">Chưa có đơn hàng</div>
      ) : null}

      <div className="chat-order-list">
        {orders.map((order) => (
          <article className="chat-order-card" key={order.id}>
            <div className="chat-order-card-header">
              <div>
                <strong>{order.externalOrderId}</strong>
                <span>{formatDate(order.externalCreatedAt)}</span>
              </div>
              <span
                className={
                  order.canonicalStatus === 'RETURNED'
                    ? 'chat-order-status is-returned'
                    : 'chat-order-status'
                }
              >
                {statusLabel(order.canonicalStatus)}
              </span>
            </div>
            <p>{order.items || 'Chưa có sản phẩm'}</p>
            <div className="chat-order-card-footer">
              <span>{order.channelName}</span>
              <strong>{formatMoney(order.totalAmount, order.currency)}</strong>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
