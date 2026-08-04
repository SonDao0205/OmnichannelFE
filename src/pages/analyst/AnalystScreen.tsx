import { useEffect, useState } from 'react'
import RevenueAnalysis from './components/RevenueAnalysis'
import './analyst.css'

export default function AnalystScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('this-month')

  useEffect(() => {
    document.title = 'Phân tích tài chính | SmartHub'
  }, [])

  return (
    <div className="analyst-container">
      <header className="analyst-header">
        <div className="header-title-area">
          <h1>Phân tích tài chính và tăng trưởng</h1>
          <p>Dữ liệu phân tích được tự động gửi tới email tenant mỗi tuần một lần.</p>
        </div>
        <div className="analyst-filters">
          <label htmlFor="period-select">Thời gian</label>
          <select
            id="period-select"
            className="filter-select"
            value={selectedPeriod}
            onChange={(event) => setSelectedPeriod(event.target.value)}
          >
            <option value="this-month">Tháng này</option>
            <option value="last-month">Tháng trước</option>
            <option value="this-quarter">Quý này</option>
            <option value="this-year">Năm nay</option>
          </select>
        </div>
      </header>

      <RevenueAnalysis selectedPeriod={selectedPeriod} />
    </div>
  )
}
