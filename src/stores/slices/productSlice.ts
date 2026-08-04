import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { productApi } from '../../apis/productApi'
import { apiErrorMessage } from '../../apis/authApi'
import type { Product, ProductFilter } from '../../types/product'

interface ProductState {
  items: Product[]
  totalElements: number
  loading: boolean
  error: string | null
  filter: ProductFilter
  selectedProduct: Product | null
  isModalOpen: boolean
}

const initialState: ProductState = {
  items: [],
  totalElements: 0,
  loading: false,
  error: null,
  filter: {
    tab: 'ALL',
    viewMode: 'grid',
    search: '',
    page: 1,
    pageSize: 12,
  },
  selectedProduct: null,
  isModalOpen: false,
}

export const fetchProductsThunk = createAsyncThunk(
  'products/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { products: ProductState }
      const { filter } = state.products
      const status = filter.tab === 'ALL' ? '' : filter.tab
      return await productApi.fetchProducts(filter.search, status, filter.page - 1, filter.pageSize)
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const createProductThunk = createAsyncThunk(
  'products/create',
  async (productData: Partial<Product>, { rejectWithValue }) => {
    try {
      return await productApi.createProduct(productData)
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const updateProductThunk = createAsyncThunk(
  'products/update',
  async ({ id, data }: { id: string; data: Partial<Product> }, { rejectWithValue }) => {
    try {
      return await productApi.updateProduct(id, data)
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const deleteProductThunk = createAsyncThunk(
  'products/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      return await productApi.deleteProduct(id)
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const adjustStockThunk = createAsyncThunk(
  'products/adjustStock',
  async ({ id, delta, note, variantId }: { id: string; delta: number; note?: string; variantId?: string }, { rejectWithValue }) => {
    try {
      return await productApi.adjustStock(id, delta, note, variantId)
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const syncMarketplacesThunk = createAsyncThunk(
  'products/sync',
  async (_, { rejectWithValue }) => {
    try {
      return await productApi.syncMarketplaces()
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  },
)

export const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setTab: (state, action: PayloadAction<ProductFilter['tab']>) => {
      state.filter.tab = action.payload
      state.filter.page = 1
    },
    setViewMode: (state, action: PayloadAction<'grid' | 'table'>) => {
      state.filter.viewMode = action.payload
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.filter.search = action.payload
      state.filter.page = 1
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.filter.page = action.payload
    },
    openModal: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload
      state.isModalOpen = true
    },
    closeModal: (state) => {
      state.selectedProduct = null
      state.isModalOpen = false
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchProductsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProductsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.totalElements = action.payload.length
      })
      .addCase(fetchProductsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = typeof action.payload === 'string'
          ? action.payload : 'Lỗi tải danh sách sản phẩm'
      })
      // Create
      .addCase(createProductThunk.pending, (state) => {
        state.error = null
      })
      .addCase(createProductThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(createProductThunk.rejected, (state, action) => {
        state.error = typeof action.payload === 'string'
          ? action.payload : 'Không thể thêm sản phẩm'
      })
      // Update
      .addCase(updateProductThunk.pending, (state) => {
        state.error = null
      })
      .addCase(updateProductThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload }
        }
      })
      .addCase(updateProductThunk.rejected, (state, action) => {
        state.error = typeof action.payload === 'string'
          ? action.payload : 'Không thể cập nhật sản phẩm'
      })
      // Delete
      .addCase(deleteProductThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload)
      })
      .addCase(deleteProductThunk.rejected, (state, action) => {
        state.error = typeof action.payload === 'string'
          ? action.payload : 'Không thể xóa sản phẩm'
      })
      // Adjust stock
      .addCase(adjustStockThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload }
        }
      })
      .addCase(adjustStockThunk.rejected, (state, action) => {
        state.error = typeof action.payload === 'string'
          ? action.payload : 'Không thể điều chỉnh tồn kho'
      })
      .addCase(syncMarketplacesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(syncMarketplacesThunk.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(syncMarketplacesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = typeof action.payload === 'string'
          ? action.payload : 'Không thể đồng bộ dữ liệu từ sàn'
      })
  },
})

export const { setTab, setViewMode, setSearch, setPage, openModal, closeModal } =
  productSlice.actions

export default productSlice.reducer
