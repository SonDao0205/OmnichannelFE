import {
  LineChartOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { analyticsApi, type DashboardOverviewData } from '../../apis/analyticsApi'
import { useAuth } from '../../contexts/authContext'
import './overview.css'

const ORDER_STATUSES: Record<string, { label: string; tone: string }> = {
  CREATED: { label: 'Đơn mới', tone: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'info' },
  READY_TO_SHIP: { label: 'Sẵn sàng bàn giao', tone: 'success' },
  SHIPPED: { label: 'Đã bàn giao', tone: 'info' },
  IN_TRANSIT: { label: 'Đang vận chuyển', tone: 'info' },
  DELIVERED: { label: 'Đã giao', tone: 'success' },
  CANCELLED: { label: 'Đã hủy', tone: 'danger' },
  RETURNED: { label: 'Đã hoàn', tone: 'danger' },
}

const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(value)

export default function OverviewScreen() {
  const { session } = useAuth()
  const [data, setData] = useState<DashboardOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadOverview = () => {
    setLoading(true)
    setError(false)
    analyticsApi.fetchOverview()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    document.title = 'Tổng quan | Omnichannel'
    loadOverview()
  }, [])

  const currentDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="dashboard-overview">
      <header className="dashboard-welcome">
        <div className="welcome-info">
          <h1>Chào mừng trở lại, {session?.user.displayName || 'Quản trị viên'}!</h1>
          <p>Tổng hợp hoạt động bán hàng trong ngày hôm nay.</p>
        </div>
        <div className="dashboard-date">📅 {currentDate}</div>
      </header>

      {loading && <div className="dashboard-state">Đang tải dữ liệu tổng quan...</div>}
      {!loading && error && (
        <div className="dashboard-state dashboard-error">
          <span>Không thể tải dữ liệu tổng quan.</span>
          <button type="button" onClick={loadOverview}><ReloadOutlined /> Thử lại</button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <section className="kpi-grid">
            <div className="kpi-card kpi-revenue">
              <div className="kpi-icon-wrapper"><LineChartOutlined /></div>
              <div className="kpi-info">
                <span className="kpi-title">Doanh thu hôm nay</span>
                <span className="kpi-value">{formatVND(data.todayRevenue)}</span>
                <span className="kpi-description">Đơn đã xác nhận hoặc sẵn sàng bàn giao</span>
              </div>
            </div>

            <div className="kpi-card kpi-orders">
              <div className="kpi-icon-wrapper"><ShoppingCartOutlined /></div>
              <div className="kpi-info">
                <span className="kpi-title">Đơn hàng mới</span>
                <span className="kpi-value">{data.newOrdersToday.toLocaleString('vi-VN')} đơn</span>
                <span className="kpi-description">Tất cả đơn được tạo hôm nay</span>
              </div>
            </div>

            <div className="kpi-card kpi-customers">
              <div className="kpi-icon-wrapper"><TeamOutlined /></div>
              <div className="kpi-info">
                <span className="kpi-title">Khách hàng mới</span>
                <span className="kpi-value">{data.newCustomersToday.toLocaleString('vi-VN')} khách</span>
                <span className="kpi-description">Lần đầu nhắn tin với shop hôm nay</span>
              </div>
            </div>
          </section>

          <section className="dashboard-panel">
            <header className="panel-header"><h2>Danh sách kênh bán hàng</h2></header>
            <div className="channels-list">
              {data.channels.map((channel) => (
                <div className="channel-card" key={channel.marketplace}>
                  <div className="channel-logo-info">
                    <div className={`channel-logo-wrapper ${channel.marketplace === 'TIKTOK_SHOP' ? 'channel-logo-tiktok' : 'channel-logo-lazada'}`}>
                      {channel.marketplace === 'TIKTOK_SHOP' ? 'T' : 'L'}
                    </div>
                    <span className="channel-name">{channel.marketplaceName}</span>
                  </div>
                  <strong>{channel.productCount.toLocaleString('vi-VN')} sản phẩm</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <header className="panel-header"><h2>5 đơn hàng gần nhất</h2></header>
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Kênh bán</th>
                    <th>Thời gian tạo</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.length === 0 && (
                    <tr><td className="empty-cell" colSpan={6}>Chưa có đơn hàng.</td></tr>
                  )}
                  {data.recentOrders.map((order) => {
                    const status = ORDER_STATUSES[order.status] || { label: order.status, tone: 'info' }
                    return (
                      <tr key={order.id}>
                        <td className="order-code">{order.externalOrderId}</td>
                        <td>{order.customerName}</td>
                        <td>{order.marketplaceName}</td>
                        <td>{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="order-total">{formatVND(order.totalAmount)}</td>
                        <td><span className={`badge-status ${status.tone}`}>{status.label}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
