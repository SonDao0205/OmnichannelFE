import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { shipmentApi, type ShipmentItem, type ShipmentOverview } from '../../apis/shipmentApi'
import { apiErrorMessage } from '../../apis/authApi'

interface ShipmentState {
  items: ShipmentItem[]
  overview: ShipmentOverview | null
  trackedShipment: ShipmentItem | null
  loading: boolean
  overviewLoading: boolean
  error: string | null
}

const initialState: ShipmentState = {
  items: [],
  overview: null,
  trackedShipment: null,
  loading: false,
  overviewLoading: false,
  error: null,
}

export const fetchShipmentsThunk = createAsyncThunk(
  'shipments/fetch',
  async ({ search = '', page = 0 }: { search?: string; page?: number } = {}, { rejectWithValue }) => {
    try {
      return await shipmentApi.fetchShipments(search, page)
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const fetchShipmentOverviewThunk = createAsyncThunk(
  'shipments/overview',
  async (_, { rejectWithValue }) => {
    try {
      return await shipmentApi.fetchOverview()
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const trackShipmentThunk = createAsyncThunk(
  'shipments/track',
  async (code: string, { rejectWithValue }) => {
    try {
      return await shipmentApi.trackShipment(code)
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const shipmentSlice = createSlice({
  name: 'shipments',
  initialState,
  reducers: {
    clearTracked: (state) => {
      state.trackedShipment = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShipmentsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchShipmentsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchShipmentsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = typeof action.payload === 'string'
          ? action.payload : 'Lỗi tải danh sách vận đơn'
      })
      .addCase(fetchShipmentOverviewThunk.pending, (state) => {
        state.overviewLoading = true
      })
      .addCase(fetchShipmentOverviewThunk.fulfilled, (state, action) => {
        state.overviewLoading = false
        state.overview = action.payload
      })
      .addCase(fetchShipmentOverviewThunk.rejected, (state, action) => {
        state.overviewLoading = false
        state.error = typeof action.payload === 'string'
          ? action.payload : 'Không thể tải tổng quan vận chuyển'
      })
      .addCase(trackShipmentThunk.pending, (state) => {
        state.loading = true
        state.error = null
        state.trackedShipment = null
      })
      .addCase(trackShipmentThunk.fulfilled, (state, action) => {
        state.loading = false
        state.trackedShipment = action.payload
      })
      .addCase(trackShipmentThunk.rejected, (state, action) => {
        state.loading = false
        state.error = typeof action.payload === 'string'
          ? action.payload : 'Không tìm thấy vận đơn'
      })
  },
})

export const { clearTracked } = shipmentSlice.actions
export default shipmentSlice.reducer
