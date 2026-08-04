import { managementApi } from './authApi'

// ─── Kiểu trả về từ Backend ──────────────────────────────────────────────────

export interface ShipmentItem {
  id: string
  tenantId: string
  orderId: string | null
  orderCode: string
  waybillCode: string
  carrierName: string
  destination: string
  codAmount: number
  latestMilestone: string
  milestoneType: 'waiting' | 'picked' | 'transit' | 'success' | 'failed'
  shippedAt: string | null
  deliveredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ShipmentOverview {
  countWaiting: number
  countPicked: number
  countInTransit: number
  countFailed: number
  countSuccess: number
  ghtkAvgHours: number
  ghnAvgHours: number
  ghtkSuccessRate: number
  ghnSuccessRate: number
}

interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const shipmentApi = {
  /** Lấy danh sách vận đơn */
  fetchShipments: async (search = '', page = 0, size = 20): Promise<ShipmentItem[]> => {
    const params: Record<string, string | number> = { page, size }
    if (search) params.search = search
    const res = await managementApi.get<SpringPage<ShipmentItem>>('/api/v1/shipments', { params })
    const data = res.data
    return Array.isArray(data) ? data : (data?.content ?? [])
  },

  /** Tra cứu vận đơn theo mã vận đơn hoặc mã đơn hàng gốc */
  trackShipment: async (code: string): Promise<ShipmentItem> => {
    const res = await managementApi.get<ShipmentItem>(`/api/v1/shipments/track/${encodeURIComponent(code.trim())}`)
    return res.data
  },

  /** Lấy tổng quan thống kê vận chuyển */
  fetchOverview: async (): Promise<ShipmentOverview> => {
    const res = await managementApi.get<ShipmentOverview>('/api/v1/shipments/overview')
    return res.data
  },
}
