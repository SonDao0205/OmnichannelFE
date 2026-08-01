import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { orderApi } from '../../apis/orderApi'
import { productApi } from '../../apis/productApi'
import type { Order } from '../../types/order'
import type { Product } from '../../types/product'
import { exportSalesExcel } from '../../utils/excelExport'
import { message } from 'antd'
import './analyst.css'

type RangePreset = 'month' | '30days' | 'quarter' | 'year'

type DateRange = {
  start: Date
  end: Date
  previousStart: Date
  previousEnd: Date
  label: string
}

type TrendPoint = {
  label: string
  revenue: number
  profit: number
}

type RankedProduct = {
  name: string
  quantity: number
  revenue: number
}

const CHANNEL_COLORS: Record<string, string> = {
  Lazada: '#ff7a13',
  'TikTok Shop': '#111827',
  Shopee: '#ef4444',
  Website: '#2f6fed',
  'Kênh khác': '#8795aa',
}

const SEGMENT_COLORS = ['#f5b90b', '#3d7ff0', '#6265eb', '#f04458']

function atStartOfDay(value: Date) {
  const result = new Date(value)
  result.setHours(0, 0, 0, 0)
  return result
}

function atEndOfDay(value: Date) {
  const result = new Date(value)
  result.setHours(23, 59, 59, 999)
  return result
}

function addDays(value: Date, days: number) {
  const result = new Date(value)
  result.setDate(result.getDate() + days)
  return result
}

function dateRangeFor(preset: RangePreset): DateRange {
  const now = new Date()
  const end = atEndOfDay(now)
  let start: Date
  let previousStart: Date

  if (preset === '30days') {
    start = atStartOfDay(addDays(now, -29))
    previousStart = atStartOfDay(addDays(start, -30))
  } else if (preset === 'quarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
    start = new Date(now.getFullYear(), quarterStartMonth, 1)
    previousStart = new Date(now.getFullYear(), quarterStartMonth - 3, 1)
  } else if (preset === 'year') {
    start = new Date(now.getFullYear(), 0, 1)
    previousStart = new Date(now.getFullYear() - 1, 0, 1)
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  }

  const previousEnd = atEndOfDay(addDays(start, -1))
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return {
    start,
    end,
    previousStart,
    previousEnd,
    label: `${formatter.format(start)} – ${formatter.format(end)}`,
  }
}

function inRange(order: Order, start: Date, end: Date) {
  const createdAt = new Date(order.createdAt).getTime()
  return createdAt >= start.getTime() && createdAt <= end.getTime()
}

function completedOrders(orders: Order[]) {
  return orders.filter((order) => order.status === 'DELIVERED')
}

function orderRevenue(orders: Order[]) {
  return completedOrders(orders).reduce(
    (sum, order) => sum + Math.max(0, Number(order.finalAmount) || 0),
    0,
  )
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString('vi-VN', {
      maximumFractionDigits: 2,
    })} tỷ`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', {
      maximumFractionDigits: 1,
    })} triệu`
  }
  return formatCurrency(value)
}

function marketplaceLabel(value: string) {
  if (value === 'TikTok Shop') return 'TikTok Shop'
  if (value === 'Lazada') return 'Lazada'
  if (value === 'Shopee') return 'Shopee'
  if (value === 'Website') return 'Website'
  return 'Kênh khác'
}

