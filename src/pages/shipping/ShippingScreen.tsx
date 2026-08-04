import { useEffect, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import './shipping.css'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  fetchShipmentOverviewThunk,
  fetchShipmentsThunk,
  trackShipmentThunk,
  clearTracked,
} from '../../stores/slices/shipmentSlice'
import { message } from 'antd'

export default function ShippingScreen() {
  const dispatch = useAppDispatch()
  const { items: shipmentItems, overview, trackedShipment, loading, error } = useAppSelector((s) => s.shipments)
  const [trackingSearch, setTrackingSearch] = useState('')

  useEffect(() => {
    dispatch(fetchShipmentOverviewThunk())
    dispatch(fetchShipmentsThunk({}))
  }, [dispatch])

  useEffect(() => {
    if (error) message.error(error)
  }, [error])

  const formatVND = (n: number) => n > 0 ? `${n.toLocaleString('vi-VN')}đ` : '—'

  const countWaiting  = overview?.countWaiting  ?? 0
  const countPicked   = overview?.countPicked   ?? 0
  const countTransit  = overview?.countInTransit ?? 0
  const countFailed   = overview?.countFailed   ?? 0

  const sourceShipments = trackedShipment ? [trackedShipment] : shipmentItems
  const displayShipments = sourceShipments.map(s => ({
        id: s.id,
        waybillCode: s.waybillCode || 'Chưa có mã',
        orderCode: s.orderCode || s.orderId || '—',
        carrier: s.carrierName || '—',
        destination: s.destination || '—',
        codAmount: s.codAmount || 0,
        milestone: s.latestMilestone || '—',
        milestoneType: s.milestoneType,
      }))

  const handleTrackingSearch = async () => {
    const code = trackingSearch.trim()
    if (!code) {
      dispatch(clearTracked())
      await dispatch(fetchShipmentsThunk({})).unwrap().catch(() => undefined)
      return
    }
    await dispatch(trackShipmentThunk(code)).unwrap().catch(() => undefined)
  }

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
        <div className="ship-header-left"><h1>Tổng quan vận chuyển</h1></div>
      </div>

      {/* ===== 6 STATUS CARDS ===== */}
      <div className="ship-status-row">

        <div className="ship-stat-card">
          <div className="ship-stat-label">Chờ lấy hàng</div>
          <div className="ship-stat-number">{String(countWaiting).padStart(2, '0')}</div>
        </div>

        <div className="ship-stat-card">
          <div className="ship-stat-label">Đã lấy hàng</div>
          <div className="ship-stat-number">{String(countPicked)}</div>
        </div>

        <div className="ship-stat-card highlighted">
          <div className="ship-stat-label">Đang giao hàng</div>
          <div className="ship-stat-number">{countTransit.toLocaleString('vi-VN')}</div>
        </div>

        <div className="ship-stat-card">
          <div className="ship-stat-label">Thất bại / hoàn / hủy</div>
          <div className={`ship-stat-number ${countFailed > 0 ? 'danger' : ''}`}>
            {countFailed}
          </div>
        </div>

        <div className="ship-stat-card">
          <div className="ship-stat-label">Đã giao thành công</div>
          <div className="ship-stat-number">{overview?.countSuccess ?? 0}</div>
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
              <div className="ship-bar-fill ghtk-time" style={{ width: `${Math.min((overview?.ghtkAvgHours ?? 0) / 48 * 100, 100)}%` }} />
            </div>
            <span className="ship-bar-value">{overview?.ghtkAvgHours ?? 0} Giờ</span>
          </div>

          {/* GHN */}
          <div className="ship-bar-row">
            <span className="ship-bar-label">Giao Hàng Nhanh (GHN)</span>
            <div className="ship-bar-track">
              <div className="ship-bar-fill ghn-time" style={{ width: `${Math.min((overview?.ghnAvgHours ?? 0) / 48 * 100, 100)}%` }} />
            </div>
            <span className="ship-bar-value">{overview?.ghnAvgHours ?? 0} Giờ</span>
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
              <div className="ship-bar-fill ghtk-rate" style={{ width: `${overview?.ghtkSuccessRate ?? 0}%` }} />
            </div>
            <span className="ship-bar-value">{overview?.ghtkSuccessRate ?? 0}%</span>
          </div>

          {/* GHN */}
          <div className="ship-bar-row">
            <span className="ship-bar-label">GHN</span>
            <div className="ship-bar-track">
              <div className="ship-bar-fill ghn-rate" style={{ width: `${overview?.ghnSuccessRate ?? 0}%` }} />
            </div>
            <span className="ship-bar-value">{overview?.ghnSuccessRate ?? 0}%</span>
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
            onChange={e => {
              setTrackingSearch(e.target.value)
              if (!e.target.value) dispatch(clearTracked())
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') void handleTrackingSearch()
            }}
          />
          <button type="button" onClick={() => void handleTrackingSearch()} disabled={loading}>
            {loading ? 'Đang tìm...' : 'Tra cứu'}
          </button>
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
