import { useEffect, useState } from 'react'
import {
  ExportOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  fetchOrdersThunk,
  setStatusTab,
  setOrderSearch,
  openOrderDetail,
  closeOrderDetail,
  updateOrderStatusThunk,
} from '../../stores/slices/orderSlice'
import type { Order, OrderStatus } from '../../types/order'
import OrderDetailModal from './OrderDetailModal'
import { message } from 'antd'
import './orders.css'

// ---- Helper: hiển thị nguồn sàn ----
function SourceBadge({ marketplace }: { marketplace: string }) {
  let cls = 'website'
  let label = marketplace

  if (marketplace === 'Shopee') { cls = 'shopee'; label = 'SHOPEE MALL' }
  else if (marketplace === 'TikTok Shop') { cls = 'tiktok'; label = 'TIKTOK SHOP' }
  else if (marketplace === 'Lazada') { cls = 'lazada'; label = 'LAZADA MALL' }
  else { cls = 'website'; label = 'WEBSITE STORE' }

  return <span className={`cell-source-badge ${cls}`}>{label}</span>
}

// ---- Helper: trạng thái badge ----
function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { cls: string; label: string }> = {
    PENDING: { cls: 'pending', label: 'CHỜ XÁC NHẬN' },
    PACKED: { cls: 'packed', label: 'ĐANG ĐÓNG GÓI' },
    IN_TRANSIT: { cls: 'in_transit', label: 'ĐANG GIAO HÀNG' },
    DELIVERED: { cls: 'delivered', label: 'ĐÃ HOÀN THÀNH' },
    CANCELLED: { cls: 'cancelled', label: 'ĐÃ HỦY ĐƠN' },
    RETURNED: { cls: 'returned', label: 'ĐÃ HOÀN HÀNG' },
  }
  const { cls, label } = map[status] ?? { cls: 'pending', label: status }
  return <span className={`order-status-badge ${cls}`}>{label}</span>
}

// ---- Helper: payment tag ----
function PaymentTag({ paymentStatus }: { paymentStatus: string }) {
  if (paymentStatus === 'PAID') return <span className="cell-payment-tag paid">Đã thanh toán</span>
  if (paymentStatus === 'REFUNDED') return <span className="cell-payment-tag transfer">Chuyển khoản QR</span>
  return <span className="cell-payment-tag cod">COD / Thu hộ</span>
}

// ---- Helper: carrier name giả lập ----
const CARRIER_MAP: Record<string, string> = {
  'TikTok Shop': 'GHN_Express',
  'Shopee': 'GHTK_091442',
  'Lazada': 'LEX_Express',
}

