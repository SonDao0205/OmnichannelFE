import { managementApi } from './authApi'

export interface DashboardChannel {
  marketplace: 'TIKTOK_SHOP' | 'LAZADA'
  marketplaceName: string
  productCount: number
}

export interface DashboardRecentOrder {
  id: string
  externalOrderId: string
  customerName: string
  marketplace: 'TIKTOK_SHOP' | 'LAZADA'
  marketplaceName: string
  totalAmount: number
  status: string
  createdAt: string
}

export interface DashboardOverviewData {
  todayRevenue: number
  newOrdersToday: number
  newCustomersToday: number
  channels: DashboardChannel[]
  recentOrders: DashboardRecentOrder[]
}

export interface RevenueAnalyticsData {
  totalRevenue: number
  netProfit: number
  totalCost: number
  profitMargin: number
  growthPercent: number
  periodStart: string
  periodEnd: string
  chartGranularity: 'DAY' | 'MONTH' | 'QUARTER'
  chartPoints: RevenueChartPoint[]
}

export interface RevenueChartPoint {
  periodStart: string
  label: string
  revenue: number
}

export const analyticsApi = {
  fetchOverview: async (): Promise<DashboardOverviewData> => {
    const response = await managementApi.get<DashboardOverviewData>('/api/v1/dashboard/overview')
    return response.data
  },

  fetchRevenueAnalytics: async (period = 'this-month'): Promise<RevenueAnalyticsData> => {
    const response = await managementApi.get<RevenueAnalyticsData>('/api/v1/analytics/revenue', {
      params: { period },
    })
    return response.data
  },
}
