import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { orderApi } from '../../apis/orderApi'
import type { Order, OrderFilter, OrderStatus } from '../../types/order'

interface OrderState {
  items: Order[]
  loading: boolean
  error: string | null
  filter: OrderFilter
  selectedOrder: Order | null
  isDetailOpen: boolean
}

const initialState: OrderState = {
  items: [],
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

export const fetchOrdersThunk = createAsyncThunk('orders/fetch', async () => {
  return await orderApi.fetchOrders()
})

export const updateOrderStatusThunk = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
    return await orderApi.updateOrderStatus(orderId, status)
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
        state.items = action.payload
      })
      .addCase(fetchOrdersThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Lỗi tải danh sách đơn hàng'
      })
      .addCase(updateOrderStatusThunk.fulfilled, (state, action) => {
        const updated = action.payload
        const idx = state.items.findIndex((o) => o.id === updated.id)
        if (idx !== -1) {
          state.items[idx] = updated
        }
        if (state.selectedOrder?.id === updated.id) {
          state.selectedOrder = updated
        }
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
