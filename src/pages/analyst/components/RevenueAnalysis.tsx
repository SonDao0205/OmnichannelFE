import { useEffect, useState } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  AccountBookOutlined,
  DollarCircleOutlined,
  PercentageOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { analyticsApi, type RevenueAnalyticsData } from '../../../apis/analyticsApi'

interface RevenueAnalysisProps {
  selectedPeriod: string
}

export default function RevenueAnalysis({ selectedPeriod }: RevenueAnalysisProps) {
  const [apiData, setApiData] = useState<RevenueAnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    analyticsApi.fetchRevenueAnalytics(selectedPeriod)
      .then(res => {
        setApiData(res)
      })
      .catch(err => {
        console.warn("Backend unavailable, falling back to simulated frontend data.", err)
        setApiData(null)
      })
      .finally(() => setLoading(false))
  }, [selectedPeriod])

  if (loading) {
    return (
      <div className="analyst-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#8b5cf6', fontWeight: '600', fontSize: '15px' }}>
        🔄 Đang tải báo cáo tài chính...
      </div>
    )
  }

  // Mock data representing financial records for the last 6 months (Feb - Jul 2026)
  const monthlyDataMock = [
    { month: 'Tháng 2/2026', revenue: 110000000, cost: 65000000, shipping: 8000000, fee: 5500000, profit: 31500000, margin: 28.6, growth: 0 },
    { month: 'Tháng 3/2026', revenue: 135000000, cost: 78000000, shipping: 10000000, fee: 6750000, profit: 40250000, margin: 29.8, growth: 22.7 },
    { month: 'Tháng 4/2026', revenue: 128000000, cost: 74000000, shipping: 9500000, fee: 6400000, profit: 38100000, margin: 29.7, growth: -5.1 },
    { month: 'Tháng 5/2026', revenue: 165000000, cost: 95000000, shipping: 12000000, fee: 8250000, profit: 49750000, margin: 30.1, growth: 28.9 },
    { month: 'Tháng 6/2026', revenue: 190000000, cost: 110000000, shipping: 14500000, fee: 9500000, profit: 56000000, margin: 29.4, growth: 15.1 },
    { month: 'Tháng 7/2026', revenue: 245000000, cost: 138000000, shipping: 18500000, fee: 14700000, profit: 73800000, margin: 30.1, growth: 28.9 },
  ]

  // Filter or aggregate based on selectedPeriod (Mock fallback logic)
  let mockKPIs = {
    revenue: 245000000,
    cost: 138000000,
    shipping: 18500000,
    fee: 14700000,
    profit: 73800000,
    margin: 30.1,
    growth: 28.9,
    cogs: 138000000,
  }

  let mockChart = monthlyDataMock
  let mockTitle = 'Xu hướng tài chính tích cực'
  let mockDesc = 'Doanh thu tháng này tăng trưởng vượt bậc (+28.9%), động lực chính đến từ chiến dịch sale Shopee 7.7 và TikTok Shop livestreaming. Lợi nhuận ròng đạt mức kỷ lục 73.8M với biên lợi nhuận ổn định ở mức 30.1%. Chi phí sàn Shopee có xu hướng tăng nhẹ lên 6%, đề xuất tối ưu hóa giá bán combo để bù đắp.'

  if (selectedPeriod === 'last-month') {
    mockKPIs = {
      revenue: 190000000,
      cost: 110000000,
      shipping: 14500000,
      fee: 9500000,
      profit: 56000000,
      margin: 29.4,
      growth: 15.1,
      cogs: 110000000,
    }
    mockTitle = 'Tăng trưởng ổn định trong tháng 6'
    mockDesc = 'Tháng 6 ghi nhận mức tăng trưởng doanh thu ổn định (+15.1%). Phí vận chuyển tăng nhẹ do lượng đơn liên tỉnh cao. AI khuyến nghị chạy thêm chương trình Freeship Extra để giữ chân khách hàng và giảm gánh nặng chi phí vận chuyển trực tiếp cho shop.'
  } else if (selectedPeriod === 'q3') {
    mockKPIs = {
      revenue: 245000000,
      cost: 138000000,
      shipping: 18500000,
      fee: 14700000,
      profit: 73800000,
      margin: 30.1,
      growth: 28.9,
      cogs: 138000000,
    }
    mockChart = monthlyDataMock.slice(4)
  } else if (selectedPeriod === 'full-year') {
    const totalRev = monthlyDataMock.reduce((acc, d) => acc + d.revenue, 0)
    const totalCost = monthlyDataMock.reduce((acc, d) => acc + d.cost, 0)
    const totalShip = monthlyDataMock.reduce((acc, d) => acc + d.shipping, 0)
    const totalFee = monthlyDataMock.reduce((acc, d) => acc + d.fee, 0)
    const totalProf = monthlyDataMock.reduce((acc, d) => acc + d.profit, 0)
    mockKPIs = {
      revenue: totalRev,
      cost: totalCost + totalShip + totalFee,
      shipping: totalShip,
      fee: totalFee,
      profit: totalProf,
      margin: Math.round((totalProf / totalRev) * 1000) / 10,
      growth: 18.2,
      cogs: totalCost,
    }
    mockTitle = 'Tập trung tối ưu chi phí vận hành năm 2026'
    mockDesc = 'Lũy kế nửa đầu năm cho thấy xu hướng tăng trưởng doanh thu khỏe mạnh ở mức 18.2%. Tuy nhiên biên lợi nhuận gộp chịu áp lực lớn từ các khoản phí sàn tăng mạnh ở nửa cuối quý 2. Lời khuyên của Senior: dịch chuyển dần 15% lượng đơn qua các kênh Direct-to-Consumer (như Zalo OA) để giảm chiết khấu sàn.'
  }

  // Active variables (use API data if loaded, otherwise fallback to mock)
  const displayKPIs = {
    revenue: apiData ? apiData.revenue : mockKPIs.revenue,
    cost: apiData ? apiData.cost : mockKPIs.cost,
    shipping: apiData ? apiData.shipping : mockKPIs.shipping,
    fee: apiData ? apiData.fee : mockKPIs.fee,
    profit: apiData ? apiData.profit : mockKPIs.profit,
    margin: apiData ? apiData.margin : mockKPIs.margin,
    growth: apiData ? apiData.growth : mockKPIs.growth,
  }

  const currentChartPoints = apiData ? apiData.chartPoints : mockChart
  const currentTableRows = apiData ? apiData.rows : monthlyDataMock
  const aiInsightTitle = apiData ? apiData.aiInsightTitle : mockTitle
  const aiInsightDesc = apiData ? apiData.aiInsightDesc : mockDesc

  // Format currency helper
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
  }

  // SVG Chart points calculations
  const svgW = 600
  const svgH = 240
  const padL = 60
  const padR = 40
  const padT = 20
  const padB = 40

  const drawW = svgW - padL - padR
  const drawH = svgH - padT - padB

  const maxVal = 260000000 // 260M
  const minVal = 0

  const getPoints = (type: 'revenue' | 'profit') => {
    return currentChartPoints.map((d, index) => {
      const x = padL + (index / Math.max(currentChartPoints.length - 1, 1)) * drawW
      const val = type === 'revenue' ? d.revenue : d.profit
      const y = padT + drawH - ((val - minVal) / (maxVal - minVal)) * drawH
      return { x, y, val, label: d.month.split('/')[0] }
    })
  }

  const revenuePoints = getPoints('revenue')
  const profitPoints = getPoints('profit')

  const revPathStr = revenuePoints.map((p) => `${p.x},${p.y}`).join(' ')
  const profPathStr = profitPoints.map((p) => `${p.x},${p.y}`).join(' ')

  const revAreaStr = `${padL},${padT + drawH} ${revPathStr} ${padL + drawW},${padT + drawH}`
  const profAreaStr = `${padL},${padT + drawH} ${profPathStr} ${padL + drawW},${padT + drawH}`


  return (
    <div className="analyst-container">
      
      {/* KPI Row */}
      <section className="kpi-grid-container">
        
        {/* KPI 1: Doanh thu */}
        <div className="analyst-kpi-card">
          <div className="kpi-icon-container kpi-theme-blue">
            <DollarCircleOutlined />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Tổng Doanh thu</span>
            <span className="kpi-num">{formatVND(displayKPIs.revenue)}</span>
            <span className={`kpi-subtext ${displayKPIs.growth >= 0 ? 'trend-up' : 'trend-down'}`}>
              {displayKPIs.growth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <span>{Math.abs(displayKPIs.growth)}% vs tháng trước</span>
            </span>
          </div>
        </div>

        {/* KPI 2: Lợi nhuận ròng */}
        <div className="analyst-kpi-card">
          <div className="kpi-icon-container kpi-theme-green">
            <WalletOutlined />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Lợi Nhuận Ròng</span>
            <span className="kpi-num">{formatVND(displayKPIs.profit)}</span>
            <span className="kpi-subtext trend-up">
              <ArrowUpOutlined />
              <span>Lãi dòng ổn định</span>
            </span>
          </div>
        </div>

        {/* KPI 3: Chi Phí */}
        <div className="analyst-kpi-card">
          <div className="kpi-icon-container kpi-theme-red">
            <AccountBookOutlined />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Tổng Chi Phí</span>
            <span className="kpi-num">{formatVND(displayKPIs.cost)}</span>
            <span className="kpi-subtext trend-neutral">
              <span>Bao gồm vốn + sàn + ship</span>
            </span>
          </div>
        </div>

        {/* KPI 4: Biên lợi nhuận */}
        <div className="analyst-kpi-card">
          <div className="kpi-icon-container kpi-theme-purple">
            <PercentageOutlined />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Tỷ Suất Lợi Nhuận</span>
            <span className="kpi-num">{displayKPIs.margin}%</span>
            <span className="kpi-subtext trend-up">
              <ArrowUpOutlined />
              <span>Biên lợi nhuận gộp cao</span>
            </span>
          </div>
        </div>

      </section>

      {/* Main Charts & Analysis row */}
      <div className="panels-row">
        
        {/* SVG Chart Panel */}
        <div className="analyst-panel">
          <header className="panel-header-row">
            <div>
              <h2>Biểu đồ xu hướng tài chính</h2>
              <span className="panel-sub-title">So sánh tốc độ tăng trưởng doanh thu và lợi nhuận ròng</span>
            </div>
          </header>
          
          <div className="chart-wrapper">
            <svg className="chart-svg-container" viewBox={`0 0 ${svgW} ${svgH}`}>
              <defs>
                <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="profit-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padL} y1={padT} x2={svgW - padR} y2={padT} className="chart-grid-dash" />
              <line x1={padL} y1={padT + drawH * 0.25} x2={svgW - padR} y2={padT + drawH * 0.25} className="chart-grid-dash" />
              <line x1={padL} y1={padT + drawH * 0.5} x2={svgW - padR} y2={padT + drawH * 0.5} className="chart-grid-dash" />
              <line x1={padL} y1={padT + drawH * 0.75} x2={svgW - padR} y2={padT + drawH * 0.75} className="chart-grid-dash" />
              <line x1={padL} y1={padT + drawH} x2={svgW - padR} y2={padT + drawH} className="chart-axis-line" />

              {/* Filled Areas */}
              <polygon points={revAreaStr} className="chart-area-revenue" />
              <polygon points={profAreaStr} className="chart-area-profit" />

              {/* Line curves */}
              <polyline points={revPathStr} className="chart-line-revenue" />
              <polyline points={profPathStr} className="chart-line-profit" />

              {/* Data points for Revenue */}
              {revenuePoints.map((p, i) => (
                <g key={`rev-dot-${i}`}>
                  <circle cx={p.x} cy={p.y} r="5" fill="#3b82f6" className="chart-circle-node" />
                  <text x={p.x} y={p.y - 10} className="chart-text-val" style={{ fill: '#2563eb' }}>
                    {Math.round(p.val / 1000000)}M
                  </text>
                  <text x={p.x} y={svgH - 12} className="chart-text-lbl">
                    {p.label}
                  </text>
                </g>
              ))}

              {/* Data points for Profit */}
              {profitPoints.map((p, i) => (
                <g key={`prof-dot-${i}`}>
                  <circle cx={p.x} cy={p.y} r="5" fill="#10b981" className="chart-circle-node" />
                  <text x={p.x} y={p.y - 10} className="chart-text-val" style={{ fill: '#059669' }}>
                    {Math.round(p.val / 1000000)}M
                  </text>
                </g>
              ))}
            </svg>

            {/* Legends */}
            <div className="chart-legends-bar">
              <div className="legend-indicator">
                <span className="legend-color-dot color-dot-revenue"></span>
                <span>Doanh thu (VND)</span>
              </div>
              <div className="legend-indicator">
                <span className="legend-color-dot color-dot-profit"></span>
                <span>Lợi nhuận ròng (VND)</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Financial Analysis Panel */}
        <div className="analyst-panel">
          <header className="panel-header-row">
            <h2>Nhận xét tài chính (AI)</h2>
          </header>
          <div className="ai-insights-box">
            <div className="ai-avatar-wrapper">💬</div>
            <div className="ai-insight-text">
              <h4>{aiInsightTitle}</h4>
              <p>{aiInsightDesc}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', margin: 0 }}>Gợi ý hành động từ AI</h3>
            <ul style={{ fontSize: '13px', paddingLeft: '16px', margin: 0, color: 'var(--text-h)', display: 'grid', gap: '8px' }}>
              <li>Tăng cường ngân sách quảng cáo cho các SKU có biên lợi nhuận &gt; 35% trên Shopee.</li>
              <li>Xem xét việc chuyển bớt khách hàng trung thành sang kênh Zalo OA để tiết kiệm 3-5% phí sàn.</li>
              <li>Kiểm soát lượng tồn kho của nhóm hàng bán chậm (tồn &gt; 90 ngày) để thu hồi vốn.</li>
            </ul>
          </div>
        </div>

      </div>

      {/* Financial Table Panel */}
      <div className="analyst-panel">
        <header className="panel-header-row">
          <h2>Bảng phân tích tài chính chi tiết</h2>
        </header>
        <div className="table-responsive">
          <table className="financial-table">
            <thead>
              <tr>
                <th>Tháng</th>
                <th>Doanh thu</th>
                <th>Giá vốn (COGS)</th>
                <th>Phí vận chuyển</th>
                <th>Phí dịch vụ sàn</th>
                <th>Lợi nhuận ròng</th>
                <th>Biên LN gộp</th>
                <th>MOM Growth</th>
              </tr>
            </thead>
            <tbody>
              {currentTableRows.map((d, i) => (
                <tr key={i}>
                  <td>{d.month}</td>
                  <td>{formatVND(d.revenue)}</td>
                  <td>{formatVND(d.cost)}</td>
                  <td>{formatVND(d.shipping)}</td>
                  <td>{formatVND(d.fee)}</td>
                  <td style={{ fontWeight: '700', color: '#10b981' }}>{formatVND(d.profit)}</td>
                  <td>{d.margin}%</td>
                  <td className={d.growth > 0 ? 'trend-up' : d.growth < 0 ? 'trend-down' : ''}>
                    {d.growth !== 0 ? (d.growth > 0 ? `+${d.growth}%` : `${d.growth}%`) : '-'}
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Lũy kế 6 tháng</td>
                <td>{formatVND(currentTableRows.reduce((s, i) => s + i.revenue, 0))}</td>
                <td>{formatVND(currentTableRows.reduce((s, i) => s + i.cost, 0))}</td>
                <td>{formatVND(currentTableRows.reduce((s, i) => s + i.shipping, 0))}</td>
                <td>{formatVND(currentTableRows.reduce((s, i) => s + i.fee, 0))}</td>
                <td style={{ color: '#10b981' }}>{formatVND(currentTableRows.reduce((s, i) => s + i.profit, 0))}</td>
                <td>29.7%</td>
                <td className="trend-up">+18.2% (Avg)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
