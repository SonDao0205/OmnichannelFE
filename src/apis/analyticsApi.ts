import { managementApi } from './authApi'

export interface ChartPoint {
  month: string
  revenue: number
  profit: number
}

export interface FinancialRow {
  month: string
  revenue: number
  cost: number
  shipping: number
  fee: number
  profit: number
  margin: number
  growth: number
}

export interface RevenueAnalyticsData {
  revenue: number
  cost: number
  shipping: number
  fee: number
  profit: number
  margin: number
  growth: number
  chartPoints: ChartPoint[]
  rows: FinancialRow[]
  aiInsightTitle: string
  aiInsightDesc: string
}

export interface ProductPerformance {
  name: string
  sku: string
  sold: number
  revenue: number
  stock: number
  status: string
  img: string
  channel: string
}

export interface FunnelStage {
  stageName: string
  value: number
  valueLabel: string
  percentage: number
}

export interface ProductAIAnalyticsData {
  topProducts: ProductPerformance[]
  bottomProducts: ProductPerformance[]
  totalOrders: number
  aiClosed: number
  hybridClosed: number
  humanClosed: number
  conversionRate: number
  responseTime: number
  csat: number
  costSaved: number
  funnelStages: FunnelStage[]
}

export const analyticsApi = {
  /** Lấy dữ liệu phân tích doanh thu */
  fetchRevenueAnalytics: async (period = 'this-month'): Promise<RevenueAnalyticsData> => {
    const res = await managementApi.get<RevenueAnalyticsData>('/api/v1/analytics/revenue', {
      params: { period }
    })
    return res.data
  },

  /** Lấy dữ liệu phân tích sản phẩm và tỉ lệ AI chốt đơn */
  fetchProductAIAnalytics: async (period = 'this-month', channel = 'ALL'): Promise<ProductAIAnalyticsData> => {
    const res = await managementApi.get<ProductAIAnalyticsData>('/api/v1/analytics/products-ai', {
      params: { period, channel }
    })
    return res.data
  }
}
