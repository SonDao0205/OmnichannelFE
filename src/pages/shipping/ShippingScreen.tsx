import { useEffect, useState } from 'react'
import {
  CalendarOutlined,
  LinkOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import './shipping.css'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  fetchShipmentOverviewThunk,
  fetchShipmentsThunk,
} from '../../stores/slices/shipmentSlice'

export default function ShippingScreen() {
  const dispatch = useAppDispatch()
  const { items: shipmentItems, overview } = useAppSelector((s) => s.shipments)
  const [trackingSearch, setTrackingSearch] = useState('')

  useEffect(() => {
    dispatch(fetchShipmentOverviewThunk())
    dispatch(fetchShipmentsThunk({}))
  }, [dispatch])

  const formatVND = (n: number) => n > 0 ? `${n.toLocaleString('vi-VN')}đ` : '—'

  // Ưu tiên dữ liệu thật từ API, fallback về mock nếu chưa có
  const countWaiting  = overview?.countWaiting  ?? 0
  const countPicked   = overview?.countPicked   ?? 0
  const countTransit  = overview?.countInTransit ?? 0
  const countFailed   = overview?.countFailed   ?? 0
  const countSuccess  = overview?.countSuccess ?? 0
  const ghtkAvgHours  = overview?.ghtkAvgHours ?? 0
  const ghnAvgHours   = overview?.ghnAvgHours ?? 0
  const ghtkRate      = overview?.ghtkSuccessRate ?? 0
  const ghnRate       = overview?.ghnSuccessRate ?? 0

  const displayShipments = shipmentItems.map(s => ({
    id: s.id,
    waybillCode: s.waybillCode,
    orderCode: s.orderId || '—',
    carrier: s.carrierName || '—',
    destination: s.destination || '—',
    codAmount: s.codAmount,
    milestone: s.latestMilestone || '—',
    milestoneType: s.milestoneType,
  }))

  const filteredShipments = displayShipments.filter(s => {
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
            Dữ liệu vận chuyển hiện tại
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
          <div className="ship-stat-number">{String(countWaiting).padStart(2, '0')}</div>
          <div className="ship-stat-sub">{countWaiting} vận đơn</div>
        </div>

        <div className="ship-stat-card">
          <div className="ship-stat-label">Đã lấy hàng</div>
          <div className="ship-stat-number">{String(countPicked)}</div>
          <div className="ship-stat-sub">{countPicked} vận đơn</div>
        </div>

        <div className="ship-stat-card highlighted">
          <div className="ship-stat-label">Đang giao hàng</div>
          <div className="ship-stat-number">{countTransit.toLocaleString('vi-VN')}</div>
          <div className="ship-stat-sub">{countTransit} vận đơn</div>
        </div>

        <div className="ship-stat-card">
          <div className="ship-stat-label">Chờ giao lại</div>
          <div className="ship-stat-number">0</div>
          <div className="ship-stat-sub">0 vận đơn</div>
        </div>

        <div className="ship-stat-card">
          <div className="ship-stat-label">Đang hoàn hàng</div>
          <div className={`ship-stat-number ${countFailed > 0 ? 'danger' : ''}`}>
            {countFailed}
          </div>
          <div className="ship-stat-sub">{countFailed} vận đơn</div>
        </div>

        <div className="ship-stat-card">
          <div className="ship-stat-label">Đã đối soát kỳ này</div>
          <div className="ship-stat-number">{countSuccess.toLocaleString('vi-VN')}</div>
          <div className="ship-stat-sub">{countSuccess} vận đơn thành công</div>
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
              <div className="ship-bar-fill ghtk-time" style={{ width: `${Math.min(100, ghtkAvgHours / 0.3)}%` }} />
            </div>
            <span className="ship-bar-value">{ghtkAvgHours.toFixed(1)} Giờ</span>
          </div>

          {/* GHN */}
          <div className="ship-bar-row">
            <span className="ship-bar-label">Giao Hàng Nhanh (GHN)</span>
            <div className="ship-bar-track">
              <div className="ship-bar-fill ghn-time" style={{ width: `${Math.min(100, ghnAvgHours / 0.3)}%` }} />
            </div>
            <span className="ship-bar-value">{ghnAvgHours.toFixed(1)} Giờ</span>
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
              <div className="ship-bar-fill ghtk-rate" style={{ width: `${ghtkRate}%` }} />
            </div>
            <span className="ship-bar-value">{ghtkRate.toFixed(1)}%</span>
          </div>

          {/* GHN */}
          <div className="ship-bar-row">
            <span className="ship-bar-label">GHN</span>
            <div className="ship-bar-track">
              <div className="ship-bar-fill ghn-rate" style={{ width: `${ghnRate}%` }} />
            </div>
            <span className="ship-bar-value">{ghnRate.toFixed(1)}%</span>
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
