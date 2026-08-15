import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { orderApi, type OrderStats } from '../../apis/orderApi'
import { apiErrorMessage } from '../../apis/authApi'
import type { Order, OrderFilter, OrderStatus } from '../../types/order'

interface OrderState {
  items: Order[]
  totalElements: number
  totalPages: number
  stats: OrderStats
  loading: boolean
  error: string | null
  filter: OrderFilter
  selectedOrder: Order | null
  isDetailOpen: boolean
}

const initialState: OrderState = {
  items: [],
  totalElements: 0,
  totalPages: 0,
  stats: { total: 0, byStatus: {} },
  loading: false,
  error: null,
  filter: {
    statusTab: 'ALL',
    marketplace: 'ALL',
    search: '',
    page: 1,
    pageSize: 10,
  },
  selectedOrder: null,
  isDetailOpen: false,
}

export const fetchOrdersThunk = createAsyncThunk(
  'orders/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { orders: OrderState }
      const { filter } = state.orders
      const status = filter.statusTab === 'ALL' ? '' : filter.statusTab
      const [page, stats] = await Promise.all([
        orderApi.fetchOrders(filter.search, status, filter.page - 1, filter.pageSize),
        orderApi.fetchStats(),
      ])
      return { page, stats }
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const updateOrderStatusThunk = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, status }: { orderId: string; status: OrderStatus }, { rejectWithValue }) => {
    try {
      return await orderApi.updateOrderStatus(orderId, status)
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setStatusTab: (state, action: PayloadAction<OrderFilter['statusTab']>) => {
      state.filter.statusTab = action.payload
      state.filter.page = 1
    },
    setMarketplaceFilter: (state, action: PayloadAction<OrderFilter['marketplace']>) => {
      state.filter.marketplace = action.payload
      state.filter.page = 1
    },
    setOrderSearch: (state, action: PayloadAction<string>) => {
      state.filter.search = action.payload
      state.filter.page = 1
    },
    setOrderPage: (state, action: PayloadAction<number>) => {
      state.filter.page = action.payload
    },
    openOrderDetail: (state, action: PayloadAction<Order>) => {
      state.selectedOrder = action.payload
      state.isDetailOpen = true
    },
    closeOrderDetail: (state) => {
      state.selectedOrder = null
      state.isDetailOpen = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrdersThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrdersThunk.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.page.content
        if (state.selectedOrder) {
          const refreshedSelection = action.payload.page.content.find(
            (order) => order.id === state.selectedOrder?.id,
          )
          if (refreshedSelection) state.selectedOrder = refreshedSelection
        }
        state.totalElements = action.payload.page.totalElements
        state.totalPages = action.payload.page.totalPages
        state.stats = action.payload.stats
      })
      .addCase(fetchOrdersThunk.rejected, (state, action) => {
        state.loading = false
        state.error = typeof action.payload === 'string'
          ? action.payload : 'Lỗi tải danh sách đơn hàng'
      })
      .addCase(updateOrderStatusThunk.pending, (state) => {
        state.error = null
      })
      .addCase(updateOrderStatusThunk.fulfilled, (state, action) => {
        const updated = action.payload
        const idx = state.items.findIndex((order) => order.id === updated.id)
        if (idx !== -1) state.items[idx] = updated
        if (state.selectedOrder?.id === updated.id) state.selectedOrder = updated
      })
      .addCase(updateOrderStatusThunk.rejected, (state, action) => {
        state.error = typeof action.payload === 'string'
          ? action.payload : 'Không thể cập nhật trạng thái đơn hàng'
      })
  },
})

export const {
  setStatusTab,
  setMarketplaceFilter,
  setOrderSearch,
  setOrderPage,
  openOrderDetail,
  closeOrderDetail,
} = orderSlice.actions

export default orderSlice.reducer
