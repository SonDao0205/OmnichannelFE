import {
  ArrowRightOutlined,
  BarChartOutlined,
  BellFilled,
  CheckCircleFilled,
  CustomerServiceOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  ThunderboltFilled,
} from '@ant-design/icons'
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { marketplaceApi } from '../../apis/marketplaceApi'
import { orderApi } from '../../apis/orderApi'
import { productApi } from '../../apis/productApi'
import { shipmentApi, type ShipmentOverview } from '../../apis/shipmentApi'
import { useAuth } from '../../contexts/authContext'
import { ROUTES } from '../../routes/paths'
import type { MarketplaceConnection } from '../../types/marketplace'
import type { Order } from '../../types/order'
import type { Product } from '../../types/product'
import './overview.css'

const EMPTY_SHIPMENT_OVERVIEW: ShipmentOverview = {
  countWaiting: 0,
  countPicked: 0,
  countInTransit: 0,
  countFailed: 0,
  countSuccess: 0,
  ghtkAvgHours: 0,
  ghnAvgHours: 0,
  ghtkSuccessRate: 0,
  ghnSuccessRate: 0,
}

const SEARCH_DESTINATIONS = [
  { keywords: ['đơn', 'order', 'bán hàng'], label: 'Quản lý đơn hàng', to: ROUTES.orders },
  { keywords: ['sản phẩm', 'product'], label: 'Quản lý sản phẩm', to: ROUTES.products },
  { keywords: ['kho', 'tồn kho'], label: 'Quản lý kho', to: ROUTES.warehouse },
  { keywords: ['vận chuyển', 'ship'], label: 'Vận chuyển', to: ROUTES.shipping },
  { keywords: ['chat', 'hội thoại'], label: 'Hội thoại', to: ROUTES.chat },
  { keywords: ['báo cáo', 'doanh thu'], label: 'Báo cáo doanh số', to: ROUTES.analytics },
  { keywords: ['kết nối', 'lazada', 'tiktok'], label: 'Liên kết sàn', to: ROUTES.connect },
]

function startOfDay(value: Date) {
  const result = new Date(value)
  result.setHours(0, 0, 0, 0)
  return result
}

function endOfDay(value: Date) {
  const result = new Date(value)
  result.setHours(23, 59, 59, 999)
  return result
}

function addDays(value: Date, days: number) {
  const result = new Date(value)
  result.setDate(result.getDate() + days)
  return result
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString('vi-VN', {
      maximumFractionDigits: 1,
    })} tỷ`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', {
      maximumFractionDigits: 1,
    })} triệu`
  }
  return formatCurrency(value)
}

function latestTimestamp(orders: Order[], products: Product[]) {
  const timestamps = [
    ...orders.map((order) => new Date(order.updatedAt || order.createdAt).getTime()),
    ...products.map((product) => new Date(product.createdAt || 0).getTime()),
  ].filter(Number.isFinite)
  return timestamps.length ? Math.max(...timestamps) : 0
}

