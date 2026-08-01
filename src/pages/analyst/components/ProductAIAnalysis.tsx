import { useEffect, useState } from 'react'
import {
  ClockCircleOutlined,
  DashboardOutlined,
  FireOutlined,
  RobotOutlined,
  StarOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { analyticsApi, type ProductAIAnalyticsData, type FunnelStage, type ProductPerformance } from '../../../apis/analyticsApi'

interface ProductAIAnalysisProps {
  selectedPeriod: string
}

export default function ProductAIAnalysis({ selectedPeriod }: ProductAIAnalysisProps) {
  const [selectedChannel, setSelectedChannel] = useState<'ALL' | 'Shopee' | 'Lazada' | 'TikTok Shop' | 'Zalo OA'>('ALL')
  const [apiData, setApiData] = useState<ProductAIAnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    analyticsApi.fetchProductAIAnalytics(selectedPeriod, selectedChannel)
      .then(res => {
        setApiData(res)
      })
      .catch(err => {
        console.warn("Backend unavailable, falling back to simulated frontend data.", err)
        setApiData(null)
      })
      .finally(() => setLoading(false))
  }, [selectedPeriod, selectedChannel])

  if (loading) {
    return (
      <div className="analyst-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#8b5cf6', fontWeight: '600', fontSize: '15px' }}>
        🔄 Đang tải hiệu năng sản phẩm & AI...
      </div>
    )
  }

  // Mock products data grouped by channel (Mock fallback logic)
  const productsDataMock = {
    ALL: {
      top: [
        { name: 'Áo khoác denim nam dáng rộng AK-204 Vintage Blue', sku: 'AK204-VB', sold: 342, revenue: 167238000, stock: 42, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=150&auto=format&fit=crop', channel: 'Shopee, TikTok' },
        { name: 'Áo thun Tee Basic Cotton Unisex 250gsm', sku: 'TEE-BASIC', sold: 331, revenue: 82750000, stock: 15, status: 'LOW', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=150&auto=format&fit=crop', channel: 'Shopee, Lazada, TikTok' },
        { name: 'Áo Hoodie Oversize Premium Form Boxy', sku: 'HD-BOX-P', sold: 214, revenue: 96300000, stock: 110, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=150&auto=format&fit=crop', channel: 'TikTok, Lazada' },
        { name: 'Quần Jogger Kaki túi hộp phong cách Streetwear', sku: 'JG-KK-ST', sold: 160, revenue: 64000000, stock: 8, status: 'LOW', img: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?q=80&w=150&auto=format&fit=crop', channel: 'Lazada, Shopee' },
        { name: 'Áo Polo Nam phối cổ sọc phong cách tối giản', sku: 'PL-MINI', sold: 74, revenue: 22126000, stock: 120, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=150&auto=format&fit=crop', channel: 'Zalo OA, Lazada' },
      ],
      bottom: [
        { name: 'Áo khoác da Bomber Biker Da bò cao cấp', sku: 'JK-LEATH', sold: 7, revenue: 10430000, stock: 213, status: 'DANGER', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=150&auto=format&fit=crop', channel: 'Shopee, Lazada, TikTok' },
        { name: 'Áo Trench Coat măng tô nam dáng dài thu đông', sku: 'TC-LONG-W', sold: 6, revenue: 4740000, stock: 93, status: 'WARNING', img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=150&auto=format&fit=crop', channel: 'TikTok, Lazada' },
        { name: 'Áo Blazer Casual dáng Hàn Quốc vải tuyết mưa', sku: 'BZ-KOR-C', sold: 9, revenue: 4950000, stock: 99, status: 'WARNING', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=150&auto=format&fit=crop', channel: 'Shopee, Zalo OA' },
      ]
    },
    Shopee: {
      top: [
        { name: 'Áo khoác denim nam dáng rộng AK-204 Vintage Blue', sku: 'AK204-VB', sold: 152, revenue: 74328000, stock: 22, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=150&auto=format&fit=crop', channel: 'Shopee' },
        { name: 'Áo thun Tee Basic Cotton Unisex 250gsm', sku: 'TEE-BASIC', sold: 120, revenue: 30000000, stock: 5, status: 'LOW', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=150&auto=format&fit=crop', channel: 'Shopee' },
        { name: 'Quần Jogger Kaki túi hộp phong cách Streetwear', sku: 'JG-KK-ST', sold: 86, revenue: 34400000, stock: 3, status: 'LOW', img: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?q=80&w=150&auto=format&fit=crop', channel: 'Shopee' },
        { name: 'Áo Hoodie Oversize Premium Form Boxy', sku: 'HD-BOX-P', sold: 74, revenue: 33300000, stock: 45, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=150&auto=format&fit=crop', channel: 'Shopee' },
        { name: 'Áo Polo Nam phối cổ sọc phong cách tối giản', sku: 'PL-MINI', sold: 20, revenue: 5980000, stock: 40, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=150&auto=format&fit=crop', channel: 'Shopee' },
      ],
      bottom: [
        { name: 'Áo khoác da Bomber Biker Da bò cao cấp', sku: 'JK-LEATH', sold: 2, revenue: 2980000, stock: 95, status: 'DANGER', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=150&auto=format&fit=crop', channel: 'Shopee' },
        { name: 'Áo Blazer Casual dáng Hàn Quốc vải tuyết mưa', sku: 'BZ-KOR-C', sold: 5, revenue: 2750000, stock: 40, status: 'WARNING', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=150&auto=format&fit=crop', channel: 'Shopee' },
      ]
    },
    Lazada: {
      top: [
        { name: 'Áo thun Tee Basic Cotton Unisex 250gsm', sku: 'TEE-BASIC', sold: 88, revenue: 22000000, stock: 4, status: 'LOW', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=150&auto=format&fit=crop', channel: 'Lazada' },
        { name: 'Quần Jogger Kaki túi hộp phong cách Streetwear', sku: 'JG-KK-ST', sold: 62, revenue: 24800000, stock: 5, status: 'LOW', img: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?q=80&w=150&auto=format&fit=crop', channel: 'Lazada' },
        { name: 'Áo khoác denim nam dáng rộng AK-204 Vintage Blue', sku: 'AK204-VB', sold: 58, revenue: 28362000, stock: 12, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=150&auto=format&fit=crop', channel: 'Lazada' },
        { name: 'Áo Hoodie Oversize Premium Form Boxy', sku: 'HD-BOX-P', sold: 40, revenue: 18000000, stock: 35, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=150&auto=format&fit=crop', channel: 'Lazada' },
        { name: 'Áo Polo Nam phối cổ sọc phong cách tối giản', sku: 'PL-MINI', sold: 20, revenue: 5980000, stock: 50, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=150&auto=format&fit=crop', channel: 'Lazada' },
      ],
      bottom: [
        { name: 'Áo khoác da Bomber Biker Da bò cao cấp', sku: 'JK-LEATH', sold: 1, revenue: 1490000, stock: 48, status: 'DANGER', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=150&auto=format&fit=crop', channel: 'Lazada' },
        { name: 'Áo Trench Coat măng tô nam dáng dài thu đông', sku: 'TC-LONG-W', sold: 3, revenue: 2370000, stock: 35, status: 'WARNING', img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=150&auto=format&fit=crop', channel: 'Lazada' },
      ]
    },
    'TikTok Shop': {
      top: [
        { name: 'Áo Hoodie Oversize Premium Form Boxy', sku: 'HD-BOX-P', sold: 140, revenue: 63000000, stock: 30, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=150&auto=format&fit=crop', channel: 'TikTok Shop' },
        { name: 'Áo khoác denim nam dáng rộng AK-204 Vintage Blue', sku: 'AK204-VB', sold: 112, revenue: 54768000, stock: 8, status: 'LOW', img: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=150&auto=format&fit=crop', channel: 'TikTok Shop' },
        { name: 'Áo thun Tee Basic Cotton Unisex 250gsm', sku: 'TEE-BASIC', sold: 95, revenue: 23750000, stock: 5, status: 'LOW', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=150&auto=format&fit=crop', channel: 'TikTok Shop' },
        { name: 'Quần Jogger Kaki túi hộp phong cách Streetwear', sku: 'JG-KK-ST', sold: 90, revenue: 36000000, stock: 12, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?q=80&w=150&auto=format&fit=crop', channel: 'TikTok Shop' },
        { name: 'Áo Polo Nam phối cổ sọc phong cách tối giản', sku: 'PL-MINI', sold: 30, revenue: 8970000, stock: 30, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=150&auto=format&fit=crop', channel: 'TikTok Shop' },
      ],
      bottom: [
        { name: 'Áo Trench Coat măng tô nam dáng dài thu đông', sku: 'TC-LONG-W', sold: 2, revenue: 1580000, stock: 50, status: 'WARNING', img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=150&auto=format&fit=crop', channel: 'TikTok Shop' },
        { name: 'Áo khoác da Bomber Biker Da bò cao cấp', sku: 'JK-LEATH', sold: 3, revenue: 4470000, stock: 60, status: 'DANGER', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=150&auto=format&fit=crop', channel: 'TikTok Shop' },
      ]
    },
    'Zalo OA': {
      top: [
        { name: 'Áo Polo Nam phối cổ sọc phong cách tối giản', sku: 'PL-MINI', sold: 34, revenue: 10166000, stock: 10, status: 'LOW', img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=150&auto=format&fit=crop', channel: 'Zalo OA' },
        { name: 'Áo thun Tee Basic Cotton Unisex 250gsm', sku: 'TEE-BASIC', sold: 28, revenue: 7000000, stock: 1, status: 'LOW', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=150&auto=format&fit=crop', channel: 'Zalo OA' },
        { name: 'Áo khoác denim nam dáng rộng AK-204 Vintage Blue', sku: 'AK204-VB', sold: 20, revenue: 9780000, stock: 10, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?q=80&w=150&auto=format&fit=crop', channel: 'Zalo OA' },
        { name: 'Quần Jogger Kaki túi hộp phong cách Streetwear', sku: 'JG-KK-ST', sold: 12, revenue: 4800000, stock: 5, status: 'LOW', img: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?q=80&w=150&auto=format&fit=crop', channel: 'Zalo OA' },
        { name: 'Áo Hoodie Oversize Premium Form Boxy', sku: 'HD-BOX-P', sold: 10, revenue: 4500000, stock: 12, status: 'NORMAL', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=150&auto=format&fit=crop', channel: 'Zalo OA' },
      ],
      bottom: [
        { name: 'Áo Blazer Casual dáng Hàn Quốc vải tuyết mưa', sku: 'BZ-KOR-C', sold: 0, revenue: 0, stock: 15, status: 'WARNING', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=150&auto=format&fit=crop', channel: 'Zalo OA' },
        { name: 'Áo khoác da Bomber Biker Da bò cao cấp', sku: 'JK-LEATH', sold: 1, revenue: 1490000, stock: 10, status: 'WARNING', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=150&auto=format&fit=crop', channel: 'Zalo OA' },
      ]
    }
  }

  // AI automation stats mock fallback
  let mockAIStats = {
    totalOrders: 348,
    aiClosed: 202,
    hybridClosed: 84,
    humanClosed: 62,
    conversionRate: 82.5,
    responseTime: 4.2,
    csat: 4.8,
    costSaved: 14500000,
  }

  if (selectedPeriod === 'last-month') {
    mockAIStats = {
      totalOrders: 290,
      aiClosed: 165,
      hybridClosed: 73,
      humanClosed: 52,
      conversionRate: 80.8,
      responseTime: 4.5,
      csat: 4.7,
      costSaved: 12100000,
    }
  } else if (selectedPeriod === 'full-year') {
    mockAIStats = {
      totalOrders: 1840,
      aiClosed: 1049,
      hybridClosed: 460,
      humanClosed: 331,
      conversionRate: 83.1,
      responseTime: 3.9,
      csat: 4.8,
      costSaved: 76500000,
    }
  }

  // Active variables (API data or mock fallbacks)
  const aiStats = {
    totalOrders: apiData ? apiData.totalOrders : mockAIStats.totalOrders,
    aiClosed: apiData ? apiData.aiClosed : mockAIStats.aiClosed,
    hybridClosed: apiData ? apiData.hybridClosed : mockAIStats.hybridClosed,
    humanClosed: apiData ? apiData.humanClosed : mockAIStats.humanClosed,
    conversionRate: apiData ? apiData.conversionRate : mockAIStats.conversionRate,
    responseTime: apiData ? apiData.responseTime : mockAIStats.responseTime,
    csat: apiData ? apiData.csat : mockAIStats.csat,
    costSaved: apiData ? apiData.costSaved : mockAIStats.costSaved,
  }

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
  }

  const mockChannelData = productsDataMock[selectedChannel]
  const topProductsList: ProductPerformance[] = apiData ? apiData.topProducts : mockChannelData.top
  const bottomProductsList: ProductPerformance[] = apiData ? apiData.bottomProducts : mockChannelData.bottom

  const mockFunnelStages: FunnelStage[] = [
    { stageName: "Tổng hội thoại", value: (aiStats.totalOrders * 4.25), valueLabel: Math.round(aiStats.totalOrders * 4.25) + " cuộc", percentage: 100 },
    { stageName: "AI nhận dạng ý định", value: (aiStats.totalOrders * 3.6), valueLabel: Math.round(aiStats.totalOrders * 3.6) + " cuộc", percentage: 85 },
    { stageName: "AI báo giá / tạo nháp", value: (aiStats.totalOrders * 2.3), valueLabel: Math.round(aiStats.totalOrders * 2.3) + " cuộc", percentage: 54 },
    { stageName: "Chốt đơn thành công", value: aiStats.totalOrders, valueLabel: aiStats.totalOrders + " đơn", percentage: 28 }
  ]
  const currentFunnelStages = apiData ? apiData.funnelStages : mockFunnelStages

  // Donut values calculations
  const r = 60
  const circ = 2 * Math.PI * r
  const aiPct = Math.round((aiStats.aiClosed / aiStats.totalOrders) * 100)
  const hybridPct = Math.round((aiStats.hybridClosed / aiStats.totalOrders) * 100)
  const humanPct = 100 - aiPct - hybridPct

  const aiOffset = 0
  const hybridOffset = (aiPct / 100) * circ
  const humanOffset = ((aiPct + hybridPct) / 100) * circ


  return (
    <div className="analyst-container">
      
      {/* Marketplace Selector Buttons */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'Shopee', 'Lazada', 'TikTok Shop', 'Zalo OA'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(ch)}
              className="filter-select"
              style={{
                borderColor: selectedChannel === ch ? 'var(--accent)' : 'var(--border)',
                background: selectedChannel === ch ? 'var(--accent-bg)' : 'var(--bg)',
                color: selectedChannel === ch ? 'var(--accent)' : 'var(--text-h)',
              }}
            >
              {ch === 'ALL' ? 'Tất cả các sàn' : ch}
            </button>
          ))}
        </div>
        
        <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '600' }}>
          Đang hiển thị kênh: <strong style={{ color: 'var(--text-h)' }}>{selectedChannel === 'ALL' ? 'Tất cả' : selectedChannel}</strong>
        </span>
      </section>

      {/* AI Automation Donut & Stats Row */}
      <div className="panels-row">
        
        {/* Left side: AI Order ratio donut & funnel */}
        <div className="analyst-panel">
          <header className="panel-header-row">
            <div>
              <h2>Tỷ lệ đơn hàng chốt bằng AI</h2>
              <span className="panel-sub-title">Báo cáo mức độ tự động hóa quy trình chốt đơn qua chatbot AI</span>
            </div>
          </header>
          
          <div className="panels-row equal-grid" style={{ gap: '16px' }}>
            {/* SVG Donut Chart */}
            <div className="ai-donut-container">
              <svg className="donut-svg" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={r} className="donut-track" />
                {/* AI Segment */}
                <circle
                  cx="80"
                  cy="80"
                  r={r}
                  className="donut-segment-ai"
                  strokeDasharray={`${(aiPct / 100) * circ} ${circ}`}
                  strokeDashoffset={-aiOffset}
                />
                {/* Hybrid Segment */}
                <circle
                  cx="80"
                  cy="80"
                  r={r}
                  className="donut-segment-hybrid"
                  strokeDasharray={`${(hybridPct / 100) * circ} ${circ}`}
                  strokeDashoffset={-hybridOffset}
                />
                {/* Human Segment */}
                <circle
                  cx="80"
                  cy="80"
                  r={r}
                  className="donut-segment-human"
                  strokeDasharray={`${(humanPct / 100) * circ} ${circ}`}
                  strokeDashoffset={-humanOffset}
                />
              </svg>
              <div className="donut-center-info">
                <span className="donut-center-num">{aiPct + hybridPct}%</span>
                <span className="donut-center-lbl">Có AI hỗ trợ</span>
              </div>
            </div>

            {/* List details */}
            <div className="donut-details-list">
              <div className="donut-detail-item">
                <div className="detail-item-left">
                  <span className="detail-color-marker" style={{ backgroundColor: '#8b5cf6' }}></span>
                  <span>AI chốt 100%</span>
                </div>
                <div className="detail-item-right">
                  <span className="detail-percent">{aiPct}%</span>
                  <span className="detail-count">{aiStats.aiClosed} đơn</span>
                </div>
              </div>

              <div className="donut-detail-item">
                <div className="detail-item-left">
                  <span className="detail-color-marker" style={{ backgroundColor: '#3b82f6' }}></span>
                  <span>AI tư vấn + Agent chốt</span>
                </div>
                <div className="detail-item-right">
                  <span className="detail-percent">{hybridPct}%</span>
                  <span className="detail-count">{aiStats.hybridClosed} đơn</span>
                </div>
              </div>

              <div className="donut-detail-item">
                <div className="detail-item-left">
                  <span className="detail-color-marker" style={{ backgroundColor: '#64748b' }}></span>
                  <span>Nhân viên chốt 100%</span>
                </div>
                <div className="detail-item-right">
                  <span className="detail-percent">{humanPct}%</span>
                  <span className="detail-count">{aiStats.humanClosed} đơn</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: AI KPI Performance */}
        <div className="analyst-panel">
          <header className="panel-header-row">
            <h2>Hiệu năng trợ lý AI</h2>
          </header>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', background: 'rgba(139, 92, 246, 0.03)' }}>
              <div style={{ color: '#8b5cf6', fontSize: '18px', marginBottom: '8px' }}><RobotOutlined /></div>
              <div style={{ fontSize: '11px', fontWeight: '650', color: '#64748b', textTransform: 'uppercase' }}>Tỷ lệ chuyển đổi</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-h)', marginTop: '4px' }}>{aiStats.conversionRate}%</div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', background: 'rgba(59, 130, 246, 0.03)' }}>
              <div style={{ color: '#3b82f6', fontSize: '18px', marginBottom: '8px' }}><ClockCircleOutlined /></div>
              <div style={{ fontSize: '11px', fontWeight: '650', color: '#64748b', textTransform: 'uppercase' }}>T/g phản hồi TB</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-h)', marginTop: '4px' }}>{aiStats.responseTime}s</div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', background: 'rgba(245, 158, 11, 0.03)' }}>
              <div style={{ color: '#f59e0b', fontSize: '18px', marginBottom: '8px' }}><StarOutlined /></div>
              <div style={{ fontSize: '11px', fontWeight: '650', color: '#64748b', textTransform: 'uppercase' }}>Hài lòng (CSAT)</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-h)', marginTop: '4px' }}>{aiStats.csat}/5.0</div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', background: 'rgba(16, 185, 129, 0.03)' }}>
              <div style={{ color: '#10b981', fontSize: '18px', marginBottom: '8px' }}><DashboardOutlined /></div>
              <div style={{ fontSize: '11px', fontWeight: '650', color: '#64748b', textTransform: 'uppercase' }}>CP tối ưu ước tính</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-h)', marginTop: '8px' }}>{formatVND(aiStats.costSaved)}</div>
            </div>
          </div>

          {/* AI Funnel */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '4px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '12px', marginTop: 0 }}>Phễu hội thoại tự động chốt đơn</h3>
            <div className="ai-funnel-pipeline">
              {currentFunnelStages.map((stage, idx) => (
                <div className="funnel-row" key={idx}>
                  <span className="funnel-stage-name">{stage.stageName}</span>
                  <div className="funnel-progress-track">
                    <div className="funnel-progress-bar" style={{ width: `${stage.percentage}%`, background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)' }}></div>
                  </div>
                  <span className="funnel-progress-value">{stage.valueLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Top & Bottom Products Row */}
      <div className="products-performance-split">
        
        {/* Top selling products */}
        <div className="analyst-panel">
          <header className="panel-header-row">
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f59e0b' }}><FireOutlined /></span>
                <span>Sản phẩm bán chạy nhất</span>
              </h2>
              <span className="panel-sub-title">Top sản phẩm đóng góp doanh số cao nhất trên hệ thống</span>
            </div>
          </header>

          <div className="prod-list-container">
            {topProductsList.map((p, idx) => (
              <div className="prod-perf-card" key={`top-${idx}`}>
                <span className={`prod-rank rank-${idx + 1}`}>{idx + 1}</span>
                <img src={p.img} alt={p.name} className="prod-img-box" />
                <div className="prod-info-box">
                  <h4 className="prod-title-text" title={p.name}>{p.name}</h4>
                  <span className="prod-sku-text">SKU: {p.sku}</span>
                  <div>
                    {selectedChannel === 'ALL' && (
                      <span className="channel-pill channel-shopee">{p.channel}</span>
                    )}
                    <span className={`prod-stock-label ${p.status === 'LOW' ? 'badge-stock-danger' : 'badge-stock-normal'}`}>
                      Tồn kho: {p.stock}
                    </span>
                  </div>
                </div>
                <div className="prod-stats-box">
                  <span className="prod-stats-val">{p.sold} sản phẩm</span>
                  <span className="prod-stats-sub">{formatVND(p.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom selling products (Least sold) */}
        <div className="analyst-panel">
          <header className="panel-header-row">
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ef4444' }}><WarningOutlined /></span>
                <span>Sản phẩm bán chậm & Cảnh báo tồn</span>
              </h2>
              <span className="panel-sub-title">Nhóm hàng hóa có tốc độ bán chậm, tồn kho cao cần thanh lý</span>
            </div>
          </header>

          <div className="prod-list-container">
            {bottomProductsList.map((p, idx) => (
              <div className="prod-perf-card" key={`bottom-${idx}`} style={{ borderLeft: '3px solid #ef4444' }}>
                <span className="prod-rank" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)' }}>!</span>
                <img src={p.img} alt={p.name} className="prod-img-box" />
                <div className="prod-info-box">
                  <h4 className="prod-title-text" title={p.name}>{p.name}</h4>
                  <span className="prod-sku-text">SKU: {p.sku}</span>
                  <div>
                    <span className="prod-stock-label badge-stock-danger">Tồn kho cao: {p.stock}</span>
                  </div>
                </div>
                <div className="prod-stats-box">
                  <span className="prod-stats-val" style={{ color: '#ef4444' }}>Đã bán: {p.sold}</span>
                  <span className="prod-stats-sub" style={{ fontSize: '10.5px', color: '#8b5cf6', fontWeight: '650', marginTop: '4px' }}>
                    {p.sold === 0 ? '⚠️ Không có phát sinh đơn hàng' : '⚠️ Vòng quay hàng tồn > 120 ngày'}
                  </span>
                </div>
              </div>
            ))}

            <div style={{
              background: 'rgba(239, 68, 68, 0.04)',
              border: '1px dashed rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              padding: '14px',
              marginTop: '8px',
              fontSize: '13px',
              lineHeight: '1.45',
              color: '#ef4444'
            }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>💡 Khuyến nghị tối ưu hàng tồn kho (Senior Suggestion):</strong>
              Tạo ngay chương trình mua kèm deal sốc (Bundle Sale) áo thun Tee Basic tặng kèm Áo khoác da Bomber, hoặc lên cấu hình cho AI Bot tự động chào giảm giá 35% khi khách hàng quan tâm đến Blazer Casual nhưng còn đắn đo về giá.
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
