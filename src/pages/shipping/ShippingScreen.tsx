import { useState } from 'react'
import {
  CalendarOutlined,
  LinkOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import './shipping.css'

/* ================================================================
   MOCK DATA — thay bằng API thật khi backend sẵn sàng
   ================================================================ */

interface Shipment {
  id: string
  waybillCode: string   // mã vận đơn
  orderCode: string     // mã đơn hàng gốc
  carrier: string       // đối tác ship
  destination: string   // nơi đến
  codAmount: number     // tiền thu hộ COD
  milestone: string     // hành trình mới nhất
  milestoneType: 'picked' | 'transit' | 'success' | 'failed' | 'waiting'
}

const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: '1',
    waybillCode: 'GHTK_S92A1A42',
    orderCode: '#SHP-92641',
    carrier: 'Giao Hàng Tiết Kiệm',
    destination: 'Cầu Giấy, Hà Nội',
    codAmount: 489000,
    milestone: 'Shipper đã lấy hàng',
    milestoneType: 'picked',
  },
  {
    id: '2',
    waybillCode: 'GHN_VNE715A',
    orderCode: '#TKT-48195',
    carrier: 'Giao Hàng Nhanh',
    destination: 'Quận 1, TP. HCM',
    codAmount: 718000,
    milestone: 'Đang luân chuyển kho trung chuyển',
    milestoneType: 'transit',
  },
  {
    id: '3',
    waybillCode: 'GHTK_F81K3C09',
    orderCode: '#SHP-91005',
    carrier: 'Giao Hàng Tiết Kiệm',
    destination: 'Đống Đa, Hà Nội',
    codAmount: 320000,
    milestone: 'Giao hàng thành công',
    milestoneType: 'success',
  },
  {
    id: '4',
    waybillCode: 'GHN_VNE402B',
    orderCode: '#TKT-47820',
    carrier: 'Giao Hàng Nhanh',
    destination: 'Bình Thạnh, TP. HCM',
    codAmount: 0,
    milestone: 'Không giao được, chờ lấy lại',
    milestoneType: 'failed',
  },
  {
    id: '5',
    waybillCode: 'GHTK_C00A1B33',
    orderCode: '#WEB-10492',
    carrier: 'Giao Hàng Tiết Kiệm',
    destination: 'Thanh Xuân, Hà Nội',
    codAmount: 249000,
    milestone: 'Đang chờ shipper lấy hàng',
    milestoneType: 'waiting',
  },
]

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function ShippingScreen() {
  const [trackingSearch, setTrackingSearch] = useState('')

  const formatVND = (n: number) => n > 0 ? `${n.toLocaleString('vi-VN')}đ` : '—'

  // Tính các số thống kê từ mock data
  const countWaiting  = MOCK_SHIPMENTS.filter(s => s.milestoneType === 'waiting').length
  const countPicked   = MOCK_SHIPMENTS.filter(s => s.milestoneType === 'picked').length
  const countTransit  = MOCK_SHIPMENTS.filter(s => s.milestoneType === 'transit').length
  const countFailed   = MOCK_SHIPMENTS.filter(s => s.milestoneType === 'failed').length

  const filteredShipments = MOCK_SHIPMENTS.filter(s => {
    const q = trackingSearch.toLowerCase().trim()
    if (!q) return true
    return (
      s.waybillCode.toLowerCase().includes(q) ||
      s.orderCode.toLowerCase().includes(q)
    )
  })

  return (
    <div className="ship-page">

      {/* ===== HEADER ===== */}
      <div className="ship-header">
        <div className="ship-header-left">
          <h1>Tổng quan vận chuyển</h1>

          <button className="ship-date-badge" type="button">
            <CalendarOutlined />
            7 ngày qua (01/07 – 07/07/2026)
          </button>

          <select className="ship-branch-select">
            <option>Tất cả chi nhánh</option>
            <option>Chi nhánh Hà Nội</option>
            <option>Chi nhánh TP. HCM</option>
          </select>
        </div>

        <button className="btn-connect-carrier" type="button">
          <LinkOutlined /> Kết nối vận chuyển
        </button>
      </div>

      {/* ===== 6 STATUS CARDS ===== */}
      <div className="ship-status-row">

        <div className="ship-stat-card">
          <div className="ship-stat-label">Chờ lấy hàng</div>
          <div className="ship-stat-number">{String(countWaiting + 12).padStart(2, '0')}</div>
          <div className="ship-stat-sub">GDD: 0.0</div>
        </div>

        <div className="ship-stat-card">
          <div className="ship-stat-label">Đã lấy hàng</div>
          <div className="ship-stat-number">{String(countPicked + 8).padStart(1, '0')}</div>
          <div className="ship-stat-sub">GDD: 4.2M</div>
        </div>

        <div className="ship-stat-card highlighted">
          <div className="ship-stat-label">Đang giao hàng</div>
          <div className="ship-stat-number">{(countTransit + 142).toLocaleString('vi-VN')}</div>
          <div className="ship-stat-sub">GDD: 52.4M</div>
        </div>

        <div className="ship-stat-card">
          <div className="ship-stat-label">Chờ giao lại</div>
          <div className="ship-stat-number">3</div>
          <div className="ship-stat-sub">GDD: 8MM</div>
        </div>

        <div className="ship-stat-card">
          <div className="ship-stat-label">Đang hoàn hàng</div>
          <div className={`ship-stat-number ${countFailed > 0 ? 'danger' : ''}`}>
            {countFailed + 2}
          </div>
          <div className="ship-stat-sub">GDD: 5C</div>
        </div>

        <div className="ship-stat-card">
          <div className="ship-stat-label">Đã đối soát kỳ này</div>
          <div className="ship-stat-number">1,105</div>
          <div className="ship-stat-sub">đã xem vs</div>
        </div>

      </div>

      {/* ===== TWO PANELS ===== */}
      <div className="ship-panels-row">

        {/* Panel trái: Thời gian giao trung bình */}
        <div className="ship-panel">
          <div className="ship-panel-header">
            <span className="ship-panel-title">Thời gian lấy &amp; giao thành công trung bình</span>
            <span className="ship-panel-meta">Đơn vị: Giờ (H)</span>
          </div>

          {/* GHTK */}
          <div className="ship-bar-row">
            <span className="ship-bar-label">Giao Hàng Tiết Kiệm (GHTK)</span>
            <div className="ship-bar-track">
              <div className="ship-bar-fill ghtk-time" style={{ width: '75%' }} />
            </div>
            <span className="ship-bar-value">22.5 Giờ</span>
          </div>

          {/* GHN */}
          <div className="ship-bar-row">
            <span className="ship-bar-label">Giao Hàng Nhanh (GHN)</span>
            <div className="ship-bar-track">
              <div className="ship-bar-fill ghn-time" style={{ width: '88%' }} />
            </div>
            <span className="ship-bar-value">28.0 Giờ</span>
          </div>
        </div>

        {/* Panel phải: Tỉ lệ giao thành công */}
        <div className="ship-panel">
          <div className="ship-panel-header">
            <span className="ship-panel-title">Tỉ lệ giao hàng thành công theo đơn vị ship</span>
            <span className="ship-panel-meta green">Mục tiêu: &gt;97%</span>
          </div>

          {/* GHTK */}
          <div className="ship-bar-row">
            <span className="ship-bar-label">GHTK</span>
            <div className="ship-bar-track">
              <div className="ship-bar-fill ghtk-rate" style={{ width: '98.2%' }} />
            </div>
            <span className="ship-bar-value">98.2%</span>
          </div>

          {/* GHN */}
          <div className="ship-bar-row">
            <span className="ship-bar-label">GHN</span>
            <div className="ship-bar-track">
              <div className="ship-bar-fill ghn-rate" style={{ width: '95.4%' }} />
            </div>
            <span className="ship-bar-value">95.4%</span>
          </div>
        </div>

      </div>

      {/* ===== TRACKING TABLE SECTION ===== */}
      <div className="ship-tracking-header">
        <span className="ship-tracking-title">Danh sách hành trình vận đơn liên kết</span>
        <div className="ship-tracking-search-wrap">
          <SearchOutlined className="ship-tracking-search-icon" />
          <input
            className="ship-tracking-search"
            placeholder="Tìm mã vận đơn, mã đơn gốc..."
            value={trackingSearch}
            onChange={e => setTrackingSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="ship-table-container">
        <table className="ship-table">
          <colgroup>
            <col className="col-waybill" />
            <col className="col-order" />
            <col className="col-carrier" />
            <col className="col-dest" />
            <col className="col-cod" />
            <col className="col-milestone" />
          </colgroup>
          <thead>
            <tr>
              <th>MÃ VẬN ĐƠN</th>
              <th>ĐƠN HÀNG GỐC</th>
              <th>ĐỐI TÁC SHIP</th>
              <th>NƠI ĐẾN</th>
              <th>TIỀN THU HỘ COD</th>
              <th>HÀNH TRÌNH SẦN NHẤT</th>
            </tr>
          </thead>
          <tbody>
            {filteredShipments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  Không tìm thấy vận đơn nào
                </td>
              </tr>
            ) : (
              filteredShipments.map(s => (
                <tr key={s.id}>
                  <td>
                    <span className="cell-waybill-link">{s.waybillCode}</span>
                  </td>
                  <td>
                    <span className="cell-order-code">{s.orderCode}</span>
                  </td>
                  <td>
                    <span className="cell-carrier-name">{s.carrier}</span>
                  </td>
                  <td>
                    <span className="cell-destination">{s.destination}</span>
                  </td>
                  <td>
                    <span className="cell-cod">{formatVND(s.codAmount)}</span>
                  </td>
                  <td>
                    <span className={`cell-milestone ${s.milestoneType}`}>
                      {s.milestone}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