function MetricCard({
  label,
  value,
  unit,
  change,
  accent,
}: {
  label: string
  value: string
  unit?: string
  change: number
  accent?: boolean
}) {
  const positive = change >= 0
  return (
    <article className="report-metric-card">
      <span className="report-metric-label">{label}</span>
      <div className="report-metric-row">
        <strong className={accent ? 'is-accent' : ''}>{value}</strong>
        {unit ? <small>{unit}</small> : null}
        <span className={`report-change ${positive ? 'positive' : 'negative'}`}>
          {positive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {Math.abs(change).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%
        </span>
      </div>
    </article>
  )
}

function TrendChart({ points }: { points: TrendPoint[] }) {
  const width = 760
  const height = 250
  const left = 52
  const right = 20
  const top = 22
  const bottom = 40
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [point.revenue, point.profit]),
  )
  const roundedMax = Math.ceil(maxValue / 100_000) * 100_000 || 1
  const x = (index: number) =>
    left + (points.length === 1 ? plotWidth / 2 : (plotWidth * index) / (points.length - 1))
  const y = (value: number) => top + plotHeight - (value / roundedMax) * plotHeight
  const revenuePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.revenue)}`)
    .join(' ')
  const profitPath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.profit)}`)
    .join(' ')

  return (
    <div className="report-chart-scroll">
      <svg
        aria-label="Biểu đồ xu hướng doanh thu và lợi nhuận"
        className="report-line-chart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {[0, 1, 2, 3, 4].map((step) => {
          const gridY = top + (plotHeight * step) / 4
          const tickValue = roundedMax * (1 - step / 4)
          return (
            <g key={step}>
              <line
                className="report-grid-line"
                x1={left}
                x2={width - right}
                y1={gridY}
                y2={gridY}
              />
              <text className="report-axis-label" x={left - 10} y={gridY + 4}>
                {tickValue >= 1_000_000
                  ? `${(tickValue / 1_000_000).toFixed(1)}tr`
                  : `${Math.round(tickValue / 1000)}k`}
              </text>
            </g>
          )
        })}
        <path className="report-profit-line" d={profitPath} />
        <path className="report-revenue-line" d={revenuePath} />
        {points.map((point, index) => (
          <g key={point.label}>
            <circle
              className="report-revenue-dot"
              cx={x(index)}
              cy={y(point.revenue)}
              r="4"
            />
            <circle
              className="report-profit-dot"
              cx={x(index)}
              cy={y(point.profit)}
              r="3"
            />
            <text
              className="report-x-label"
              textAnchor="middle"
              x={x(index)}
              y={height - 13}
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function AnalystScreen() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [preset, setPreset] = useState<RangePreset>('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [orderData, productData] = await Promise.all([
        orderApi.fetchOrdersForReport(),
        productApi.fetchAllProducts(),
      ])
      setOrders(orderData)
      setProducts(productData)
    } catch {
      setError('Không thể tải dữ liệu báo cáo. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReport(), 0)
    return () => window.clearTimeout(timer)
  }, [loadReport])

  useEffect(() => {
    function closeExportMenu(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', closeExportMenu)
    return () => document.removeEventListener('mousedown', closeExportMenu)
  }, [])

  const report = useMemo(() => {
    const range = dateRangeFor(preset)
    const currentOrders = orders.filter((order) => inRange(order, range.start, range.end))
    const previousOrders = orders.filter((order) =>
      inRange(order, range.previousStart, range.previousEnd),
    )
    const currentCompleted = completedOrders(currentOrders)
    const previousCompleted = completedOrders(previousOrders)
    const revenue = orderRevenue(currentOrders)
    const previousRevenue = orderRevenue(previousOrders)
    const successful = currentCompleted.length
    const previousSuccessful = previousCompleted.length
    const aov = successful ? revenue / successful : 0
    const previousAov = previousSuccessful ? previousRevenue / previousSuccessful : 0
    const conversion = currentOrders.length ? (successful / currentOrders.length) * 100 : 0
    const previousConversion = previousOrders.length
      ? (previousSuccessful / previousOrders.length) * 100
      : 0

    const costBySku = new Map<string, number>()
    const costByName = new Map<string, number>()
    products.forEach((product) => {
      costByName.set(product.name.trim().toLowerCase(), product.costPrice || 0)
      product.variants.forEach((variant) => {
        costBySku.set(variant.sku, variant.costPrice || product.costPrice || 0)
      })
    })

    const bucketCount = 4
    const duration = Math.max(1, range.end.getTime() - range.start.getTime())
    const bucketDuration = duration / bucketCount
    const trend: TrendPoint[] = Array.from({ length: bucketCount }, (_, index) => ({
      label: preset === 'year' ? `Quý ${index + 1}` : `Tuần ${index + 1}`,
      revenue: 0,
      profit: 0,
    }))

    currentCompleted.forEach((order) => {
      const index = Math.min(
        bucketCount - 1,
        Math.max(
          0,
          Math.floor(
            (new Date(order.createdAt).getTime() - range.start.getTime()) /
              bucketDuration,
          ),
        ),
      )
      const cost = order.items.reduce((sum, item) => {
        const unitCost =
          costBySku.get(item.sku) ??
          costByName.get(item.productName.trim().toLowerCase()) ??
          0
        return sum + unitCost * item.quantity
      }, 0)
      trend[index].revenue += order.finalAmount
      trend[index].profit += Math.max(0, order.finalAmount - cost)
    })

    const channelTotals = new Map<string, number>()
    currentCompleted.forEach((order) => {
      const channel = marketplaceLabel(order.marketplace)
      channelTotals.set(channel, (channelTotals.get(channel) ?? 0) + order.finalAmount)
    })
    const channelEntries = [...channelTotals.entries()]
      .map(([name, value]) => ({
        name,
        value,
        color: CHANNEL_COLORS[name] ?? CHANNEL_COLORS['Kênh khác'],
      }))
      .sort((a, b) => b.value - a.value)
    const channelTotal = channelEntries.reduce((sum, item) => sum + item.value, 0)

    const donutStops = channelEntries.map((item, index) => {
      const previousValue = channelEntries
        .slice(0, index)
        .reduce((sum, channel) => sum + channel.value, 0)
      const startAngle = channelTotal ? (previousValue / channelTotal) * 360 : 0
      const endAngle = channelTotal
        ? ((previousValue + item.value) / channelTotal) * 360
        : 0
      return `${item.color} ${startAngle}deg ${endAngle}deg`
    })
    const donutBackground = donutStops.length
      ? `conic-gradient(${donutStops.join(', ')})`
      : 'conic-gradient(#e8edf5 0deg 360deg)'

    const customerOrders = new Map<string, Order[]>()
    currentOrders.forEach((order) => {
      const key = order.customerPhone || order.customerName
      customerOrders.set(key, [...(customerOrders.get(key) ?? []), order])
    })
    const segmentValues = [0, 0, 0, 0]
    customerOrders.forEach((customerOrderList) => {
      const delivered = completedOrders(customerOrderList)
      const customerRevenue = orderRevenue(customerOrderList)
      const cancelled = customerOrderList.some((order) =>
        ['CANCELLED', 'RETURNED'].includes(order.status),
      )
      const segment = cancelled
        ? 3
        : delivered.length >= 5
          ? 0
          : delivered.length >= 2
            ? 1
            : 2
      segmentValues[segment] += customerRevenue
    })
    const segments = [
      { label: 'Hội viên VIP', value: segmentValues[0] },
      { label: 'Thân thiết', value: segmentValues[1] },
      { label: 'Khách mua mới', value: segmentValues[2] },
      { label: 'Nguy cơ rời bỏ', value: segmentValues[3] },
    ]

    const rankedProducts = new Map<string, RankedProduct>()
    currentCompleted.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productName.trim().toLowerCase()
        const existing = rankedProducts.get(key) ?? {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        }
        existing.quantity += item.quantity
        existing.revenue += item.price * item.quantity
        rankedProducts.set(key, existing)
      })
    })
    const topProducts = [...rankedProducts.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return {
      range,
      currentOrders,
      revenue,
      successful,
      aov,
      conversion,
      trend,
      channels: channelEntries,
      donutBackground,
      segments,
      topProducts,
      revenueChange: percentageChange(revenue, previousRevenue),
      successfulChange: percentageChange(successful, previousSuccessful),
      aovChange: percentageChange(aov, previousAov),
      conversionChange: percentageChange(conversion, previousConversion),
    }
  }, [orders, preset, products])

  const exportExcel = async () => {
    setExporting(true)
    try {
      await exportSalesExcel({
        rangeLabel: report.range.label,
        revenue: report.revenue,
        successful: report.successful,
        aov: report.aov,
        conversion: report.conversion,
        orders: report.currentOrders,
        trend: report.trend,
        channels: report.channels,
        topProducts: report.topProducts,
      })
      message.success('Đã xuất báo cáo doanh số Excel (.xlsx)')
      setExportOpen(false)
    } catch {
      message.error('Không thể tạo file Excel. Vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
  }

  const maxSegment = Math.max(1, ...report.segments.map((segment) => segment.value))
  const hasData = report.currentOrders.length > 0

  return (
    <section className="sales-report-page">
      <header className="report-header">
        <div>
          <div className="report-title-row">
            <h1>Báo cáo &amp; phân tích chuyên sâu</h1>
            <span className="report-period-badge">
              <CalendarOutlined />
              {report.range.label}
            </span>
          </div>
          <p>Theo dõi doanh thu, hiệu suất kênh bán và giá trị khách hàng.</p>
        </div>
        <div className="report-header-actions">
          <label className="report-range-select">
            <span className="sr-only">Khoảng thời gian</span>
            <select
              onChange={(event) => setPreset(event.target.value as RangePreset)}
              value={preset}
            >
              <option value="month">Tháng này</option>
              <option value="30days">30 ngày gần nhất</option>
              <option value="quarter">Quý này</option>
              <option value="year">Năm nay</option>
            </select>
          </label>
          <button
            aria-label="Tải lại báo cáo"
            className="report-refresh-button"
            disabled={loading}
            onClick={() => void loadReport()}
            type="button"
          >
            <ReloadOutlined spin={loading} />
          </button>
          <div className="report-export-wrap" ref={exportRef}>
            <button
              aria-expanded={exportOpen}
              className="report-export-button"
              onClick={() => setExportOpen((open) => !open)}
              type="button"
            >
              <DownloadOutlined />
              Xuất báo cáo
            </button>
            {exportOpen ? (
              <div className="report-export-menu">
                <button disabled={exporting} onClick={() => void exportExcel()} type="button">
                  <FileExcelOutlined />
                  {exporting ? 'Đang tạo Excel...' : 'Xuất Excel (.xlsx)'}
                </button>
                <button
                  onClick={() => {
                    setExportOpen(false)
                    window.print()
                  }}
                  type="button"
                >
                  <FilePdfOutlined />
                  In / lưu PDF
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {error ? (
        <div className="report-error" role="alert">
          <span>{error}</span>
          <button onClick={() => void loadReport()} type="button">
            Thử lại
          </button>
        </div>
      ) : null}

      <div className={`report-content ${loading ? 'is-loading' : ''}`}>
        <div className="report-metrics-grid">
          <MetricCard
            change={report.revenueChange}
            label="Doanh thu thuần"
            value={formatCompactCurrency(report.revenue)}
          />
          <MetricCard
            change={report.successfulChange}
            label="Đơn thành công"
            unit="đơn"
            value={report.successful.toLocaleString('vi-VN')}
          />
          <MetricCard
            change={report.aovChange}
            label="Giá trị đơn TB (AOV)"
            value={formatCurrency(report.aov)}
          />
          <MetricCard
            accent
            change={report.conversionChange}
            label="Tỷ lệ chuyển đổi"
            value={`${report.conversion.toLocaleString('vi-VN', {
              maximumFractionDigits: 2,
            })}%`}
          />
        </div>

        <div className="report-primary-grid">
          <article className="report-panel report-trend-panel">
            <div className="report-panel-header">
              <div>
                <h2>Xu hướng doanh thu &amp; lợi nhuận</h2>
                <p>Doanh thu thực nhận và lợi nhuận ước tính theo kỳ</p>
              </div>
              <div className="report-chart-legend">
                <span><i className="revenue" />Doanh thu</span>
                <span><i className="profit" />Lợi nhuận</span>
              </div>
            </div>
            <TrendChart points={report.trend} />
            {!hasData ? <div className="report-empty-overlay">Chưa có đơn hàng trong kỳ</div> : null}
          </article>

          <article className="report-panel report-channel-panel">
            <div className="report-panel-header">
              <div>
                <h2>Phân tích tỷ trọng kênh bán</h2>
                <p>Doanh thu theo từng nguồn đơn</p>
              </div>
            </div>
            <div className="report-donut-wrap">
              <div
                aria-label="Biểu đồ tỷ trọng doanh thu theo kênh"
                className="report-donut"
                role="img"
                style={{ background: report.donutBackground }}
              >
                <div>
                  <strong>{report.channels.length}</strong>
                  <span>kênh bán</span>
                </div>
              </div>
            </div>
            <div className="report-channel-legend">
              {report.channels.length ? (
                report.channels.map((channel) => (
                  <div key={channel.name}>
                    <span>
                      <i style={{ backgroundColor: channel.color }} />
                      {channel.name}
                    </span>
                    <strong>{formatCompactCurrency(channel.value)}</strong>
                  </div>
                ))
              ) : (
                <span className="report-empty-copy">Chưa có doanh thu theo kênh</span>
              )}
            </div>
          </article>
        </div>

        <div className="report-secondary-grid">
          <article className="report-panel report-segment-panel">
            <div className="report-panel-header">
              <div>
                <h2>Cấu trúc nhóm khách hàng &amp; giá trị trọn đời</h2>
                <p>Doanh thu đóng góp theo hành vi mua hàng</p>
              </div>
            </div>
            <div className="report-bars" aria-label="Biểu đồ giá trị nhóm khách hàng">
              {report.segments.map((segment, index) => (
                <div className="report-bar-item" key={segment.label}>
                  <div className="report-bar-track">
                    <div
                      className="report-bar-fill"
                      style={{
                        backgroundColor: SEGMENT_COLORS[index],
                        height: `${Math.max(
                          segment.value > 0 ? 8 : 0,
                          (segment.value / maxSegment) * 100,
                        )}%`,
                      }}
                      title={`${segment.label}: ${formatCurrency(segment.value)}`}
                    />
                  </div>
                  <strong>{formatCompactCurrency(segment.value)}</strong>
                  <span>{segment.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="report-panel report-products-panel">
            <div className="report-panel-header">
              <div>
                <h2>Top sản phẩm đóng góp doanh số cao nhất</h2>
                <p>Xếp hạng theo doanh thu đơn giao thành công</p>
              </div>
              <span className="report-top-count">
                {report.topProducts.length} sản phẩm
              </span>
            </div>
            <div className="report-product-table-wrap">
              <table className="report-product-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Đã bán</th>
                    <th>Doanh số</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topProducts.length ? (
                    report.topProducts.map((product, index) => (
                      <tr key={`${product.name}-${index}`}>
                        <td>
                          <span className="report-rank">{index + 1}</span>
                          {product.name}
                        </td>
                        <td>{product.quantity.toLocaleString('vi-VN')}</td>
                        <td>{formatCompactCurrency(product.revenue)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="report-table-empty" colSpan={3}>
                        Chưa có sản phẩm phát sinh doanh số trong kỳ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
