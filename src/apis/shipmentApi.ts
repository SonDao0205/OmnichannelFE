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

async function fetchShipmentPage(search: string, page: number, size: number): Promise<SpringPage<ShipmentItem>> {
  const params: Record<string, string | number> = { page, size }
  if (search) params.search = search
  const res = await managementApi.get<SpringPage<ShipmentItem> | ShipmentItem[]>('/api/v1/shipments', { params })
  if (Array.isArray(res.data)) {
    return { content: res.data, totalElements: res.data.length, totalPages: 1 }
  }
  return res.data
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const shipmentApi = {
  /** Lấy danh sách vận đơn */
  fetchShipments: async (search = '', page = 0, size = 20): Promise<ShipmentItem[]> => {
    const data = await fetchShipmentPage(search, page, size)
    return data.content ?? []
  },

  /** Lấy toàn bộ vận đơn thực tế để xuất báo cáo, không giới hạn ở trang đang hiển thị. */
  fetchAllShipments: async (search = ''): Promise<ShipmentItem[]> => {
    const pageSize = 200
    const firstPage = await fetchShipmentPage('', 0, pageSize)
    const shipments = [...(firstPage.content ?? [])]

    for (let page = 1; page < firstPage.totalPages; page += 1) {
      const nextPage = await fetchShipmentPage('', page, pageSize)
      shipments.push(...(nextPage.content ?? []))
    }

    const keyword = search.toLocaleLowerCase('vi-VN').trim()
    if (!keyword) return shipments
    return shipments.filter(shipment =>
      shipment.waybillCode.toLocaleLowerCase('vi-VN').includes(keyword)
      || (shipment.orderId ?? '').toLocaleLowerCase('vi-VN').includes(keyword)
      || (shipment.carrierName ?? '').toLocaleLowerCase('vi-VN').includes(keyword),
    )
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
    const res = await managementApi.get<ShipmentOverview>('/api/v1/shipments/overview')
    return res.data
  },
}
