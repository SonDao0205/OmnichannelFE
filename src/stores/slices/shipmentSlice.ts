import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { shipmentApi, type ShipmentItem, type ShipmentOverview } from '../../apis/shipmentApi'

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
  async ({ search = '', page = 0 }: { search?: string; page?: number } = {}) => {
    return await shipmentApi.fetchShipments(search, page)
  }
)

export const fetchShipmentOverviewThunk = createAsyncThunk(
  'shipments/overview',
  async () => {
    return await shipmentApi.fetchOverview()
  }
)

export const trackShipmentThunk = createAsyncThunk(
  'shipments/track',
  async (code: string) => {
    return await shipmentApi.trackShipment(code)
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
        state.error = action.error.message || 'Lỗi tải danh sách vận đơn'
      })
      .addCase(fetchShipmentOverviewThunk.pending, (state) => {
        state.overviewLoading = true
      })
      .addCase(fetchShipmentOverviewThunk.fulfilled, (state, action) => {
        state.overviewLoading = false
        state.overview = action.payload
      })
      .addCase(fetchShipmentOverviewThunk.rejected, (state) => {
        state.overviewLoading = false
      })
      .addCase(trackShipmentThunk.fulfilled, (state, action) => {
        state.trackedShipment = action.payload
      })
  },
})

export const { clearTracked } = shipmentSlice.actions
export default shipmentSlice.reducer
