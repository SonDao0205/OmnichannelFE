import { useEffect, useState } from 'react'
import { SearchOutlined, SettingOutlined, SyncOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  fetchOrdersThunk,
  setStatusTab,
  setOrderSearch,
  setOrderPage,
  openOrderDetail,
  closeOrderDetail,
  updateOrderStatusThunk,
} from '../../stores/slices/orderSlice'
import type { Order, OrderStatus } from '../../types/order'
import OrderDetailModal from './OrderDetailModal'
import { Alert, Button, Pagination, message } from 'antd'
import { marketplaceApi } from '../../apis/marketplaceApi'
import { apiErrorMessage } from '../../apis/authApi'
import { useAuth } from '../../contexts/authContext'
import { io } from 'socket.io-client'
import { CHAT_SOCKET_URL } from '../../apis/chatApi'
import './orders.css'

// ---- Helper: hiển thị nguồn sàn ----
function SourceBadge({ marketplace }: { marketplace: string }) {
  const sources: Record<string, { cls: string; label: string }> = {
    Shopee: { cls: 'shopee', label: 'SHOPEE MALL' },
    'TikTok Shop': { cls: 'tiktok', label: 'TIKTOK SHOP' },
    Lazada: { cls: 'lazada', label: 'LAZADA MALL' },
  }
  const source = sources[marketplace] ?? { cls: 'website', label: 'WEBSITE STORE' }

  return <span className={`cell-source-badge ${source.cls}`}>{source.label}</span>
}

