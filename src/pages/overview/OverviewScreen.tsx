import {
  ArrowUpOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  LineChartOutlined,
} from '@ant-design/icons'
import { useEffect } from 'react'
import { useAuth } from '../../contexts/authContext'
import './overview.css'

export default function OverviewScreen() {
  const { session } = useAuth()

  useEffect(() => {
    document.title = 'Tổng quan hệ thống | SmartHub'
  }, [])

  // Format current date
  const currentDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Mock revenue chart path coords
  const chartPoints = [
    { label: 'T2', val: 32, x: 50, y: 180 },
    { label: 'T3', val: 45, x: 130, y: 150 },
    { label: 'T4', val: 78, x: 210, y: 90 },
    { label: 'T5', val: 55, x: 290, y: 130 },
    { label: 'T6', val: 92, x: 370, y: 60 },
    { label: 'T7', val: 110, x: 450, y: 30 },
    { label: 'CN', val: 124, x: 530, y: 15 },
  ]

  const chartPath = chartPoints.map((p) => `${p.x},${p.y}`).join(' ')
  const areaPath = `50,220 ${chartPath} 530,220`

  // Mock recent orders list
  const recentOrders = [
    { id: 'ORD-8942', customer: 'Nguyễn Minh Hoàng', channel: 'Shopee', total: '39.500.000đ', status: 'SUCCESS', statusLabel: 'Đã hoàn thành' },
    { id: 'ORD-8941', customer: 'Trần Thị Thu Hà', channel: 'TikTok Shop', total: '1.250.000đ', status: 'WARNING', statusLabel: 'Chờ thanh toán' },
    { id: 'ORD-8940', customer: 'Phạm Minh Tuấn', channel: 'Lazada', total: '8.400.000đ', status: 'INFO', statusLabel: 'Đang vận chuyển' },
    { id: 'ORD-8939', customer: 'Lê Thanh Hải', channel: 'Zalo OA', total: '450.000đ', status: 'SUCCESS', statusLabel: 'Đã hoàn thành' },
    { id: 'ORD-8938', customer: 'Vũ Thị Mai', channel: 'Shopee', total: '2.150.000đ', status: 'SUCCESS', statusLabel: 'Đã hoàn thành' },
  ]

  return (
    <div className="dashboard-overview">
      
      {/* Welcome Header */}
      <header className="dashboard-welcome">
        <div className="welcome-info">
          <h1>Chào mừng trở lại, {session?.user.displayName || 'Quản trị viên'}!</h1>
          <p>Dưới đây là hiệu năng hoạt động của hệ thống SmartHub của bạn ngày hôm nay.</p>
        </div>
        <div className="dashboard-date">
          📅 {currentDate}
        </div>
      </header>

      {/* KPI Cards Row */}
      <section className="kpi-grid">
        
        {/* Card 1: Revenue */}
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon-wrapper">
            <LineChartOutlined />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Doanh thu hôm nay</span>
            <span className="kpi-value">124.500.000đ</span>
            <span className="kpi-trend up">
              <ArrowUpOutlined /> +12.4% vs hôm qua
            </span>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="kpi-card kpi-orders">
          <div className="kpi-icon-wrapper">
            <ShoppingCartOutlined />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Đơn hàng mới</span>
            <span className="kpi-value">86 đơn</span>
            <span className="kpi-trend up">
              <ArrowUpOutlined /> +8.2% vs hôm qua
            </span>
          </div>
        </div>

        {/* Card 3: Conversion Rate */}
        <div className="kpi-card kpi-conversion">
          <div className="kpi-icon-wrapper">
            <AppstoreOutlined />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Tỷ lệ chốt đơn</span>
            <span className="kpi-value">74.2%</span>
            <span className="kpi-trend up">
              <ArrowUpOutlined /> +2.4% vs tuần trước
            </span>
          </div>
        </div>

        {/* Card 4: New Customers */}
        <div className="kpi-card kpi-customers">
          <div className="kpi-icon-wrapper">
            <TeamOutlined />
          </div>
          <div className="kpi-info">
            <span className="kpi-title">Khách hàng mới</span>
            <span className="kpi-value">34 khách</span>
            <span className="kpi-trend up">
              <ArrowUpOutlined /> +15.3% vs tuần trước
            </span>
          </div>
        </div>

      </section>

      {/* Main Dashboard Rows */}
      <div className="dashboard-row">
        
        {/* Chart Panel */}
        <div className="dashboard-panel">
          <header className="panel-header">
            <h2>Hiệu năng doanh số tuần này</h2>
            <span className="panel-action">Chi tiết báo cáo</span>
          </header>
          <div className="chart-container">
            <svg className="chart-svg" viewBox="0 0 580 250">
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="50" y1="30" x2="550" y2="30" className="chart-grid-line" />
              <line x1="50" y1="90" x2="550" y2="90" className="chart-grid-line" />
              <line x1="50" y1="150" x2="550" y2="150" className="chart-grid-line" />
              <line x1="50" y1="220" x2="550" y2="220" className="chart-grid-line" />

              {/* Filled Area */}
              <polygon points={areaPath} className="chart-area" />

              {/* Smooth Path Line */}
              <polyline points={chartPath} className="chart-line" />

              {/* Interactive Dots & Labels */}
              {chartPoints.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="5" className="chart-dot" />
                  <text x={p.x} y={p.y - 12} className="chart-label" style={{ fontWeight: '600', fill: '#4f46e5' }}>
                    {p.val}M
                  </text>
                  <text x={p.x} y="240" className="chart-label">
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Connected Channels Panel */}
        <div className="dashboard-panel">
          <header className="panel-header">
            <h2>Kênh bán hàng kết nối</h2>
            <span className="panel-action">Quản lý</span>
          </header>
          <div className="channels-list">
            
            <div className="channel-card">
              <div className="channel-logo-info">
                <div className="channel-logo-wrapper channel-logo-shopee">S</div>
                <div className="channel-details">
                  <span className="channel-name">Shopee Vietnam</span>
                  <span className="channel-status-sync">Đồng bộ: 342 sản phẩm</span>
                </div>
              </div>
              <span className="channel-status-badge active">Hoạt động</span>
            </div>

            <div className="channel-card">
              <div className="channel-logo-info">
                <div className="channel-logo-wrapper channel-logo-tiktok">T</div>
                <div className="channel-details">
                  <span className="channel-name">TikTok Shop Mall</span>
                  <span className="channel-status-sync">Đồng bộ: 281 sản phẩm</span>
                </div>
              </div>
              <span className="channel-status-badge active">Hoạt động</span>
            </div>

            <div className="channel-card">
              <div className="channel-logo-info">
                <div className="channel-logo-wrapper channel-logo-lazada">L</div>
                <div className="channel-details">
                  <span className="channel-name">Lazada Store</span>
                  <span className="channel-status-sync">Đồng bộ: 150 sản phẩm</span>
                </div>
              </div>
              <span className="channel-status-badge active">Hoạt động</span>
            </div>

            <div className="channel-card">
              <div className="channel-logo-info">
                <div className="channel-logo-wrapper channel-logo-zalo">Z</div>
                <div className="channel-details">
                  <span className="channel-name">Zalo Official Account</span>
                  <span className="channel-status-sync">2.3k người quan tâm</span>
                </div>
              </div>
              <span className="channel-status-badge active">Hoạt động</span>
            </div>

          </div>
        </div>

      </div>

      {/* Row 2: Recent Orders Table */}
      <div className="dashboard-row full-width">
        <div className="dashboard-panel">
          <header className="panel-header">
            <h2>Hóa đơn &amp; Đơn hàng gần đây</h2>
            <span className="panel-action">Tất cả đơn hàng</span>
          </header>
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Kênh kết nối</th>
                  <th>Tổng tiền đơn</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td style={{ fontWeight: '600', color: '#4f46e5' }}>{ord.id}</td>
                    <td style={{ fontWeight: '550' }}>{ord.customer}</td>
                    <td>{ord.channel}</td>
                    <td style={{ fontWeight: '600' }}>{ord.total}</td>
                    <td>
                      <span className={`badge-status ${
                        ord.status === 'SUCCESS' ? 'success' : ord.status === 'WARNING' ? 'warning' : 'info'
                      }`}>
                        {ord.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
