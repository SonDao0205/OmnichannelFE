import { Modal, Tag, Button, Divider, message } from 'antd'
import {
  ShoppingOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CarOutlined,
} from '@ant-design/icons'
import type { Order, OrderStatus } from '../../types/order'
import { useAppDispatch } from '../../hooks/redux'
import { updateOrderStatusThunk } from '../../stores/slices/orderSlice'

interface OrderDetailModalProps {
  canUpdateStatus: boolean
  open: boolean
  order: Order | null
  onClose: () => void
}

export default function OrderDetailModal({ canUpdateStatus, open, order, onClose }: OrderDetailModalProps) {
  const dispatch = useAppDispatch()

  if (!order) return null

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      await dispatch(updateOrderStatusThunk({ orderId: order.id, status: newStatus })).unwrap()
      message.success(`Đã chuyển trạng thái đơn hàng sang: ${newStatus}`)
    } catch (error) {
      if (typeof error === 'string') message.error(error)
    }
  }

  const formatVND = (num: number) => `${num.toLocaleString('vi-VN')}đ`

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShoppingOutlined style={{ color: '#2563eb', fontSize: 20 }} />
          <span>Chi tiết đơn hàng #{order.orderCode}</span>
          <Tag color={order.marketplace === 'Shopee' ? 'orange' : order.marketplace === 'Lazada' ? 'geekblue' : 'volcano'}>
            {order.marketplace}
          </Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <div style={{ padding: '10px 0' }}>
        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#f8fafc', padding: 16, borderRadius: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 6 }}>
              <UserOutlined /> Khách hàng: {order.customerName}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              <PhoneOutlined /> {order.customerPhone}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              <EnvironmentOutlined /> {order.shippingAddress.fullAddress}, {order.shippingAddress.city}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Mã đơn trên sàn: <strong>{order.externalOrderId}</strong></div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Mã vận đơn: <strong>{order.trackingNumber || 'Chưa tạo'}</strong></div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Thanh toán: <Tag color="green">{order.paymentStatus}</Tag></div>
          </div>
        </div>

        <Divider style={{ margin: '16px 0' }}>Sản phẩm trong đơn</Divider>

        {order.items.map((item) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.productName} style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.productName}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>SKU: {item.sku} | Biến thể: {item.variantName}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>{formatVND(item.price)}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>x{item.quantity}</div>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
          <span>Tổng tiền thanh toán:</span>
          <span style={{ color: '#2563eb', fontSize: 18 }}>{formatVND(order.finalAmount)}</span>
        </div>

        {canUpdateStatus && (
          <>
            <Divider style={{ margin: '16px 0' }} />

            {/* Actions based on current status */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {order.status === 'CREATED' && (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleStatusChange('CONFIRMED')}>
                  Xác nhận đơn hàng
                </Button>
              )}

              {order.status === 'CONFIRMED' && (
                <Button type="primary" style={{ background: '#1d4ed8' }} icon={<CarOutlined />} onClick={() => handleStatusChange('READY_TO_SHIP')}>
                  Sẵn sàng bàn giao
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
