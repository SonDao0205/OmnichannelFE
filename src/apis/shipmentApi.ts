import { managementApi } from './authApi'

// ─── Kiểu trả về từ Backend ──────────────────────────────────────────────────

export interface ShipmentItem {
  id: string
  tenantId: string
  orderId: string | null
  waybillCode: string
  carrierName: string
  destination: string
  codAmount: number
  latestMilestone: string
  milestoneType: 'waiting' | 'picked' | 'transit' | 'success' | 'failed'
  shippedAt: string | null
  deliveredAt: string | null
  createdAt: string
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

// ─── Mock dự phòng ───────────────────────────────────────────────────────────

const MOCK_OVERVIEW: ShipmentOverview = {
  countWaiting: 12,
  countPicked: 8,
  countInTransit: 142,
  countFailed: 2,
  countSuccess: 1105,
  ghtkAvgHours: 22.5,
  ghnAvgHours: 28.0,
  ghtkSuccessRate: 98.2,
  ghnSuccessRate: 95.4,
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const shipmentApi = {
  /** Lấy danh sách vận đơn */
  fetchShipments: async (search = '', page = 0, size = 20): Promise<ShipmentItem[]> => {
    try {
      const params: Record<string, string | number> = { page, size }
      if (search) params.search = search
      const res = await managementApi.get<SpringPage<ShipmentItem>>('/api/v1/shipments', { params })
      const data = res.data
      return Array.isArray(data) ? data : (data?.content ?? [])
    } catch {
      return []
    }
  },

  /** Tra cứu vận đơn theo mã vận đơn hoặc mã đơn hàng gốc */
  trackShipment: async (code: string): Promise<ShipmentItem | null> => {
    try {
      const res = await managementApi.get<ShipmentItem>(`/api/v1/shipments/track/${code}`)
      return res.data
    } catch {
      return null
    }
  },

  /** Lấy tổng quan thống kê vận chuyển */
  fetchOverview: async (): Promise<ShipmentOverview> => {
    try {
      const res = await managementApi.get<ShipmentOverview>('/api/v1/shipments/overview')
      return res.data
    } catch {
      return MOCK_OVERVIEW
    }
  },
}