function relativeTime(timestamp: number) {
  if (!timestamp) return 'Chưa có hoạt động'
  const difference = Date.now() - timestamp
  const minutes = Math.max(0, Math.floor(difference / 60_000))
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

export default function OverviewScreen() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const searchRef = useRef<HTMLInputElement>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [connections, setConnections] = useState<MarketplaceConnection[]>([])
  const [shipmentOverview, setShipmentOverview] = useState<ShipmentOverview>(
    EMPTY_SHIPMENT_OVERVIEW,
  )
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState('')

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setWarning('')
    const results = await Promise.allSettled([
      orderApi.fetchOrdersForReport(),
      productApi.fetchProducts('', '', 0, 500),
      marketplaceApi.list(),
      shipmentApi.fetchOverview(),
    ])

    if (results[0].status === 'fulfilled') setOrders(results[0].value)
    if (results[1].status === 'fulfilled') setProducts(results[1].value)
    if (results[2].status === 'fulfilled') setConnections(results[2].value)
    if (results[3].status === 'fulfilled') setShipmentOverview(results[3].value)
    if (results.some((result) => result.status === 'rejected')) {
      setWarning('Một phần dữ liệu chưa tải được. Các chỉ số còn lại vẫn được cập nhật.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOverview(), 0)
    return () => window.clearTimeout(timer)
  }, [loadOverview])

  useEffect(() => {
    function focusGlobalSearch(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', focusGlobalSearch)
    return () => document.removeEventListener('keydown', focusGlobalSearch)
  }, [])

  const dashboard = useMemo(() => {
    const today = new Date()
    const weekStart = startOfDay(addDays(today, -6))
    const weekEnd = endOfDay(today)
    const previousWeekStart = startOfDay(addDays(weekStart, -7))
    const previousWeekEnd = endOfDay(addDays(weekStart, -1))
    const weekOrders = orders.filter((order) => {
      const timestamp = new Date(order.createdAt).getTime()
      return timestamp >= weekStart.getTime() && timestamp <= weekEnd.getTime()
    })
    const previousWeekOrders = orders.filter((order) => {
      const timestamp = new Date(order.createdAt).getTime()
      return (
        timestamp >= previousWeekStart.getTime() &&
        timestamp <= previousWeekEnd.getTime()
      )
    })
    const delivered = weekOrders.filter((order) => order.status === 'DELIVERED')
    const previousDelivered = previousWeekOrders.filter(
      (order) => order.status === 'DELIVERED',
    )
    const revenue = delivered.reduce((sum, order) => sum + order.finalAmount, 0)
    const previousRevenue = previousDelivered.reduce(
      (sum, order) => sum + order.finalAmount,
      0,
    )
    const unpaid = weekOrders.filter((order) => order.paymentStatus === 'UNPAID')
    const unpaidAmount = unpaid.reduce((sum, order) => sum + order.finalAmount, 0)
    const pending = weekOrders.filter((order) =>
      ['PENDING', 'PACKED'].includes(order.status),
    ).length
    const inTransit = weekOrders.filter((order) => order.status === 'IN_TRANSIT').length
    const cancelled = weekOrders.filter((order) =>
      ['CANCELLED', 'RETURNED'].includes(order.status),
    ).length
    const aov = delivered.length ? revenue / delivered.length : 0

    const dailyRevenue = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index)
      const dayStart = startOfDay(date).getTime()
      const dayEnd = endOfDay(date).getTime()
      const value = delivered
        .filter((order) => {
          const timestamp = new Date(order.createdAt).getTime()
          return timestamp >= dayStart && timestamp <= dayEnd
        })
        .reduce((sum, order) => sum + order.finalAmount, 0)
      return {
        label:
          index === 6
            ? 'Hôm nay'
            : new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date),
        value,
      }
    })

    const connected = connections.filter((connection) => connection.status === 'CONNECTED')
    const activeProducts = products.filter((product) => product.status === 'ACTIVE')
    const onboardingSteps = [
      connected.length > 0,
      products.length > 0,
      orders.length > 0,
    ]
    const completedSteps = onboardingSteps.filter(Boolean).length
    const completion = (completedSteps / onboardingSteps.length) * 100
    const revenueChange =
      previousRevenue === 0
        ? revenue > 0
          ? 100
          : 0
        : ((revenue - previousRevenue) / previousRevenue) * 100

    return {
      weekOrders,
      revenue,
      revenueChange,
      totalOrders: weekOrders.length,
      unpaidCount: unpaid.length,
      unpaidAmount,
      pending,
      inTransit,
      cancelled,
      successful: delivered.length,
      aov,
      dailyRevenue,
      connected,
      activeProducts,
      completedSteps,
      completion,
      latestActivity: latestTimestamp(orders, products),
    }
  }, [connections, orders, products])

  const searchMatches = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []
    return SEARCH_DESTINATIONS.filter((destination) =>
      [destination.label, ...destination.keywords].some((keyword) =>
        keyword.toLowerCase().includes(normalized),
      ),
    ).slice(0, 4)
  }, [query])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const destination = searchMatches[0]
    if (destination) {
      setQuery('')
      navigate(destination.to)
    }
  }

  const maxDailyRevenue = Math.max(
    1,
    ...dashboard.dailyRevenue.map((day) => day.value),
  )
  const displayName = session?.user.displayName || 'Quản trị viên'
  const avatarText = displayName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return (
    <section className="overview-page">
      <header className="overview-topbar">
        <form className="overview-global-search" onSubmit={submitSearch}>
          <SearchOutlined />
          <input
            aria-label="Tìm nhanh trong hệ thống"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm kiếm đơn hàng, sản phẩm, báo cáo..."
            ref={searchRef}
            type="search"
            value={query}
          />
          <kbd>Ctrl + K</kbd>
          {searchMatches.length ? (
            <div className="overview-search-results">
              {searchMatches.map((destination) => (
                <button
                  key={destination.to}
                  onClick={() => {
                    setQuery('')
                    navigate(destination.to)
                  }}
                  type="button"
                >
                  <SearchOutlined />
                  {destination.label}
                  <ArrowRightOutlined />
                </button>
              ))}
            </div>
          ) : null}
        </form>
        <div className="overview-user-tools">
          <button
            className="overview-help-button"
            onClick={() => navigate(ROUTES.chat)}
            type="button"
          >
            <CustomerServiceOutlined />
            Trợ giúp
          </button>
          <span className="overview-notification" aria-label="Thông báo">
            <BellFilled />
          </span>
          <span className="overview-avatar">{avatarText}</span>
          <span className="overview-user-name">{displayName}</span>
        </div>
      </header>

      {warning ? (
        <div className="overview-warning" role="status">
          <InfoCircleOutlined />
          <span>{warning}</span>
          <button onClick={() => void loadOverview()} type="button">
            Tải lại
          </button>
        </div>
      ) : null}

      <div className={`overview-dashboard ${loading ? 'is-loading' : ''}`}>
        <section className="overview-connect-banner">
          <div className="overview-connect-icon">
            <LinkOutlined />
          </div>
          <div>
            <strong>
              {dashboard.connected.length
                ? `Đã kết nối ${dashboard.connected.length}/2 kênh bán`
                : 'Kết nối TikTok Shop và Lazada để bắt đầu vận hành'}
            </strong>
            <p>
              {dashboard.connected.length
                ? dashboard.connected
                    .map((connection) => connection.shopName || connection.marketplaceName)
                    .join(' • ')
                : 'Đồng bộ sản phẩm và đơn hàng về một nơi quản lý tập trung.'}
            </p>
          </div>
          <button onClick={() => navigate(ROUTES.connect)} type="button">
            {dashboard.connected.length === 2 ? 'Quản lý kết nối' : 'Kết nối ngay'}
            <ArrowRightOutlined />
          </button>
        </section>

        <div className="overview-main-grid">
          <div className="overview-main-column">
            <section className="overview-welcome-card">
              <div className="overview-welcome-copy">
                <h1>Xin chào, {displayName} 👋</h1>
                <p>Cùng theo dõi hoạt động kinh doanh và xử lý công việc quan trọng.</p>
              </div>
              <div className="overview-progress-copy">
                <strong>
                  Đã hoàn thành {dashboard.completedSteps}/3 bước
                </strong>
                <span>{Math.round(dashboard.completion)}%</span>
              </div>
              <div className="overview-progress-track">
                <div style={{ width: `${dashboard.completion}%` }} />
              </div>
            </section>

            <section className="overview-business-card">
              <div className="overview-section-heading">
                <div>
                  <span className="overview-heading-marker" />
                  <h2>Kết quả kinh doanh</h2>
                </div>
                <div className="overview-period-controls">
                  <span>Tất cả nguồn đơn</span>
                  <strong>7 ngày qua</strong>
                  <small>
                    {dashboard.revenueChange >= 0 ? '+' : ''}
                    {dashboard.revenueChange.toLocaleString('vi-VN', {
                      maximumFractionDigits: 1,
                    })}
                    % so với tuần trước
                  </small>
                </div>
              </div>

              <div className="overview-primary-metrics">
                <article>
                  <span>Doanh thu thuần</span>
                  <strong>{formatCompactCurrency(dashboard.revenue)}</strong>
                </article>
                <article>
                  <span>Tổng đơn</span>
                  <strong>{dashboard.totalOrders.toLocaleString('vi-VN')}</strong>
                </article>
                <article className="is-warning">
                  <span>Chưa thanh toán</span>
                  <strong>{formatCompactCurrency(dashboard.unpaidAmount)}</strong>
                  <small>{dashboard.unpaidCount} đơn</small>
                </article>
              </div>

              <div className="overview-secondary-metrics">
                <article>
                  <span>Giá trị TB đơn</span>
                  <strong>{formatCurrency(dashboard.aov)}</strong>
                </article>
                <article>
                  <span>Đơn thành công</span>
                  <strong>{dashboard.successful}</strong>
                </article>
                <article className="pending">
                  <span>Chưa giao</span>
                  <strong>{dashboard.pending}</strong>
                </article>
                <article className="transit">
                  <span>Đang giao</span>
                  <strong>{dashboard.inTransit}</strong>
                </article>
                <article className="cancelled">
                  <span>Hủy/Hoàn</span>
                  <strong>{dashboard.cancelled}</strong>
                </article>
              </div>
            </section>

            <section className="overview-revenue-card">
              <div className="overview-section-heading">
                <div>
                  <span className="overview-heading-marker" />
                  <h2>Biểu đồ doanh thu 7 ngày</h2>
                </div>
                <small>Đơn vị: VND</small>
              </div>
              <div className="overview-week-chart">
                {dashboard.dailyRevenue.map((day) => (
                  <div className="overview-day-column" key={day.label}>
                    <span className="overview-day-value">
                      {day.value ? formatCompactCurrency(day.value) : ''}
                    </span>
                    <div className="overview-day-track">
                      <div
                        style={{
                          height: `${Math.max(
                            day.value > 0 ? 10 : 0,
                            (day.value / maxDailyRevenue) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <strong>{day.label}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="overview-side-column">
            <section className="overview-highlight-card">
              <span className="overview-event-label">Tổng kết 7 ngày</span>
              <h2>
                {dashboard.successful
                  ? `${dashboard.successful} đơn đã giao thành công`
                  : 'Sẵn sàng cho đơn hàng đầu tiên'}
              </h2>
              <p>
                Doanh thu ghi nhận: <strong>{formatCompactCurrency(dashboard.revenue)}</strong>
              </p>
              <button onClick={() => navigate(ROUTES.analytics)} type="button">
                Xem báo cáo chi tiết
                <BarChartOutlined />
              </button>
            </section>

            <section className="overview-side-card">
              <div className="overview-side-title">Tiện ích đề xuất</div>
              <button
                className="overview-suggestion"
                onClick={() =>
                  navigate(
                    dashboard.connected.length < 2 ? ROUTES.connect : ROUTES.products,
                  )
                }
                type="button"
              >
                <span className="teal">
                  {dashboard.connected.length < 2 ? <LinkOutlined /> : <ThunderboltFilled />}
                </span>
                <div>
                  <strong>
                    {dashboard.connected.length < 2
                      ? 'Hoàn tất kết nối sàn'
                      : 'Kiểm tra đồng bộ sản phẩm'}
                  </strong>
                  <p>
                    {dashboard.connected.length < 2
                      ? `Còn ${2 - dashboard.connected.length} kênh bán chưa kết nối.`
                      : `${dashboard.activeProducts.length}/${products.length} sản phẩm đang hoạt động.`}
                  </p>
                </div>
                <ArrowRightOutlined />
              </button>
              <button
                className="overview-suggestion"
                onClick={() =>
                  navigate(
                    shipmentOverview.countWaiting + shipmentOverview.countInTransit > 0
                      ? ROUTES.shipping
                      : ROUTES.orders,
                  )
                }
                type="button"
              >
                <span className="orange">
                  <ShoppingCartOutlined />
                </span>
                <div>
                  <strong>Theo dõi đơn và vận chuyển</strong>
                  <p>
                    {shipmentOverview.countWaiting + shipmentOverview.countInTransit} vận
                    đơn đang chờ hoặc đang giao.
                  </p>
                </div>
                <ArrowRightOutlined />
              </button>
            </section>

            <section className="overview-side-card overview-update-card">
              <div className="overview-side-title">
                Cập nhật hệ thống
                <button
                  aria-label="Làm mới dữ liệu"
                  disabled={loading}
                  onClick={() => void loadOverview()}
                  type="button"
                >
                  <ReloadOutlined spin={loading} />
                </button>
              </div>
              <div className="overview-update-item">
                <CheckCircleFilled />
                <div>
                  <strong>Dữ liệu đang được lấy trực tiếp từ hệ thống</strong>
                  <p>
                    {orders.length} đơn hàng • {products.length} sản phẩm •{' '}
                    {dashboard.connected.length} kênh kết nối
                  </p>
                </div>
                <time>{relativeTime(dashboard.latestActivity)}</time>
              </div>
              <div className="overview-update-item">
                <InfoCircleOutlined />
                <div>
                  <strong>Trạng thái vận chuyển hiện tại</strong>
                  <p>
                    {shipmentOverview.countSuccess} giao thành công •{' '}
                    {shipmentOverview.countFailed} giao thất bại
                  </p>
                </div>
                <time>Hiện tại</time>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  )
}
