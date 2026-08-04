import {
  AccountBookOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarCircleOutlined,
  PercentageOutlined,
  ReloadOutlined,
  RiseOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { analyticsApi, type RevenueAnalyticsData } from '../../../apis/analyticsApi'

interface RevenueAnalysisProps {
  selectedPeriod: string
}

const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(value)

const formatCompactVND = (value: number) => new Intl.NumberFormat('vi-VN', {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(value)

const chartCopy = {
  DAY: {
    title: 'Xu hướng doanh thu theo ngày',
    description: 'Theo dõi doanh thu và mức tăng trưởng từng ngày trong tháng đã chọn.',
  },
  MONTH: {
    title: 'Doanh thu theo tháng trong quý',
    description: 'So sánh doanh thu và mức tăng trưởng giữa các tháng của quý.',
  },
  QUARTER: {
    title: 'Doanh thu theo từng quý',
    description: 'So sánh doanh thu và mức tăng trưởng giữa các quý trong năm.',
  },
} as const

export default function RevenueAnalysis({ selectedPeriod }: RevenueAnalysisProps) {
  const [data, setData] = useState<RevenueAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadAnalytics = () => {
    setLoading(true)
    setError(false)
    analyticsApi.fetchRevenueAnalytics(selectedPeriod)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(loadAnalytics, [selectedPeriod])

  if (loading) return <div className="analytics-state">Đang tải dữ liệu phân tích...</div>

  if (error || !data) {
    return (
      <div className="analytics-state analytics-error">
        <span>Không thể tải dữ liệu phân tích.</span>
        <button type="button" onClick={loadAnalytics}><ReloadOutlined /> Thử lại</button>
      </div>
    )
  }

  const growthPositive = data.growthPercent >= 0
  const period = `${new Date(data.periodStart).toLocaleDateString('vi-VN')} - ${new Date(data.periodEnd).toLocaleDateString('vi-VN')}`
  const chartData = data.chartPoints.map((point, index, points) => {
    const previousRevenue = index === 0 ? null : points[index - 1].revenue
    const pointGrowth = previousRevenue === null
      ? 0
      : previousRevenue === 0
        ? (point.revenue === 0 ? 0 : 100)
        : ((point.revenue - previousRevenue) / previousRevenue) * 100
    return {
      ...point,
      growth: Math.round(pointGrowth * 100) / 100,
    }
  })
  const selectedChartCopy = chartCopy[data.chartGranularity]

  return (
    <>
      <div className="analytics-period">Kỳ phân tích: {period}</div>
      <section className="kpi-grid-container">
        <div className="analyst-kpi-card">
          <div className="kpi-icon-container kpi-theme-blue"><DollarCircleOutlined /></div>
          <div className="kpi-data">
            <span className="kpi-label">Tổng doanh thu</span>
            <span className="kpi-num">{formatVND(data.totalRevenue)}</span>
          </div>
        </div>

        <div className="analyst-kpi-card">
          <div className="kpi-icon-container kpi-theme-green"><WalletOutlined /></div>
          <div className="kpi-data">
            <span className="kpi-label">Lợi nhuận ròng</span>
            <span className="kpi-num">{formatVND(data.netProfit)}</span>
          </div>
        </div>

        <div className="analyst-kpi-card">
          <div className="kpi-icon-container kpi-theme-red"><AccountBookOutlined /></div>
          <div className="kpi-data">
            <span className="kpi-label">Tổng chi phí</span>
            <span className="kpi-num">{formatVND(data.totalCost)}</span>
            <span className="kpi-subtext trend-neutral">Giá vốn sản phẩm và phí vận chuyển</span>
          </div>
        </div>

        <div className="analyst-kpi-card">
          <div className="kpi-icon-container kpi-theme-purple"><PercentageOutlined /></div>
          <div className="kpi-data">
            <span className="kpi-label">Tỷ suất lợi nhuận</span>
            <span className="kpi-num">{data.profitMargin.toLocaleString('vi-VN')}%</span>
          </div>
        </div>

        <div className="analyst-kpi-card">
          <div className="kpi-icon-container kpi-theme-orange"><RiseOutlined /></div>
          <div className="kpi-data">
            <span className="kpi-label">Tăng trưởng so với kỳ trước</span>
            <span className={`kpi-num ${growthPositive ? 'trend-up' : 'trend-down'}`}>
              {growthPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {' '}{Math.abs(data.growthPercent).toLocaleString('vi-VN')}%
            </span>
          </div>
        </div>
      </section>

      <section className="revenue-chart-panel">
        <header className="revenue-chart-header">
          <div>
            <h2>{selectedChartCopy.title}</h2>
            <p>{selectedChartCopy.description}</p>
          </div>
          <div className="chart-legends" aria-label="Chú thích biểu đồ">
            <span><i className="legend-revenue" />Doanh thu</span>
            <span><i className="legend-growth" />Tăng trưởng</span>
          </div>
        </header>

        <div className="revenue-chart-wrap">
          {chartData.length === 0 ? (
            <div className="chart-empty">Chưa có dữ liệu doanh thu trong kỳ đã chọn.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 18, right: 18, left: 6, bottom: 2 }}>
                <defs>
                  <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  minTickGap={16}
                />
                <YAxis
                  yAxisId="revenue"
                  tickFormatter={formatCompactVND}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={54}
                />
                <YAxis
                  yAxisId="growth"
                  orientation="right"
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: '#f59e0b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
                  formatter={(value, name) => name === 'Doanh thu'
                    ? [formatVND(Number(value)), name]
                    : [`${Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`, name]}
                  contentStyle={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
                  }}
                />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fill="url(#revenueAreaGradient)"
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="growth"
                  type="monotone"
                  dataKey="growth"
                  name="Tăng trưởng"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{ r: 3, fill: '#f59e0b' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </>
  )
}