// ---- Helper: trạng thái badge ----
function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { cls: string; label: string }> = {
    CREATED: { cls: 'pending', label: 'MỚI TẠO' },
    CONFIRMED: { cls: 'packed', label: 'ĐÃ XÁC NHẬN' },
    READY_TO_SHIP: { cls: 'packed', label: 'SẴN SÀNG BÀN GIAO' },
    SHIPPED: { cls: 'in_transit', label: 'ĐÃ BÀN GIAO' },
    IN_TRANSIT: { cls: 'in_transit', label: 'ĐANG GIAO HÀNG' },
    DELIVERED: { cls: 'delivered', label: 'ĐÃ HOÀN THÀNH' },
    CANCELLED: { cls: 'cancelled', label: 'ĐÃ HỦY ĐƠN' },
    RETURN_REQUESTED: { cls: 'returned', label: 'YÊU CẦU HOÀN' },
    RETURNED: { cls: 'returned', label: 'ĐÃ HOÀN HÀNG' },
    FAILED: { cls: 'cancelled', label: 'GIAO THẤT BẠI' },
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

export default function OrderScreen() {
  const dispatch = useAppDispatch()
  const { hasPermission } = useAuth()
  const { items, totalElements, stats, loading, error, filter, selectedOrder, isDetailOpen } = useAppSelector(
    (state) => state.orders
  )
  const [localSearch, setLocalSearch] = useState('')
  const [syncing, setSyncing] = useState(false)
  const canFulfillOrders = hasPermission('ORDER.FULFILL')
  const canSyncMarketplace = hasPermission('PRODUCT.UPDATE')

  useEffect(() => {
    dispatch(fetchOrdersThunk())
  }, [dispatch, filter.statusTab, filter.search, filter.page])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void dispatch(fetchOrdersThunk())
    }, 30000)
    return () => window.clearInterval(timer)
  }, [dispatch])

  useEffect(() => {
    const socket = io(CHAT_SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })
    const refreshOrders = () => void dispatch(fetchOrdersThunk())
    socket.on('order_updated', refreshOrders)
    return () => {
      socket.off('order_updated', refreshOrders)
      socket.disconnect()
    }
  }, [dispatch])

  useEffect(() => {
    if (error) message.error(error)
  }, [error])

  const formatVND = (num: number) => `${num.toLocaleString('vi-VN')}đ`

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return { day: 'Hôm nay', time: timeStr }
    return { day: d.toLocaleDateString('vi-VN'), time: timeStr }
  }

  // Count per tab
  const countPending = stats.byStatus.CREATED ?? 0
  const countPacked = (stats.byStatus.CONFIRMED ?? 0) + (stats.byStatus.READY_TO_SHIP ?? 0)
  const countInTransit = (stats.byStatus.SHIPPED ?? 0) + (stats.byStatus.IN_TRANSIT ?? 0)
  const countDelivered = stats.byStatus.DELIVERED ?? 0
  const countCancelled = (stats.byStatus.CANCELLED ?? 0) +
    (stats.byStatus.RETURN_REQUESTED ?? 0) + (stats.byStatus.RETURNED ?? 0) +
    (stats.byStatus.FAILED ?? 0)

  // Filter
  const filteredOrders = items
    .filter((order) => {
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
    .sort((left, right) => {
      const newestFirst = Date.parse(right.createdAt) - Date.parse(left.createdAt)
      return newestFirst || right.id.localeCompare(left.id)
    })

  const handleApprove = async (order: Order) => {
    try {
      await dispatch(updateOrderStatusThunk({ orderId: order.id, status: 'CONFIRMED' })).unwrap()
      message.success(`Đã xác nhận đơn hàng ${order.orderCode}!`)
    } catch {
      // ProblemDetail được hiển thị qua state.error.
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await marketplaceApi.syncAll()
      await dispatch(fetchOrdersThunk()).unwrap()
      const succeeded = result.shopResults.filter(
        (shop) => shop.status === 'SUCCEEDED',
      ).length
      message.success(
        `Đã đồng bộ ${succeeded} shop: ${result.orders} đơn hàng và ${result.orderItems} sản phẩm trong đơn.`,
      )
      if (result.failures > 0) {
        const failedNames = result.shopResults
          .filter(
            (shop) =>
              shop.status !== 'SUCCEEDED' &&
              shop.errorCode !== 'ACCOUNT_NOT_CONNECTED',
          )
          .map((shop) => shop.shopName)
        message.warning(
          `${result.failures} shop chưa đồng bộ được${failedNames.length ? `: ${failedNames.join(', ')}` : ''}. Các shop khác không bị ảnh hưởng.`,
        )
      }
    } catch (error) {
      message.error(apiErrorMessage(error))
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="order-page-container">

      {/* ===== HEADER ===== */}
      <div className="order-header-bar">
        <div className="order-header-left">
          <h1>Quản lý đơn hàng</h1>
        </div>
        {canSyncMarketplace && (
          <Button
            icon={<SyncOutlined spin={syncing} />}
            loading={syncing}
            onClick={() => void handleSync()}
          >
            Đồng bộ từ sàn
          </Button>
        )}
      </div>

      {!canFulfillOrders && (
        <Alert
          message="Chế độ chỉ xem"
          description="Tài khoản CSKH có thể xem và tìm kiếm đơn hàng nhưng không thể đồng bộ hoặc cập nhật trạng thái đơn."
          showIcon
          type="info"
        />
      )}

      {/* ===== STATUS TABS ===== */}
      <div className="order-status-tabs">
        <button
          id="order-tab-all"
          className={`order-tab-btn ${filter.statusTab === 'ALL' ? 'active' : ''}`}
          onClick={() => dispatch(setStatusTab('ALL'))}
          type="button"
        >
          Tất cả đơn&nbsp;
          <span className="tab-count">{stats.total.toLocaleString('vi-VN')}</span>
        </button>

        <button
          id="order-tab-pending"
          className={`order-tab-btn ${filter.statusTab === 'CREATED' ? 'active' : ''}`}
          onClick={() => dispatch(setStatusTab('CREATED'))}
          type="button"
        >
          Chờ xử lý&nbsp;
          <span className={`tab-count ${countPending > 0 ? 'blue' : ''}`}>{countPending}</span>
        </button>

        <button
          id="order-tab-packed"
          className={`order-tab-btn ${filter.statusTab === 'READY_TO_SHIP' ? 'active' : ''}`}
          onClick={() => dispatch(setStatusTab('READY_TO_SHIP'))}
          type="button"
        >
          Chờ bàn giao&nbsp;
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

      </div>

      {/* ===== ORDER TABLE ===== */}
      <div className="order-table-container">
        <table className="order-table">
          <colgroup>
            {canFulfillOrders && <col className="col-check" />}
            <col className="col-code" />
            <col className="col-source" />
            <col className="col-customer" />
            <col className="col-product" />
            <col className="col-amount" />
            <col className="col-status" />
          </colgroup>
          <thead>
            <tr>
              {canFulfillOrders && <th><input type="checkbox" /></th>}
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
                <td colSpan={canFulfillOrders ? 7 : 6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={canFulfillOrders ? 7 : 6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  Không có đơn hàng nào
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const { day, time } = formatDate(order.createdAt)
                const firstItem = order.items[0]
                const extraItems = order.items.length - 1

                return (
                  <tr key={order.id}>
                    {/* Checkbox */}
                    {canFulfillOrders && <td><input type="checkbox" /></td>}

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
                        {order.trackingNumber || 'Chưa có vận đơn'}
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
                        {canFulfillOrders && order.status === 'CREATED' && (
                          <button
                            className="btn-approve"
                            onClick={() => handleApprove(order)}
                            type="button"
                          >
                            Duyệt
                          </button>
                        )}
                        <button
                          className="btn-order-action"
                          onClick={() => dispatch(openOrderDetail(order))}
                          type="button"
                          title="Xem chi tiết"
                        >
                          <SettingOutlined />
                        </button>
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
            Hiển thị {filteredOrders.length} trong số{' '}
            {totalElements.toLocaleString('vi-VN')} kết quả
          </div>
          <Pagination
            current={filter.page}
            pageSize={filter.pageSize}
            total={totalElements}
            showSizeChanger={false}
            showTotal={(total) => `${total} đơn hàng`}
            onChange={(page) => dispatch(setOrderPage(page))}
          />
        </div>
      </div>

      {/* ===== ORDER DETAIL MODAL ===== */}
      <OrderDetailModal
        canUpdateStatus={canFulfillOrders}
        open={isDetailOpen}
        order={selectedOrder}
        onClose={() => dispatch(closeOrderDetail())}
      />
    </div>
  )
}