export default function OrderScreen() {
  const dispatch = useAppDispatch()
  const { items, loading, filter, selectedOrder, isDetailOpen } = useAppSelector(
    (state) => state.orders
  )
  const [localSearch, setLocalSearch] = useState('')

  useEffect(() => {
    dispatch(fetchOrdersThunk())
  }, [dispatch])

  const formatVND = (num: number) => `${num.toLocaleString('vi-VN')}đ`

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return { day: 'Hôm nay', time: timeStr }
    return { day: 'Hôm qua', time: timeStr }
  }

  // Count per tab
  const countPending = items.filter(i => i.status === 'PENDING').length
  const countPacked = items.filter(i => i.status === 'PACKED').length
  const countInTransit = items.filter(i => i.status === 'IN_TRANSIT').length
  const countDelivered = items.filter(i => i.status === 'DELIVERED').length
  const countCancelled = items.filter(i => i.status === 'CANCELLED' || i.status === 'RETURNED').length

  // Filter
  const filteredOrders = items.filter((order) => {
    if (filter.statusTab !== 'ALL' && order.status !== filter.statusTab) return false
    const q = localSearch.toLowerCase().trim()
    if (q) {
      return (
        order.orderCode.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q)
      )
    }
    return true
  })

  const handleApprove = (order: Order) => {
    dispatch(updateOrderStatusThunk({ orderId: order.id, status: 'PACKED' }))
    message.success(`Đã duyệt đơn hàng ${order.orderCode}!`)
  }

  return (
    <div className="order-page-container">

      {/* ===== HEADER ===== */}
      <div className="order-header-bar">
        <div className="order-header-left">
          <h1>Quản lý đơn hàng</h1>
          <span className="order-today-badge">Hôm nay: +45 đơn mới</span>
        </div>
        <div className="order-header-actions">
          <button className="btn-export-report" type="button">
            <ExportOutlined /> Xuất báo cáo
          </button>
          <button className="btn-create-order" type="button">
            <PlusOutlined /> Tạo đơn tay (F4)
          </button>
        </div>
      </div>

      {/* ===== STATUS TABS ===== */}
      <div className="order-status-tabs">
        <button
          id="order-tab-all"
          className={`order-tab-btn ${filter.statusTab === 'ALL' ? 'active' : ''}`}
          onClick={() => dispatch(setStatusTab('ALL'))}
          type="button"
        >
          Tất cả đơn&nbsp;
          <span className="tab-count">{items.length.toLocaleString('vi-VN')}</span>
        </button>

        <button
          id="order-tab-pending"
          className={`order-tab-btn ${filter.statusTab === 'PENDING' ? 'active' : ''}`}
          onClick={() => dispatch(setStatusTab('PENDING'))}
          type="button"
        >
          Chờ xử lý&nbsp;
          <span className={`tab-count ${countPending > 0 ? 'blue' : ''}`}>{countPending}</span>
        </button>

        <button
          id="order-tab-packed"
          className={`order-tab-btn ${filter.statusTab === 'PACKED' ? 'active' : ''}`}
          onClick={() => dispatch(setStatusTab('PACKED'))}
          type="button"
        >
          Đang đóng gói&nbsp;
          <span className="tab-count">{countPacked}</span>
        </button>

        <button
          id="order-tab-transit"
          className={`order-tab-btn ${filter.statusTab === 'IN_TRANSIT' ? 'active' : ''}`}
          onClick={() => dispatch(setStatusTab('IN_TRANSIT'))}
          type="button"
        >
          Đang vận chuyển&nbsp;
          <span className={`tab-count ${countInTransit > 0 ? 'blue' : ''}`}>{countInTransit}</span>
        </button>

        <button
          id="order-tab-delivered"
          className={`order-tab-btn ${filter.statusTab === 'DELIVERED' ? 'active' : ''}`}
          onClick={() => dispatch(setStatusTab('DELIVERED'))}
          type="button"
        >
          Đã giao thành công&nbsp;
          <span className="tab-count">{countDelivered.toLocaleString('vi-VN')}</span>
        </button>

        <button
          id="order-tab-cancelled"
          className={`order-tab-btn warn-tab ${
            filter.statusTab === 'CANCELLED' || filter.statusTab === 'RETURNED' ? 'active' : ''
          }`}
          onClick={() => dispatch(setStatusTab('CANCELLED'))}
          type="button"
        >
          Đơn hủy/Hoàn&nbsp;
          <span className="tab-count orange">{countCancelled}</span>
        </button>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="order-filter-bar">
        <div className="order-search-wrap">
          <SearchOutlined className="order-search-icon" />
          <input
            id="order-search-input"
            className="order-search-input"
            placeholder="Mã đơn, Tên, SĐT khách hàng..."
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value)
              dispatch(setOrderSearch(e.target.value))
            }}
          />
        </div>

        <select className="order-filter-select">
          <option>Mọi nguồn đơn (Omnichannel)</option>
          <option>Shopee</option>
          <option>TikTok Shop</option>
          <option>Lazada</option>
          <option>Website Store</option>
        </select>

        <select className="order-filter-select">
          <option>Đơn vị vận chuyển: Tất cả</option>
          <option>GHTK</option>
          <option>GHN</option>
          <option>LEX Express</option>
          <option>Viettel Post</option>
        </select>

        <input type="date" className="order-date-input" placeholder="mm/dd/yyyy" />
        <span className="order-date-sep">đến</span>
        <input type="date" className="order-date-input" placeholder="mm/dd/yyyy" />
      </div>

      {/* ===== ORDER TABLE ===== */}
      <div className="order-table-container">
        <table className="order-table">
          <colgroup>
            <col className="col-check" />
            <col className="col-code" />
            <col className="col-source" />
            <col className="col-customer" />
            <col className="col-product" />
            <col className="col-amount" />
            <col className="col-status" />
          </colgroup>
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>MÃ ĐƠN / THỜI GIAN</th>
              <th>NGUỒN SÀN &amp; KÊNH SHIP</th>
              <th>KHÁCH HÀNG &amp; ĐỊA CHỈ</th>
              <th>CHI TIẾT SẢN PHẨM MUA</th>
              <th>TỔNG THANH TOÁN</th>
              <th>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  Không có đơn hàng nào
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const { day, time } = formatDate(order.createdAt)
                const carrier = CARRIER_MAP[order.marketplace] ?? 'Shipr_Express'
                const firstItem = order.items[0]
                const extraItems = order.items.length - 1

                return (
                  <tr key={order.id}>
                    {/* Checkbox */}
                    <td><input type="checkbox" /></td>

                    {/* Mã đơn / Thời gian */}
                    <td>
                      <span className="cell-order-code">{order.orderCode}</span>
                      <span className="cell-order-time">{day}, {time}</span>
                    </td>

                    {/* Nguồn sàn & kênh ship */}
                    <td>
                      <div>
                        <SourceBadge marketplace={order.marketplace} />
                      </div>
                      <div className="cell-carrier">
                        <span className="cell-carrier-dot" />
                        {carrier}
                      </div>
                    </td>

                    {/* Khách hàng & địa chỉ */}
                    <td>
                      <div className="cell-customer-name">{order.customerName}</div>
                      <div className="cell-customer-phone">{order.customerPhone}</div>
                      <div className="cell-customer-addr">
                        {order.shippingAddress.district
                          ? `${order.shippingAddress.district}, `
                          : ''}{order.shippingAddress.city}
                      </div>
                    </td>

                    {/* Chi tiết sản phẩm */}
                    <td>
                      <div className="cell-product-name">
                        {firstItem ? (
                          <>
                            <span style={{ fontWeight: 600, color: '#374151' }}>
                              {firstItem.productName.length > 30
                                ? firstItem.productName.slice(0, 30) + '…'
                                : firstItem.productName}
                            </span>
                            {extraItems > 0 && (
                              <span className="cell-product-more">+{extraItems}</span>
                            )}
                          </>
                        ) : '—'}
                      </div>
                      {firstItem && (
                        <div className="cell-product-meta">
                          SKU: {firstItem.sku} · x{firstItem.quantity}
                          {firstItem.variantName ? ` · ${firstItem.variantName}` : ''}
                        </div>
                      )}
                    </td>

                    {/* Tổng thanh toán */}
                    <td>
                      <div className="cell-amount">{formatVND(order.finalAmount)}</div>
                      <PaymentTag paymentStatus={order.paymentStatus} />
                    </td>

                    {/* Trạng thái + hành động */}
                    <td>
                      <div className="order-status-cell">
                        <StatusBadge status={order.status} />
                        {order.status === 'PENDING' ? (
                          <button
                            className="btn-approve"
                            onClick={() => handleApprove(order)}
                            type="button"
                          >
                            Duyệt
                          </button>
                        ) : (
                          <button
                            className="btn-order-action"
                            onClick={() => dispatch(openOrderDetail(order))}
                            type="button"
                            title="Xem chi tiết"
                          >
                            <SettingOutlined />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* ===== PAGINATION ===== */}
        <div className="order-pagination-bar">
          <div>
            Hiển thị 1–{filteredOrders.length} trong số{' '}
            {items.length.toLocaleString('vi-VN')} đơn hàng
          </div>
          <div className="order-pagination-controls">
            <button className="order-page-btn" disabled type="button">‹</button>
            <button className="order-page-btn active" type="button">1</button>
            <button className="order-page-btn" type="button">2</button>
            <button className="order-page-btn" type="button">3</button>
            <button className="order-page-btn" type="button">›</button>
          </div>
        </div>
      </div>

      {/* ===== ORDER DETAIL MODAL ===== */}
      <OrderDetailModal
        open={isDetailOpen}
        order={selectedOrder}
        onClose={() => dispatch(closeOrderDetail())}
      />
    </div>
  )
}
