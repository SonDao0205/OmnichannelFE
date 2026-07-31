import { useEffect, useState } from 'react'
import RevenueAnalysis from './components/RevenueAnalysis'
import ProductAIAnalysis from './components/ProductAIAnalysis'
import './analyst.css'

export default function AnalystScreen() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'products'>('revenue')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this-month')

  useEffect(() => {
    document.title = 'Báo cáo doanh số & Hiệu suất | SmartHub'
  }, [])

  // Format current date
  const currentDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="analyst-container">
      
      {/* Welcome Header */}
      <header className="analyst-header" id="analyst-main-header">
        <div className="header-title-area">
          <h1 id="analyst-title">Báo cáo doanh số & Hiệu suất AI</h1>
          <p>Phân tích hiệu quả doanh thu, tăng trưởng dòng tiền và đóng góp tự động hóa của Trợ lý AI.</p>
        </div>
        
        {/* Filters */}
        <div className="analyst-filters">
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>📅 {currentDate}</span>
          <select 
            id="period-select"
            className="filter-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="this-month">Tháng này (T7/2026)</option>
            <option value="last-month">Tháng trước (T6/2026)</option>
            <option value="q3">Quý này (Q3/2026)</option>
            <option value="full-year">Cả năm 2026</option>
          </select>
        </div>
      </header>

      {/* Sub-navigation Tabs */}
      <div className="analyst-tabs-bar" role="tablist">
        <button
          id="tab-revenue-trigger"
          role="tab"
          aria-selected={activeTab === 'revenue'}
          className={`analyst-tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
          type="button"
        >
          Tài chính & Tăng trưởng (MOM)
        </button>
        <button
          id="tab-products-trigger"
          role="tab"
          aria-selected={activeTab === 'products'}
          className={`analyst-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
          type="button"
        >
          Sản phẩm & Tỷ lệ chốt đơn AI
        </button>
      </div>

      {/* Render Sub Pages */}
      <main id="analyst-subpage-content" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
        {activeTab === 'revenue' ? (
          <RevenueAnalysis selectedPeriod={selectedPeriod} />
        ) : (
          <ProductAIAnalysis selectedPeriod={selectedPeriod} />
        )}
      </main>

    </div>
  )
}
