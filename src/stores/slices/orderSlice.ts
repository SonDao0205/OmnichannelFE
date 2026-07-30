import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { orderApi, type CreateOrderPayload } from '../../apis/orderApi'
import type { Order, OrderFilter, OrderStatus } from '../../types/order'

interface OrderState {
  items: Order[]
  totalElements: number
  loading: boolean
  error: string | null
  filter: OrderFilter
  selectedOrder: Order | null
  isDetailOpen: boolean
  isCreateOpen: boolean
}

const initialState: OrderState = {
  items: [],
  totalElements: 0,
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
  isCreateOpen: false,
}

export const fetchOrdersThunk = createAsyncThunk(
  'orders/fetch',
  async (_, { getState }: any) => {
    const state = getState() as { orders: OrderState }
    const { filter } = state.orders
    const status = filter.statusTab === 'ALL' ? '' : filter.statusTab
    return await orderApi.fetchOrders(filter.search, status, filter.page - 1, filter.pageSize)
  }
)

export const createOrderThunk = createAsyncThunk(
  'orders/create',
  async (payload: CreateOrderPayload) => {
    return await orderApi.createOrder(payload)
  }
)

export const updateOrderStatusThunk = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
    return await orderApi.updateOrderStatus(orderId, status)
  }
)

export const deleteOrderThunk = createAsyncThunk(
  'orders/delete',
  async (orderId: string) => {
    return await orderApi.deleteOrder(orderId)
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
    openCreateOrder: (state) => {
      state.isCreateOpen = true
    },
    closeCreateOrder: (state) => {
      state.isCreateOpen = false
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
        state.totalElements = action.payload.length
      })
      .addCase(fetchOrdersThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Lỗi tải danh sách đơn hàng'
      })
      .addCase(createOrderThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
        state.isCreateOpen = false
      })
      .addCase(updateOrderStatusThunk.fulfilled, (state, action) => {
        const updated = action.payload
        const idx = state.items.findIndex((o) => o.id === updated.id)
        if (idx !== -1) state.items[idx] = updated
        if (state.selectedOrder?.id === updated.id) state.selectedOrder = updated
      })
      .addCase(deleteOrderThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((o) => o.id !== action.payload)
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
  openCreateOrder,
  closeCreateOrder,
} = orderSlice.actions

export default orderSlice.reducer
